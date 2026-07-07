import api from "./api";

// Register (Step 1 — sends OTP to email)
export const registerUser = (userData) => {
  return api.post("/auth/register", userData);
};

// Verify OTP (Step 2 — completes registration / login)
export const verifyOtp = (email, otp) => {
  return api.post("/auth/verify-otp", { email, otp });
};

// Resend OTP
export const resendOtp = (email) => {
  return api.post("/auth/resend-otp", { email });
};

// Send Phone OTP (Step 1 — sends OTP to phone via Twilio Verify)
export const sendPhoneOtp = (userData) => {
  return api.post("/auth/send-phone-otp", userData);
};

// Verify Phone OTP (Step 2 — completes registration / login)
export const verifyPhoneOtp = (phone, otp) => {
  return api.post("/auth/verify-phone-otp", { phone, otp });
};

// Resend Phone OTP
export const resendPhoneOtp = (phone) => {
  return api.post("/auth/resend-phone-otp", { phone });
};

// Login
export const loginUser = (userData) => {
  return api.post("/auth/login", userData);
};

// Get Logged-in User
export const getMe = () => {
  return api.get("/auth/me");
};
