-- Create database
CREATE DATABASE IF NOT EXISTS hesabdoni CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hesabdoni;

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  nationalId VARCHAR(20) UNIQUE NOT NULL,
  companyType ENUM('سهامی خاص', 'سهامی عام', 'مسئولیت محدود', 'تضامنی') NOT NULL,
  businessType VARCHAR(255),
  username VARCHAR(20) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nationalId (nationalId),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document covers table
CREATE TABLE IF NOT EXISTS document_covers (
  id VARCHAR(36) PRIMARY KEY,
  companyId VARCHAR(36) NOT NULL,
  docNumber VARCHAR(50),
  docDate DATE,
  description TEXT,
  kolCode VARCHAR(20),
  moeenCode VARCHAR(20),
  tafziliCode VARCHAR(20),
  debit DECIMAL(15, 2) DEFAULT 0,
  credit DECIMAL(15, 2) DEFAULT 0,
  totalDebit DECIMAL(15, 2) DEFAULT 0,
  totalCredit DECIMAL(15, 2) DEFAULT 0,
  status ENUM('pending', 'completed') DEFAULT 'pending',
  coverImageUrl VARCHAR(500),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_companyId (companyId),
  INDEX idx_docNumber (docNumber),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document files table
CREATE TABLE IF NOT EXISTS document_files (
  id VARCHAR(36) PRIMARY KEY,
  documentId VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  `order` INT NOT NULL DEFAULT 0,
  fileUrl VARCHAR(500) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (documentId) REFERENCES document_covers(id) ON DELETE CASCADE,
  INDEX idx_documentId (documentId),
  INDEX idx_order (documentId, `order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

