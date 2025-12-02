import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import {
  contractCategoryService,
  contractService,
  ContractCategory,
  Contract
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
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') }, // 50MB default for contracts
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

// ===== GET CONTRACT CATEGORIES =====
// Get all contract categories for the authenticated company
router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    let categories = await contractCategoryService.findByCompanyId(req.companyId);

    // If no categories exist, initialize defaults
    if (categories.length === 0) {
      categories = await contractCategoryService.initializeDefaults(req.companyId);
    }

    res.json({ categories });
  } catch (error: any) {
    console.error('Get contract categories error:', error);
    res.status(500).json({ error: 'خطا در دریافت دسته‌بندی‌های قرارداد' });
  }
});

// ===== CREATE CUSTOM CONTRACT CATEGORY =====
// Add a custom contract category
router.post('/categories', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'نام دسته‌بندی الزامی است' });
    }

    // Get current max order
    const existingCategories = await contractCategoryService.findByCompanyId(req.companyId);
    const maxOrder = existingCategories.length > 0 
      ? Math.max(...existingCategories.map(c => c.order)) 
      : 0;

    const newCategory = await contractCategoryService.create({
      companyId: req.companyId,
      name: name.trim(),
      order: maxOrder + 1,
      isCustom: true
    });

    res.status(201).json({ category: newCategory });
  } catch (error: any) {
    console.error('Create contract category error:', error);
    res.status(500).json({ error: 'خطا در ایجاد دسته‌بندی قرارداد' });
  }
});

// ===== UPDATE CONTRACT CATEGORY =====
// Update a contract category (only custom categories can be updated)
router.put('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const { id } = req.params;
    const { name } = req.body;

    const category = await contractCategoryService.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'دسته‌بندی یافت نشد' });
    }

    if (category.companyId !== req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    if (!category.isCustom) {
      return res.status(400).json({ error: 'نمی‌توان دسته‌بندی پیش‌فرض را ویرایش کرد' });
    }

    if (name && typeof name === 'string' && name.trim().length > 0) {
      await contractCategoryService.update(id, { name: name.trim() });
    }

    const updatedCategory = await contractCategoryService.findById(id);
    res.json({ category: updatedCategory });
  } catch (error: any) {
    console.error('Update contract category error:', error);
    res.status(500).json({ error: 'خطا در ویرایش دسته‌بندی قرارداد' });
  }
});

// ===== DELETE CONTRACT CATEGORY =====
// Delete a custom contract category
router.delete('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const { id } = req.params;

    const category = await contractCategoryService.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'دسته‌بندی یافت نشد' });
    }

    if (category.companyId !== req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    if (!category.isCustom) {
      return res.status(400).json({ error: 'نمی‌توان دسته‌بندی پیش‌فرض را حذف کرد' });
    }

    // Check if there are contracts in this category
    const { contracts } = await contractService.findByCompanyId(req.companyId, { categoryId: id, limit: 1 });
    if (contracts.length > 0) {
      return res.status(400).json({ error: 'نمی‌توان دسته‌بندی دارای قرارداد را حذف کرد' });
    }

    // Delete the category
    await contractCategoryService.delete(id);

    res.json({ message: 'دسته‌بندی با موفقیت حذف شد' });
  } catch (error: any) {
    console.error('Delete contract category error:', error);
    res.status(500).json({ error: 'خطا در حذف دسته‌بندی قرارداد' });
  }
});

// ===== GET CONTRACTS LIST =====
// Get all contracts for the authenticated company with filters
router.get('/list', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const categoryId = req.query.categoryId as string | undefined;
    const search = req.query.search as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await contractService.findByCompanyId(req.companyId, {
      categoryId,
      search,
      page,
      limit
    });

    // Get categories for each contract
    const contractsWithCategories = await Promise.all(
      result.contracts.map(async (contract) => {
        const category = await contractCategoryService.findById(contract.categoryId);
        return {
          ...contract,
          category: category || null
        };
      })
    );

    res.json({
      contracts: contractsWithCategories,
      total: result.total,
      page,
      limit
    });
  } catch (error: any) {
    console.error('Get contracts list error:', error);
    res.status(500).json({ error: 'خطا در دریافت لیست قراردادها' });
  }
});

// ===== GET CONTRACT =====
// Get a specific contract
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const { id } = req.params;

    const contract = await contractService.findById(id);
    if (!contract) {
      return res.status(404).json({ error: 'قرارداد یافت نشد' });
    }

    if (contract.companyId !== req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const category = await contractCategoryService.findById(contract.categoryId);

    res.json({
      contract: {
        ...contract,
        category: category || null
      }
    });
  } catch (error: any) {
    console.error('Get contract error:', error);
    res.status(500).json({ error: 'خطا در دریافت قرارداد' });
  }
});

// ===== CREATE CONTRACT =====
// Create a new contract
router.post('/', upload.single('document'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'فایل سند ارسال نشده است' });
    }

    const { categoryId, title, contractCode, contractDate } = req.body;

    if (!categoryId || !title || !contractCode || !contractDate) {
      return res.status(400).json({ error: 'تمام فیلدهای الزامی باید پر شوند' });
    }

    // Verify category belongs to company
    const category = await contractCategoryService.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'دسته‌بندی یافت نشد' });
    }

    if (category.companyId !== req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    // Check if contract code already exists
    const existingContract = await contractService.findByContractCode(contractCode);
    if (existingContract) {
      return res.status(400).json({ error: 'کد قرارداد تکراری است' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const contract = await contractService.create({
      companyId: req.companyId,
      categoryId,
      title: title.trim(),
      contractCode: contractCode.trim(),
      contractDate: new Date(contractDate),
      documentUrl: fileUrl,
      documentFileName: req.file.originalname,
      documentFileSize: req.file.size,
      documentMimeType: req.file.mimetype
    });

    const contractCategory = await contractCategoryService.findById(categoryId);

    res.status(201).json({
      contract: {
        ...contract,
        category: contractCategory || null
      }
    });
  } catch (error: any) {
    console.error('Create contract error:', error);
    res.status(500).json({ 
      error: 'خطا در ایجاد قرارداد',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== UPDATE CONTRACT =====
// Update an existing contract
router.put('/:id', upload.single('document'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const { id } = req.params;
    const { categoryId, title, contractCode, contractDate } = req.body;

    const contract = await contractService.findById(id);
    if (!contract) {
      return res.status(404).json({ error: 'قرارداد یافت نشد' });
    }

    if (contract.companyId !== req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const updates: any = {};

    if (categoryId) {
      const category = await contractCategoryService.findById(categoryId);
      if (!category) {
        return res.status(404).json({ error: 'دسته‌بندی یافت نشد' });
      }
      if (category.companyId !== req.companyId) {
        return res.status(403).json({ error: 'دسترسی غیرمجاز' });
      }
      updates.categoryId = categoryId;
    }

    if (title) {
      updates.title = title.trim();
    }

    if (contractCode && contractCode !== contract.contractCode) {
      // Check if new contract code already exists
      const existingContract = await contractService.findByContractCode(contractCode);
      if (existingContract && existingContract.id !== id) {
        return res.status(400).json({ error: 'کد قرارداد تکراری است' });
      }
      updates.contractCode = contractCode.trim();
    }

    if (contractDate) {
      updates.contractDate = new Date(contractDate);
    }

    // Handle file upload if provided
    if (req.file) {
      // Delete old file
      const oldFilePath = path.join(getUploadDir(), path.basename(contract.documentUrl));
      try {
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (error) {
        console.error('Error deleting old file:', error);
      }

      updates.documentUrl = `/uploads/${req.file.filename}`;
      updates.documentFileName = req.file.originalname;
      updates.documentFileSize = req.file.size;
      updates.documentMimeType = req.file.mimetype;
    }

    const updatedContract = await contractService.update(id, updates);
    if (!updatedContract) {
      return res.status(500).json({ error: 'خطا در به‌روزرسانی قرارداد' });
    }

    const contractCategory = await contractCategoryService.findById(updatedContract.categoryId);

    res.json({
      contract: {
        ...updatedContract,
        category: contractCategory || null
      }
    });
  } catch (error: any) {
    console.error('Update contract error:', error);
    res.status(500).json({ 
      error: 'خطا در به‌روزرسانی قرارداد',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== DELETE CONTRACT =====
// Delete a contract
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    const { id } = req.params;

    const contract = await contractService.findById(id);
    if (!contract) {
      return res.status(404).json({ error: 'قرارداد یافت نشد' });
    }

    if (contract.companyId !== req.companyId) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }

    // Delete file from filesystem
    const filePath = path.join(getUploadDir(), path.basename(contract.documentUrl));
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Delete from database
    await contractService.delete(id);

    res.json({ message: 'قرارداد با موفقیت حذف شد' });
  } catch (error: any) {
    console.error('Delete contract error:', error);
    res.status(500).json({ error: 'خطا در حذف قرارداد' });
  }
});

export default router;

