/**
 * Lightweight Request Body Validation Middleware
 */
export const validateBody = (rules) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, config] of Object.entries(rules)) {
      const value = req.body[field];

      if (config.required && (value === undefined || value === null || value === '')) {
        errors.push(`${config.label || field} is required`);
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        if (config.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(value).trim())) {
            errors.push(`${config.label || field} must be a valid email address`);
          }
        }

        if (config.minLength && String(value).length < config.minLength) {
          errors.push(`${config.label || field} must be at least ${config.minLength} characters`);
        }

        if (config.enum && !config.enum.includes(value)) {
          errors.push(`${config.label || field} must be one of: ${config.enum.join(', ')}`);
        }

        if (config.type === 'number' && isNaN(Number(value))) {
          errors.push(`${config.label || field} must be a valid number`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    next();
  };
};

