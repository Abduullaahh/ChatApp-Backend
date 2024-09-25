require('dotenv').config(); // Load environment variables

const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { jwtStrategy } = require('./config/passport');
const typeDefs = require('./graphql/typeDefs/index');
const resolvers = require('./graphql/resolvers/index');
const twilio = require('twilio');
const { SubscriptionServer } = require('subscriptions-transport-ws'); // {{ edit_1 }}
const http = require('http'); // {{ edit_2 }}
const { execute, subscribe } = require('graphql'); // {{ edit_1 }}
const { makeExecutableSchema } = require('@graphql-tools/schema'); // {{ edit_1 }}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { // Use env variable
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err)); // More descriptive error log

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the SMS Chat Application!');
});

// Twilio Webhook to receive SMS
app.post('/sms', express.urlencoded({ extended: true }), async (req, res) => {
  const { Body, From } = req.body;
  
  try {
    const mutation = `
      mutation ReceiveIncomingMessage($content: String!, $sender: String!, $receiver: String!) {
        receiveIncomingMessage(content: $content, sender: $sender, receiver: $receiver) {
          content
          sender
          receiver
          timestamp
        }
      }
    `;

    const receiver = 'You'; // or your Twilio number

    // Execute the mutation with variables, without the context
    const response = await server.executeOperation({
      query: mutation,
      variables: {
        content: Body,
        sender: From,
        receiver: receiver, // Set the receiver variable
      },
    });

    if (response.errors) {
      console.error('GraphQL Errors:', response.errors); // Log GraphQL errors
      res.status(500).send('Error processing SMS');
      return;
    }
    
    res.send('<Response></Response>');  // Empty response for Twilio
  } catch (error) {
    console.error('Error receiving SMS:', error); // Log the actual error
    res.status(500).send('Error processing SMS');
  }
});

// Passport middleware for JWT
passport.use(jwtStrategy);

// Create the schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Apollo Server setup
const server = new ApolloServer({
  schema, // Use the created schema
  context: ({ req }) => {
    // Ensure req is defined
    const token = req?.headers?.authorization || '';
    if (token) {
      try {
        // Extract the token part after "Bearer "
        const jwtToken = token.split(' ')[1];
        const user = jwt.verify(jwtToken, process.env.JWT_SECRET); // Ensure the JWT_SECRET is correctly set
        return { user };
      } catch (err) {
        console.error('Token verification failed:', err.message); // Log the specific error
        return {}; // Return an empty context if token verification fails
      }
    }
    return {}; // No token provided
  },
});

// Start Apollo Server and apply middleware
const startApolloServer = async () => {
  await server.start(); // Await the server start
  server.applyMiddleware({ app }); // Apply middleware after server starts

  const PORT = process.env.PORT || 4000; // Use env variable
  const httpServer = http.createServer(app); // Create HTTP server
  
  // Set up the Subscription server
  const subscriptionServer = SubscriptionServer.create({ // Create SubscriptionServer
    schema, // Pass the schema directly
    execute,
    subscribe,
    onConnect: (connectionParams) => {
      return { authToken: connectionParams.authToken }; // Pass token for authentication
    },
  }, {
    server: httpServer,
    path: server.graphqlPath,
  });

  httpServer.listen(PORT, () => { // Start the HTTP server
    console.log(`Server is running on http://localhost:${PORT}${server.graphqlPath}`);
  });
};

startApolloServer(); // Call the function to start the server
