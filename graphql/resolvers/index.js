const { mergeResolvers } = require('@graphql-tools/merge');
const user = require('./user');
const chat = require('./chat');

const resolvers = mergeResolvers([user, chat]);

module.exports = resolvers;
