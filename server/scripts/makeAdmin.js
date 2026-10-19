import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { User } from "../models/User.js";

dotenv.config();

const emailArg = process.argv[2];

if (!emailArg) {
  console.error("❌ Error: Email argument is required.");
  console.log("Usage: node scripts/makeAdmin.js <user-email>");
  process.exit(1);
}

const targetEmail = emailArg.trim().toLowerCase();

const promoteUser = async () => {
  if (!process.env.MONGO_URI) {
    console.error("❌ Error: MONGO_URI is missing or undefined in server/.env.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOne({ email: { $regex: new RegExp(`^${targetEmail}$`, "i") } });

    if (!user) {
      console.error(`❌ User not found with email: ${emailArg}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    if (user.role === 1) {
      console.log(`ℹ️ User "${user.name}" (${user.email}) is already an Administrator (role: 1).`);
      await mongoose.disconnect();
      process.exit(0);
    }

    user.role = 1;
    await user.save();

    console.log(`✅ Successfully promoted "${user.name}" (${user.email}) to Administrator (role: 1).`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Database operation failed.");
    console.error(`Error: ${err.name || "Error"} - ${err.message ? err.message.replace(/mongodb(\+srv)?:\/\/[^\s@]+@[^\s/]+/gi, "mongodb+srv://[CREDENTIALS_REDACTED]") : "Unknown error"}`);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
};

promoteUser();
