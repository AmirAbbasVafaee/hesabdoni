import { createWorker } from 'tesseract.js';
import * as fs from 'fs';
import * as path from 'path';

export interface OCRResult {
  docNumber?: string;
  docDate?: string;
  description?: string;
  kolCode?: string;
  moeenCode?: string;
  tafziliCode?: string;
  debit?: number;
  credit?: number;
  totalDebit?: number;
  totalCredit?: number;
}

export async function processOCR(imagePath: string): Promise<OCRResult> {
  const worker = await createWorker('fas'); // Persian language
  
  try {
    // Recognize text with better configuration
    const { data: { text } } = await worker.recognize(imagePath);
    await worker.terminate();
    
    // Parse the extracted text
    const result: OCRResult = parseOCRText(text);
    
    return result;
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}

function parseOCRText(text: string): OCRResult {
  const result: OCRResult = {};
  
  // Normalize text - remove extra spaces and normalize Persian characters
  const normalizedText = text
    .replace(/\s+/g, ' ')
    .replace(/[،؛]/g, ':')
    .trim();
  
  // Extract document number (شماره سند) - multiple patterns
  const docNumberPatterns = [
    /شماره\s*سند\s*[:：]\s*([۰-۹0-9]+)/i,
    /شماره\s*[:：]\s*([۰-۹0-9]+)/i,
    /سند\s*شماره\s*[:：]\s*([۰-۹0-9]+)/i,
    /شماره\s*سند\s*([۰-۹0-9]+)/i,
  ];
  
  for (const pattern of docNumberPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      result.docNumber = convertPersianDigits(match[1]);
      break;
    }
  }
  
  // Extract date (تاریخ سند) - multiple patterns for Persian dates
  const datePatterns = [
    /تاریخ\s*سند\s*[:：]\s*([۰-۹0-9]{4}[\/\-]([۰-۹0-9]{1,2})[\/\-]([۰-۹0-9]{1,2}))/i,
    /تاریخ\s*[:：]\s*([۰-۹0-9]{4}[\/\-]([۰-۹0-9]{1,2})[\/\-]([۰-۹0-9]{1,2}))/i,
    /تاریخ\s*سند\s*([۰-۹0-9]{4}[\/\-]([۰-۹0-9]{1,2})[\/\-]([۰-۹0-9]{1,2}))/i,
  ];
  
  for (const pattern of datePatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      result.docDate = convertPersianDate(match[1]);
      break;
    }
  }
  
  // Extract description (شرح) - more flexible pattern
  const descPatterns = [
    /شرح\s*[:：]\s*([^\n]+?)(?:\n|کد|مبلغ|بدهکار|بستانکار|جمع)/i,
    /شرح\s*[:：]\s*([^\n]+)/i,
    /شرح\s*([^\n]+?)(?:\n|کد|مبلغ)/i,
  ];
  
  for (const pattern of descPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      result.description = match[1].trim().replace(/\s+/g, ' ');
      break;
    }
  }
  
  // Extract account codes - multiple patterns
  const kolPatterns = [
    /کد\s*حساب\s*کل\s*[:：]\s*([۰-۹0-9]+)/i,
    /حساب\s*کل\s*[:：]\s*([۰-۹0-9]+)/i,
    /کل\s*[:：]\s*([۰-۹0-9]+)/i,
  ];
  
  for (const pattern of kolPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      result.kolCode = convertPersianDigits(match[1]);
      break;
    }
  }
  
  const moeenPatterns = [
    /کد\s*حساب\s*معین\s*[:：]\s*([۰-۹0-9]+)/i,
    /حساب\s*معین\s*[:：]\s*([۰-۹0-9]+)/i,
    /معین\s*[:：]\s*([۰-۹0-9]+)/i,
  ];
  
  for (const pattern of moeenPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      result.moeenCode = convertPersianDigits(match[1]);
      break;
    }
  }
  
  const tafziliPatterns = [
    /کد\s*حساب\s*تفصیل\s*[:：]\s*([۰-۹0-9]+)/i,
    /حساب\s*تفصیل\s*[:：]\s*([۰-۹0-9]+)/i,
    /تفصیل\s*[:：]\s*([۰-۹0-9]+)/i,
  ];
  
  for (const pattern of tafziliPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      result.tafziliCode = convertPersianDigits(match[1]);
      break;
    }
  }
  
  // Extract amounts - more flexible patterns
  const debitPatterns = [
    /مبلغ\s*بدهکار\s*[:：]\s*([۰-۹0-9,]+)/i,
    /بدهکار\s*[:：]\s*([۰-۹0-9,]+)/i,
    /بدهکار\s*([۰-۹0-9,]+)/i,
  ];
  
  for (const pattern of debitPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      result.debit = parsePersianNumber(match[1]);
      break;
    }
  }
  
  const creditPatterns = [
    /مبلغ\s*بستانکار\s*[:：]\s*([۰-۹0-9,]+)/i,
    /بستانکار\s*[:：]\s*([۰-۹0-9,]+)/i,
    /بستانکار\s*([۰-۹0-9,]+)/i,
  ];
  
  for (const pattern of creditPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      result.credit = parsePersianNumber(match[1]);
      break;
    }
  }
  
  // Extract totals
  const totalDebitPatterns = [
    /جمع\s*کل\s*بدهکار\s*[:：]\s*([۰-۹0-9,]+)/i,
    /جمع\s*بدهکار\s*[:：]\s*([۰-۹0-9,]+)/i,
    /جمع\s*کل\s*[:：]\s*بدهکار\s*([۰-۹0-9,]+)/i,
  ];
  
  for (const pattern of totalDebitPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      result.totalDebit = parsePersianNumber(match[1]);
      break;
    }
  }
  
  const totalCreditPatterns = [
    /جمع\s*کل\s*بستانکار\s*[:：]\s*([۰-۹0-9,]+)/i,
    /جمع\s*بستانکار\s*[:：]\s*([۰-۹0-9,]+)/i,
    /جمع\s*کل\s*[:：]\s*بستانکار\s*([۰-۹0-9,]+)/i,
  ];
  
  for (const pattern of totalCreditPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      result.totalCredit = parsePersianNumber(match[1]);
      break;
    }
  }
  
  return result;
}

function convertPersianDigits(str: string): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const englishDigits = '0123456789';
  
  return str.split('').map(char => {
    const index = persianDigits.indexOf(char);
    return index !== -1 ? englishDigits[index] : char;
  }).join('');
}

function parsePersianNumber(str: string): number {
  // Remove commas and convert Persian digits to English
  const cleaned = convertPersianDigits(str.replace(/,/g, ''));
  return parseFloat(cleaned) || 0;
}

function convertPersianDate(persianDate: string): string {
  // Convert Persian digits to English
  const englishDate = convertPersianDigits(persianDate);
  
  // Handle different date formats: YYYY/MM/DD, YYYY-MM-DD, etc.
  const dateMatch = englishDate.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (dateMatch) {
    const year = dateMatch[1];
    const month = dateMatch[2].padStart(2, '0');
    const day = dateMatch[3].padStart(2, '0');
    
    // If year is likely Persian (1400-1500 range), convert to Gregorian
    const yearNum = parseInt(year);
    if (yearNum >= 1400 && yearNum <= 1500) {
      // Simple conversion: Persian year - 621 = Gregorian year (approximate)
      // For production, use a proper library like moment-jalaali or date-fns-jalali
      const gregorianYear = yearNum - 621;
      return `${gregorianYear}-${month}-${day}`;
    }
    
    // Already Gregorian
    return `${year}-${month}-${day}`;
  }
  
  // Return as-is if format doesn't match
  return englishDate.replace(/\//g, '-');
}

