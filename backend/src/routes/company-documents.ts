import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import {
  companyDocumentTypeService,
  companyDocumentService,
  CompanyDocumentType,
  CompanyDocument
} from '../services/db.service';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Configure multer for file uploads
const getUploadDir = () => {
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
      const fallbackDir = '/tmp/uploads';
      try {
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive: true });
        }
        cb(null, fallbackDir);
      } catch (fallbackError: any) {
        console.error('Error creating fallback upload directory:', fallbackError);
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
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') }, // 10MB default
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

// ===== GET COMPANY DOCUMENT TYPES =====
// Get all document types for the authenticated company
router.get('/types', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    let types = await companyDocumentTypeService.findByCompanyId(req.companyId);

    // If no types exist, initialize defaults
    if (types.length === 0) {
      types = await companyDocumentTypeService.initializeDefaults(req.companyId);
    }

    // Get documents for each type to check completion status
    const typesWithDocuments = await Promise.all(
      types.map(async (type) => {
        const document = await companyDocumentService.findByDocumentTypeId(type.id);
        return {
          ...type,
          hasDocument: !!document,
          document: document || null
        };
      })
    );

    res.json({ types: typesWithDocuments });
  } catch (error: any) {
    console.error('Get document types error:', error);
    res.status(500).json({ error: 'خطا در دریافت انواع اسناد' });
  }
});

// ===== GET PROGRESS =====
// Get completion progress for company documents
router.get('/progress', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    let types = await companyDocumentTypeService.findByCompanyId(req.companyId);

    // If no types exist, initialize defaults
    if (types.length === 0) {
      types = await companyDocumentTypeService.initializeDefaults(req.companyId);
    }

    let completedCount = 0;
    for (const type of types) {
      const document = await companyDocumentService.findByDocumentTypeId(type.id);
      if (document) {
        completedCount++;
      }
    }

    const totalCount = types.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    res.json({
      completed: completedCount,
      total: totalCount,
      percentage
    });
  } catch (error: any) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'خطا در دریافت پیشرفت' });
  }
});

// ===== CREATE CUSTOM DOCUMENT TYPE =====
// Add a custom document type
router.post('/types', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'نام نوع سند الزامی است' });
    }

    // Get current max order
    const existingTypes = await companyDocumentTypeService.findByCompanyId(req.companyId);
    const maxOrder = existingTypes.length > 0 
      ? Math.max(...existingTypes.map(t => t.order)) 
      : 0;

    const newType = await companyDocumentTypeService.create({
      companyId: req.companyId,
      name: name.trim(),
      order: maxOrder + 1,
      isCustom: true
    });

    res.status(201).json({ type: newType });
  } catch (error: any) {
    console.error('Create document type error:', error);
    res.status(500).json({ error: 'خطا در ایجاد نوع سند' });
  }
});

// ===== UPDATE DOCUMENT TYPE =====
// Update a document type (only custom types can be updated)
router.put('/types/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const { id } = req.params;
    const { name } = req.body;

    const type = await companyDocumentTypeService.findById(id);
    if (!type) {
      return res.status(404).json({ error: 'نوع سند یافت نشد' });
    }

    if (type.companyId !== req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    if (!type.isCustom) {
      return res.status(400).json({ error: 'نمی‌توان نوع سند پیش‌فرض را ویرایش کرد' });
    }

    if (name && typeof name === 'string' && name.trim().length > 0) {
      await companyDocumentTypeService.update(id, { name: name.trim() });
    }

    const updatedType = await companyDocumentTypeService.findById(id);
    res.json({ type: updatedType });
  } catch (error: any) {
    console.error('Update document type error:', error);
    res.status(500).json({ error: 'خطا در ویرایش نوع سند' });
  }
});

// ===== DELETE DOCUMENT TYPE =====
// Delete a custom document type
router.delete('/types/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const { id } = req.params;

    const type = await companyDocumentTypeService.findById(id);
    if (!type) {
      return res.status(404).json({ error: 'نوع سند یافت نشد' });
    }

    if (type.companyId !== req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    if (!type.isCustom) {
      return res.status(400).json({ error: 'نمی‌توان نوع سند پیش‌فرض را حذف کرد' });
    }

    // Delete associated documents first
    await companyDocumentService.deleteByDocumentTypeId(id);

    // Delete the type
    await companyDocumentTypeService.delete(id);

    res.json({ message: 'نوع سند با موفقیت حذف شد' });
  } catch (error: any) {
    console.error('Delete document type error:', error);
    res.status(500).json({ error: 'خطا در حذف نوع سند' });
  }
});

// ===== UPLOAD DOCUMENT =====
// Upload a document for a specific document type
router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'فایل ارسال نشده است' });
    }

    const { documentTypeId } = req.body;

    if (!documentTypeId) {
      return res.status(400).json({ error: 'شناسه نوع سند الزامی است' });
    }

    // Verify document type belongs to company
    const type = await companyDocumentTypeService.findById(documentTypeId);
    if (!type) {
      return res.status(404).json({ error: 'نوع سند یافت نشد' });
    }

    if (type.companyId !== req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    // Check if document already exists for this type
    const existingDocument = await companyDocumentService.findByDocumentTypeId(documentTypeId);

    let document: CompanyDocument;
    if (existingDocument) {
      // Update existing document
      // Delete old file
      const oldFilePath = path.join(getUploadDir(), path.basename(existingDocument.fileUrl));
      try {
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (error) {
        console.error('Error deleting old file:', error);
      }

      document = await companyDocumentService.update(existingDocument.id, {
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }) as CompanyDocument;
    } else {
      // Create new document
      document = await companyDocumentService.create({
        companyId: req.companyId,
        documentTypeId,
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      });
    }

    res.status(201).json({ document });
  } catch (error: any) {
    console.error('Upload document error:', error);
    res.status(500).json({ 
      error: 'خطا در آپلود سند',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== GET DOCUMENT =====
// Get a specific document
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const { id } = req.params;

    const document = await companyDocumentService.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'سند یافت نشد' });
    }

    if (document.companyId !== req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    res.json({ document });
  } catch (error: any) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'خطا در دریافت سند' });
  }
});

// ===== DELETE DOCUMENT =====
// Delete a document
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const { id } = req.params;

    const document = await companyDocumentService.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'سند یافت نشد' });
    }

    if (document.companyId !== req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    // Delete file from filesystem
    const filePath = path.join(getUploadDir(), path.basename(document.fileUrl));
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Delete from database
    await companyDocumentService.delete(id);

    res.json({ message: 'سند با موفقیت حذف شد' });
  } catch (error: any) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'خطا در حذف سند' });
  }
});

export default router;

