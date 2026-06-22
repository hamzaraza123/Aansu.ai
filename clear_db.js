// Aansu.ai Database Wiping Utility
// Run this script using: node --env-file=.env clear_db.js

import mongoose from "mongoose";

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error("❌ DATABASE_URL is not configured in your .env file!");
  process.exit(1);
}

async function run() {
  try {
    console.log("🔌 Connecting to MongoDB Atlas...");
    await mongoose.connect(DB_URL);
    console.log("🔌 Connected successfully.");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Could not access database connection instance.");
    }

    console.log("🧹 Clearing all posts from the 'tragedies' collection...");
    const result = await db.collection("tragedies").deleteMany({});
    
    console.log(`✅ Success! Deleted ${result.deletedCount} posts.`);
    console.log("🌱 Note: The server will re-seed the 4 classical mock tragedies on the next startup.");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database.");
  }
}

run();
