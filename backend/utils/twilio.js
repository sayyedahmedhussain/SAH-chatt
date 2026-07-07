import twilio from "twilio";

// Built lazily (on first use) instead of at module-load time. ES Module
// imports are all resolved before server.js's dotenv.config() line runs,
// so building the client at the top of this file would read
// TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN before they're set — causing
// Twilio's SDK to fail with a misleading "username is required" error.
let _client = null;
const getClient = () => {
  if (!_client) {
    _client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return _client;
};

// Basic E.164 format check, e.g. +14155552671, +923001234567
export const isValidPhoneNumber = (phone) => {
  return typeof phone === "string" && /^\+[1-9]\d{7,14}$/.test(phone);
};

// Sends an OTP via Twilio Verify to the given phone number
export const sendPhoneVerification = (phone) => {
  return getClient()
    .verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({ to: phone, channel: "sms" });
};

// Checks the OTP the user entered against Twilio Verify
export const checkPhoneVerification = (phone, code) => {
  return getClient()
    .verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({ to: phone, code });
};

// Nothing else in the project currently imports this default export, but
// it's kept for compatibility — exported as a getter so it stays lazy too.
export default getClient;