import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { ACCESS_TOKEN_SECRET } from '../services/token.service.js';

export const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

    // Re-verify against live database rather than blindly trusting stale token
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account no longer exists in system.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact administrator.' });
    }

    // Enforce student approval gate
    if (user.role === 'student' && user.approvalStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: user.approvalStatus === 'rejected'
          ? `Your enrollment was not approved: ${user.rejectionReason || 'Contact school administration.'}`
          : 'Your student registration is pending administrator approval. Please wait for activation.',
        approvalStatus: user.approvalStatus,
      });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({ success: false, message: 'Invalid or malformed authentication token' });
  }
};
