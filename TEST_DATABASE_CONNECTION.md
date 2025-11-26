# تست اتصال به دیتابیس

## تنظیمات فعلی

فایل `backend/.env` با تنظیمات زیر به‌روزرسانی شده است:

```env
DB_HOST=apo.liara.cloud
DB_PORT=33282
DB_USER=root
DB_PASSWORD=T3g0IKfniNDE6nPmpE3X0NGz
DB_NAME=vigorous_grothendieck
```

## تست از Command Line

ابتدا تست کنید که آیا می‌توانید از command line به دیتابیس متصل شوید:

```bash
mysql -u root -pT3g0IKfniNDE6nPmpE3X0NGz --port 33282 --host apo.liara.cloud vigorous_grothendieck -e "SHOW TABLES;"
```

اگر این کار می‌کند، ادامه دهید.

## تست از Node.js

پس از اینکه مطمئن شدید command line کار می‌کند، Backend را restart کنید:

```bash
cd backend
# Stop current server (Ctrl+C یا kill process)
npm run dev
```

سپس تست کنید:

```bash
curl http://localhost:5001/health
```

## تست API با دیتابیس

برای تست اینکه آیا Backend می‌تواند به دیتابیس متصل شود، می‌توانید:

1. **تست Login (بدون نیاز به دیتابیس):**
   ```bash
   curl -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test"}'
   ```
   باید خطای مناسب برگرداند (نه خطای دیتابیس).

2. **تست Admin (نیاز به دیتابیس):**
   - ابتدا باید یک admin token واقعی داشته باشید
   - یا از پنل ادمین در Frontend استفاده کنید

## بررسی لاگ‌ها

اگر مشکلی وجود دارد، لاگ‌های Backend را بررسی کنید:

```bash
tail -f /tmp/backend.log
```

یا اگر Backend در foreground اجرا می‌شود، خطاها را در console می‌بینید.

## وضعیت

- ✅ تنظیمات به‌روزرسانی شده
- ✅ Password اصلاح شده
- ✅ Connection timeout تنظیم شده
- ⚠️ نیاز به تست از سیستم شما

## مراحل بعدی

1. تست کنید که آیا command line mysql کار می‌کند
2. اگر کار می‌کند، Backend را restart کنید
3. تست کنید که آیا API endpoints کار می‌کنند
4. اگر خطای دیتابیس می‌بینید، لاگ‌ها را بررسی کنید

