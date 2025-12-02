-- Migration for company documents feature
-- This migration adds tables for managing company general information documents

-- Company document types table (for predefined and custom types)
CREATE TABLE IF NOT EXISTS company_document_types (
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

-- Company documents table (stores uploaded files)
CREATE TABLE IF NOT EXISTS company_documents (
  id VARCHAR(36) PRIMARY KEY,
  companyId VARCHAR(36) NOT NULL,
  documentTypeId VARCHAR(36) NOT NULL,
  fileUrl VARCHAR(500) NOT NULL,
  fileName VARCHAR(255) NOT NULL,
  fileSize BIGINT,
  mimeType VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (documentTypeId) REFERENCES company_document_types(id) ON DELETE CASCADE,
  INDEX idx_companyId (companyId),
  INDEX idx_documentTypeId (documentTypeId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

