import mongoose from 'mongoose';

const occupantSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      default: 'N/A',
      trim: true,
    },
    bedNumber: {
      type: Number,
      required: true,
    },
    allocatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    block: {
      type: String,
      required: true,
      default: 'Block A',
      index: true,
    },
    floor: {
      type: Number,
      default: 1,
    },
    capacity: {
      type: Number,
      required: true,
      min: [1, 'Capacity must be at least 1'],
      default: 2,
    },
    occupiedBeds: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance'],
      default: 'available',
      index: true,
    },
    occupants: [occupantSchema],
    amenities: {
      type: [String],
      default: ['Attached Bath', 'Wi-Fi', 'Study Table'],
    },
    messFee: {
      type: Number,
      default: 4500,
    },
    rentFee: {
      type: Number,
      default: 25000,
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ block: 1, status: 1 });
roomSchema.index({ 'occupants.studentId': 1 });

const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
export default Room;
