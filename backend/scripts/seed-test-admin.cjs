#!/usr/bin/env node

/**
 * Upserts test ADMIN account directly in MongoDB
 * Usage (from backend folder): node scripts/seed-test-admin.cjs
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

const ADMIN_ACCOUNT = {
  email: 'admin.test@maghrebia.local',
  password: 'AdminTest!2025',
  name: 'Test Admin',
  role: 'ADMIN',
  matricule: 'ADM-TEST-0001',
};

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const hashedPassword = await bcrypt.hash(ADMIN_ACCOUNT.password, 10);

    const result = await usersCollection.updateOne(
      { email: ADMIN_ACCOUNT.email },
      {
        $set: {
          email: ADMIN_ACCOUNT.email,
          password: hashedPassword,
          name: ADMIN_ACCOUNT.name,
          role: ADMIN_ACCOUNT.role,
          matricule: ADMIN_ACCOUNT.matricule,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    if (result.upsertedId) {
      console.log(`✅ Created ADMIN account: ${ADMIN_ACCOUNT.email}`);
    } else {
      console.log(`✅ Updated ADMIN account: ${ADMIN_ACCOUNT.email}`);
    }
    console.log(`   Name: ${ADMIN_ACCOUNT.name}`);
    console.log(`   Password: ${ADMIN_ACCOUNT.password}`);
    console.log(`   Role: ${ADMIN_ACCOUNT.role}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
