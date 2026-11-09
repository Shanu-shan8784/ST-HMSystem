import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    model: {
      type: String,
      default: 'Standard Transport Bus',
    },
    capacity: {
      type: Number,
      default: 40,
      min: [1, 'Capacity must be at least 1'],
    },
    assignedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedDriver: {
      type: String,
      default: '',
    },
    assignedRouteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      default: null,
      index: true,
    },
    insuranceExpiry: {
      type: Date,
      default: () => new Date(+new Date() + 180 * 24 * 60 * 60 * 1000),
    },
    fitnessExpiry: {
      type: Date,
      default: () => new Date(+new Date() + 300 * 24 * 60 * 60 * 1000),
    },
    status: {
      type: String,
      enum: ['Active', 'In Maintenance', 'Standby'],
      default: 'Active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
