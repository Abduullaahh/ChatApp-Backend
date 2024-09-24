const { gql } = require('apollo-server-express');

const user = gql`
  type User {
    id: ID!
    name: String!
    username: String!
    email: String!
    phoneNumber: String!
    token: String!
  }

  type Query {
    me: User
    getUsers: [User]
  }

  type Mutation {
    register(name: String!, username: String!, email: String!, password: String!, phoneNumber: String!): User!
    login(username: String!, password: String!): User
    sendMessage(content: String!, receiver: String!): Boolean!
  }
`;

module.exports = user;
