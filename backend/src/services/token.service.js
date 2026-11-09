import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.model.js';
import User from '../models/User.model.js';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'mern_hostel_access_secret_key_2026';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET ? process.env.JWT_SECRET + '_refresh' : 'mern_hostel_refresh_secret_key_2026');

const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access token
const REFRESH_TOKEN_DAYS = 7; // 7-day refresh token

/**
 * Hash raw refresh token for safe database persistence
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate Access Token & Refresh Token pair, persisting session in MongoDB
 */
export const createTokenPair = async (user, userAgent = 'Unknown Device', ipAddress = '127.0.0.1') => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(
    { id: user._id.toString(), tokenType: 'refresh' },
    REFRESH_TOKEN_SECRET,
    { expiresIn: `${REFRESH_TOKEN_DAYS}d` }
  );

  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

  // Store hashed session in DB
  await Session.create({
    userId: user._id,
    refreshTokenHash,
    userAgent,
    ipAddress,
    expiresAt,
    isRevoked: false,
  });

  return { accessToken, refreshToken, expiresAt };
};

/**
 * Rotate Refresh Token with automatic reuse detection
 */
export const rotateRefreshToken = async (oldRefreshToken, userAgent = 'Unknown Device', ipAddress = '127.0.0.1') => {
  if (!oldRefreshToken) {
    throw new Error('Refresh token missing');
  }

  let decoded;
  try {
    decoded = jwt.verify(oldRefreshToken, REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new Error('Invalid or expired refresh token');
  }

  const oldHash = hashToken(oldRefreshToken);
  const session = await Session.findOne({ refreshTokenHash: oldHash });

  // REUSE DETECTION: If session not found or already revoked, invalidate ALL sessions of this user
  if (!session || session.isRevoked) {
    if (decoded?.id) {
      await Session.updateMany({ userId: decoded.id }, { isRevoked: true });
    }
    throw new Error('Security Alert: Refresh token reuse detected. All sessions revoked.');
  }

  // Revoke the old session
  session.isRevoked = true;
  await session.save();

  // Re-verify the user still exists, is active, and approved
  const user = await User.findById(session.userId);
  if (!user || !user.isActive) {
    throw new Error('User account is deactivated or no longer exists');
  }

  if (user.role === 'student' && user.approvalStatus !== 'approved') {
    throw new Error('Student account is not approved by administrator');
  }

  // Issue brand-new token pair
  return await createTokenPair(user, userAgent, ipAddress);
};

/**
 * Revoke specific refresh token (Logout)
 */
export const revokeRefreshToken = async (refreshToken) => {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await Session.updateOne({ refreshTokenHash: tokenHash }, { isRevoked: true });
};

/**
 * Revoke all sessions for a specific user (Force logout on password change/admin action)
 */
export const revokeAllSessions = async (userId) => {
  await Session.updateMany({ userId }, { isRevoked: true });
};

export { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET };

