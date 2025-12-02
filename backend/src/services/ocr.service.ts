import { createWorker } from 'tesseract.js';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

// ===== TYPES & INTERFACES =====
export interface OCRTableRow {
  rowNumber?: string;
  kolCode?: string;
  kolDescription?: string; // شرح کد حساب کل
  moeenCode?: string;
  moeenDescription?: string; // شرح کد حساب معین
  tafziliCode?: string;
  tafziliDescription?: string; // شرح کد حساب تفصیل
  tafziliDetails?: string; // جزعیات کد حساب تفصیل
  partialAmount?: number; // مبلغ جزء
  debit?: number; // بدهکار
  credit?: number; // بستانکار
  order?: number; // ترتیب ردیف
}

export interface OCRResult {
  docNumber?: string; // شماره سند
  docDate?: string; // تاریخ سند
  description?: string; // شرح سند
  tableRows?: OCRTableRow[]; // ردیف‌های جدول
  totalDebit?: number; // جمع کل بدهکار
  totalCredit?: number; // جمع کل بستانکار
  rawText?: string; // متن خام OCR برای دیباگ
}

// ===== IMAGE PREPROCESSING =====

/**
 * پیش‌پردازش تصویر برای بهبود دقت OCR
 * - تبدیل به grayscale
 * - افزایش کنتراست
 * - کاهش نویز
 * - افزایش وضوح
 * - تبدیل به binary (در صورت نیاز)
 */
async function preprocessImage(imagePath: string): Promise<string> {
  const outputPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_processed.png');
  
  try {
    console.log('=== IMAGE PREPROCESSING ===');
    console.log('Original image:', imagePath);
    
    // خواندن تصویر و اعمال پیش‌پردازش
    await sharp(imagePath)
      .greyscale() // تبدیل به grayscale
      .normalize() // نرمال‌سازی (افزایش کنتراست)
      .sharpen(1.5, 1, 2) // افزایش وضوح (sigma, flat, jagged)
      .modulate({
        brightness: 1.1, // افزایش روشنایی
        saturation: 0, // حذف رنگ (grayscale)
      })
      .linear(1.2, -(128 * 0.2)) // افزایش کنتراست بیشتر
      .threshold(128) // تبدیل به binary (سیاه و سفید)
      .png({ quality: 100, compressionLevel: 9 }) // ذخیره با کیفیت بالا
      .toFile(outputPath);
    
    console.log('Processed image saved:', outputPath);
    
    // بررسی اندازه فایل
    const stats = fs.statSync(outputPath);
    console.log('Processed image size:', stats.size, 'bytes');
    
    return outputPath;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    // در صورت خطا، تصویر اصلی را برگردان
    return imagePath;
  }
}

/**
 * پیش‌پردازش جایگزین برای تصاویر با کیفیت پایین
 * - استفاده از adaptive threshold
 * - کاهش نویز با blur و sharpen
 */
async function preprocessImageAlternative(imagePath: string): Promise<string> {
  const outputPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_processed_alt.png');
  
  try {
    console.log('=== ALTERNATIVE IMAGE PREPROCESSING ===');
    
    await sharp(imagePath)
      .greyscale()
      .blur(0.5) // کاهش نویز
      .sharpen(2, 1, 2) // افزایش وضوح (sigma, flat, jagged)
      .normalize()
      .gamma(1.5) // تنظیم گاما
      .linear(1.3, -(128 * 0.3)) // افزایش کنتراست
      .png({ quality: 100 })
      .toFile(outputPath);
    
    console.log('Alternative processed image saved:', outputPath);
    return outputPath;
  } catch (error) {
    console.error('Error in alternative preprocessing:', error);
    return imagePath;
  }
}

// ===== CORE BUSINESS LOGIC =====

/**
 * پردازش OCR با چندین استراتژی برای بهترین نتیجه
 */
export async function processOCR(imagePath: string): Promise<OCRResult> {
  console.log('=== STARTING OCR PROCESSING ===');
  console.log('Image path:', imagePath);
  
  // پیش‌پردازش تصویر
  const processedImagePath = await preprocessImage(imagePath);
  const processedImagePathAlt = await preprocessImageAlternative(imagePath);
  
  const results: Array<{ psm: number; text: string; confidence: number }> = [];
  
  // PSM modes برای تست:
  // 6 = Uniform block of text (بهترین برای جداول)
  // 11 = Sparse text (برای متن تکه‌تکه)
  // 3 = Auto (پیش‌فرض)
  // 4 = Single column (برای ستون‌های جداگانه)
  const psmModes = [6, 11, 3, 4];
  
  const worker = await createWorker('fas'); // زبان فارسی
  
  try {
    // تست با تصویر پیش‌پردازش شده اصلی
    for (const psm of psmModes) {
      try {
        console.log(`\n=== Testing PSM Mode ${psm} ===`);
        
        await worker.setParameters({
          tessedit_pageseg_mode: psm,
          tessedit_char_whitelist: '۰۱۲۳۴۵۶۷۸۹0123456789،؛:.,- /\\\n\t\u200C\u200D\u200E\u200F\u202A\u202B\u202C\u202D\u202E\uFEFF',
          tessedit_pageseg_mode_force: 1,
        } as any);
        
        const { data } = await worker.recognize(processedImagePath);
        const confidence = data.confidence || 0;
        
        results.push({
          psm,
          text: data.text,
          confidence
        });
        
        console.log(`PSM ${psm} - Confidence: ${confidence.toFixed(2)}%, Text length: ${data.text.length}`);
        console.log(`PSM ${psm} - First 200 chars:`, data.text.substring(0, 200));
      } catch (error) {
        console.error(`Error with PSM ${psm}:`, error);
      }
    }
    
    // تست با تصویر پیش‌پردازش شده جایگزین
    for (const psm of [6, 11]) {
      try {
        console.log(`\n=== Testing PSM Mode ${psm} with Alternative Preprocessing ===`);
        
        await worker.setParameters({
          tessedit_pageseg_mode: psm,
          tessedit_char_whitelist: '۰۱۲۳۴۵۶۷۸۹0123456789،؛:.,- /\\\n\t\u200C\u200D\u200E\u200F\u202A\u202B\u202C\u202D\u202E\uFEFF',
        } as any);
        
        const { data } = await worker.recognize(processedImagePathAlt);
        const confidence = data.confidence || 0;
        
        results.push({
          psm: psm + 100, // علامت برای تشخیص تصویر جایگزین
          text: data.text,
          confidence
        });
        
        console.log(`PSM ${psm} (Alt) - Confidence: ${confidence.toFixed(2)}%, Text length: ${data.text.length}`);
      } catch (error) {
        console.error(`Error with PSM ${psm} (Alt):`, error);
      }
    }
    
    await worker.terminate();
    
    // انتخاب بهترین نتیجه بر اساس:
    // 1. طول متن (بیشتر = بهتر)
    // 2. confidence (بالاتر = بهتر)
    // 3. وجود کلمات کلیدی (شماره سند، تاریخ، کد حساب)
    const bestResult = selectBestOCRResult(results);
    
    console.log('\n=== SELECTED BEST RESULT ===');
    console.log(`PSM Mode: ${bestResult.psm}`);
    console.log(`Confidence: ${bestResult.confidence.toFixed(2)}%`);
    console.log(`Text length: ${bestResult.text.length}`);
    console.log('First 1000 chars:', bestResult.text.substring(0, 1000));
    console.log('Full text:', bestResult.text);
    
    // پارس کردن متن
    const result: OCRResult = parseOCRText(bestResult.text);
    result.rawText = bestResult.text;
    
    // لاگ نتایج
    console.log('\n=== PARSED OCR RESULT ===');
    console.log('Doc Number:', result.docNumber);
    console.log('Doc Date:', result.docDate);
    console.log('Description:', result.description ? result.description.substring(0, 100) + '...' : null);
    console.log('Table Rows Count:', result.tableRows?.length || 0);
    console.log('Total Debit:', result.totalDebit);
    console.log('Total Credit:', result.totalCredit);
    
    // پاک کردن فایل‌های موقت
    try {
      if (processedImagePath !== imagePath && fs.existsSync(processedImagePath)) {
        fs.unlinkSync(processedImagePath);
      }
      if (processedImagePathAlt !== imagePath && fs.existsSync(processedImagePathAlt)) {
        fs.unlinkSync(processedImagePathAlt);
      }
    } catch (error) {
      console.warn('Could not delete temporary files:', error);
    }
    
    return result;
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}

/**
 * انتخاب بهترین نتیجه OCR از بین چندین تلاش
 */
function selectBestOCRResult(results: Array<{ psm: number; text: string; confidence: number }>): { psm: number; text: string; confidence: number } {
  if (results.length === 0) {
    throw new Error('No OCR results available');
  }
  
  // امتیازدهی به هر نتیجه
  const scoredResults = results.map(result => {
    const text = result.text;
    let score = 0;
    
    // امتیاز بر اساس طول متن
    score += Math.min(text.length / 100, 10); // حداکثر 10 امتیاز
    
    // امتیاز بر اساس confidence
    score += result.confidence / 10; // حداکثر 10 امتیاز
    
    // امتیاز بر اساس وجود کلمات کلیدی
    const keywords = ['شماره', 'تاریخ', 'شرح', 'سند', 'ردیف', 'کد', 'حساب', 'بدهکار', 'بستانکار', 'مبلغ'];
    const foundKeywords = keywords.filter(keyword => text.includes(keyword)).length;
    score += foundKeywords * 2; // 2 امتیاز برای هر کلمه کلیدی
    
    // امتیاز بر اساس وجود اعداد (کدهای حساب)
    const numberMatches = text.match(/[۰-۹0-9]{3,}/g);
    score += (numberMatches?.length || 0) * 0.5; // 0.5 امتیاز برای هر عدد
    
    // امتیاز بر اساس وجود تاریخ
    const dateMatches = text.match(/[۰-۹0-9]{4}[\/\-][۰-۹0-9]{1,2}[\/\-][۰-۹0-9]{1,2}/g);
    score += (dateMatches?.length || 0) * 5; // 5 امتیاز برای هر تاریخ
    
    return {
      ...result,
      score
    };
  });
  
  // مرتب‌سازی بر اساس امتیاز
  scoredResults.sort((a, b) => b.score - a.score);
  
  console.log('\n=== OCR RESULTS SCORING ===');
  scoredResults.forEach((result, index) => {
    console.log(`Rank ${index + 1}: PSM ${result.psm}, Score: ${result.score.toFixed(2)}, Confidence: ${result.confidence.toFixed(2)}%`);
  });
  
  return scoredResults[0];
}

function parseOCRText(text: string): OCRResult {
  const result: OCRResult = {};
  
  console.log('\n=== PARSING OCR TEXT ===');
  console.log('Original text length:', text.length);
  
  // نرمال‌سازی متن
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[،؛]/g, ':')
    .trim();
  
  // تقسیم به خطوط
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log('Number of lines after normalization:', lines.length);
  console.log('First 10 lines:', lines.slice(0, 10));
  
  // استخراج اطلاعات هدر
  extractHeaderInfo(lines, result);
  
  // استخراج ردیف‌های جدول
  result.tableRows = extractTableRows(lines, normalizedText);
  
  console.log('\n=== PARSING COMPLETE ===');
  console.log('Extracted:', {
    docNumber: result.docNumber,
    docDate: result.docDate,
    description: result.description ? result.description.substring(0, 50) : null,
    tableRowsCount: result.tableRows?.length || 0
  });
  
  // محاسبه جمع کل
  if (result.tableRows && result.tableRows.length > 0) {
    let totalDebit = 0;
    let totalCredit = 0;
    
    result.tableRows.forEach(row => {
      totalDebit += row.debit || 0;
      totalCredit += row.credit || 0;
    });
    
    result.totalDebit = totalDebit;
    result.totalCredit = totalCredit;
  }
  
  return result;
}

// استخراج اطلاعات هدر (شماره سند، تاریخ، شرح)
function extractHeaderInfo(lines: string[], result: OCRResult): void {
  // استفاده از خطوط جداگانه برای دقت بیشتر
  const firstLines = lines.slice(0, 10).join(' '); // 10 خط اول
  const combinedText = lines.join(' ');
  
  console.log('\n=== Extracting Header Info ===');
  console.log('First 10 lines:', firstLines.substring(0, 500));
  
  // استخراج شماره سند - الگوهای مختلف
  const docNumberPatterns = [
    /شماره\s*سند\s*[:：]\s*([۰-۹0-9]+)/i,
    /شماره\s*سند\s*([۰-۹0-9]+)/i,
    /شماره\s*[:：]\s*([۰-۹0-9]+)/i,
    /سند\s*شماره\s*[:：]\s*([۰-۹0-9]+)/i,
  ];
  
  for (const pattern of docNumberPatterns) {
    const match = firstLines.match(pattern) || combinedText.match(pattern);
    if (match) {
      result.docNumber = convertPersianDigits(match[1]);
      console.log('Found docNumber:', result.docNumber, 'from pattern:', pattern);
      break;
    }
  }
  
  // استخراج تاریخ سند - الگوهای مختلف
  const datePatterns = [
    /تاریخ\s*سند\s*[:：]\s*([۰-۹0-9]{4}[\/\-][۰-۹0-9]{1,2}[\/\-][۰-۹0-9]{1,2})/i,
    /تاریخ\s*سند\s*([۰-۹0-9]{4}[\/\-][۰-۹0-9]{1,2}[\/\-][۰-۹0-9]{1,2})/i,
    /تاریخ\s*[:：]\s*([۰-۹0-9]{4}[\/\-][۰-۹0-9]{1,2}[\/\-][۰-۹0-9]{1,2})/i,
    /([۰-۹0-9]{4}[\/\-][۰-۹0-9]{1,2}[\/\-][۰-۹0-9]{1,2})/i, // بدون برچسب تاریخ
  ];
  
  for (const pattern of datePatterns) {
    const match = firstLines.match(pattern) || combinedText.match(pattern);
    if (match) {
      const dateStr = match[1];
      // بررسی که تاریخ معتبر باشد (سال بین 1300-1500 یا 1900-2100)
      const yearMatch = dateStr.match(/^([۰-۹0-9]{4})/);
      if (yearMatch) {
        const year = parseInt(convertPersianDigits(yearMatch[1]));
        if ((year >= 1300 && year <= 1500) || (year >= 1900 && year <= 2100)) {
          result.docDate = convertPersianDate(dateStr);
          console.log('Found docDate:', result.docDate, 'from pattern:', pattern);
          break;
        }
      }
    }
  }
  
  // استخراج شرح سند - الگوهای مختلف
  const descPatterns = [
    /شرح\s*سند\s*[:：]\s*([^\n]+?)(?:\n|ردیف|کد|مبلغ|بدهکار|بستانکار|جمع|شماره)/i,
    /شرح\s*[:：]\s*([^\n]+?)(?:\n|ردیف|کد|مبلغ|بدهکار|بستانکار|جمع|شماره)/i,
    /شرح\s*سند\s*([^\n]+?)(?:\n|ردیف|کد|مبلغ)/i,
    /شرح\s*([^\n]+?)(?:\n|ردیف|کد|مبلغ)/i,
  ];
  
  for (const pattern of descPatterns) {
    const match = firstLines.match(pattern) || combinedText.match(pattern);
    if (match) {
      const desc = match[1].trim().replace(/\s+/g, ' ');
      if (desc.length > 5) { // حداقل 5 کاراکتر
        result.description = desc;
        console.log('Found description:', result.description.substring(0, 100), 'from pattern:', pattern);
        break;
      }
    }
  }
  
  console.log('\nHeader extraction result:', {
    docNumber: result.docNumber,
    docDate: result.docDate,
    description: result.description ? result.description.substring(0, 50) + '...' : null
  });
}

// استخراج ردیف‌های جدول
function extractTableRows(lines: string[], fullText: string): OCRTableRow[] {
  const rows: OCRTableRow[] = [];
  let inTableSection = false;
  let rowOrder = 0;
  
  // پیدا کردن شروع جدول
  const tableStartMarkers = ['ردیف', 'کد حساب', 'شرح', 'مبلغ جزء', 'بدهکار', 'بستانکار'];
  
  // پیدا کردن خط شروع جدول
  let tableStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (tableStartMarkers.some(marker => line.includes(marker))) {
      tableStartIndex = i + 1; // خط بعد از هدر جدول
      inTableSection = true;
      break;
    }
  }
  
  // اگر هدر جدول پیدا نشد، از خط 3 شروع کن (بعد از هدر سند)
  if (tableStartIndex === -1 && lines.length > 3) {
    tableStartIndex = 3;
    inTableSection = true;
  }
  
  if (!inTableSection) {
    return rows;
  }
  
  // استخراج ردیف‌ها
  for (let i = tableStartIndex; i < lines.length; i++) {
    const line = lines[i];
    
    // توقف در خط جمع
    if (line.toLowerCase().includes('جمع') && 
        (line.toLowerCase().includes('بدهکار') || line.toLowerCase().includes('بستانکار'))) {
      break;
    }
    
    // پارس کردن ردیف
    const row = parseTableRow(line, i, lines);
    if (row && isValidTableRow(row)) {
      rowOrder++;
      row.order = rowOrder;
      rows.push(row);
    }
  }
  
  return rows;
}

// پارس کردن یک ردیف جدول
function parseTableRow(line: string, lineIndex: number, allLines: string[]): OCRTableRow | null {
  const row: OCRTableRow = {};
  const cleanedLine = line.replace(/\s+/g, ' ').trim();
  
  // لاگ خط برای دیباگ
  if (lineIndex < 5) {
    console.log(`Parsing line ${lineIndex}:`, cleanedLine.substring(0, 100));
  }
  
  // استخراج شماره ردیف (اولین عدد در خط)
  const rowNumberMatch = cleanedLine.match(/^([۰-۹0-9]+)\s+/);
  if (rowNumberMatch) {
    const rowNum = convertPersianDigits(rowNumberMatch[1]);
    // فقط اگر شماره ردیف معقول باشد (1-1000)
    const rowNumInt = parseInt(rowNum);
    if (rowNumInt >= 1 && rowNumInt <= 1000) {
      row.rowNumber = rowNum;
    }
  }
  
  // استخراج کدهای حساب - روش بهتر: پیدا کردن تمام اعداد و فیلتر کردن
  const allNumbers: Array<{num: string, digits: string, value: number, position: number}> = [];
  
  // پیدا کردن تمام اعداد در خط
  const numberPattern = /([۰-۹0-9]+)/g;
  let match;
  while ((match = numberPattern.exec(cleanedLine)) !== null) {
    const num = match[1];
    const digits = convertPersianDigits(num);
    const value = parseInt(digits);
    allNumbers.push({
      num,
      digits,
      value,
      position: match.index
    });
  }
  
  // مرتب‌سازی بر اساس موقعیت
  allNumbers.sort((a, b) => a.position - b.position);
  
  // فیلتر و اختصاص کدها
  const rowNumValue = parseInt(row.rowNumber || '0');
  
  for (const numInfo of allNumbers) {
    const { digits, value } = numInfo;
    
    // کد کل: 4 رقم، بین 1000-9999، نه شماره ردیف، نه تاریخ
    if (digits.length === 4 && value >= 1000 && value <= 9999 && 
        value !== rowNumValue && !row.kolCode) {
      // بررسی که تاریخ نباشد (سال بین 1300-1500)
      if (!(value >= 1300 && value <= 1500)) {
        row.kolCode = digits;
        continue;
      }
    }
    
    // کد معین: 6 رقم، بین 100000-999999
    if (digits.length === 6 && value >= 100000 && value <= 999999 && !row.moeenCode) {
      row.moeenCode = digits;
      continue;
    }
    
    // کد تفصیل: 3-5 رقم، بین 100-99999، نه کد کل یا معین
    if (digits.length >= 3 && digits.length <= 5 && 
        value >= 100 && value <= 99999 && 
        value !== rowNumValue && !row.tafziliCode) {
      const isKol = digits.length === 4 && value >= 1000 && value <= 9999;
      const isMoeen = digits.length === 6;
      if (!isKol && !isMoeen) {
        row.tafziliCode = digits;
        continue;
      }
    }
  }
  
  // لاگ برای دیباگ
  if (row.kolCode || row.moeenCode || row.tafziliCode) {
    console.log(`Row ${lineIndex} codes:`, {
      kol: row.kolCode,
      moeen: row.moeenCode,
      tafzili: row.tafziliCode
    });
  }
  
  // استخراج مبالغ (اعداد بزرگ)
  const amountPatterns = [
    /([۰-۹0-9]{1,3}(?:[،,]\d{3}){2,})/g, // با جداکننده (حداقل 7 رقم)
    /([۰-۹0-9]{7,})/g, // بدون جداکننده (حداقل 7 رقم)
  ];
  
  const amounts: number[] = [];
  for (const pattern of amountPatterns) {
    let amountMatch;
    while ((amountMatch = pattern.exec(cleanedLine)) !== null) {
      const amount = parsePersianNumber(amountMatch[1]);
      if (amount >= 10000) { // فقط مبالغ معنی‌دار (حداقل 10 هزار)
        amounts.push(amount);
      }
    }
  }
  
  // حذف مبالغ تکراری
  const uniqueAmounts = [...new Set(amounts)].sort((a, b) => b - a);
  
  // اختصاص مبالغ
  if (uniqueAmounts.length > 0) {
    const mainAmount = uniqueAmounts[0]; // بزرگترین مبلغ
    
    // تعیین بدهکار/بستانکار بر اساس کد حساب کل
    if (row.kolCode) {
      const kolNum = parseInt(row.kolCode);
      // کدهای 1xxx (دارایی) و 2xxx (بدهی) = بدهکار
      // کدهای 3xxx (سرمایه) و 4xxx (درآمد) و 5xxx (هزینه) = بستانکار
      if (kolNum >= 1000 && kolNum < 3000) {
        // بدهکار
        row.debit = mainAmount;
        row.partialAmount = mainAmount;
      } else if (kolNum >= 3000 && kolNum < 6000) {
        // بستانکار
        row.credit = mainAmount;
        row.partialAmount = mainAmount;
      } else {
        row.partialAmount = mainAmount;
      }
    } else {
      row.partialAmount = mainAmount;
    }
  }
  
  // استخراج جزعیات (متن باقی‌مانده)
  let details = cleanedLine;
  
  // جمع‌آوری کدهای استخراج شده برای حذف از جزعیات
  const extractedCodes: string[] = [];
  if (row.kolCode) extractedCodes.push(row.kolCode);
  if (row.moeenCode) extractedCodes.push(row.moeenCode);
  if (row.tafziliCode) extractedCodes.push(row.tafziliCode);
  
  // حذف شماره ردیف
  if (row.rowNumber) {
    details = details.replace(new RegExp(`^${row.rowNumber}\\s*`), '');
  }
  
  // حذف کدهای حساب
  extractedCodes.forEach((code: string) => {
    details = details.replace(new RegExp(`\\b${code}\\b`), '');
  });
  
  // حذف مبالغ
  uniqueAmounts.forEach(amount => {
    const amountStr = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '،');
    details = details.replace(new RegExp(amountStr.replace(/،/g, '[،,]?')), '');
  });
  
  // حذف کلمات کلیدی
  details = details
    .replace(/بدهکار|بستانکار|مبلغ\s*جزء|ردیف|کد\s*حساب|شرح/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (details.length > 5) {
    row.tafziliDetails = details;
  }
  
  return row;
}

// بررسی اعتبار ردیف
function isValidTableRow(row: OCRTableRow): boolean {
  // باید حداقل یک کد حساب یا مبلغ داشته باشد
  const hasAccountCode = !!(row.kolCode || row.moeenCode || row.tafziliCode);
  const hasAmount = !!(row.debit || row.credit || row.partialAmount);
  
  if (!hasAccountCode && !hasAmount) {
    return false;
  }
  
  // اگر فقط مبلغ دارد، باید معنی‌دار باشد
  if (hasAmount && !hasAccountCode) {
    const totalAmount = (row.debit || 0) + (row.credit || 0) + (row.partialAmount || 0);
    if (totalAmount < 1000) {
      return false;
    }
  }
  
  return true;
}

// تبدیل ارقام فارسی به انگلیسی
function convertPersianDigits(str: string): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const englishDigits = '0123456789';
  
  return str.split('').map(char => {
    const index = persianDigits.indexOf(char);
    return index !== -1 ? englishDigits[index] : char;
  }).join('');
}

// پارس کردن عدد فارسی
function parsePersianNumber(str: string): number {
  const cleaned = convertPersianDigits(str.replace(/[،,]/g, ''));
  return parseFloat(cleaned) || 0;
}

// تبدیل تاریخ فارسی
function convertPersianDate(persianDate: string): string {
  const englishDate = convertPersianDigits(persianDate);
  const dateMatch = englishDate.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  
  if (dateMatch) {
    const year = dateMatch[1];
    const month = dateMatch[2].padStart(2, '0');
    const day = dateMatch[3].padStart(2, '0');
    
    // اگر سال فارسی است (1300-1500)، به همان صورت نگه دار
    const yearNum = parseInt(year);
    if (yearNum >= 1300 && yearNum <= 1500) {
      return `${year}-${month}-${day}`;
    }
    
    return `${year}-${month}-${day}`;
  }
  
  return englishDate.replace(/\//g, '-');
}
