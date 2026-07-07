import express from "express";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  registerUser,
  loginUser,
  getMe,
  verifyOtp,
  resendOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
  resendPhoneOtp,
} from "../controllers/authController.js";

const router = express.Router();

// Register (Step 1 — sends OTP)
router.post(
  "/register",
  upload.single("profilePicture"),
  registerUser
);

// Verify OTP (Step 2 — completes registration, returns token)
router.post("/verify-otp", verifyOtp);

// Resend OTP
router.post("/resend-otp", resendOtp);

// Phone Number OTP Verification (Twilio Verify)
router.post(
  "/send-phone-otp",
  upload.single("profilePicture"),
  sendPhoneOtp
);
router.post("/verify-phone-otp", verifyPhoneOtp);
router.post("/resend-phone-otp", resendPhoneOtp);

// Login
router.post("/login", loginUser);

// Get Logged-in User
router.get("/me", protect, getMe);

export default router;
