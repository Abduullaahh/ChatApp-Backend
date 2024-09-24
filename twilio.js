const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

const sendMessage = async (to, body) => {
  try {
    const message = await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    return message;
  } catch (error) {
    console.error('Twilio error:', error);
    throw new Error('Failed to send message via Twilio');
  }
};

module.exports = { sendMessage };
