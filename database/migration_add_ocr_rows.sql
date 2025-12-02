-- Migration: Add OCR rows table for storing extracted table data
-- This table stores individual rows extracted from OCR processing

USE hesabdoni;

-- OCR rows table for storing extracted table data
CREATE TABLE IF NOT EXISTS document_ocr_rows (
  id VARCHAR(36) PRIMARY KEY,
  documentId VARCHAR(36) NOT NULL,
  rowNumber VARCHAR(20),
  kolCode VARCHAR(20),
  moeenCode VARCHAR(20),
  tafziliCode VARCHAR(20),
  description TEXT,
  partialAmount DECIMAL(15, 2) DEFAULT 0,
  debit DECIMAL(15, 2) DEFAULT 0,
  credit DECIMAL(15, 2) DEFAULT 0,
  parentRowId VARCHAR(36) NULL,
  `order` INT NOT NULL DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (documentId) REFERENCES document_covers(id) ON DELETE CASCADE,
  FOREIGN KEY (parentRowId) REFERENCES document_ocr_rows(id) ON DELETE CASCADE,
  INDEX idx_documentId (documentId),
  INDEX idx_parentRowId (parentRowId),
  INDEX idx_order (documentId, `order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

