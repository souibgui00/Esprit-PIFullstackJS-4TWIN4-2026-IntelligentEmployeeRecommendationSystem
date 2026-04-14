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

async function testCVUploadAndExtraction() {
  loadEnv();
  await mongoose.connect(process.env.MONGODB_URI);
  const users = mongoose.connection.db.collection('users');
  
  console.log('=== CV UPLOAD AND EXTRACTION TEST ===');
  
  // Get the test employee
  const employee = await users.findOne({ email: 'employee.test@maghrebia.local' });
  
  if (!employee) {
    console.log('❌ Test employee not found');
    return;
  }
  
  console.log('✅ Found test employee:', employee.name);
  
  // Simulate CV extraction by manually calling the service
  try {
    // First, let's test if we can read the existing CV
    if (employee.cvUrl) {
      const filename = employee.cvUrl.split('/').pop();
      const filePath = path.join(__dirname, '..', 'uploads', filename);
      
      if (fs.existsSync(filePath)) {
        console.log('✅ CV file exists:', filename);
        
        // Test the extraction service directly
        console.log('Testing CV extraction service...');
        
        // Import and test the service
        const { CvExtractionService } = require('../dist/common/services/cv-extraction.service');
        const { SkillsService } = require('../dist/skills/skills.service');
        
        // Create instances properly
        const skillsService = new SkillsService();
        const cvService = new CvExtractionService(skillsService);
        
        try {
          const skillIds = await cvService.extractDataFromCV(filePath);
          console.log('✅ CV extraction completed!');
          console.log('Found skills:', skillIds.length);
          
          // Add the skills to the employee
          if (skillIds.length > 0) {
            for (const skillId of skillIds) {
              try {
                await users.updateOne(
                  { email: 'employee.test@maghrebia.local' },
                  { 
                    $push: { 
                      skills: { 
                        skillId, 
                        level: 'intermediate', 
                        score: 60, 
                        auto_eval: 60 
                      } 
                    },
                    $set: { updatedAt: new Date() }
                  }
                );
              } catch (skillError) {
                console.log('Warning: Failed to add skill:', skillError.message);
              }
            }
            
            // Verify the update
            const updatedEmployee = await users.findOne({ email: 'employee.test@maghrebia.local' });
            console.log('Employee now has', updatedEmployee.skills?.length || 0, 'skills');
          }
          
        } catch (extractionError) {
          console.error('❌ CV extraction failed:', extractionError.message);
          console.error('Stack:', extractionError.stack);
        }
      } else {
        console.log('❌ CV file not found:', filePath);
      }
    } else {
      console.log('❌ No CV uploaded for employee');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('=====================================');
  
  await mongoose.disconnect();
}

testCVUploadAndExtraction().catch(console.error);
