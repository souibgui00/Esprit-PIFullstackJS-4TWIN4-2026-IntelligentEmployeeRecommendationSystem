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

async function testAutoDiscovery() {
  loadEnv();
  await mongoose.connect(process.env.MONGODB_URI);
  const skills = mongoose.connection.db.collection('skills');
  const users = mongoose.connection.db.collection('users');
  
  console.log('=== AUTO-DISCOVERY TEST ===');
  
  // Get test employee
  const employee = await users.findOne({ email: 'employee.test@maghrebia.local' });
  
  // Get CV file
  const filename = employee.cvUrl.split('/').pop();
  const filePath = path.join(__dirname, '..', 'uploads', filename);
  
  // Extract text using the same method as the service
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
        resolve(text.join(' '));
        return;
      }
      
      if (item.text) {
        text.push(item.text);
      }
    });
  });
  
  console.log('Extracted CV text preview:');
  console.log(extractedText.substring(0, 800));
  console.log('...');
  
  // Look for potential new skills not in database
  const availableSkills = await skills.find().toArray();
  const existingSkillNames = new Set(availableSkills.map(s => s.name.toLowerCase()));
  
  // Common tech skills to check for
  const potentialSkills = [
    'Blockchain', 'Machine Learning', 'Artificial Intelligence', 'AI', 'Data Science', 'DevOps',
    'Microservices', 'GraphQL', 'TypeScript', 'Vue.js', 'Svelte', 'Next.js',
    'Flutter', 'Kubernetes', 'Terraform', 'Ansible', 'CI/CD', 'Unit Testing',
    'Integration Testing', 'System Design', 'Algorithm', 'Data Structure',
    'RESTful API', 'GraphQL API', 'NoSQL', 'SQL', 'Database Design',
    'Frontend Development', 'Backend Development', 'Full Stack', 'Mobile Development',
    'Android', 'iOS', 'React Native', 'Flutter', 'Swift', 'Kotlin',
    'Node.js', 'Express.js', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'Docker', 'AWS', 'Azure', 'Google Cloud', 'Firebase', 'Heroku',
    'Agile', 'Scrum', 'Kanban', 'TDD', 'BDD', 'OOP', 'SOLID',
    'MVC', 'MVP', 'API Design', 'System Architecture', 'Cloud Architecture',
    'Security', 'Authentication', 'Authorization', 'JWT', 'OAuth',
    'Unit Testing', 'Integration Testing', 'E2E Testing', 'Performance Testing',
    'Load Testing', 'Penetration Testing', 'Code Review', 'Debugging'
  ];
  
  const foundNewSkills = [];
  
  potentialSkills.forEach(skillName => {
    const skillLower = skillName.toLowerCase();
    if (!existingSkillNames.has(skillLower) && extractedText.toLowerCase().includes(skillLower)) {
      foundNewSkills.push(skillName);
    }
  });
  
  console.log(`\nPotential new skills found in CV: ${foundNewSkills.length}`);
  foundNewSkills.forEach((skill, index) => {
    console.log(`${index + 1}. ${skill}`);
  });
  
  if (foundNewSkills.length > 0) {
    console.log('\n🚀 These skills would be auto-discovered and added to your database!');
  } else {
    console.log('\n✅ All skills in CV already exist in database');
  }
  
  console.log('\n=== AUTO-DISCOVERY TEST COMPLETE ===');
  
  await mongoose.disconnect();
}

testAutoDiscovery().catch(console.error);
