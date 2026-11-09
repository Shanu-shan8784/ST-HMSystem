import mongoose from 'mongoose';
import User from './User.model.js';

const wardenSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    default: () => `WRD-${Math.floor(1000 + Math.random() * 9000)}`,
  },
  hostelBlock: {
    type: String,
    default: 'Block A & B',
  },
  assignedBlocks: {
    type: [String],
    default: ['Block A', 'Block B'],
  },
  assignedFloors: {
    type: [Number],
    default: [1, 2, 3],
  },
  officeRoom: {
    type: String,
    default: 'Warden Suite B, Ground Floor',
  },
  shiftSchedule: {
    type: String,
    default: 'Morning & Evening Inspection',
  },
  qualification: {
    type: String,
    default: 'Inter Pass',
  },
  emergencyContact: {
    type: String,
    default: '',
  },
});

const Warden = User.discriminators?.warden || User.discriminator('warden', wardenSchema);
export default Warden;

