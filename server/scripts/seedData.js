import mongoose from "mongoose";
import * as dotenv from "dotenv";
import Plan from "../models/Plan.js";

dotenv.config();

const samplePlans = [
  {
    planName: "Basic Fitness",
    monthlyPlanAmount: "1200",
    yearlyPlanAmount: "12000",
    waterStations: "Available",
    lockerRooms: "Available",
    wifiService: "Available",
    cardioClass: "Not Available",
    refreshment: "Not Available",
    groupFitnessClasses: "Not Available",
    personalTrainer: "Not Available",
    specialEvents: "Not Available",
    cafeOrLounge: "Not Available",
  },
  {
    planName: "Standard Pro",
    monthlyPlanAmount: "2500",
    yearlyPlanAmount: "24000",
    waterStations: "Available",
    lockerRooms: "Available",
    wifiService: "Available",
    cardioClass: "Available",
    refreshment: "Available",
    groupFitnessClasses: "Available",
    personalTrainer: "Not Available",
    specialEvents: "Available",
    cafeOrLounge: "Not Available",
  },
  {
    planName: "VIP Elite",
    monthlyPlanAmount: "4500",
    yearlyPlanAmount: "42000",
    waterStations: "Available",
    lockerRooms: "Available",
    wifiService: "Available",
    cardioClass: "Available",
    refreshment: "Available",
    groupFitnessClasses: "Available",
    personalTrainer: "Available",
    specialEvents: "Available",
    cafeOrLounge: "Available",
  },
];

const seedPlans = async () => {
  if (!process.env.MONGO_URI) {
    console.error("❌ Error: MONGO_URI is missing or undefined in server/.env.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for optional seeding.");

    let insertedCount = 0;
    for (const planData of samplePlans) {
      const exists = await Plan.findOne({ planName: planData.planName });
      if (!exists) {
        await new Plan(planData).save();
        console.log(`✅ Seeded plan: "${planData.planName}"`);
        insertedCount++;
      } else {
        console.log(`ℹ️ Plan "${planData.planName}" already exists, skipping.`);
      }
    }

    console.log(`Done. Seeded ${insertedCount} new plan(s).`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Database seeding failed.");
    console.error(`Error: ${err.name || "Error"} - ${err.message ? err.message.replace(/mongodb(\+srv)?:\/\/[^\s@]+@[^\s/]+/gi, "mongodb+srv://[CREDENTIALS_REDACTED]") : "Unknown error"}`);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
};

seedPlans();
