-- Migration for contract archive feature
-- This migration adds tables for managing company contracts

-- Contract categories table (for predefined and custom categories)
CREATE TABLE IF NOT EXISTS contract_categories (
  id VARCHAR(36) PRIMARY KEY,
  companyId VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  `order` INT NOT NULL DEFAULT 0,
  isCustom BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_companyId (companyId),
  INDEX idx_order (companyId, `order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id VARCHAR(36) PRIMARY KEY,
  companyId VARCHAR(36) NOT NULL,
  categoryId VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  contractCode VARCHAR(100) UNIQUE NOT NULL,
  contractDate DATE NOT NULL,
  documentUrl VARCHAR(500) NOT NULL,
  documentFileName VARCHAR(255) NOT NULL,
  documentFileSize BIGINT,
  documentMimeType VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES contract_categories(id) ON DELETE CASCADE,
  INDEX idx_companyId (companyId),
  INDEX idx_categoryId (categoryId),
  INDEX idx_contractCode (contractCode),
  INDEX idx_contractDate (contractDate),
  INDEX idx_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

