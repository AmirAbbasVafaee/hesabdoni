# راهنمای Whitelist کردن IP در Liara

## مشکل فعلی

اتصال به دیتابیس timeout می‌شود. این به این دلیل است که IP شما در Liara whitelist نشده است.

## راه‌حل: Whitelist کردن IP

### مرحله 1: پیدا کردن IP شما

IP فعلی شما:
```
(در حال بررسی...)
```

یا می‌توانید از این لینک استفاده کنید:
https://api.ipify.org

### مرحله 2: Whitelist کردن IP در Liara

1. وارد پنل Liara شوید
2. به بخش **Database** بروید
3. دیتابیس `vigorous_grothendieck` را انتخاب کنید
4. به بخش **Network Access** یا **IP Whitelist** بروید
5. IP خود را اضافه کنید
6. تغییرات را ذخیره کنید

### مرحله 3: تست مجدد

پس از whitelist کردن IP، دوباره تست کنید:

```bash
cd backend
npm run dev
```

## تنظیمات فعلی

### Public Network
- **Host:** `apo.liara.cloud`
- **Port:** `33282`
- **Username:** `root`
- **Password:** `T3gOIKfniNDE6nPmpE3XONGZ`
- **Database:** `vigorous_grothendieck`

### فایل .env
فایل `backend/.env` با تنظیمات بالا به‌روزرسانی شده است.

## تست اتصال

پس از whitelist کردن IP، می‌توانید با این دستور تست کنید:

```bash
cd backend
node -e "
const mysql = require('mysql2/promise');
require('dotenv').config();

mysql.createConnection({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}).then(conn => {
  console.log('✅ Connected!');
  return conn.execute('SELECT 1');
}).then(() => {
  console.log('✅ Query successful!');
  process.exit(0);
}).catch(err => {
  console.log('❌ Error:', err.message);
  process.exit(1);
});
"
```

## نکات مهم

1. **Dynamic IP:** اگر IP شما dynamic است، ممکن است نیاز باشد هر بار که تغییر می‌کند، دوباره whitelist کنید
2. **VPN:** اگر از VPN استفاده می‌کنید، IP VPN را whitelist کنید
3. **Wait Time:** پس از whitelist کردن، ممکن است چند دقیقه طول بکشد تا فعال شود

## جایگزین: استفاده از Private Network

اگر نمی‌توانید IP را whitelist کنید، می‌توانید از Private Network استفاده کنید (فقط از داخل Liara):

```env
DB_HOST=hesabdoni
DB_PORT=3306
```

اما این فقط از داخل Liara کار می‌کند و برای development محلی مناسب نیست.

