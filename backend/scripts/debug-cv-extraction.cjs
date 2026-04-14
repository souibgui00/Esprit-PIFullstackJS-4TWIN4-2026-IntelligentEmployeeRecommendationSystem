const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.log('Trying alternative import...');
  pdfParse = require('pdf-parse').default;
}
const mammoth = require('mammoth');

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

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const dataBuffer = fs.readFileSync(filePath);
  
  try {
    if (ext === '.pdf') {
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      return result.value;
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    console.error('Text extraction error:', error.message);
    throw error;
  }
}

async function debugCVExtraction() {
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
  
  console.log('=== CV EXTRACTION DEBUG ===');
  console.log('CV File:', filename);
  console.log('File Path:', filePath);
  console.log('File Size:', fs.statSync(filePath).size, 'bytes');
  console.log('');
  
  try {
    // Step 1: Extract text
    console.log('Step 1: Extracting text from CV...');
    const text = await extractText(filePath);
    console.log('✅ Text extracted successfully');
    console.log('Text length:', text.length, 'characters');
    console.log('First 200 characters:');
    console.log(text.substring(0, 200));
    console.log('');
    
    // Step 2: Check for common skills
    console.log('Step 2: Checking for common skills...');
    const availableSkills = await skills.find().toArray();
    console.log('Available skills in database:', availableSkills.length);
    
    const commonSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'Project Management', 'Communication', 'SQL', 'Docker'];
    const foundSkills = [];
    
    commonSkills.forEach(skill => {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });
    
    console.log('Common skills found in CV:', foundSkills);
    console.log('');
    
    // Step 3: Email and phone extraction
    console.log('Step 3: Extracting contact information...');
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : null;
    
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : null;
    
    console.log('Email found:', email || 'None');
    console.log('Phone found:', phone || 'None');
    console.log('');
    
    console.log('=== DEBUG COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Extraction failed:', error.message);
    console.error('Stack:', error.stack);
  }
  
  await mongoose.disconnect();
}

debugCVExtraction().catch(console.error);
