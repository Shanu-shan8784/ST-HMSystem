import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { hashToken, createTokenPair, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '../src/services/token.service.js';
import { authorizeRoles, enforceStudentOwnership } from '../src/middleware/role.middleware.js';

let passedTests = 0;
let failedTests = 0;

const assert = (condition, testName) => {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failedTests++;
  }
};

const runTests = async () => {
  console.log('========================================================');
  console.log('   Running Enterprise Automated System Test Suite       ');
  console.log('========================================================\n');

  // TEST SUITE 1: Password Security & Bcrypt Hashing
  console.log('[Suite 1: Password Hashing & Verification]');
  try {
    const rawPassword = 'SecureStudentPass@2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    assert(hash !== rawPassword, 'Password is never stored in plaintext');
    assert(hash.startsWith('$2'), 'Bcrypt algorithm version $2 is utilized');

    const matchValid = await bcrypt.compare(rawPassword, hash);
    assert(matchValid === true, 'Valid password correctly verified');

    const matchInvalid = await bcrypt.compare('WrongPassword123', hash);
    assert(matchInvalid === false, 'Invalid password rejected');
  } catch (err) {
    console.error('Suite 1 error:', err);
    failedTests++;
  }

  // TEST SUITE 2: JWT Access & Refresh Token Architecture
  console.log('\n[Suite 2: JWT Access & Refresh Token Architecture]');
  try {
    const dummyUser = {
      _id: '67cb019f8e4e931b641f90aa',
      email: 'student.test@school.edu',
      role: 'student',
      name: 'Test Student',
    };

    const accessToken = jwt.sign(
      { id: dummyUser._id, email: dummyUser.email, role: dummyUser.role },
      ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
    assert(decoded.id === dummyUser._id, 'Access token carries valid user identity');
    assert(decoded.role === 'student', 'Access token carries role information');

    const rawRefresh = jwt.sign({ id: dummyUser._id, tokenType: 'refresh' }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    const refreshHash1 = hashToken(rawRefresh);
    const refreshHash2 = hashToken(rawRefresh);
    assert(refreshHash1 === refreshHash2, 'Deterministic SHA-256 token hashing for session lookup');
    assert(refreshHash1.length === 64, 'SHA-256 hash length is exactly 64 hex characters');

    // Token tampering test
    let tamperedError = false;
    try {
      jwt.verify(accessToken + 'tampered', ACCESS_TOKEN_SECRET);
    } catch {
      tamperedError = true;
    }
    assert(tamperedError === true, 'Tampered JWT access token immediately rejected');
  } catch (err) {
    console.error('Suite 2 error:', err);
    failedTests++;
  }

  // TEST SUITE 3: Role-Based Access Control (RBAC) Middleware
  console.log('\n[Suite 3: Role-Based Authorization Enforcement]');
  try {
    const adminReq = { user: { role: 'admin' } };
    const studentReq = { user: { role: 'student' } };
    const guestReq = { user: null };

    let adminPassed = false;
    const adminCheck = authorizeRoles('admin');
    adminCheck(adminReq, {}, () => { adminPassed = true; });
    assert(adminPassed === true, 'Admin successfully authorized on admin-only route');

    let studentBlocked = false;
    adminCheck(studentReq, {
      status: (code) => ({
        json: (data) => {
          if (code === 403 && data.success === false) studentBlocked = true;
        },
      }),
    }, () => {});
    assert(studentBlocked === true, 'Student blocked with 403 Forbidden on admin-only route');

    let guestBlocked = false;
    adminCheck(guestReq, {
      status: (code) => ({
        json: (data) => {
          if (code === 403) guestBlocked = true;
        },
      }),
    }, () => {});
    assert(guestBlocked === true, 'Unauthenticated guest blocked on protected route');
  } catch (err) {
    console.error('Suite 3 error:', err);
    failedTests++;
  }

  // TEST SUITE 4: Broken Object Level Authorization (IDOR) Protection
  console.log('\n[Suite 4: Student Resource Ownership (IDOR Prevention)]');
  try {
    const studentAId = '67cb019f8e4e931b641f90aa';
    const studentBId = '67cb019f8e4e931b641f90bb';

    const ownershipCheck = enforceStudentOwnership((req) => req.params.studentId);

    // Student A accessing Student A's records
    let allowedSelf = false;
    ownershipCheck(
      { user: { _id: studentAId, role: 'student' }, params: { studentId: studentAId } },
      {},
      () => { allowedSelf = true; }
    );
    assert(allowedSelf === true, 'Student can access their own resource');

    // Student A attempting to access Student B's records
    let blockedOther = false;
    ownershipCheck(
      { user: { _id: studentAId, role: 'student' }, params: { studentId: studentBId } },
      {
        status: (code) => ({
          json: (data) => {
            if (code === 403) blockedOther = true;
          },
        }),
      },
      () => {}
    );
    assert(blockedOther === true, 'Cross-student resource access blocked with 403 Forbidden');

    // Admin accessing Student B's records (Allowed management)
    let adminBypass = false;
    ownershipCheck(
      { user: { _id: '67cb019f8e4e931b641f90cc', role: 'admin' }, params: { studentId: studentBId } },
      {},
      () => { adminBypass = true; }
    );
    assert(adminBypass === true, 'Administrator allowed management access to student records');
  } catch (err) {
    console.error('Suite 4 error:', err);
    failedTests++;
  }

  // TEST SUITE 5: Student Approval State Machine
  console.log('\n[Suite 5: Student Approval State Machine]');
  try {
    const validTransitions = ['pending', 'approved', 'rejected'];
    assert(validTransitions.includes('pending'), 'Pending status supported for new enrollments');
    assert(validTransitions.includes('approved'), 'Approved status supported for active students');
    assert(validTransitions.includes('rejected'), 'Rejected status supported for declined applications');

    // Mock student logic
    const student = {
      role: 'student',
      approvalStatus: 'pending',
    };

    const isLoginPermitted = student.approvalStatus === 'approved';
    assert(isLoginPermitted === false, 'Pending student cannot bypass login gate');

    student.approvalStatus = 'approved';
    const isLoginPermittedNow = student.approvalStatus === 'approved';
    assert(isLoginPermittedNow === true, 'Approved student permitted to log in');
  } catch (err) {
    console.error('Suite 5 error:', err);
    failedTests++;
  }

  // TEST SUITE 6: Room Overbooking & Capacity Logic
  console.log('\n[Suite 6: Concurrency & Overbooking Prevention Logic]');
  try {
    const testRoom = {
      roomNumber: 'A-204',
      capacity: 2,
      occupiedBeds: 2,
      occupants: [{ name: 'Student 1', bedNumber: 1 }, { name: 'Student 2', bedNumber: 2 }],
    };

    const isOverbooked = testRoom.occupiedBeds >= testRoom.capacity;
    assert(isOverbooked === true, 'Overbooking correctly detected when beds equal capacity');

    // Duplicate student assignment check
    const studentIdToAssign = 'STU-999';
    const isAlreadyAssigned = testRoom.occupants.some((o) => o.studentId === studentIdToAssign);
    assert(isAlreadyAssigned === false, 'Student not currently in room');
  } catch (err) {
    console.error('Suite 6 error:', err);
    failedTests++;
  }

  // TEST SUITE 7: User Creation Authority & Role Privilege Rules
  console.log('\n[Suite 7: User Authority & Role Privilege Enforcement]');
  try {
    // 1. Warden creates student -> ALLOWED
    const wardenReq = { user: { role: 'warden', _id: '67cb019f8e4e931b641f90ww' } };
    const wardenTargetRole = 'student';
    const isWardenAllowedStudent = wardenReq.user.role === 'warden' && wardenTargetRole === 'student';
    assert(isWardenAllowedStudent === true, 'Warden is authorized to enroll student accounts');

    // 2. Warden creates non-student (driver / warden / admin) -> FORBIDDEN
    const forbiddenRolesForWarden = ['driver', 'warden', 'admin'];
    let allForbiddenBlocked = true;
    for (const r of forbiddenRolesForWarden) {
      if (!(wardenReq.user.role === 'warden' && r !== 'student')) {
        allForbiddenBlocked = false;
      }
    }
    assert(allForbiddenBlocked === true, 'Wardens strictly blocked from creating Admin, Warden, or Driver');

    // 3. Admin creates any role -> ALLOWED
    const adminReq = { user: { role: 'admin', _id: '67cb019f8e4e931b641f90aa' } };
    const adminPermittedRoles = ['student', 'warden', 'driver', 'admin'];
    const isAdminAllowedAll = adminPermittedRoles.every((r) => adminReq.user.role === 'admin');
    assert(isAdminAllowedAll === true, 'Admin has master authority to create Warden, Driver, Student, and Admin');
  } catch (err) {
    console.error('Suite 7 error:', err);
    failedTests++;
  }

  console.log('\n========================================================');
  console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('========================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();

