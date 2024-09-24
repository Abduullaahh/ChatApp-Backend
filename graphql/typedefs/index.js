const { mergeTypeDefs } = require('@graphql-tools/merge');
const user = require('./user');
const chat = require('./chat');

const typeDefs = mergeTypeDefs([user, chat]);

module.exports = typeDefs;
