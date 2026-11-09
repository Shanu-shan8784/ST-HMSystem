import connectDB from '../config/db.js';
import User from '../models/User.model.js';
import Admin from '../models/Admin.model.js';
import AuditLog from '../models/AuditLog.model.js';
import mongoose from 'mongoose';

/**
 * Enterprise CLI Admin Provisioning Script
 * Usage: node src/scripts/initAdmin.js [email] [password] [name] [department]
 */
const provisionAdmin = async () => {
  console.log('========================================================');
  console.log('   Enterprise Administrator Provisioning Utility        ');
  console.log('========================================================');

  const isConnected = await connectDB();
  if (!isConnected) {
    console.error('Failed to establish database connection. Aborting.');
    process.exit(1);
  }

  try {
    const args = process.argv.slice(2);
    const email = (args[0] || process.env.ADMIN_EMAIL || 'admin@hostel.com').toLowerCase().trim();
    const password = args[1] || process.env.ADMIN_PASSWORD || 'admin123';
    const name = args[2] || process.env.ADMIN_NAME || 'Chief Administrator';
    const department = args[3] || process.env.ADMIN_DEPT || 'Campus Administration & Institutional Affairs';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log(`[INFO] Admin account '${email}' already exists. Updating credentials...`);
        existingUser.password = password;
        existingUser.isActive = true;
        existingUser.approvalStatus = 'approved';
        await existingUser.save();
        console.log(`[SUCCESS] Admin '${email}' password and active status successfully updated.`);
      } else {
        console.error(`[ERROR] A non-admin user with email '${email}' already exists.`);
        process.exit(1);
      }
    } else {
      const newAdmin = await Admin.create({
        name,
        email,
        password,
        role: 'admin',
        phone: '+92 346 1234567',
        employeeId: 'ADM-1001',
        department,
        designation: 'Director of Facilities & Transport',
        isActive: true,
        approvalStatus: 'approved',
        permissions: ['all'],
      });

      await AuditLog.create({
        userId: newAdmin._id,
        userEmail: newAdmin.email,
        userRole: 'admin',
        action: 'ADMIN_PROVISIONED_VIA_CLI',
        targetResource: 'users',
        targetId: newAdmin._id.toString(),
        details: { department, provisionMethod: 'CLI Script' },
      });

      console.log(`[SUCCESS] Master Admin created successfully:`);
      console.log(`  Name:        ${name}`);
      console.log(`  Email:       ${email}`);
      console.log(`  Role:        admin`);
      console.log(`  Employee ID: ADM-1001`);
    }

    console.log('========================================================');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[FATAL ERROR] Provisioning failed:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

provisionAdmin();

