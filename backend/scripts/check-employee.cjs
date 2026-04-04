const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Missing backend/.env');
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

async function checkEmployee() {
  loadEnv();
  await mongoose.connect(process.env.MONGODB_URI);
  const users = mongoose.connection.db.collection('users');
  
  const employee = await users.findOne({ email: 'employee.test@maghrebia.local' });
  console.log('=== EMPLOYEE ACCOUNT DETAILS ===');
  console.log('Email:', employee.email);
  console.log('Name:', employee.name);
  console.log('Role:', employee.role);
  console.log('CV URL:', employee.cvUrl || 'No CV uploaded');
  console.log('Status:', employee.status);
  console.log('Matricule:', employee.matricule);
  console.log('Department:', employee.department || 'Not assigned');
  console.log('Position:', employee.position || 'Not assigned');
  console.log('=====================================');
  
  await mongoose.disconnect();
}

checkEmployee().catch(console.error);
