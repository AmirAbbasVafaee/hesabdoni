# راهنمای اتصال به دیتابیس Liara

## اطلاعات اتصال

- **Host:** `hesabdoni`
- **Port:** `3306`
- **Username:** `root`
- **Password:** `T3gOIKfniNDE6nPmpE3XONGz`
- **Database Name:** `vigorous_grothendieck`
- **Database Version:** `9.0.1`

## تنظیمات Backend

فایل `backend/.env` با اطلاعات بالا تنظیم شده است.

## ایجاد جداول در دیتابیس Liara

### روش 1: استفاده از phpMyAdmin

1. وارد phpMyAdmin شوید
2. دیتابیس `vigorous_grothendieck` را انتخاب کنید
3. به تب "SQL" بروید
4. محتوای فایل `database/schema.sql` را کپی کنید
5. دستورات SQL را اجرا کنید

**نکته:** خط اول (`CREATE DATABASE`) را حذف کنید چون دیتابیس از قبل وجود دارد.

### روش 2: استفاده از MySQL CLI

```bash
# اتصال به دیتابیس Liara
mysql -h hesabdoni -P 3306 -u root -p vigorous_grothendieck

# پس از وارد کردن رمز عبور، محتوای schema.sql را اجرا کنید
# (بدون خط اول CREATE DATABASE)
```

یا:

```bash
mysql -h hesabdoni -P 3306 -u root -p vigorous_grothendieck < database/schema.sql
```

**نکته:** ممکن است نیاز باشد که IP شما در Liara whitelist شود.

### روش 3: استفاده از MySQL Workbench

1. MySQL Workbench را باز کنید
2. New Connection ایجاد کنید:
   - **Connection Name:** Liara HesabDooni
   - **Hostname:** `hesabdoni`
   - **Port:** `3306`
   - **Username:** `root`
   - **Password:** `T3gOIKfniNDE6nPmpE3XONGz`
   - **Default Schema:** `vigorous_grothendieck`
3. Connect کنید
4. Query جدید باز کنید
5. محتوای `database/schema.sql` را (بدون خط اول) اجرا کنید

## بررسی اتصال

### از طریق Backend

```bash
cd backend
npm run dev
```

اگر خطایی نداد، اتصال موفق بوده است.

### از طریق MySQL CLI

```bash
mysql -h hesabdoni -P 3306 -u root -p vigorous_grothendieck -e "SHOW TABLES;"
```

باید سه جدول را ببینید:
- `companies`
- `document_covers`
- `document_files`

## عیب‌یابی

### مشکل: "Can't connect to MySQL server"

- بررسی کنید که IP شما در Liara whitelist شده باشد
- بررسی کنید که Host و Port درست باشند
- بررسی کنید که دیتابیس در Liara فعال باشد

### مشکل: "Access denied"

- رمز عبور را دوباره بررسی کنید
- مطمئن شوید که Username درست است (`root`)

### مشکل: "Unknown database"

- بررسی کنید که نام دیتابیس درست باشد: `vigorous_grothendieck`
- یا دیتابیس را از طریق phpMyAdmin ایجاد کنید

## نکات مهم

1. **امنیت:** رمز عبور را در `.env` نگه دارید و هرگز در Git commit نکنید
2. **Whitelist IP:** ممکن است نیاز باشد IP شما در Liara whitelist شود
3. **Connection Pooling:** تنظیمات connection pool در `backend/src/config/database.ts` برای دیتابیس remote بهینه شده است

