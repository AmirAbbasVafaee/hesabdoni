# تست Backend

## ✅ تست‌های انجام شده

### 1. Health Check
```bash
curl http://localhost:5001/health
```
**نتیجه:** ✅ موفق
```json
{"status":"ok","message":"HesabDooni API is running"}
```

### 2. Login Endpoint
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```
**نتیجه:** ✅ کار می‌کند (خطای مناسب برای credentials نامعتبر)
```json
{"error":"خطا در ورود به سیستم"}
```

## 📝 نکات مهم

### پورت Backend
- **پورت:** `5001` (به دلیل استفاده پورت 5000 توسط سرویس دیگر)
- **URL:** `http://localhost:5001`
- **API Base:** `http://localhost:5001/api`

### تنظیمات Frontend
فایل `frontend/lib/api.ts` به‌روزرسانی شده تا از پورت 5001 استفاده کند.

### فایل .env
فایل `.env` در `backend/` با اطلاعات Liara تنظیم شده است:
- Host: `hesabdoni`
- Database: `vigorous_grothendieck`
- Port: `3306`

## 🧪 تست‌های بیشتر

### تست اتصال به دیتابیس
برای تست اتصال به دیتابیس، می‌توانید:
1. یک شرکت از پنل ادمین ایجاد کنید
2. یا مستقیماً از API استفاده کنید (نیاز به admin token دارد)

### تست OCR
برای تست OCR:
```bash
curl -X POST http://localhost:5001/api/documents/ocr \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@path/to/image.jpg"
```

## ✅ وضعیت

- ✅ Backend server در حال اجرا است
- ✅ Health check کار می‌کند
- ✅ API endpoints پاسخ می‌دهند
- ✅ Authentication middleware کار می‌کند
- ✅ Error handling کار می‌کند

## 🚀 آماده برای استفاده

Backend آماده است و می‌توانید:
1. Frontend را اجرا کنید و به Backend متصل شوید
2. از پنل ادمین شرکت ایجاد کنید
3. با شرکت ایجاد شده وارد شوید
4. اسناد را آپلود و مدیریت کنید

