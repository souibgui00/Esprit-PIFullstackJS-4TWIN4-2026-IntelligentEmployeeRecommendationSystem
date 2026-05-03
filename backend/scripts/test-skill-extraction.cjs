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

async function testSkillExtraction() {
  loadEnv();
  await mongoose.connect(process.env.MONGODB_URI);
  const skills = mongoose.connection.db.collection('skills');
  
  console.log('=== SKILL EXTRACTION TEST ===');
  
  // Get the test employee
  const users = mongoose.connection.db.collection('users');
  const employee = await users.findOne({ email: 'employee.test@maghrebia.local' });
  
  if (!employee) {
    console.log('❌ Test employee not found');
    return;
  }
  
  // Get the CV file
  if (!employee.cvUrl) {
    console.log('❌ No CV uploaded');
    return;
  }
  
  const filename = employee.cvUrl.split('/').pop();
  const filePath = path.join(__dirname, '..', 'uploads', filename);
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ CV file not found');
    return;
  }
  
  console.log('✅ Found CV file:', filename);
  
  // Test PDF extraction
  try {
    const { PdfReader } = require('pdfreader');
    
    const extractedText = await new Promise((resolve, reject) => {
      const pdfReader = new PdfReader();
      const text = [];
      
      pdfReader.parseBuffer(fs.readFileSync(filePath), (err, item) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!item) {
          const fullText = text.join(' ');
          console.log(`✅ Successfully extracted ${fullText.length} characters from PDF`);
          resolve(fullText);
          return;
        }
        
        if (item.text) {
          text.push(item.text);
        }
      });
    });
    
    console.log('Extracted text preview:');
    console.log(extractedText.substring(0, 500));
    console.log('...');
    
    // Test skill extraction
    const availableSkills = await skills.find().toArray();
    console.log(`Available skills in database: ${availableSkills.length}`);
    
    // Simple skill matching
    const foundSkills = [];
    const commonSkills = [
      'JavaScript', 'Python', 'React', 'Node.js', 'Project Management', 
      'Communication', 'SQL', 'Docker', 'TypeScript', 'HTML', 'CSS',
      'Java', 'C++', 'Angular', 'Vue', 'MongoDB', 'PostgreSQL'
    ];
    
    const extractedLower = extractedText.toLowerCase();
    
    for (const skillName of commonSkills) {
      const skill = availableSkills.find(s => 
        s.name.toLowerCase() === skillName.toLowerCase()
      );
      
      if (skill && extractedLower.includes(skillName.toLowerCase())) {
        foundSkills.push({
          skillId: skill._id,
          skillName: skill.name,
          skillType: skill.type
        });
      }
    }
    
    console.log(`\nSkills found in CV: ${foundSkills.length}`);
    foundSkills.forEach((skill, index) => {
      console.log(`${index + 1}. ${skill.skillName} (${skill.skillType})`);
    });
    
    // Add skills to employee
    if (foundSkills.length > 0) {
      console.log('\nAdding skills to employee...');
      
      for (const foundSkill of foundSkills) {
        await users.updateOne(
          { email: 'employee.test@maghrebia.local' },
          { 
            $push: { 
              skills: { 
                skillId: foundSkill.skillId, 
                level: 'intermediate', 
                score: Math.floor(Math.random() * 30) + 60, // Random score between 60-90
                auto_eval: Math.floor(Math.random() * 30) + 60
              } 
            },
            $set: { updatedAt: new Date() }
          }
        );
      }
      
      console.log('✅ Skills added to employee profile!');
      
      // Verify
      const updatedEmployee = await users.findOne({ email: 'employee.test@maghrebia.local' });
      console.log(`Employee now has ${updatedEmployee.skills?.length || 0} skills`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n=== SKILL EXTRACTION TEST COMPLETE ===');
  
  await mongoose.disconnect();
}

testSkillExtraction().catch(console.error);
