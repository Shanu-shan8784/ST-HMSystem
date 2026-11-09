import mongoose from 'mongoose';
import User from './User.model.js';

const adminSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    default: () => `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
  },
  department: {
    type: String,
    default: 'Campus Administration & Hostel Affairs',
  },
  designation: {
    type: String,
    default: 'System Administrator',
  },
  permissions: {
    type: [String],
    default: [
      'all',
      'manage_users',
      'manage_hostel',
      'manage_transport',
      'manage_finances',
      'system_settings',
    ],
  },
  officeLocation: {
    type: String,
    default: 'Main Administration Building, Room 204',
  },
  emergencyContact: {
    type: String,
    default: '',
  },
});

const Admin = User.discriminators?.admin || User.discriminator('admin', adminSchema);
export default Admin;

