import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

// Ensure .env is loaded
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envPath);
  }
} catch (e) {
  // Graceful fallback if already loaded
}

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel_transport_db';
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`[MongoDB Atlas] Connected successfully: ${conn.connection.host}`);
    console.log(`[MongoDB Database] Active DB: ${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`[MongoDB Error] Connection failed: ${error.message}`);
    return false;
  }
};

export default connectDB;
