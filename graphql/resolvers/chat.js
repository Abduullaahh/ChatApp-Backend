const { sendMessage } = require('../../twilio');
const Message = require('../../models/chat');

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
    receiveIncomingMessage: async (_, { content, sender }) => {
        try {
          const newMessage = new Message({
            content,
            sender,
            receiver: 'You',
          });
          await newMessage.save();
          return newMessage;
        } catch (error) {
          console.error('Error receiving message:', error);
          throw new Error('Failed to receive message');
        }
      },
    },
};

module.exports = chat;
