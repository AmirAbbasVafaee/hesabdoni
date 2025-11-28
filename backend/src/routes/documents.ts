import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { documentService } from '../services/db.service';
import { processOCR } from '../services/ocr.service';

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
  destination: (req, file, cb) => {
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
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  fileFilter: (req, file, cb) => {
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
    const ocrResult = await processOCR(imagePath);

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
      coverImageUrl
    } = req.body;

    if (!req.companyId) {
      return res.status(401).json({ error: 'احراز هویت نشده است' });
    }

    const document = await documentService.create({
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
      status: 'pending',
      coverImageUrl: coverImageUrl || null
    });

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

    res.json({ document, files });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'خطا در دریافت اطلاعات سند' });
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


