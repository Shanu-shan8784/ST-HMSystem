import connectDB from '../config/db.js';
import mongoose from 'mongoose';

const runHealthCheck = async () => {
  console.log('[DB Utility] Connecting to MongoDB Atlas...');
  const connected = await connectDB();
  if (connected) {
    console.log('[DB Utility] Database connection verified. System is running with dynamic live database.');
    await mongoose.disconnect();
    process.exit(0);
  } else {
    console.error('[DB Utility] Database connection failed.');
    process.exit(1);
  }
};

runHealthCheck();
