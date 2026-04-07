const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
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

async function run() {
  loadEnv();
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillmatch';
  console.log('Connecting to Mongo DB to apply deterministic variance...');
  
  await mongoose.connect(uri);
  const users = mongoose.connection.db.collection('users');
  console.log('Finding employees...');
  
  const allUsers = await users.find({ 'skills': { $exists: true, $not: {$size: 0} } }).toArray();
  
  for (const user of allUsers) {
    let updated = false;
    const newSkills = user.skills.map(s => {
      // Re-apply deterministic base score logic for any score under 50 (to force-refresh our random values)
      if (s.score <= 50) {
        updated = true;
        const skillIdString = s.skillId ? s.skillId.toString() : '';
        let hash = 0;
        for (let i = 0; i < skillIdString.length; i++) {
          hash = skillIdString.charCodeAt(i) + ((hash << 5) - hash);
        }
        const pseudoRandom = Math.abs(hash) % 15;
        // Resets default base (25) + default exp (20) + default prog (5) = 50 + deterministic variance
        s.score = 50 + pseudoRandom;
      }
      return s;
    });
    
    if (updated) {
      await users.updateOne({ _id: user._id }, { $set: { skills: newSkills } });
      console.log('✅ Updated deterministic test data for user: ' + user.email);
    }
  }
  
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(console.error);
