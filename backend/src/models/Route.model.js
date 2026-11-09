import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: true,
      trim: true,
    },
    routeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    assignedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    driverName: {
      type: String,
      default: 'Assigned Driver',
    },
    driverPhone: {
      type: String,
      default: '',
    },
    vehicleNumber: {
      type: String,
      default: 'BUS-101',
    },
    stops: [
      {
        stopName: { type: String, required: true },
        morningTime: { type: String, default: '07:30 AM' },
        eveningTime: { type: String, default: '05:30 PM' },
        lat: { type: Number, default: 35.2971 },
        lng: { type: Number, default: 75.6341 },
      },
    ],
    activeStudentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['On Schedule', 'Delayed', 'Completed', 'Idle'],
      default: 'On Schedule',
      index: true,
    },
    currentCoordinates: {
      lat: { type: Number, default: 35.2971 },
      lng: { type: Number, default: 75.6341 },
    },
    alerts: [
      {
        message: { type: String },
        time: { type: Date, default: Date.now },
        severity: { type: String, enum: ['info', 'warning', 'emergency'], default: 'info' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

routeSchema.index({ status: 1 });

const Route = mongoose.models.Route || mongoose.model('Route', routeSchema);
export default Route;
