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
  
  // Extract document number (شماره سند)
  const docNumberMatch = text.match(/شماره\s*سند\s*[:：]\s*(\d+)/i);
  if (docNumberMatch) {
    result.docNumber = docNumberMatch[1];
  }
  
  // Extract date (تاریخ سند)
  const dateMatch = text.match(/تاریخ\s*سند\s*[:：]\s*(\d{4}\/\d{1,2}\/\d{1,2})/i);
  if (dateMatch) {
    // Convert Persian date to standard format
    result.docDate = convertPersianDate(dateMatch[1]);
  }
  
  // Extract description (شرح)
  const descMatch = text.match(/شرح\s*[:：]\s*(.+?)(?:\n|کد|مبلغ)/i);
  if (descMatch) {
    result.description = descMatch[1].trim();
  }
  
  // Extract account codes
  const kolMatch = text.match(/کد\s*حساب\s*کل\s*[:：]\s*(\d+)/i);
  if (kolMatch) {
    result.kolCode = kolMatch[1];
  }
  
  const moeenMatch = text.match(/کد\s*حساب\s*معین\s*[:：]\s*(\d+)/i);
  if (moeenMatch) {
    result.moeenCode = moeenMatch[1];
  }
  
  const tafziliMatch = text.match(/کد\s*حساب\s*تفصیل\s*[:：]\s*(\d+)/i);
  if (tafziliMatch) {
    result.tafziliCode = tafziliMatch[1];
  }
  
  // Extract amounts
  const debitMatch = text.match(/بدهکار\s*[:：]\s*([\d,]+)/i);
  if (debitMatch) {
    result.debit = parsePersianNumber(debitMatch[1]);
  }
  
  const creditMatch = text.match(/بستانکار\s*[:：]\s*([\d,]+)/i);
  if (creditMatch) {
    result.credit = parsePersianNumber(creditMatch[1]);
  }
  
  // Extract totals
  const totalDebitMatch = text.match(/جمع\s*کل\s*بدهکار\s*[:：]\s*([\d,]+)/i);
  if (totalDebitMatch) {
    result.totalDebit = parsePersianNumber(totalDebitMatch[1]);
  }
  
  const totalCreditMatch = text.match(/جمع\s*کل\s*بستانکار\s*[:：]\s*([\d,]+)/i);
  if (totalCreditMatch) {
    result.totalCredit = parsePersianNumber(totalCreditMatch[1]);
  }
  
  return result;
}

function parsePersianNumber(str: string): number {
  // Remove commas and convert Persian digits to English
  const cleaned = str.replace(/,/g, '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
  return parseFloat(cleaned) || 0;
}

function convertPersianDate(persianDate: string): string {
  // Simple conversion - in production, use a proper Persian date library
  // Format: YYYY/MM/DD -> YYYY-MM-DD
  return persianDate.replace(/\//g, '-');
}

