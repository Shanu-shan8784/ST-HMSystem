import mongoose from 'mongoose';
import User from './User.model.js';

const driverSchema = new mongoose.Schema({
  licenseNumber: {
    type: String,
    required: true,
    trim: true,
  },
  licenseExpiry: {
    type: Date,
    default: () => new Date(+new Date() + 365 * 24 * 60 * 60 * 1000),
  },
  assignedVehicle: {
    type: String,
    default: 'BUS-101 (PS&CS)',
  },
  assignedRoute: {
    type: String,
    default: 'Route 101 - Skardu City',
  },
  experienceYears: {
    type: Number,
    default: 8,
  },
  shiftTime: {
    type: String,
    default: '06:30 AM - 07:00 PM',
  },
  dutyStatus: {
    type: String,
    enum: ['On Duty', 'Off Duty', 'On Leave'],
    default: 'On Duty',
  },
  emergencyContact: {
    type: String,
    default: '',
  },
});

const Driver = User.discriminators?.driver || User.discriminator('driver', driverSchema);
export default Driver;

