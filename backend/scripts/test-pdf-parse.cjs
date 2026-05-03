const path = require('path');
const fs = require('fs');

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

async function testPdfParse() {
  console.log('=== PDF-PARSE TEST ===');
  
  try {
    console.log('Testing pdf-parse import...');
    const pdfParseModule = require('pdf-parse');
    console.log('Module keys:', Object.keys(pdfParseModule));
    console.log('Module type:', typeof pdfParseModule);
    
    const pdfParse = pdfParseModule.PDFParse || pdfParseModule.default || pdfParseModule.pdfParse || pdfParseModule;
    console.log('✅ pdf-parse imported successfully');
    console.log('pdfParse type:', typeof pdfParse);
    
    // Create a new instance if it's a class
    let parser;
    if (typeof pdfParse === 'function' && pdfParse.prototype) {
      parser = new pdfParse({
        verbosity: 0
      });
    } else if (typeof pdfParse === 'function') {
      parser = pdfParse;
    } else {
      console.error('pdfParse is not a constructor or function');
      return;
    }
    
    console.log('Parser type:', typeof parser);
    console.log('Parser methods:', Object.getOwnPropertyNames(parser.__proto__));
    
    // Test with the uploaded CV
    const filePath = path.join(__dirname, '..', 'uploads', 'b234fc38b8464687a258da560291a7f8.pdf');
    
    if (fs.existsSync(filePath)) {
      console.log('Testing with CV file:', filePath);
      const dataBuffer = fs.readFileSync(filePath);
      console.log('File buffer size:', dataBuffer.length);
      
      try {
        // Load the PDF data
        await parser.load(dataBuffer);
        
        // Get the text content
        const data = {
          text: parser.getText(),
          numpages: 1, // We'll need to check actual page count
          info: parser.getInfo()
        };
        
        console.log('✅ PDF parsed successfully');
        console.log('Text length:', data.text.length);
        console.log('First 200 characters:');
        console.log(data.text.substring(0, 200));
        console.log('');
        console.log('Pages:', data.numpages);
        console.log('Info:', data.info);
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
  
  console.log('=====================');
}

testPdfParse().catch(console.error);
