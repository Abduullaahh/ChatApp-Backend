const { sendMessage } = require('../../twilio');
const Message = require('../../models/chat');
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();

const MESSAGE_RECEIVED = 'MESSAGE_RECEIVED';

const chat = {
  Query: {
    getMessages: async (_, { username }) => {
      try {
        return await Message.find({
          $or: [
            { sender: username },
            { receiver: username },
            { receiver: "You" }
          ]
        });
      } catch (error) {
        console.error('Error fetching messages:', error);
        throw new Error('Failed to fetch messages');
      }
    },
  },
  Mutation: {
    saveSentMessage: async (_, { content, receiver, sender }) => {
      if (!content || !receiver) {
        throw new Error('Content and receiver are required');
      }

      try {
        const newMessage = new Message({
          content,
          receiver,
          sender,
        });
        await sendMessage(receiver, content);
        await newMessage.save();

        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        return false;
      }
    },
    receiveIncomingMessage: async (_, { content, sender, receiver }) => {
      try {
          const newMessage = new Message({
              content,
              sender,
              receiver: 'You',
          });
          await newMessage.save();
          console.log('Incoming message saved:', newMessage);
  
          try {
              pubsub.publish(MESSAGE_RECEIVED, { 
                messageReceived: newMessage,
                username: receiver 
              });
              console.log("Message published successfully:", newMessage);
          } catch (error) {
              console.error("Failed to publish message:", error);
          }

          return newMessage;
      } catch (error) {
          console.error('Error receiving message:', error);
          throw new Error('Failed to receive message');
      }
  },
  },
  Subscription: {
    messageReceived: {
      subscribe: (_, { username }) => {
          console.log(`User subscribed: ${username}`);
          const iterator = pubsub.asyncIterator([MESSAGE_RECEIVED]);
          pubsub.publish(MESSAGE_RECEIVED, { messageReceived: { username } });
          return iterator;
      },
    },
  },
};

module.exports = chat;
