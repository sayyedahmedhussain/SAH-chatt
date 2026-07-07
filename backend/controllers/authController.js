import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateOtp, OTP_EXPIRY_MS } from "../utils/otp.js";
import { sendOtpEmail } from "../utils/emailService.js";
import {
  isValidPhoneNumber,
  sendPhoneVerification,
  checkPhoneVerification,
} from "../utils/twilio.js";

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Register User (Step 1) — creates an unverified account and emails an OTP
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if all fields are provided
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Please fill all fields",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }

      // Existing but unverified — resend a fresh OTP instead of blocking
      const otp = generateOtp();
      existingUser.otp = otp;
      existingUser.otpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
      existingUser.username = username;
      const salt = await bcrypt.genSalt(10);
      existingUser.password = await bcrypt.hash(password, salt);
      if (req.file) {
        existingUser.profilePicture = `/uploads/${req.file.filename}`;
      }
      await existingUser.save();

      console.log(`📩 OTP for ${existingUser.email}: ${otp}`);

      let emailSent = true;
      try {
        await sendOtpEmail(existingUser.email, existingUser.username, otp);
      } catch (e) {
        emailSent = false;
      }

      return res.status(200).json({
        message: emailSent
          ? "Verification code sent to your email"
          : "Account updated, but the verification email could not be sent. Check the server console for your code.",
        email: existingUser.email,
        needsVerification: true,
        emailSent,
      });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get uploaded profile picture path
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : "";

    const otp = generateOtp();

    // Create New User (unverified until OTP is confirmed)
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      profilePicture,
      isVerified: false,
      otp,
      otpExpires: new Date(Date.now() + OTP_EXPIRY_MS),
    });

    // Always log the OTP server-side so registration never hard-fails just
    // because email isn't configured yet (handy for local/dev testing too).
    console.log(`📩 OTP for ${user.email}: ${otp}`);

    let emailSent = true;
    try {
      await sendOtpEmail(user.email, user.username, otp);
    } catch (e) {
      // Don't delete the account or block registration — the user can
      // still verify once EMAIL_USER/EMAIL_PASS are fixed, using "Resend code".
      emailSent = false;
    }

    res.status(201).json({
      message: emailSent
        ? "Verification code sent to your email"
        : "Account created, but the verification email could not be sent. Check the server console for your code, or contact the site owner about email setup.",
      email: user.email,
      needsVerification: true,
      emailSent,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Verify OTP (Step 2) — confirms the code and logs the user in
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const user = await User.findOne({ email }).select("+otp +otpExpires");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (!user.otpExpires || user.otpExpires.getTime() < Date.now()) {
      return res.status(400).json({
        message: "Verification code expired. Please request a new one.",
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = signToken(user._id);

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(200).json({
      message: "Account verified successfully",
      token,
      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resend OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    await user.save();

    console.log(`📩 OTP for ${user.email}: ${otp}`);

    let emailSent = true;
    try {
      await sendOtpEmail(user.email, user.username, otp);
    } catch (e) {
      emailSent = false;
    }

    res.status(200).json({
      message: emailSent
        ? "A new verification code has been sent"
        : "Could not send the email, but a new code was generated — check the server console.",
      emailSent,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------------------------------------------------------
// Phone Number OTP Verification (Twilio Verify API)
// ------------------------------------------------------------------

// Send Phone OTP (Step 1) — creates an unverified account and texts an OTP
export const sendPhoneOtp = async (req, res) => {
  try {
    const { username, phone, password } = req.body;

    if (!username || !phone || !password) {
      return res.status(400).json({
        message: "Please fill all fields",
      });
    }

    if (!isValidPhoneNumber(phone)) {
      return res.status(400).json({
        message:
          "Please enter a valid phone number in international format, e.g. +14155552671",
      });
    }

    // Check if phone already exists
    const existingUser = await User.findOne({ phone });

    if (existingUser && existingUser.phoneVerified) {
      return res.status(400).json({
        message: "Phone number already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (existingUser) {
      // Existing but unverified — update details and resend a fresh OTP
      existingUser.username = username;
      existingUser.password = hashedPassword;
      if (req.file) {
        existingUser.profilePicture = `/uploads/${req.file.filename}`;
      }
      await existingUser.save();
    } else {
      await User.create({
        username,
        phone,
        password: hashedPassword,
        profilePicture: req.file ? `/uploads/${req.file.filename}` : "",
        isVerified: false,
        phoneVerified: false,
      });
    }

    try {
      await sendPhoneVerification(phone);
    } catch (twilioError) {
      return res.status(502).json({
        message:
          twilioError?.message ||
          "Could not send the verification code. Please check the phone number and try again.",
      });
    }

    res.status(201).json({
      message: "Verification code sent to your phone",
      phone,
      needsVerification: true,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Phone number already exists" });
    }
    res.status(500).json({
      message: error.message,
    });
  }
};

// Verify Phone OTP (Step 2) — confirms the code and logs the user in
export const verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and code are required" });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.phoneVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    let check;
    try {
      check = await checkPhoneVerification(phone, otp);
    } catch (twilioError) {
      // Twilio throws for expired/not-found verification sessions
      return res.status(400).json({
        message: "Verification code expired. Please request a new one.",
      });
    }

    if (check.status !== "approved") {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    user.isVerified = true;
    user.phoneVerified = true;
    await user.save();

    const token = signToken(user._id);

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(200).json({
      message: "Account verified successfully",
      token,
      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resend Phone OTP
export const resendPhoneOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.phoneVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    try {
      await sendPhoneVerification(phone);
    } catch (twilioError) {
      return res.status(502).json({
        message:
          twilioError?.message || "Could not send the verification code",
      });
    }

    res.status(200).json({
      message: "A new verification code has been sent",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if fields are provided
    if (!email || !password) {
      return res.status(400).json({
        message: "Please fill all fields",
      });
    }

    // Find user by email (or, for phone-registered accounts, by phone —
    // the login form's single identifier field is reused for both so the
    // existing login UI/flow doesn't need to change)
    const user = await User.findOne({
      $or: [{ email }, { phone: email }],
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        needsVerification: true,
        email: user.email,
      });
    }

    // Generate JWT Token
    const token = signToken(user._id);

    res.status(200).json({
      message: "Login Successful",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get Logged-in User
export const getMe = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
