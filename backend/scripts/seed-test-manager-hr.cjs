/**
 * Upserts two test accounts: MANAGER and HR (bcrypt password, same format as UsersService).
 * Usage (from backend folder): node scripts/seed-test-manager-hr.cjs
 */
const path = require('path');
const fs = require('fs');
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

const ACCOUNTS = [
  {
    email: 'manager.test@maghrebia.local',
    password: 'ManagerTest!2025',
    name: 'Test Manager',
    role: 'MANAGER',
    matricule: 'MGR-TEST-0001',
  },
  {
    email: 'hr.test@maghrebia.local',
    password: 'HRTest!2025',
    name: 'Test HR',
    role: 'HR',
    matricule: 'HR-TEST-0001',
  },
];

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const users = mongoose.connection.db.collection('users');

  console.log('Seeding test MANAGER and HR users...\n');

  for (const acc of ACCOUNTS) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(acc.password, salt);
    const emailLower = acc.email.toLowerCase();

    const existing = await users.findOne({ email: emailLower });
    await users.updateOne(
      { email: emailLower },
      {
        $set: {
          name: acc.name,
          email: emailLower,
          password: passwordHash,
          role: acc.role,
          matricule: acc.matricule,
          status: 'active',
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

    console.log(`${existing ? 'UPDATED' : 'CREATED'}: ${acc.role}`);
    console.log(`  Email:    ${emailLower}`);
    console.log(`  Password: ${acc.password}\n`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
