require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const cors = require("cors");
const app = express();

app.use(cors());

// Middleware
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,            // For interacting with guilds (servers)
  ],
});

// Login to Discord with your app's token
client.login(process.env.DISCORD_BOT_TOKEN);

// Connect DB
console.log("connecting db");
connectDB();

// Discord bot interaction for creating user
client.on('messageCreate', async (message) => {
  if (message.content.startsWith('/ppcreateuser')) {
    const args = message.content.split(' '); // Split the message by spaces
    const username = args[1] ? args[1].replace('username:', '') : null; // Get username from the message
    const email = args[2] ? args[2].replace('email:', '') : null; // Get email from the message
    const password = args[3] ? args[3].replace('password:', '') : null; // Get password from the message

    if (username && email && password) {
      try {
        // Call your API to create the user with username, email, and password
        const response = await axios.post('http://localhost:5000/api/users/register', { username, email, password });

        if (response.data && response.data.message === 'User created successfully') {
          await message.reply(`User ${username} has been created successfully!`);
        } else if (response.data.message === 'User already exists') {
          await message.reply('Error: Username already exists. Please choose a different username.');
        } else {
          await message.reply('Failed to create the user.');
        }
      } catch (error) {
        console.error('Error while creating user:', error);
        await message.reply('An error occurred while creating the user.');
      }
    } else {
      await message.reply('Please provide a valid username, email, and password.');
    }
  }
});

// Register slash commands (one-time registration)
client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const commands = await client.application.commands.set([
    {
      name: 'ppcreateuser',  // Changed from 'ppcreateuser' to 'pp-create-user'
      description: 'Create a new user',
      type: 1,  // Slash command type
      options: [
        { name: 'username', description: 'The username of the new user', type: 3, required: true },
        { name: 'email', description: 'The email of the new user', type: 3, required: true },
        { name: 'password', description: 'The password of the new user', type: 3, required: true },
      ],
    },
    {
      name: 'ppcreateservice',  // Changed from 'ppcreateservice' to 'pp-create-service'
      description: 'Create a new service',
      type: 1,
      options: [
        { name: 'service-name', description: 'Service name', type: 3, required: true },  // Changed from 'serviceName' to 'service-name'
        { name: 'service-link', description: 'Service URL', type: 3, required: true },    // Changed from 'serviceLink' to 'service-link'
        { name: 'monthly-fee', description: 'Monthly fee for the service', type: 3, required: true },  // Changed from 'monthlyFee' to 'monthly-fee'
        { name: 'token', description: 'JWT token for authentication', type: 3, required: true },
      ],
    },
    {
      name: 'ppgetuser',  // Changed from 'ppgetuser' to 'pp-get-user'
      description: 'Fetch user data and associated services',
      type: 1,
      options: [
        { name: 'token', description: 'JWT token for authentication', type: 3, required: true },
      ],
    },
  ]);
});


// Handling slash command interaction
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return; // Only handle commands

  const { commandName } = interaction;

  if (commandName === 'ppcreateuser') {
    const username = interaction.options.getString('username');
    const email = interaction.options.getString('email');
    const password = interaction.options.getString('password');

    if (username && email && password) {
      try {
        // Call the API to create the user with username, email, and password
        const response = await axios.post('http://localhost:5000/api/users/register', { username, email, password });

        if (response.status === 201 && response.data && response.data._id) {
          const token = response.data.token; // Make sure the response includes the token
          await interaction.reply(`User ${username} has been created successfully! Here is your token: ${token}`);
        } else if (response.data.message === 'User already exists') {
          await interaction.reply('Error: Username already exists. Please choose a different username.');
        } else {
          await interaction.reply('Failed to create the user.');
        }
      } catch (error) {
        console.error('Error while creating user:', error);
        await interaction.reply('An error occurred while creating the user.');
      }
    } else {
      await interaction.reply('Please provide a valid username, email, and password.');
    }
  }

  if (commandName === 'ppgetuser') {
    const token = interaction.options.getString('token'); // Only token is needed here
  
    console.log(token);
  
    if (token) {
      try {
        const response = await axios.get('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (response.status === 200 && response.data) {
          const userData = response.data;
  
          // Check if the 'services' field exists and is an array
          const services = userData.services && Array.isArray(userData.services) && userData.services.length > 0
            ? userData.services.map(service => `${service.serviceName} (${service.serviceLink})`).join(', ')
            : 'No services associated with this user.';
  
          await interaction.reply(`User details: \n\nUsername: ${userData.username}\nEmail: ${userData.email}\nServices: ${services}`);
        } else {
          await interaction.reply('Error: Token is invalid or user does not exist.');
        }        
      } catch (error) {
        console.error('Error fetching user data:', error);
        await interaction.reply('An error occurred while fetching user data.');
      }
    } else {
      await interaction.reply('Please provide a valid token.');
    }
  }
  
  if (commandName === 'ppcreateservice') {
    const serviceName = interaction.options.getString('service-name');
    const serviceLink = interaction.options.getString('service-link');
    const monthlyFee = parseFloat(interaction.options.getString('monthly-fee'));  // Parsing monthly fee as float
    const token = interaction.options.getString('token');
    // Validate required fields
    if (serviceName && serviceLink && monthlyFee) {
      try {
        // Prepare the data for the subscription
        const startDate = new Date().toISOString();  // Use the current date as startDate
        const serviceID = Math.floor(Math.random() * 1000);  // Generate a random serviceID (or implement logic for unique IDs)

        // Send POST request to create a new subscription
        const response = await axios.post('http://localhost:5000/api/subscriptions', {
          serviceID,
          serviceName,
          serviceLink,
          monthlyFee,
          startDate
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,  // Pass the token in the Authorization header
          }
        });

        console.log(response)
        // Check if the subscription was created successfully
        if (response.status === 201) {
          await interaction.reply(`Service "${serviceName}" has been created successfully!`);
        } else {
          await interaction.reply('Failed to create the service.');
        }
      } catch (error) {
        console.error('Error while creating service:', error);
        await interaction.reply('An error occurred while creating the service.');
      }
    } else {
      await interaction.reply('Please provide valid service details (service name, link, and monthly fee).');
    }
  }
  

});

// Start Express Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
