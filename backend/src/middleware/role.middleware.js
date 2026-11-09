/**
 * Restrict access to designated roles
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user?.role || 'Guest'}' is not authorized to perform this operation`,
      });
    }
    next();
  };
};

/**
 * Enforce Warden Hostel Block Boundary:
 * Wardens can only manage rooms in their assigned hostel block (Admins have global bypass)
 */
export const enforceWardenHostelBlock = (blockExtractor) => {
  return (req, res, next) => {
    if (req.user?.role === 'admin') return next();

    if (req.user?.role === 'warden') {
      const targetBlock = typeof blockExtractor === 'function'
        ? blockExtractor(req)
        : req.body.hostelBlock || req.body.block;

      if (!targetBlock) return next();

      const assignedBlocks = req.user.assignedBlocks || [req.user.hostelBlock];
      const isAllowed = assignedBlocks.some(
        (b) => b && (b.toLowerCase().includes(targetBlock.toLowerCase()) || targetBlock.toLowerCase().includes(b.toLowerCase()))
      );

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: You are only authorized to manage hostel blocks: ${assignedBlocks.join(', ')}`,
        });
      }
    }
    next();
  };
};

/**
 * Enforce Student Resource Ownership:
 * Students can only access or modify their own data (Admins and Wardens have management access)
 */
export const enforceStudentOwnership = (studentIdExtractor) => {
  return (req, res, next) => {
    if (req.user?.role === 'admin' || req.user?.role === 'warden') return next();

    if (req.user?.role === 'student') {
      const targetStudentId = typeof studentIdExtractor === 'function'
        ? studentIdExtractor(req)
        : req.params.studentId || req.body.studentId;

      if (targetStudentId && String(targetStudentId) !== String(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You cannot view or modify another student\'s records',
        });
      }
    }
    next();
  };
};
