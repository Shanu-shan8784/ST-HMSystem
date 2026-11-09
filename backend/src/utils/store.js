import mongoose from 'mongoose';
import { weeklyMessMenu } from './initialData.js';

export const isDbConnected = () => mongoose.connection.readyState === 1;

export { weeklyMessMenu };
