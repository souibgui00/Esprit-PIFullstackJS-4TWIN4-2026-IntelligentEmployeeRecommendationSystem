/**
 * Creates a test EMPLOYEE account for CV upload testing
 * Usage (from backend folder): node scripts/seed-test-employee.cjs
 */
const path = require('node:path');
const fs = require('node:fs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Missing backend/.env — copy .env.example and set MONGODB_URI');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const EMPLOYEE_ACCOUNT = {
  email: 'employee.test@maghrebia.local',
  password: 'EmployeeTest!2025',
  name: 'Test Employee',
  role: 'EMPLOYEE',
  matricule: 'EMP-TEST-0001',
  position: 'Software Developer',
  department: 'Engineering',
  telephone: '+1 234 567 8900',
  status: 'active',
  // No CV URL - this will trigger the CV upload popup
  cvUrl: null,
};

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const users = mongoose.connection.db.collection('users');

  console.log('Creating test EMPLOYEE user for CV upload testing...\n');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(EMPLOYEE_ACCOUNT.password, salt);
  const emailLower = EMPLOYEE_ACCOUNT.email.toLowerCase();

  const existing = await users.findOne({ email: emailLower });
  await users.updateOne(
    { email: emailLower },
    {
      $set: {
        name: EMPLOYEE_ACCOUNT.name,
        email: emailLower,
        password: passwordHash,
        role: EMPLOYEE_ACCOUNT.role,
        matricule: EMPLOYEE_ACCOUNT.matricule,
        position: EMPLOYEE_ACCOUNT.position,
        department: EMPLOYEE_ACCOUNT.department,
        telephone: EMPLOYEE_ACCOUNT.telephone,
        status: EMPLOYEE_ACCOUNT.status,
        cvUrl: EMPLOYEE_ACCOUNT.cvUrl,
        en_ligne: false,
        isGoogleUser: false,
        isFaceIdEnabled: false,
        yearsOfExperience: 0,
        skills: [],
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  console.log(`${existing ? 'UPDATED' : 'CREATED'}: EMPLOYEE`);
  console.log(`  Email:    ${emailLower}`);
  console.log(`  Password: ${EMPLOYEE_ACCOUNT.password}`);
  console.log(`  Name:     ${EMPLOYEE_ACCOUNT.name}`);
  console.log(`  Role:     ${EMPLOYEE_ACCOUNT.role}`);
  console.log(`  CV Status: No CV uploaded (will trigger popup)`);
  console.log(`\nUse these credentials to test the CV upload functionality.`);
  console.log(`The CV upload popup should appear immediately after login.`);

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
