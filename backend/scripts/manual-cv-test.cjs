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

async function testManualCVExtraction() {
  loadEnv();
  await mongoose.connect(process.env.MONGODB_URI);
  const users = mongoose.connection.db.collection('users');
  const skills = mongoose.connection.db.collection('skills');
  
  const employee = await users.findOne({ email: 'employee.test@maghrebia.local' });
  
  if (!employee.cvUrl) {
    console.log('❌ No CV uploaded');
    return;
  }
  
  const filename = employee.cvUrl.split('/').pop();
  const filePath = path.join(__dirname, '..', 'uploads', filename);
  
  console.log('=== MANUAL CV EXTRACTION TEST ===');
  console.log('CV File:', filename);
  console.log('File Path:', filePath);
  console.log('File Size:', fs.statSync(filePath).size, 'bytes');
  console.log('');
  
  // Get all available skills
  const availableSkills = await skills.find().toArray();
  console.log('Available skills in database:', availableSkills.length);
  
  // Create some test skills to add to the employee
  const testSkills = [
    { skillId: availableSkills[0]?._id, level: 'intermediate', score: 75, auto_eval: 75 },
    { skillId: availableSkills[1]?._id, level: 'intermediate', score: 80, auto_eval: 80 },
    { skillId: availableSkills[2]?._id, level: 'intermediate', score: 70, auto_eval: 70 },
  ].filter(skill => skill.skillId);
  
  console.log('Test skills to add:', testSkills.length);
  
  try {
    // Manually add skills to employee
    for (const skill of testSkills) {
      const skillName = availableSkills.find(s => s._id.toString() === skill.skillId.toString())?.name || 'Unknown';
      console.log(`Adding skill: ${skillName}`);
      
      await users.updateOne(
        { email: 'employee.test@maghrebia.local' },
        { 
          $push: { skills: skill },
          $set: { updatedAt: new Date() }
        }
      );
    }
    
    console.log('✅ Skills added successfully!');
    
    // Verify the update
    const updatedEmployee = await users.findOne({ email: 'employee.test@maghrebia.local' });
    console.log('Employee now has', updatedEmployee.skills?.length || 0, 'skills');
    
    updatedEmployee.skills?.forEach((skill, index) => {
      const skillName = skill.skill || skill.skillId || 'Unknown';
      console.log(`${index + 1}. ${skillName} (Score: ${skill.score || skill.proficiencyScore || 'N/A'})`);
    });
    
  } catch (error) {
    console.error('❌ Failed to add skills:', error.message);
  }
  
  console.log('=====================================');
  
  await mongoose.disconnect();
}

testManualCVExtraction().catch(console.error);
