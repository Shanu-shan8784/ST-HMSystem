import mongoose from 'mongoose';
import User from './User.model.js';

const studentSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  course: {
    type: String,
    default: 'Computer Science & Engineering',
  },
  year: {
    type: Number,
    default: 1,
  },
  semester: {
    type: Number,
    default: 1,
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null,
  },
  roomNumber: {
    type: String,
    default: 'Unassigned',
  },
  hostelBlock: {
    type: String,
    default: 'Block A',
  },
  bedNumber: {
    type: Number,
    default: 1,
  },
  busRouteObjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    default: null,
  },
  busRouteId: {
    type: String,
    default: '',
  },
  busStop: {
    type: String,
    default: '',
  },
  parentName: {
    type: String,
    default: '',
  },
  parentPhone: {
    type: String,
    default: '',
  },
  parentEmail: {
    type: String,
    default: '',
  },
  guardianAddress: {
    type: String,
    default: '',
  },
  bloodGroup: {
    type: String,
    default: 'O+',
  },
  admissionDate: {
    type: Date,
    default: Date.now,
  },
});

const Student = User.discriminators?.student || User.discriminator('student', studentSchema);
export default Student;
