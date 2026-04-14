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

async function checkEmployeeCV() {
  loadEnv();
  await mongoose.connect(process.env.MONGODB_URI);
  const users = mongoose.connection.db.collection('users');
  
  const employee = await users.findOne({ email: 'employee.test@maghrebia.local' });
  
  console.log('=== EMPLOYEE CV STATUS ===');
  console.log('Email:', employee.email);
  console.log('CV URL:', employee.cvUrl || 'No CV uploaded');
  console.log('Skills count:', employee.skills ? employee.skills.length : 0);
  
  if (employee.skills && employee.skills.length > 0) {
    console.log('Current skills:');
    employee.skills.forEach((skill, index) => {
      const skillName = skill.skill ? skill.skill.name : skill.skillId || 'Unknown';
      console.log(`${index + 1}. ${skillName} (Score: ${skill.score || skill.proficiencyScore || 'N/A'})`);
    });
  }
  
  // Check if CV file exists locally
  if (employee.cvUrl) {
    const filename = employee.cvUrl.split('/').pop();
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    if (fs.existsSync(filePath)) {
      console.log('✅ CV file exists locally at:', filePath);
      console.log('File size:', fs.statSync(filePath).size, 'bytes');
    } else {
      console.log('❌ CV file not found locally at:', filePath);
    }
  }
  
  console.log('===========================');
  
  await mongoose.disconnect();
}

checkEmployeeCV().catch(console.error);
