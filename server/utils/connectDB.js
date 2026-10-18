import mongoose from "mongoose";

const connectDB = async (url) => {
  if (!url) {
    throw new Error("MONGO_URI is missing or undefined in environment variables.");
  }
  await mongoose.connect(url);
  console.log("✅ MongoDB Connected Successfully");
};

export default connectDB;
