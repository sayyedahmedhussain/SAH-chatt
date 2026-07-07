// Generates a 6-digit numeric OTP as a string, e.g. "042917"
export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// How long an OTP stays valid (10 minutes)
export const OTP_EXPIRY_MS = 10 * 60 * 1000;
