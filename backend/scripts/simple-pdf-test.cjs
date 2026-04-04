const path = require('path');
const fs = require('fs');

async function testSimplePdfParse() {
  console.log('=== SIMPLE PDF-PARSE TEST ===');
  
  try {
    // Try the simple approach from documentation
    const pdf = require('pdf-parse');
    console.log('pdf-parse imported');
    
    const filePath = path.join(__dirname, '..', 'uploads', 'b234fc38b8464687a258da560291a7f8.pdf');
    
    if (fs.existsSync(filePath)) {
      console.log('Reading file:', filePath);
      const dataBuffer = fs.readFileSync(filePath);
      
      try {
        const data = await pdf(dataBuffer);
        console.log('✅ PDF parsed successfully!');
        console.log('Text length:', data.text.length);
        console.log('First 200 characters:');
        console.log(data.text.substring(0, 200));
        console.log('');
        console.log('Pages:', data.numpages);
        console.log('Info:', data.info);
        
        // Test skill extraction
        const commonSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'Project Management', 'Communication', 'SQL', 'Docker'];
        const foundSkills = [];
        
        commonSkills.forEach(skill => {
          if (data.text.toLowerCase().includes(skill.toLowerCase())) {
            foundSkills.push(skill);
          }
        });
        
        console.log('');
        console.log('Skills found in CV:', foundSkills);
        
      } catch (parseError) {
        console.error('❌ PDF parsing failed:', parseError.message);
        console.error('Stack:', parseError.stack);
      }
    } else {
      console.log('❌ CV file not found');
    }
    
  } catch (importError) {
    console.error('❌ Failed to import pdf-parse:', importError.message);
    console.error('Stack:', importError.stack);
  }
  
  console.log('==========================');
}

testSimplePdfParse().catch(console.error);
