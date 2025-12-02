// ===== TEST OCR SCRIPT =====
// This script can be used to test OCR extraction on a document image
// Usage: ts-node src/scripts/test-ocr.ts <image-path>

import { processOCR } from '../services/ocr.service';
import * as path from 'path';
import * as fs from 'fs';

async function testOCR(imagePath: string) {
  try {
    console.log('=== Testing OCR Extraction ===');
    console.log(`Image path: ${imagePath}`);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.error(`Error: File not found: ${imagePath}`);
      process.exit(1);
    }
    
    console.log('Processing OCR...');
    const result = await processOCR(imagePath);
    
    console.log('\n=== OCR Results ===');
    console.log('Document Number:', result.docNumber);
    console.log('Document Date:', result.docDate);
    console.log('Description:', result.description);
    console.log('Total Debit:', result.totalDebit);
    console.log('Total Credit:', result.totalCredit);
    
    console.log('\n=== Table Rows ===');
    if (result.tableRows && result.tableRows.length > 0) {
      console.log(`Found ${result.tableRows.length} rows:\n`);
      
      result.tableRows.forEach((row, index) => {
        console.log(`Row ${index + 1}:`);
        console.log(`  Row Number: ${row.rowNumber || 'N/A'}`);
        console.log(`  Account Codes: Kol=${row.kolCode || 'N/A'}, Moeen=${row.moeenCode || 'N/A'}, Tafzili=${row.tafziliCode || 'N/A'}`);
        console.log(`  Kol Description: ${row.kolDescription || 'N/A'}`);
        console.log(`  Moeen Description: ${row.moeenDescription || 'N/A'}`);
        console.log(`  Tafzili Description: ${row.tafziliDescription || 'N/A'}`);
        console.log(`  Tafzili Details: ${row.tafziliDetails || 'N/A'}`);
        console.log(`  Partial Amount: ${row.partialAmount || 0}`);
        console.log(`  Debit: ${row.debit || 0}`);
        console.log(`  Credit: ${row.credit || 0}`);
        console.log(`  Order: ${row.order || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('No table rows found.');
    }
    
    console.log('\n=== Raw OCR Text (first 500 chars) ===');
    if (result.rawText) {
      console.log(result.rawText.substring(0, 500));
      console.log('...');
    }
    
    // Save results to JSON file
    const outputPath = path.join(path.dirname(imagePath), 'ocr-result.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`\nResults saved to: ${outputPath}`);
    
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Get image path from command line arguments
const imagePath = process.argv[2];

if (!imagePath) {
  console.error('Usage: ts-node src/scripts/test-ocr.ts <image-path>');
  process.exit(1);
}

testOCR(imagePath);

