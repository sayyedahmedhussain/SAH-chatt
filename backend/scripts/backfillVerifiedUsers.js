// One-time fix for accounts that existed BEFORE the OTP verification
// feature was added. Those users never had `isVerified` set, so Mongoose
// was defaulting it to `false` and locking them out of login.
//
// Run this once from the backend/ folder:
//   node scripts/backfillVerifiedUsers.js
//
// It marks every user who doesn't currently have an OTP pending (i.e.
// wasn't mid-signup when this ran) as verified. Safe to run more than once.

import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI not found in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const result = await User.updateMany(
    { isVerified: { $ne: true }, otp: null },
    { $set: { isVerified: true } }
  );

  console.log(
    `✅ Marked ${result.modifiedCount} existing user(s) as verified.`
  );

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
