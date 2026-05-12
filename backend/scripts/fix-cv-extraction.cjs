const path = require('node:path');
const fs = require('node:fs');
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

async function fixCVExtraction() {
  loadEnv();
  await mongoose.connect(process.env.MONGODB_URI);
  const users = mongoose.connection.db.collection('users');
  const skills = mongoose.connection.db.collection('skills');
  
  console.log('=== CV EXTRACTION FIX ===');
  
  // Get the test employee
  const employee = await users.findOne({ email: 'employee.test@maghrebia.local' });
  
  if (!employee) {
    console.log('❌ Test employee not found');
    return;
  }
  
  console.log('✅ Found test employee:', employee.name);
  
  // Get available skills
  const availableSkills = await skills.find().toArray();
  console.log('Available skills:', availableSkills.length);
  
  // Simulate CV extraction by adding some common skills
  const commonSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'Project Management', 
    'Communication', 'SQL', 'Docker', 'TypeScript', 'HTML', 'CSS'
  ];
  
  const skillsToAdd = [];
  
  for (const skillName of commonSkills) {
    const skill = availableSkills.find(s => 
      s.name.toLowerCase() === skillName.toLowerCase()
    );
    
    if (skill) {
      // Check if employee already has this skill
      const hasSkill = employee.skills?.some(s => 
        s.skillId?.toString() === skill._id.toString()
      );
      
      if (!hasSkill) {
        skillsToAdd.push({
          skillId: skill._id,
          level: 'intermediate',
          score: Math.floor(Math.random() * 30) + 60, // Random score between 60-90
          auto_eval: Math.floor(Math.random() * 30) + 60
        });
      }
    }
  }
  
  console.log('Skills to add:', skillsToAdd.length);
  
  if (skillsToAdd.length > 0) {
    // Add skills to employee
    for (const skill of skillsToAdd) {
      const skillName = availableSkills.find(s => s._id.toString() === skill.skillId.toString())?.name || 'Unknown';
      console.log(`Adding skill: ${skillName} (Score: ${skill.score})`);
      
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
    
    console.log('\nEmployee Skills:');
    updatedEmployee.skills?.forEach((skill, index) => {
      const skillName = availableSkills.find(s => s._id.toString() === skill.skillId.toString())?.name || 'Unknown';
      console.log(`${index + 1}. ${skillName} (Score: ${skill.score || skill.proficiencyScore || 'N/A'})`);
    });
    
  } else {
    console.log('ℹ️  Employee already has all common skills');
  }
  
  console.log('\n=== CV EXTRACTION WORKAROUND COMPLETE ===');
  console.log('The employee now has skills that would typically be extracted from a CV.');
  console.log('You can test the employee dashboard to see the skills displayed.');
  
  await mongoose.disconnect();
}

fixCVExtraction().catch(console.error);
