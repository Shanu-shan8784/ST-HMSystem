import AuditLog from '../models/AuditLog.model.js';

/**
 * Record an administrative or security-sensitive audit event
 */
export const recordAuditLog = async ({
  userId = null,
  userEmail = 'System',
  userRole = 'system',
  action,
  targetResource,
  targetId = '',
  details = {},
  req = null,
}) => {
  try {
    const ipAddress = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';

    await AuditLog.create({
      userId: userId || req?.user?.id || null,
      userEmail: userEmail || req?.user?.email || 'Anonymous',
      userRole: userRole || req?.user?.role || 'guest',
      action,
      targetResource,
      targetId,
      details,
      ipAddress,
    });
  } catch (error) {
    // Non-blocking: audit log failure should not crash main transaction, but log error
    console.error('[Audit Log Error]', error.message);
  }
};

