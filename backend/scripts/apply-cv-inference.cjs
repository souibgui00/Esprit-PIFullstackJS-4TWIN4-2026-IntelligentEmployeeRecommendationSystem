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
  console.log('Connecting to Mongo DB to apply retrospective CV level inference...');
  
  await mongoose.connect(uri);
  const users = mongoose.connection.db.collection('users');
  console.log('Finding employees...');
  
  const allUsers = await users.find({ 'skills': { $exists: true, $not: {$size: 0} } }).toArray();
  
  for (const user of allUsers) {
    let updated = false;
    const exp = user.yearsOfExperience || 0;
    
    // Calculate new base level based on experience
    let newLevel = 'beginner';
    if (exp >= 10) newLevel = 'advanced';
    else if (exp >= 4) newLevel = 'intermediate';
    
    // Map base levels to score baselines
    let baseScore = 25;
    if (newLevel === 'advanced') baseScore = 75;
    else if (newLevel === 'intermediate') baseScore = 50;
    
    // Calculate new experience bonus (max 40)
    const newExpBonus = Math.min(Math.max(0, exp) * 2, 40);

    const newSkills = user.skills.map(s => {
      // Re-apply if they haven't been manually evaluated yet
      if (s.auto_eval === 0 && s.hierarchie_eval === 0) {
        if (s.level !== newLevel) {
           updated = true;
           s.level = newLevel;
           
           // Re-calculate the static variance hash
           const skillIdString = s.skillId ? s.skillId.toString() : '';
           let hash = 0;
           for (let i = 0; i < skillIdString.length; i++) {
             hash = skillIdString.charCodeAt(i) + ((hash << 5) - hash);
           }
           const pseudoRandom = Math.abs(hash) % 15;
           
           // Calculate progression assuming recent update
           const prog = 5; 
           
           s.score = Math.min(baseScore + newExpBonus + prog + pseudoRandom, 120);
        } else {
           // still update score to reflect new experience bonus calculation
           const oldScore = s.score;
           
           const skillIdString = s.skillId ? s.skillId.toString() : '';
           let hash = 0;
           for (let i = 0; i < skillIdString.length; i++) {
             hash = skillIdString.charCodeAt(i) + ((hash << 5) - hash);
           }
           const pseudoRandom = Math.abs(hash) % 15;
           const prog = 5; 
           
           s.score = Math.min(baseScore + newExpBonus + prog + pseudoRandom, 120);
           if (s.score !== oldScore) updated = true;
        }
      }
      return s;
    });
    
    if (updated) {
      await users.updateOne({ _id: user._id }, { $set: { skills: newSkills } });
      console.log('✅ Applied inferred levels to user: ' + user.email + ' (Experience: ' + exp + ', Level: ' + newLevel + ')');
    }
  }
  
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(console.error);
