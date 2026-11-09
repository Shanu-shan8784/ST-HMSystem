import User from '../models/User.model.js';
import Admin from '../models/Admin.model.js';
import AuditLog from '../models/AuditLog.model.js';

/**
 * Enterprise Automatic Database Initializer
 * Ensures at least one Master Administrator account exists in MongoDB Atlas.
 * Runs once automatically during server startup without exposing any public registration interface.
 */
export const seedMasterAdminOnce = async () => {
  try {
    // 1. Check if any admin already exists in MongoDB
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log(`[Database Init] Master Administrator verified in database (${existingAdmin.email}).`);
      return existingAdmin;
    }

    // 2. Define default admin configuration (from env or secure fallbacks)
    const email = (process.env.ADMIN_EMAIL || 'admin@hostel.com').toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const name = process.env.ADMIN_NAME || 'Chief Administrator';
    const department = process.env.ADMIN_DEPT || 'Campus Administration & Institutional Affairs';

    // 3. Double-check if a user with this email already exists under a different role
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      console.warn(
        `[Database Init] User '${email}' already exists with role '${existingEmailUser.role}'. Promoting to admin...`
      );
      existingEmailUser.role = 'admin';
      existingEmailUser.isActive = true;
      existingEmailUser.approvalStatus = 'approved';
      await existingEmailUser.save();
      return existingEmailUser;
    }

    // 4. Create Master Admin directly in the database
    const newAdmin = await Admin.create({
      name,
      email,
      password, // Password hashed automatically by User pre-save hook using bcrypt
      role: 'admin',
      phone: '+92 346 1234567',
      employeeId: 'ADM-1001',
      department,
      designation: 'Director of Facilities & Transport',
      isActive: true,
      approvalStatus: 'approved',
      permissions: [
        'all',
        'manage_users',
        'manage_hostel',
        'manage_transport',
        'manage_finances',
        'system_settings',
      ],
    });

    // 5. Record internal audit log
    await AuditLog.create({
      userId: newAdmin._id,
      userEmail: newAdmin.email,
      userRole: 'admin',
      action: 'ADMIN_PROVISIONED_ONCE_BACKEND',
      targetResource: 'users',
      targetId: newAdmin._id.toString(),
      details: {
        method: 'Automatic Backend Startup Initializer',
        email: newAdmin.email,
        employeeId: newAdmin.employeeId,
        department,
        timestamp: new Date(),
      },
    });

    console.log(`================================================================`);
    console.log(`[Database Init] ✓ Master Administrator created once in MongoDB Atlas:`);
    console.log(`  Name:        ${newAdmin.name}`);
    console.log(`  Email:       ${newAdmin.email}`);
    console.log(`  Role:        admin`);
    console.log(`  Employee ID: ${newAdmin.employeeId}`);
    console.log(`================================================================`);

    return newAdmin;
  } catch (error) {
    console.error('[Database Init] Failed to initialize Master Administrator:', error.message);
    return null;
  }
};
