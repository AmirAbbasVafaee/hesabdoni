# Database Setup

## ایجاد دیتابیس

```bash
mysql -u root -p < schema.sql
```

## ساختار جداول

### companies
جدول شرکت‌ها شامل اطلاعات پایه و credentials

### document_covers
جدول روکش اسناد مالی با اطلاعات استخراج شده از OCR

### document_files
جدول مستندات مرتبط با هر سند

