const { gql } = require('apollo-server-express');

const chat = gql`

  type Message {
    id: ID!
    content: String!
    sender: String!
    receiver: String!
    timestamp: String!
  }

  type Query {
    getMessages(username: String!): [Message!]!
  }

  type Mutation {
    saveSentMessage(content: String!, receiver: String!, sender: String!): Boolean!
    receiveIncomingMessage(content: String!, sender: String!, receiver: String!): Message!
  }

  type Subscription {
    messageReceived(username: String!): Message!
  }
`;

module.exports = chat;
