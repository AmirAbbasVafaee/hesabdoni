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
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
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
    cb(new Error('فقط فایل‌های تصویری (JPG, PNG) و PDF مجاز است'));
  }
});

// Upload document cover
router.post('/upload-cover', upload.single('cover'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'فایل ارسال نشده است' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Upload cover error:', error);
    res.status(500).json({ error: 'خطا در آپلود فایل' });
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!req.companyId) {
      return res.status(401).json({ error: 'احراز هویت نشده است' });
    }

    const result = await documentService.findByCompanyId(req.companyId, page, limit);
    res.json(result);
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ error: 'خطا در دریافت لیست اسناد' });
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

