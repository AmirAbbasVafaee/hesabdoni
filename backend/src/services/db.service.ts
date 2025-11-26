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
    const offset = (page - 1) * limit;
    const [rows] = await pool.execute(
      'SELECT * FROM document_covers WHERE companyId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      [companyId, limit, offset]
    );
    const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM document_covers WHERE companyId = ?', [companyId]);
    const total = (countRows as any[])[0].total;
    return { documents: rows as DocumentCover[], total };
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

