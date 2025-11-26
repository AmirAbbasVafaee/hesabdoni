# حساب‌دونی (HesabDooni)

سیستم مدیریت اسناد مالی با قابلیت OCR

## ساختار پروژه

- `frontend/` - Next.js application با shadcn/ui
- `backend/` - Express.js API
- `database/` - MySQL schema و migrations

## ویژگی‌ها

- ✅ مدیریت شرکت‌ها (پنل ادمین)
- ✅ ورود کاربران با شناسه ملی
- ✅ آپلود روکش سند با OCR خودکار
- ✅ استخراج اطلاعات از روکش سند (شماره، تاریخ، شرح، کد حساب‌ها، مبالغ)
- ✅ تأیید و ویرایش اطلاعات OCR
- ✅ آپلود مستندات مرتبط با هر سند
- ✅ مشاهده و مدیریت بایگانی اسناد
- ✅ رابط کاربری فارسی با RTL support
- ✅ استفاده از فونت Vazirmatn

## راه‌اندازی

### پیش‌نیازها

- Node.js 18+
- MySQL 8+
- npm یا yarn

### نصب

```bash
# نصب dependencies برای تمام پروژه
npm run install:all
```

### راه‌اندازی دیتابیس

#### استفاده از دیتابیس Liara (پیشنهادی)

پروژه با دیتابیس Liara تنظیم شده است. اطلاعات اتصال در `backend/.env` موجود است.

**ایجاد جداول:**

1. **روش 1: از طریق phpMyAdmin**
   - وارد phpMyAdmin شوید
   - دیتابیس `vigorous_grothendieck` را انتخاب کنید
   - به تب "SQL" بروید
   - محتوای فایل `database/schema-for-liara.sql` را کپی و اجرا کنید

2. **روش 2: از طریق MySQL CLI**
   ```bash
   mysql -h hesabdoni -P 3306 -u root -p vigorous_grothendieck < database/schema-for-liara.sql
   ```

> 📖 **راهنمای کامل:** برای جزئیات بیشتر به فایل `database/LIARA_SETUP.md` مراجعه کنید.

#### نصب MySQL محلی (اختیاری)

اگر می‌خواهید MySQL را به صورت محلی نصب کنید:

**macOS:**
```bash
brew install mysql
brew services start mysql
mysql -u root -p < database/schema.sql
```

**Linux:**
```bash
sudo apt install mysql-server
sudo systemctl start mysql
mysql -u root -p < database/schema.sql
```

> 💡 **نکته:** برای راهنمای کامل نصب محلی، به فایل `database/SETUP.md` مراجعه کنید.

### تنظیمات محیط

1. فایل `backend/.env` با اطلاعات Liara از قبل تنظیم شده است. اگر نیاز به تغییر دارید، آن را ویرایش کنید:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hesabdoni
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

2. در پوشه `frontend` فایل `.env.local` ایجاد کنید:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### اجرا

```bash
# اجرای همزمان frontend و backend
npm run dev

# یا جداگانه
npm run dev:frontend  # Frontend در پورت 3000
npm run dev:backend   # Backend در پورت 5000
```

## پورت‌ها

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## صفحات اصلی

### کاربران
- `/login` - ورود کاربران
- `/dashboard` - داشبورد
- `/documents` - لیست اسناد
- `/documents/new` - افزودن سند جدید با OCR
- `/documents/[id]` - جزئیات سند

### ادمین
- `/admin/login` - ورود ادمین
- `/admin/companies` - لیست شرکت‌ها
- `/admin/companies/new` - ایجاد شرکت جدید

## تکنولوژی‌ها

### Frontend
- Next.js 14
- TypeScript
- TailwindCSS
- shadcn/ui
- Axios
- Vazirmatn Font

### Backend
- Express.js
- TypeScript
- MySQL
- JWT Authentication
- Tesseract.js (OCR)
- Multer (File Upload)
- bcryptjs

## API Endpoints

### Authentication
- `POST /api/auth/login` - ورود کاربر

### Admin
- `POST /api/admin/company/create` - ایجاد شرکت
- `GET /api/admin/company/list` - لیست شرکت‌ها
- `GET /api/admin/company/:id` - جزئیات شرکت

### Documents
- `POST /api/documents/upload-cover` - آپلود روکش سند
- `POST /api/documents/ocr` - پردازش OCR
- `POST /api/documents/confirm-cover` - تأیید و ثبت سند
- `GET /api/documents/list` - لیست اسناد
- `GET /api/documents/:id` - جزئیات سند
- `PUT /api/documents/:id` - ویرایش سند
- `POST /api/documents/:id/upload-file` - آپلود مستند
- `DELETE /api/documents/:id/files/:fileId` - حذف مستند

## ساختار دیتابیس

### companies
جدول شرکت‌ها شامل اطلاعات پایه و credentials

### document_covers
جدول روکش اسناد مالی با اطلاعات استخراج شده از OCR

### document_files
جدول مستندات مرتبط با هر سند

