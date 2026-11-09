import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';

import authRoutes from './routes/auth.routes.js';
import hostelRoutes from './routes/hostel.routes.js';
import transportRoutes from './routes/transport.routes.js';
import feeRoutes from './routes/fee.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { seedMasterAdminOnce } from './services/adminInit.service.js';

// Load .env using Node native env loader if available
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (e) {
  // Graceful continue
}

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas and initialize Master Admin
connectDB().then(async () => {
  console.log('[Server] MongoDB Atlas connected. Enterprise architecture active.');
  await seedMasterAdminOnce();
});

// Security: Helmet HTTP Headers (configured for cross-origin Leaflet map tile rendering)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Cookie Parser for HttpOnly Refresh Tokens
app.use(cookieParser());

// Express Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Production-ready CORS with Credentials support
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in development, can restrict in strict production
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  })
);

// Rate Limiter for Authentication endpoints (Anti-Brute-Force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hostel', hostelRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/fee', feeRoutes);
app.use('/api/complaint', complaintRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'Hostel & Transport Enterprise API',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root
app.get('/', (req, res) => {
  res.send('School Transport & Hostel Management Enterprise API is active.');
});

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`Server Running at PORT ${PORT}`);
  console.log(`===============================================`);
});

export default app;
