const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');

const user = {
  Query: {
    me: (_, __, { user }) => user,
    getUsers: async () => {
      try {
        return await User.find(); // Ensure this is awaited properly
      } catch (error) {
        throw new Error('Error fetching users: ' + error.message);
      }
    },
  },
  Mutation: {
    register: async (_, { name, username, email, password, phoneNumber }) => {
      const existingUser = await User.findOne({ username });
      if (existingUser) throw new Error('User already exists');
      
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = new User({ name, username, email, password: hashedPassword, phoneNumber });
      await newUser.save();
      
      const token = jwt.sign({ id: newUser.id, name, username, email, phoneNumber }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return { id: newUser.id, name, username, email, phoneNumber, token };
    },
    login: async (_, { username, password }) => {
      const user = await User.findOne({ username });
      if (!user) throw new Error('User not found');
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) throw new Error('Invalid credentials');
      
      const token = jwt.sign({ id: user.id, name: user.name, username: user.username, email: user.email, phoneNumber: user.phoneNumber }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return { token };
    },
  },
};

module.exports = user;
