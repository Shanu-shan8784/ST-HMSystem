import mongoose from 'mongoose';

const outpassSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      default: '',
      trim: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    leaveDate: {
      type: Date,
      required: true,
      index: true,
    },
    returnDate: {
      type: Date,
      required: true,
    },
    emergencyContact: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    wardenRemarks: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

outpassSchema.index({ status: 1, leaveDate: 1 });
outpassSchema.index({ studentId: 1, status: 1 });

const Outpass = mongoose.models.Outpass || mongoose.model('Outpass', outpassSchema);
export default Outpass;
