import Twilio from "twilio";
import config from "../config";

const client = Twilio(config.twilio.accountSid, config.twilio.authToken);

export const sendSMS = async (to: string, message: string): Promise<void> => {
  try {
    await client.messages.create({
      body: message,
      from: config.twilio.twilioPhone,
      to,
    });
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
};
