import connectDB from '../config/db.js';
import User from '../models/User.model.js'; // Use User model for everything
import AuditLog from '../models/AuditLog.model.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt'; // Make sure bcrypt is imported if hashing manually

const provisionAdmin = async () => {
  console.log('========================================================');
  console.log('    Enterprise Administrator Provisioning Utility        ');
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

    // 1. Always look up in the User collection
    let adminUser = await User.findOne({ email });

    if (adminUser) {
      console.log(`[INFO] Account '${email}' already exists. Updating to Admin credentials...`);
      adminUser.name = name;
      adminUser.password = password; // If your model has a pre-save hash hook, assign directly
      adminUser.role = 'admin';
      adminUser.isActive = true;
      adminUser.approvalStatus = 'approved';
      await adminUser.save();
      console.log(`[SUCCESS] Admin '${email}' successfully updated.`);
    } else {
      // 2. Create directly inside the User collection with role: 'admin'
      adminUser = await User.create({
        name,
        email,
        password, // Pre-save hook will hash this, or hash manually if needed
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
        userId: adminUser._id,
        userEmail: adminUser.email,
        userRole: 'admin',
        action: 'ADMIN_PROVISIONED_VIA_CLI',
        targetResource: 'users',
        targetId: adminUser._id.toString(),
        details: { department, provisionMethod: 'CLI Script' },
      });

      console.log(`[SUCCESS] Master Admin created successfully in User collection:`);
      console.log(`  Name:         ${name}`);
      console.log(`  Email:        ${email}`);
      console.log(`  Role:         admin`);
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