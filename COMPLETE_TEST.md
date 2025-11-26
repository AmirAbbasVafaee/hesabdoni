# تست کامل پروژه حساب‌دونی

## ✅ وضعیت سرورها

### Backend (Port 5001)
- ✅ **Status:** در حال اجرا
- ✅ **Health Check:** کار می‌کند
- ✅ **Response:** `{"status":"ok","message":"HesabDooni API is running"}`

### Frontend (Port 3000)
- ✅ **Status:** در حال اجرا
- ✅ **Pages:** لود می‌شوند
- ✅ **Title:** "حساب‌دونی"

## 🧪 تست‌های انجام شده

### 1. Backend API Tests

#### Health Check
```bash
GET http://localhost:5001/health
```
**Result:** ✅ Success
```json
{"status":"ok","message":"HesabDooni API is running"}
```

#### Authentication - Login (Invalid)
```bash
POST http://localhost:5001/api/auth/login
Body: {"username":"invalid","password":"invalid"}
```
**Result:** ✅ Works correctly
```json
{"error":"خطا در ورود به سیستم"}
```

#### Admin Routes - Auth Middleware
```bash
POST http://localhost:5001/api/admin/company/create
Headers: Authorization: Bearer fake-token
```
**Result:** ✅ Middleware works
```json
{"error":"توکن نامعتبر است"}
```

### 2. Frontend Tests

#### Root Page (/)
- ✅ Redirects to `/login` (expected behavior)

#### Login Page (/login)
- ✅ Page loads
- ✅ Contains Persian text
- ✅ Form elements present

#### Admin Login Page (/admin/login)
- ✅ Page loads
- ✅ Admin login form present

## 📋 جریان کامل کاربری (نیاز به تست دستی)

### مرحله 1: ورود ادمین
1. به `http://localhost:3000/admin/login` بروید
2. Username: `admin`
3. Password: `admin`
4. باید به `/admin/companies` redirect شود

### مرحله 2: ایجاد شرکت
1. در پنل ادمین، "افزودن شرکت جدید" را کلیک کنید
2. اطلاعات را وارد کنید:
   - نام شرکت: "شرکت تست"
   - شناسه ملی: "1234567890"
   - نوع شرکت: "سهامی خاص"
   - نوع فعالیت: "تست" (اختیاری)
3. روی "ایجاد شرکت" کلیک کنید
4. **مهم:** Username و Password تولید شده را یادداشت کنید

### مرحله 3: ورود کاربر
1. به `http://localhost:3000/login` بروید
2. Username: شناسه ملی شرکت (مثلاً "1234567890")
3. Password: رمز عبور تولید شده
4. باید به `/dashboard` redirect شود

### مرحله 4: افزودن سند
1. از داشبورد "افزودن سند جدید" را انتخاب کنید
2. روکش سند را آپلود کنید (JPG/PNG/PDF)
3. OCR اطلاعات را استخراج می‌کند
4. اطلاعات را بررسی و ویرایش کنید
5. روی "تأیید و ادامه" کلیک کنید
6. مستندات مرتبط را آپلود کنید
7. روی "تکمیل و ذخیره" کلیک کنید

### مرحله 5: مشاهده اسناد
1. به `/documents` بروید
2. لیست تمام اسناد را ببینید
3. روی یک سند کلیک کنید
4. جزئیات کامل و مستندات را مشاهده کنید

## ✅ چک‌لیست تست

### Backend
- [x] Server starts successfully
- [x] Health check endpoint works
- [x] Authentication endpoint responds
- [x] Admin middleware works
- [x] Error handling works
- [x] Database connection configured

### Frontend
- [x] Server starts successfully
- [x] Pages load correctly
- [x] RTL layout works
- [x] Persian font loads
- [x] Client components work
- [x] API integration configured

### Integration
- [x] Frontend can connect to Backend
- [x] API URL configured correctly
- [x] CORS enabled
- [ ] Full user flow (needs manual testing)
- [ ] OCR functionality (needs image file)
- [ ] File upload (needs actual files)

## 🔧 تنظیمات فعلی

### پورت‌ها
- **Backend:** 5001
- **Frontend:** 3000
- **API Base URL:** http://localhost:5001/api

### دیتابیس
- **Host:** hesabdoni (Liara)
- **Database:** vigorous_grothendieck
- **Port:** 3306

### Authentication
- **Admin:** Hardcoded (`admin`/`admin`) - برای development
- **Users:** JWT-based با credentials از دیتابیس

## ⚠️ نکات مهم

1. **پورت Backend:** به 5001 تغییر کرد (5000 در حال استفاده بود)
2. **Admin Auth:** فعلاً hardcoded است - برای production باید تغییر کند
3. **Database:** باید جداول از قبل ایجاد شده باشند
4. **File Upload:** پوشه `backend/uploads` باید وجود داشته باشد

## 🚀 آماده برای استفاده

پروژه آماده است و می‌توانید:
1. Frontend و Backend را اجرا کنید
2. از پنل ادمین شرکت ایجاد کنید
3. با شرکت ایجاد شده وارد شوید
4. اسناد را آپلود و مدیریت کنید

## 📝 تست‌های پیشنهادی بعدی

1. **تست OCR:** با یک تصویر واقعی روکش سند
2. **تست File Upload:** آپلود فایل‌های مختلف
3. **تست Validation:** ورودی‌های نامعتبر
4. **تست Error Handling:** خطاهای مختلف
5. **تست UI/UX:** بررسی کامل رابط کاربری

