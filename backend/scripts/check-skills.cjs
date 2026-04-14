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

async function checkSkills() {
  loadEnv();
  await mongoose.connect(process.env.MONGODB_URI);
  const skills = mongoose.connection.db.collection('skills');
  
  const skillCount = await skills.countDocuments();
  const sampleSkills = await skills.find().limit(10).toArray();
  
  console.log('=== SKILLS DATABASE STATUS ===');
  console.log('Total skills in database:', skillCount);
  console.log('');
  
  if (skillCount === 0) {
    console.log('❌ No skills found in database!');
    console.log('This is likely why CV extraction is not working.');
    console.log('The extraction service needs skills to match against.');
  } else {
    console.log('✅ Skills found in database:');
    sampleSkills.forEach((skill, index) => {
      console.log(`${index + 1}. ${skill.name} (Type: ${skill.type || 'N/A'})`);
    });
    if (skillCount > 10) {
      console.log(`... and ${skillCount - 10} more skills`);
    }
  }
  console.log('=====================================');
  
  await mongoose.disconnect();
}

checkSkills().catch(console.error);
