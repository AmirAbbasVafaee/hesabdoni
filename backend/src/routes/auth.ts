import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { companyService } from '../services/db.service';

const router = Router();

// Unified login route for both admin and companies
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است' });
    }

    // First, check if it's admin credentials
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

    if (username === adminUsername && password === adminPassword) {
      // Admin login
      const secret = process.env.JWT_SECRET || 'secret';
      const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as string;
      
      const token = jwt.sign(
        { userId: 'admin', companyId: null, isAdmin: true },
        secret,
        { expiresIn } as jwt.SignOptions
      );

      return res.json({
        token,
        user: {
          id: 'admin',
          name: 'مدیر سیستم',
          username: adminUsername,
          isAdmin: true
        }
      });
    }

    // If not admin, check company credentials
    const company = await companyService.findByUsername(username);
    
    if (!company) {
      return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });
    }

    const isValidPassword = await bcrypt.compare(password, company.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });
    }

    // Company login
    const secret = process.env.JWT_SECRET || 'secret';
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as string;
    
    const token = jwt.sign(
      { userId: company.id, companyId: company.id, isAdmin: false },
      secret,
      { expiresIn } as jwt.SignOptions
    );

    res.json({
      token,
      user: {
        id: company.id,
        name: company.name,
        username: company.username,
        isAdmin: false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'خطا در ورود به سیستم' });
  }
});

export default router;

