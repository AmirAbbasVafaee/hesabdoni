# تست اتصال به دیتابیس Liara (Public Network)

## تنظیمات جدید

### Public Network (برای دسترسی از خارج)
- **Host:** `apo.liara.cloud`
- **Port:** `33282`
- **Username:** `root`
- **Password:** `T3gOIKfniNDE6nPmpE3XONGZ`
- **Database:** `vigorous_grothendieck`

### Private Network (برای دسترسی از داخل Liara)
- **Host:** `hesabdoni`
- **Port:** `3306`

## تغییرات انجام شده

1. ✅ فایل `backend/.env` به‌روزرسانی شد
2. ✅ Host به `apo.liara.cloud` تغییر کرد
3. ✅ Port به `33282` تغییر کرد
4. ✅ Password به‌روزرسانی شد (با Z بزرگ)

## تست‌های انجام شده

### 1. تست اتصال پایه
```bash
Test database connection
```
**نتیجه:** ✅ موفق - اتصال برقرار شد

### 2. تست جداول
```bash
SHOW TABLES
```
**نتیجه:** ✅ جداول موجود هستند

### 3. تست Query جداول
- ✅ Companies table: قابل دسترسی
- ✅ Document_covers table: قابل دسترسی
- ✅ Document_files table: قابل دسترسی

### 4. تست Backend API
```bash
GET http://localhost:5001/health
POST http://localhost:5001/api/auth/login
```
**نتیجه:** ✅ API endpoints کار می‌کنند

## وضعیت

- ✅ اتصال به دیتابیس برقرار است
- ✅ جداول قابل دسترسی هستند
- ✅ Backend می‌تواند به دیتابیس متصل شود
- ✅ API endpoints کار می‌کنند

## نکات مهم

1. **Public Network:** برای دسترسی از خارج Liara استفاده می‌شود
2. **Port:** 33282 (متفاوت از private network)
3. **Security:** مطمئن شوید که IP شما در Liara whitelist شده باشد (اگر نیاز باشد)

## آماده برای استفاده

دیتابیس آماده است و Backend می‌تواند به آن متصل شود. می‌توانید:
1. از پنل ادمین شرکت ایجاد کنید
2. با شرکت ایجاد شده وارد شوید
3. اسناد را آپلود و مدیریت کنید

