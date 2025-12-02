# OCR System Improvements

## Overview

The OCR system has been significantly enhanced to extract detailed table data from Persian accounting documents. The improvements include:

1. **Table Row Extraction**: Now extracts individual rows from the accounting table
2. **Account Code Parsing**: Extracts Kol, Moeen, and Tafzili account codes
3. **Amount Extraction**: Extracts partial amounts (مبلغ جزء), debit (بدهکار), and credit (بستانکار) values
4. **Hierarchical Structure**: Supports parent-child relationships for sub-rows
5. **Database Storage**: New table to store extracted OCR rows

## Database Changes

### New Table: `document_ocr_rows`

This table stores individual rows extracted from OCR processing:

```sql
CREATE TABLE document_ocr_rows (
  id VARCHAR(36) PRIMARY KEY,
  documentId VARCHAR(36) NOT NULL,
  rowNumber VARCHAR(20),
  kolCode VARCHAR(20),
  moeenCode VARCHAR(20),
  tafziliCode VARCHAR(20),
  description TEXT,
  partialAmount DECIMAL(15, 2) DEFAULT 0,
  debit DECIMAL(15, 2) DEFAULT 0,
  credit DECIMAL(15, 2) DEFAULT 0,
  parentRowId VARCHAR(36) NULL,
  `order` INT NOT NULL DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (documentId) REFERENCES document_covers(id) ON DELETE CASCADE,
  FOREIGN KEY (parentRowId) REFERENCES document_ocr_rows(id) ON DELETE CASCADE
);
```

### Migration

Run the migration to add the new table:

```bash
mysql -u root -p hesabdoni < database/migration_add_ocr_rows.sql
```

Or if the table is already in `schema.sql`, it will be created automatically.

## API Changes

### Enhanced OCR Response

The `/api/documents/ocr` endpoint now returns table rows:

```json
{
  "data": {
    "docNumber": "112",
    "docDate": "1403/10/15",
    "description": "بابت شناسایی تنخواه خانم میرعرب شماره ۲",
    "totalDebit": 124790000,
    "totalCredit": 124790000,
    "tableRows": [
      {
        "rowNumber": "1",
        "kolCode": "2112",
        "moeenCode": "211213",
        "tafziliCode": "10599",
        "description": "سایر حسابهای پرداختنی",
        "debit": 40000000,
        "credit": 0,
        "isSubRow": false,
        "order": 1
      },
      {
        "rowNumber": "4",
        "kolCode": "6112",
        "description": "هزینه های عملیاتی",
        "debit": 84500000,
        "credit": 0,
        "isSubRow": false,
        "order": 2
      },
      {
        "kolCode": "611208",
        "tafziliCode": "1002",
        "description": "هزینه پذیرایی و آبدارخانه",
        "partialAmount": 40000000,
        "isSubRow": true,
        "parentRowIndex": 1,
        "order": 2
      }
    ],
    "rawText": "..."
  }
}
```

### New Endpoint: Get OCR Rows

```
GET /api/documents/:id/ocr-rows
```

Returns all OCR-extracted rows for a document.

### Updated Endpoint: Create Document

The `/api/documents/confirm-cover` endpoint now accepts and saves `tableRows`:

```json
{
  "docNumber": "112",
  "docDate": "1403/10/15",
  "description": "...",
  "totalDebit": 124790000,
  "totalCredit": 124790000,
  "coverImageUrl": "/uploads/...",
  "tableRows": [...]
}
```

## OCR Extraction Logic

### Table Row Detection

The OCR service now:

1. **Identifies Table Section**: Looks for table headers (ردیف, کد حساب, شرح, etc.)
2. **Parses Each Row**: Extracts account codes, descriptions, and amounts
3. **Detects Sub-Rows**: Identifies partial amount rows (مبلغ جزء) that belong to parent rows
4. **Handles Hierarchical Structure**: Maintains parent-child relationships

### Account Code Extraction

- **Kol Code**: Usually 4-digit codes (e.g., 2112, 6112)
- **Moeen Code**: Usually 6-digit codes (e.g., 211213, 611208)
- **Tafzili Code**: Usually 4-5 digit codes (e.g., 1002, 10599)

### Amount Extraction

- **Partial Amount (مبلغ جزء)**: Smaller amounts that sum up to main row amounts
- **Debit (بدهکار)**: Left column amounts
- **Credit (بستانکار)**: Right column amounts

## Testing

### Test Script

Use the test script to test OCR extraction on an image:

```bash
cd backend
npx ts-node src/scripts/test-ocr.ts path/to/image.jpg
```

The script will:
1. Process the image with OCR
2. Display extracted data
3. Save results to `ocr-result.json`

### Manual Testing

1. Upload an image via the frontend or API
2. Call `/api/documents/ocr` endpoint
3. Check the response for `tableRows` array
4. Verify extracted data matches the document

## Current Limitations & Future Improvements

### Known Limitations

1. **OCR Accuracy**: Depends on image quality and Tesseract's Persian language model
2. **Table Structure**: Assumes standard table format; may struggle with non-standard layouts
3. **Account Code Detection**: May misidentify codes if OCR text is garbled
4. **Amount Parsing**: May miss amounts if formatting is unusual

### Recommended Improvements

1. **Image Preprocessing**: 
   - Deskewing
   - Noise reduction
   - Contrast enhancement
   - Binarization

2. **Better OCR Configuration**:
   - Custom training data for Persian accounting documents
   - Page segmentation modes optimized for tables
   - Character whitelisting

3. **Post-Processing**:
   - Validation of extracted data
   - Cross-checking totals
   - Confidence scores for each extraction

4. **Machine Learning**:
   - Train a model to recognize table structures
   - Use computer vision to detect table boundaries
   - Improve account code classification

## Code Structure

### Files Modified

- `backend/src/services/ocr.service.ts` - Enhanced OCR extraction logic
- `backend/src/services/db.service.ts` - Added OCR row service
- `backend/src/routes/documents.ts` - Updated routes to handle OCR rows
- `database/schema.sql` - Added `document_ocr_rows` table
- `database/migration_add_ocr_rows.sql` - Migration script

### New Files

- `backend/src/scripts/test-ocr.ts` - Test script for OCR
- `OCR_IMPROVEMENTS.md` - This documentation

## Usage Example

```typescript
// Process OCR
const ocrResult = await processOCR(imagePath);

// ocrResult.tableRows contains extracted rows
ocrResult.tableRows?.forEach(row => {
  console.log(`Row ${row.rowNumber}: ${row.description}`);
  console.log(`  Account: ${row.kolCode}-${row.moeenCode}-${row.tafziliCode}`);
  console.log(`  Debit: ${row.debit}, Credit: ${row.credit}`);
  if (row.partialAmount) {
    console.log(`  Partial: ${row.partialAmount}`);
  }
});

// Save to database
await documentService.create({...});
await ocrRowService.createBatch(ocrResult.tableRows.map(row => ({
  documentId: document.id,
  ...row
})));
```

## Next Steps

1. **Run Migration**: Apply the database migration
2. **Test OCR**: Use the test script with your document image
3. **Review Results**: Check extracted data accuracy
4. **Iterate**: Adjust parsing logic based on test results
5. **Frontend Integration**: Update frontend to display OCR rows

