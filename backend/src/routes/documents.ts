import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { documentService, ocrRowService } from '../services/db.service';
import { processOCR, OCRTableRow, OCRResult } from '../services/ocr.service';

const router = Router();

// All document routes require authentication
router.use(authenticateToken);

// Configure multer for file uploads
// Use /tmp/uploads for Liara (writable directory) or ./uploads for local development
const getUploadDir = () => {
  // Check if running on Liara or production (has PORT env var and not localhost)
  if (process.env.NODE_ENV === 'production' || process.env.UPLOAD_DIR) {
    return process.env.UPLOAD_DIR || '/tmp/uploads';
  }
  return './uploads';
};

const storage = multer.diskStorage({
  destination: (req: any, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = getUploadDir();
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (error: any) {
      console.error('Error creating upload directory:', error);
      // Fallback to /tmp if default fails
      const fallbackDir = '/tmp/uploads';
      try {
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive: true });
        }
        cb(null, fallbackDir);
      } catch (fallbackError: any) {
        console.error('Error creating fallback upload directory:', fallbackError);
        // Pass error as first argument, empty string as second (multer callback signature)
        const uploadError = new Error('خطا در ایجاد پوشه آپلود');
        (cb as any)(uploadError, '');
      }
    }
  },
  filename: (req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    (cb as any)(new Error('فقط فایل‌های تصویری (JPG, PNG) و PDF مجاز است'), false);
  }
});

// Upload document cover
router.post('/upload-cover', upload.single('cover'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'فایل ارسال نشده است' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    console.log(`File uploaded successfully: ${req.file.path} -> ${fileUrl}`);
    res.json({ fileUrl, filename: req.file.filename });
  } catch (error: any) {
    console.error('Upload cover error:', error);
    res.status(500).json({ 
      error: 'خطا در آپلود فایل',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Process OCR
router.post('/ocr', upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'فایل تصویر ارسال نشده است' });
    }

    const imagePath = req.file.path;
    console.log('Processing OCR for image:', imagePath);
    const ocrResult = await processOCR(imagePath);
    
    // Log OCR result for debugging
    console.log('OCR Result:', JSON.stringify(ocrResult, null, 2));
    console.log('OCR Result keys:', Object.keys(ocrResult));
    console.log('OCR Result has data:', {
      docNumber: !!ocrResult.docNumber,
      docDate: !!ocrResult.docDate,
      description: !!ocrResult.description,
      totalDebit: !!ocrResult.totalDebit,
      totalCredit: !!ocrResult.totalCredit,
      tableRows: ocrResult.tableRows?.length || 0,
    });

    res.json({ data: ocrResult });
  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ error: 'خطا در پردازش OCR' });
  }
});

// Create document from OCR data
router.post('/confirm-cover', async (req: AuthRequest, res: Response) => {
  try {
    const {
      docNumber,
      docDate,
      description,
      kolCode,
      moeenCode,
      tafziliCode,
      debit,
      credit,
      totalDebit,
      totalCredit,
      coverImageUrl,
      tableRows
    } = req.body;

    if (!req.companyId) {
      return res.status(401).json({ error: 'احراز هویت نشده است' });
    }

    // Log received data for debugging
    console.log('=== Confirm Cover - Received Data ===');
    console.log('docNumber:', docNumber);
    console.log('docDate:', docDate);
    console.log('description:', description);
    console.log('kolCode:', kolCode);
    console.log('moeenCode:', moeenCode);
    console.log('tafziliCode:', tafziliCode);
    console.log('debit:', debit);
    console.log('credit:', credit);
    console.log('totalDebit:', totalDebit);
    console.log('totalCredit:', totalCredit);
    console.log('coverImageUrl:', coverImageUrl);
    console.log('tableRows count:', tableRows?.length || 0);

    const documentData = {
      companyId: req.companyId,
      docNumber: docNumber || null,
      docDate: docDate || null,
      description: description || null,
      kolCode: kolCode || null,
      moeenCode: moeenCode || null,
      tafziliCode: tafziliCode || null,
      debit: parseFloat(debit) || 0,
      credit: parseFloat(credit) || 0,
      totalDebit: parseFloat(totalDebit) || 0,
      totalCredit: parseFloat(totalCredit) || 0,
      status: 'pending' as const,
      coverImageUrl: coverImageUrl || null
    };

    console.log('=== Saving Document to Database ===');
    console.log('Document Data:', JSON.stringify(documentData, null, 2));

    const document = await documentService.create(documentData);
    
    console.log('Document created with ID:', document.id);

    // Save OCR table rows if provided
    if (tableRows && Array.isArray(tableRows) && tableRows.length > 0) {
      console.log(`Saving ${tableRows.length} table rows to database`);
      
      const ocrRowsToSave = tableRows.map((row: OCRTableRow, index: number) => {
        // ترکیب توضیحات مختلف در یک فیلد description
        const descriptions: string[] = [];
        if (row.kolDescription) descriptions.push(`کل: ${row.kolDescription}`);
        if (row.moeenDescription) descriptions.push(`معین: ${row.moeenDescription}`);
        if (row.tafziliDescription) descriptions.push(`تفصیل: ${row.tafziliDescription}`);
        if (row.tafziliDetails) descriptions.push(row.tafziliDetails);
        
        return {
          documentId: document.id,
          rowNumber: row.rowNumber || null,
          kolCode: row.kolCode || null,
          moeenCode: row.moeenCode || null,
          tafziliCode: row.tafziliCode || null,
          description: descriptions.join(' | ') || null,
          partialAmount: row.partialAmount || 0,
          debit: row.debit || 0,
          credit: row.credit || 0,
          parentRowId: null,
          order: row.order !== undefined ? row.order : index
        };
      });

      console.log('OCR Rows to Save:', JSON.stringify(ocrRowsToSave.slice(0, 3), null, 2), '... (showing first 3)');

      // Create all rows first
      const createdRows = await ocrRowService.createBatch(ocrRowsToSave);
      console.log(`Successfully saved ${createdRows.length} OCR rows`);

      // Update parent-child relationships in a second pass
      for (let i = 0; i < tableRows.length; i++) {
        const row = tableRows[i];
        if (row.isSubRow && row.parentRowIndex !== undefined && row.parentRowIndex >= 0 && row.parentRowIndex < createdRows.length) {
          const parentRow = createdRows[row.parentRowIndex];
          if (parentRow && createdRows[i]) {
            // Update the child row with parent ID
            await ocrRowService.update(createdRows[i].id, { parentRowId: parentRow.id });
            console.log(`Updated parent-child relationship: row ${i} -> parent ${row.parentRowIndex}`);
          }
        }
      }
    } else {
      console.log('No table rows to save');
    }

    console.log('=== Document Creation Complete ===');
    res.status(201).json({ document });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'خطا در ایجاد سند' });
  }
});

// Upload document file
router.post('/:id/upload-file', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, order } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'فایل ارسال نشده است' });
    }

    // Verify document belongs to company
    const document = await documentService.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'سند یافت نشد' });
    }

    if (document.companyId !== req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const file = await documentService.addFile({
      documentId: id,
      title: title || req.file.originalname,
      order: parseInt(order) || 0,
      fileUrl
    });

    res.status(201).json({ file });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ error: 'خطا در آپلود فایل' });
  }
});

// Get documents list
router.get('/list', async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== Documents List Request ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Query:', req.query);
    console.log('User info:', { 
      userId: req.userId, 
      companyId: req.companyId, 
      isAdmin: req.isAdmin 
    });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Check authentication
    if (!req.userId) {
      console.error('No userId found in request');
      return res.status(401).json({ error: 'احراز هویت نشده است' });
    }

    // Admin users don't have companyId, so return empty list or handle differently
    if (req.isAdmin) {
      console.log('Admin user - returning empty list');
      return res.json({ documents: [], total: 0 });
    }

    // Company users must have companyId
    if (!req.companyId) {
      console.error('No companyId found for non-admin user');
      return res.status(401).json({ error: 'شناسه شرکت یافت نشد' });
    }

    console.log(`Fetching documents for companyId: ${req.companyId}, page: ${page}, limit: ${limit}`);
    
    try {
      const result = await documentService.findByCompanyId(req.companyId, page, limit);
      console.log(`Successfully found ${result.documents.length} documents, total: ${result.total}`);
      res.json(result);
    } catch (dbError: any) {
      console.error('Database query error:', dbError);
      console.error('Database error message:', dbError.message);
      console.error('Database error code:', dbError.code);
      console.error('Database error sqlState:', dbError.sqlState);
      console.error('Database error sqlMessage:', dbError.sqlMessage);
      throw dbError;
    }
  } catch (error: any) {
    console.error('=== List documents error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request user:', { userId: req.userId, companyId: req.companyId, isAdmin: req.isAdmin });
    
    // Return more detailed error in development
    const errorResponse: any = { 
      error: 'خطا در دریافت لیست اسناد'
    };
    
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
      errorResponse.details = error.message;
      errorResponse.stack = error.stack;
    }
    
    res.status(500).json(errorResponse);
  }
});

// Get document by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = await documentService.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'سند یافت نشد' });
    }

    if (document.companyId !== req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const files = await documentService.getFiles(id);
    const ocrRows = await ocrRowService.findByDocumentId(id);

    res.json({ document, files, ocrRows });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'خطا در دریافت اطلاعات سند' });
  }
});

// Get OCR rows for a document
router.get('/:id/ocr-rows', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = await documentService.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'سند یافت نشد' });
    }

    if (document.companyId !== req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const ocrRows = await ocrRowService.findByDocumentId(id);

    res.json({ ocrRows });
  } catch (error) {
    console.error('Get OCR rows error:', error);
    res.status(500).json({ error: 'خطا در دریافت اطلاعات جدول OCR' });
  }
});

// Update document
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const document = await documentService.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'سند یافت نشد' });
    }

    if (document.companyId !== req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const updated = await documentService.update(id, updates);
    res.json({ document: updated });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'خطا در به‌روزرسانی سند' });
  }
});

// Delete document file
router.delete('/:id/files/:fileId', async (req: AuthRequest, res: Response) => {
  try {
    const { id, fileId } = req.params;

    const document = await documentService.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'سند یافت نشد' });
    }

    if (document.companyId !== req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const deleted = await documentService.deleteFile(fileId);
    if (deleted) {
      res.json({ message: 'فایل حذف شد' });
    } else {
      res.status(404).json({ error: 'فایل یافت نشد' });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'خطا در حذف فایل' });
  }
});

export default router;


