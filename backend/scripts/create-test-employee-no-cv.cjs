const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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

async function createTestEmployee() {
  loadEnv();
  await mongoose.connect(process.env.MONGODB_URI);
  const users = mongoose.connection.db.collection('users');
  
  console.log('=== CREATING TEST EMPLOYEE (NO CV) ===');
  
  const newEmployee = {
    email: 'employee.test2@maghrebia.local',
    name: 'John Doe',
    role: 'EMPLOYEE',
    matricule: 'EMP-TEST-0002',
    position: 'Data Analyst',
    department: 'Data Science',
    telephone: '+1 234 567 8901',
    status: 'active',
    en_ligne: false,
    isGoogleUser: false,
    isFaceIdEnabled: false,
    yearsOfExperience: 2,
    skills: [],
    cvUrl: null, // No CV uploaded
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('EmployeeTest!2025', salt);
    
    // Create employee
    const result = await users.insertOne({
      ...newEmployee,
      password: hashedPassword
    });
    
    console.log('✅ Employee created successfully!');
    console.log('Email:', newEmployee.email);
    console.log('Name:', newEmployee.name);
    console.log('Role:', newEmployee.role);
    console.log('Position:', newEmployee.position);
    console.log('Department:', newEmployee.department);
    console.log('CV Status:', newEmployee.cvUrl ? 'Uploaded' : 'No CV uploaded');
    console.log('Password:', 'EmployeeTest!2025');
    console.log('Matricule:', newEmployee.matricule);
    console.log('');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('Email: employee.test2@maghrebia.local');
    console.log('Password: EmployeeTest!2025');
    console.log('');
    console.log('📋 EXPECTED BEHAVIOR:');
    console.log('1. Login with these credentials');
    console.log('2. CV upload popup should appear immediately');
    console.log('3. Upload a CV to test extraction');
    console.log('4. Skills should be extracted and added automatically');
    console.log('');
    console.log('🎯 This employee will trigger the CV upload popup!');
    
  } catch (error) {
    console.error('❌ Failed to create employee:', error.message);
  }
  
  console.log('=== EMPLOYEE CREATION COMPLETE ===');
  
  await mongoose.disconnect();
}

createTestEmployee().catch(console.error);
