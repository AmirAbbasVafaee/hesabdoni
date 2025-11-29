import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Company {
  id: string;
  name: string;
  nationalId: string;
  companyType: 'سهامی خاص' | 'سهامی عام' | 'مسئولیت محدود' | 'تضامنی';
  businessType: string | null;
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentCover {
  id: string;
  companyId: string;
  docNumber: string | null;
  docDate: Date | null;
  description: string | null;
  kolCode: string | null;
  moeenCode: string | null;
  tafziliCode: string | null;
  debit: number;
  credit: number;
  totalDebit: number;
  totalCredit: number;
  status: 'pending' | 'completed';
  coverImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentFile {
  id: string;
  documentId: string;
  title: string;
  order: number;
  fileUrl: string;
  createdAt: Date;
}

// Company operations
export const companyService = {
  async create(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO companies (id, name, nationalId, companyType, businessType, username, passwordHash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, company.name, company.nationalId, company.companyType, company.businessType, company.username, company.passwordHash]
    );
    const [rows] = await pool.execute('SELECT * FROM companies WHERE id = ?', [id]);
    return (rows as Company[])[0];
  },

  async findByUsername(username: string): Promise<Company | null> {
    const [rows] = await pool.execute('SELECT * FROM companies WHERE username = ?', [username]);
    return (rows as Company[])[0] || null;
  },

  async findByNationalId(nationalId: string): Promise<Company | null> {
    const [rows] = await pool.execute('SELECT * FROM companies WHERE nationalId = ?', [nationalId]);
    return (rows as Company[])[0] || null;
  },

  async findAll(): Promise<Company[]> {
    const [rows] = await pool.execute('SELECT id, name, nationalId, companyType, businessType, username, createdAt, updatedAt FROM companies ORDER BY createdAt DESC');
    return rows as Company[];
  },

  async findById(id: string): Promise<Company | null> {
    const [rows] = await pool.execute('SELECT id, name, nationalId, companyType, businessType, username, createdAt, updatedAt FROM companies WHERE id = ?', [id]);
    return (rows as Company[])[0] || null;
  },

  async update(id: string, updates: Partial<Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'passwordHash'>>): Promise<Company | null> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    if (fields) {
      await pool.execute(`UPDATE companies SET ${fields} WHERE id = ?`, [...values, id]);
    }
    return this.findById(id);
  },

  async updatePassword(id: string, passwordHash: string): Promise<Company | null> {
    await pool.execute('UPDATE companies SET passwordHash = ? WHERE id = ?', [passwordHash, id]);
    return this.findById(id);
  }
};

// Document operations
export const documentService = {
  async create(cover: Omit<DocumentCover, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentCover> {
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO document_covers (id, companyId, docNumber, docDate, description, kolCode, moeenCode, tafziliCode, debit, credit, totalDebit, totalCredit, status, coverImageUrl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, cover.companyId, cover.docNumber, cover.docDate, cover.description,
        cover.kolCode, cover.moeenCode, cover.tafziliCode,
        cover.debit, cover.credit, cover.totalDebit, cover.totalCredit,
        cover.status, cover.coverImageUrl
      ]
    );
    const [rows] = await pool.execute('SELECT * FROM document_covers WHERE id = ?', [id]);
    return (rows as DocumentCover[])[0];
  },

  async findById(id: string): Promise<DocumentCover | null> {
    const [rows] = await pool.execute('SELECT * FROM document_covers WHERE id = ?', [id]);
    return (rows as DocumentCover[])[0] || null;
  },

  async findByCompanyId(companyId: string, page: number = 1, limit: number = 20): Promise<{ documents: DocumentCover[], total: number }> {
    console.log('=== findByCompanyId called ===');
    console.log('Parameters:', { companyId, page, limit, companyIdType: typeof companyId });
    
    if (!companyId) {
      throw new Error('companyId is required');
    }
    
    const offset = (page - 1) * limit;
    
    // Ensure limit and offset are integers
    const limitNum = Math.max(1, Math.floor(Number(limit)));
    const offsetNum = Math.max(0, Math.floor(Number(offset)));
    
    console.log('Calculated values:', { limitNum, offsetNum });
    
    try {
      // MySQL2 prepared statements don't work well with LIMIT/OFFSET placeholders
      // Use pool.query() with proper escaping instead
      const mysql = require('mysql2/promise');
      
      // Escape the limit and offset values to prevent SQL injection
      const escapedLimit = mysql.escape(limitNum);
      const escapedOffset = mysql.escape(offsetNum);
      
      console.log('Executing SELECT query with params:', [companyId, limitNum, offsetNum]);
      
      // Use query() instead of execute() for LIMIT/OFFSET
      const [rows] = await pool.query(
        `SELECT * FROM document_covers WHERE companyId = ? ORDER BY createdAt DESC LIMIT ${escapedLimit} OFFSET ${escapedOffset}`,
        [companyId]
      ) as any[];
      
      console.log('SELECT query successful, rows found:', rows.length);
      
      console.log('Executing COUNT query with param:', [companyId]);
      const [countRows] = await pool.execute(
        'SELECT COUNT(*) as total FROM document_covers WHERE companyId = ?', 
        [companyId]
      ) as any[];
      
      console.log('COUNT query result:', countRows);
      
      const total = countRows[0]?.total || 0;
      console.log('Returning result:', { documentsCount: rows.length, total: Number(total) });
      
      return { documents: rows as DocumentCover[], total: Number(total) };
    } catch (error: any) {
      console.error('=== Database error in findByCompanyId ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error sqlState:', error.sqlState);
      console.error('Error sqlMessage:', error.sqlMessage);
      console.error('Query params:', { companyId, limitNum, offsetNum });
      console.error('Error stack:', error.stack);
      throw error;
    }
  },

  async update(id: string, updates: Partial<DocumentCover>): Promise<DocumentCover | null> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    await pool.execute(`UPDATE document_covers SET ${fields} WHERE id = ?`, [...values, id]);
    return this.findById(id);
  },

  async addFile(file: Omit<DocumentFile, 'id' | 'createdAt'>): Promise<DocumentFile> {
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO document_files (id, documentId, title, `order`, fileUrl) VALUES (?, ?, ?, ?, ?)',
      [id, file.documentId, file.title, file.order, file.fileUrl]
    );
    const [rows] = await pool.execute('SELECT * FROM document_files WHERE id = ?', [id]);
    return (rows as DocumentFile[])[0];
  },

  async getFiles(documentId: string): Promise<DocumentFile[]> {
    const [rows] = await pool.execute('SELECT * FROM document_files WHERE documentId = ? ORDER BY `order` ASC', [documentId]);
    return rows as DocumentFile[];
  },

  async deleteFile(fileId: string): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM document_files WHERE id = ?', [fileId]);
    return (result as any).affectedRows > 0;
  }
};

