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

export interface DocumentOCRRow {
  id: string;
  documentId: string;
  rowNumber: string | null;
  kolCode: string | null;
  moeenCode: string | null;
  tafziliCode: string | null;
  description: string | null;
  partialAmount: number;
  debit: number;
  credit: number;
  parentRowId: string | null;
  order: number;
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

// OCR Row operations
export const ocrRowService = {
  async create(row: Omit<DocumentOCRRow, 'id' | 'createdAt'>): Promise<DocumentOCRRow> {
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO document_ocr_rows (id, documentId, rowNumber, kolCode, moeenCode, tafziliCode, description, partialAmount, debit, credit, parentRowId, \`order\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, row.documentId, row.rowNumber, row.kolCode, row.moeenCode, row.tafziliCode,
        row.description, row.partialAmount, row.debit, row.credit, row.parentRowId, row.order
      ]
    );
    const [rows] = await pool.execute('SELECT * FROM document_ocr_rows WHERE id = ?', [id]);
    return (rows as DocumentOCRRow[])[0];
  },

  async createBatch(rows: Omit<DocumentOCRRow, 'id' | 'createdAt'>[]): Promise<DocumentOCRRow[]> {
    if (rows.length === 0) return [];
    
    const createdRows: DocumentOCRRow[] = [];
    
    // Create rows one by one to handle parent-child relationships
    for (const row of rows) {
      const created = await this.create(row);
      createdRows.push(created);
    }
    
    // Update parentRowId references if needed
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].parentRowId === null && rows[i].parentRowId !== undefined) {
        // Check if this row should have a parent based on parentRowIndex
        // This would need to be passed in the row data
        // For now, we'll handle it in the calling code
      }
    }
    
    return createdRows;
  },

  async findByDocumentId(documentId: string): Promise<DocumentOCRRow[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM document_ocr_rows WHERE documentId = ? ORDER BY `order` ASC, id ASC',
      [documentId]
    );
    return rows as DocumentOCRRow[];
  },

  async deleteByDocumentId(documentId: string): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM document_ocr_rows WHERE documentId = ?', [documentId]);
    return (result as any).affectedRows >= 0;
  },

  async update(id: string, updates: Partial<DocumentOCRRow>): Promise<DocumentOCRRow | null> {
    const fields = Object.keys(updates).map(key => {
      if (key === 'order') return '`order` = ?';
      return `${key} = ?`;
    }).join(', ');
    const values = Object.values(updates);
    if (fields) {
      await pool.execute(`UPDATE document_ocr_rows SET ${fields} WHERE id = ?`, [...values, id]);
    }
    const [rows] = await pool.execute('SELECT * FROM document_ocr_rows WHERE id = ?', [id]);
    return (rows as DocumentOCRRow[])[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM document_ocr_rows WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }
};

// Company Document Types
export interface CompanyDocumentType {
  id: string;
  companyId: string;
  name: string;
  order: number;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Company Documents
export interface CompanyDocument {
  id: string;
  companyId: string;
  documentTypeId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Company Document Type operations
export const companyDocumentTypeService = {
  // Initialize default document types for a company
  async initializeDefaults(companyId: string): Promise<CompanyDocumentType[]> {
    const defaultTypes = [
      { name: 'اساسنامه', order: 1 },
      { name: 'آگهی تاسیس', order: 2 },
      { name: 'اظهار نامه ثبت', order: 3 },
      { name: 'روزنامه رسمی / آگهی تغییرات', order: 4 },
    ];

    const createdTypes: CompanyDocumentType[] = [];

    for (const type of defaultTypes) {
      const id = uuidv4();
      await pool.execute(
        'INSERT INTO company_document_types (id, companyId, name, `order`, isCustom) VALUES (?, ?, ?, ?, ?)',
        [id, companyId, type.name, type.order, false]
      );
      const [rows] = await pool.execute('SELECT * FROM company_document_types WHERE id = ?', [id]);
      createdTypes.push((rows as CompanyDocumentType[])[0]);
    }

    return createdTypes;
  },

  async findByCompanyId(companyId: string): Promise<CompanyDocumentType[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM company_document_types WHERE companyId = ? ORDER BY `order` ASC',
      [companyId]
    );
    return rows as CompanyDocumentType[];
  },

  async create(type: Omit<CompanyDocumentType, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompanyDocumentType> {
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO company_document_types (id, companyId, name, `order`, isCustom) VALUES (?, ?, ?, ?, ?)',
      [id, type.companyId, type.name, type.order, type.isCustom]
    );
    const [rows] = await pool.execute('SELECT * FROM company_document_types WHERE id = ?', [id]);
    return (rows as CompanyDocumentType[])[0];
  },

  async update(id: string, updates: Partial<Omit<CompanyDocumentType, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CompanyDocumentType | null> {
    const fields = Object.keys(updates).map(key => {
      if (key === 'order') return '`order` = ?';
      return `${key} = ?`;
    }).join(', ');
    const values = Object.values(updates);
    if (fields) {
      await pool.execute(`UPDATE company_document_types SET ${fields} WHERE id = ?`, [...values, id]);
    }
    const [rows] = await pool.execute('SELECT * FROM company_document_types WHERE id = ?', [id]);
    return (rows as CompanyDocumentType[])[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM company_document_types WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  },

  async findById(id: string): Promise<CompanyDocumentType | null> {
    const [rows] = await pool.execute('SELECT * FROM company_document_types WHERE id = ?', [id]);
    return (rows as CompanyDocumentType[])[0] || null;
  }
};

// Company Document operations
export const companyDocumentService = {
  async create(document: Omit<CompanyDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompanyDocument> {
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO company_documents (id, companyId, documentTypeId, fileUrl, fileName, fileSize, mimeType) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, document.companyId, document.documentTypeId, document.fileUrl, document.fileName, document.fileSize, document.mimeType]
    );
    const [rows] = await pool.execute('SELECT * FROM company_documents WHERE id = ?', [id]);
    return (rows as CompanyDocument[])[0];
  },

  async findByDocumentTypeId(documentTypeId: string): Promise<CompanyDocument | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM company_documents WHERE documentTypeId = ? ORDER BY createdAt DESC LIMIT 1',
      [documentTypeId]
    );
    return (rows as CompanyDocument[])[0] || null;
  },

  async findByCompanyId(companyId: string): Promise<CompanyDocument[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM company_documents WHERE companyId = ? ORDER BY createdAt DESC',
      [companyId]
    );
    return rows as CompanyDocument[];
  },

  async findById(id: string): Promise<CompanyDocument | null> {
    const [rows] = await pool.execute('SELECT * FROM company_documents WHERE id = ?', [id]);
    return (rows as CompanyDocument[])[0] || null;
  },

  async update(id: string, updates: Partial<Omit<CompanyDocument, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CompanyDocument | null> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    if (fields) {
      await pool.execute(`UPDATE company_documents SET ${fields} WHERE id = ?`, [...values, id]);
    }
    const [rows] = await pool.execute('SELECT * FROM company_documents WHERE id = ?', [id]);
    return (rows as CompanyDocument[])[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM company_documents WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  },

  async deleteByDocumentTypeId(documentTypeId: string): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM company_documents WHERE documentTypeId = ?', [documentTypeId]);
    return (result as any).affectedRows >= 0;
  }
};

// ===== CONTRACT CATEGORIES =====
export interface ContractCategory {
  id: string;
  companyId: string;
  name: string;
  order: number;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Contract Category operations
export const contractCategoryService = {
  // Initialize default contract categories for a company
  async initializeDefaults(companyId: string): Promise<ContractCategory[]> {
    const defaultCategories = [
      { name: 'قرارداد هزینه ای', order: 1 },
      { name: 'قرارداد درآمدی', order: 2 },
      { name: 'قرارداد پرسنل تمام وقت', order: 3 },
      { name: 'قرارداد پرسنل پاره وقت', order: 4 },
    ];

    const createdCategories: ContractCategory[] = [];

    for (const category of defaultCategories) {
      const id = uuidv4();
      await pool.execute(
        'INSERT INTO contract_categories (id, companyId, name, `order`, isCustom) VALUES (?, ?, ?, ?, ?)',
        [id, companyId, category.name, category.order, false]
      );
      const [rows] = await pool.execute('SELECT * FROM contract_categories WHERE id = ?', [id]);
      createdCategories.push((rows as ContractCategory[])[0]);
    }

    return createdCategories;
  },

  async findByCompanyId(companyId: string): Promise<ContractCategory[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM contract_categories WHERE companyId = ? ORDER BY `order` ASC',
      [companyId]
    );
    return rows as ContractCategory[];
  },

  async create(category: Omit<ContractCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContractCategory> {
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO contract_categories (id, companyId, name, `order`, isCustom) VALUES (?, ?, ?, ?, ?)',
      [id, category.companyId, category.name, category.order, category.isCustom]
    );
    const [rows] = await pool.execute('SELECT * FROM contract_categories WHERE id = ?', [id]);
    return (rows as ContractCategory[])[0];
  },

  async update(id: string, updates: Partial<Omit<ContractCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ContractCategory | null> {
    const fields = Object.keys(updates).map(key => {
      if (key === 'order') return '`order` = ?';
      return `${key} = ?`;
    }).join(', ');
    const values = Object.values(updates);
    if (fields) {
      await pool.execute(`UPDATE contract_categories SET ${fields} WHERE id = ?`, [...values, id]);
    }
    const [rows] = await pool.execute('SELECT * FROM contract_categories WHERE id = ?', [id]);
    return (rows as ContractCategory[])[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM contract_categories WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  },

  async findById(id: string): Promise<ContractCategory | null> {
    const [rows] = await pool.execute('SELECT * FROM contract_categories WHERE id = ?', [id]);
    return (rows as ContractCategory[])[0] || null;
  }
};

// ===== CONTRACTS =====
export interface Contract {
  id: string;
  companyId: string;
  categoryId: string;
  title: string;
  contractCode: string;
  contractDate: Date;
  documentUrl: string;
  documentFileName: string;
  documentFileSize: number | null;
  documentMimeType: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Contract operations
export const contractService = {
  async create(contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contract> {
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO contracts (id, companyId, categoryId, title, contractCode, contractDate, documentUrl, documentFileName, documentFileSize, documentMimeType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, contract.companyId, contract.categoryId, contract.title, contract.contractCode,
        contract.contractDate, contract.documentUrl, contract.documentFileName,
        contract.documentFileSize, contract.documentMimeType
      ]
    );
    const [rows] = await pool.execute('SELECT * FROM contracts WHERE id = ?', [id]);
    return (rows as Contract[])[0];
  },

  async findByCompanyId(
    companyId: string,
    options?: {
      categoryId?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ contracts: Contract[], total: number }> {
    let query = 'SELECT * FROM contracts WHERE companyId = ?';
    const params: any[] = [companyId];

    if (options?.categoryId) {
      query += ' AND categoryId = ?';
      params.push(options.categoryId);
    }

    if (options?.search) {
      query += ' AND (title LIKE ? OR contractCode LIKE ?)';
      const searchTerm = `%${options.search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countRows] = await pool.execute(countQuery, params) as any[];
    const total = countRows[0]?.total || 0;

    // Add pagination
    if (options?.page && options?.limit) {
      const offset = (options.page - 1) * options.limit;
      query += ' ORDER BY contractDate DESC, createdAt DESC LIMIT ? OFFSET ?';
      params.push(options.limit, offset);
    } else {
      query += ' ORDER BY contractDate DESC, createdAt DESC';
    }

    const [rows] = await pool.execute(query, params);
    return { contracts: rows as Contract[], total: Number(total) };
  },

  async findById(id: string): Promise<Contract | null> {
    const [rows] = await pool.execute('SELECT * FROM contracts WHERE id = ?', [id]);
    return (rows as Contract[])[0] || null;
  },

  async findByContractCode(contractCode: string): Promise<Contract | null> {
    const [rows] = await pool.execute('SELECT * FROM contracts WHERE contractCode = ?', [contractCode]);
    return (rows as Contract[])[0] || null;
  },

  async update(id: string, updates: Partial<Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Contract | null> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    if (fields) {
      await pool.execute(`UPDATE contracts SET ${fields} WHERE id = ?`, [...values, id]);
    }
    const [rows] = await pool.execute('SELECT * FROM contracts WHERE id = ?', [id]);
    return (rows as Contract[])[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM contracts WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }
};

