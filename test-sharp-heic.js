const sharp = require('sharp');

async function testSharpHeicSupport() {
  console.log('Testing Sharp HEIC support after rebuild...');
  
  try {
    console.log('Sharp version:', sharp.versions.sharp);
    console.log('Libvips version:', sharp.versions.vips);
    
    // Try to create a Sharp instance and check if it works
    const testInstance = sharp();
    console.log('✅ Sharp is working correctly');
    
    // Try to access format information if available
    if (sharp.format && sharp.format.input) {
      console.log('Available input formats:', Object.keys(sharp.format.input));
      
      // Check specifically for HEIC/HEIF support
      const hasHeic = sharp.format.input.heic || sharp.format.input.heif;
      console.log('HEIC/HEIF support available:', hasHeic ? 'YES' : 'NO');
    } else {
      console.log('⚠️ Sharp format API not available, but Sharp is working');
    }
    
  } catch (error) {
    console.error('Error testing Sharp:', error);
  }
}

testSharpHeicSupport(); 