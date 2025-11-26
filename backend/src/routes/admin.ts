import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.middleware';
import { companyService } from '../services/db.service';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.post('/company/create', async (req: Request, res: Response) => {
  try {
    const { name, nationalId, companyType, businessType } = req.body;

    if (!name || !nationalId || !companyType) {
      return res.status(400).json({ error: 'نام، شناسه ملی و نوع شرکت الزامی است' });
    }

    // Check if company with this nationalId already exists
    const existing = await companyService.findByNationalId(nationalId);
    if (existing) {
      return res.status(400).json({ error: 'شرکتی با این شناسه ملی قبلاً ثبت شده است' });
    }

    // Generate username and password
    const username = nationalId;
    const password = generateRandomPassword();
    const passwordHash = await bcrypt.hash(password, 10);

    const company = await companyService.create({
      name,
      nationalId,
      companyType,
      businessType: businessType || null,
      username,
      passwordHash
    });

    res.status(201).json({
      company: {
        id: company.id,
        name: company.name,
        nationalId: company.nationalId,
        companyType: company.companyType,
        businessType: company.businessType,
        username: company.username
      },
      password // Return password for display (in production, send via SMS/email)
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'خطا در ایجاد شرکت' });
  }
});

router.get('/company/list', async (req: Request, res: Response) => {
  try {
    const companies = await companyService.findAll();
    res.json({ companies });
  } catch (error) {
    console.error('List companies error:', error);
    res.status(500).json({ error: 'خطا در دریافت لیست شرکت‌ها' });
  }
});

router.get('/company/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const company = await companyService.findById(id);
    
    if (!company) {
      return res.status(404).json({ error: 'شرکت یافت نشد' });
    }

    res.json({ company });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'خطا در دریافت اطلاعات شرکت' });
  }
});

function generateRandomPassword(): string {
  const length = 8;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export default router;

