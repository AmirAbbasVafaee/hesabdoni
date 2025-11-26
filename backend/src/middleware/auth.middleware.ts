import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  companyId?: string;
  isAdmin?: boolean;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'دسترسی غیرمجاز - توکن ارائه نشده است' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'توکن نامعتبر است' });
    }
    
    req.userId = decoded.userId;
    req.companyId = decoded.companyId;
    req.isAdmin = decoded.isAdmin || false;
    next();
  });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'دسترسی غیرمجاز - فقط مدیر سیستم' });
  }
  next();
};

