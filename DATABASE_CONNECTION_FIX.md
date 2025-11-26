# رفع مشکل اتصال به دیتابیس Liara

## تنظیمات به‌روزرسانی شده

### Public Network
- **Host:** `apo.liara.cloud`
- **Port:** `33282`
- **Username:** `root`
- **Password:** `T3g0IKfniNDE6nPmpE3X0NGz`
- **Database:** `vigorous_grothendieck`

## تغییرات انجام شده

1. ✅ فایل `backend/.env` به‌روزرسانی شد
2. ✅ Password اصلاح شد (با 0 به جای O)
3. ✅ Connection timeout افزایش یافت (30 ثانیه)
4. ✅ Connection pool تنظیمات بهینه شد

## تست اتصال

### از Command Line (باید کار کند)
```bash
mysql -u root -pT3g0IKfniNDE6nPmpE3X0NGz --port 33282 --host apo.liara.cloud vigorous_grothendieck
```

### از Node.js
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
  connectTimeout: 30000,
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

## عیب‌یابی

### اگر اتصال برقرار نمی‌شود:

1. **بررسی دستور MySQL:**
   ```bash
   mysql -u root -pT3g0IKfniNDE6nPmpE3X0NGz --port 33282 --host apo.liara.cloud vigorous_grothendieck -e "SELECT 1;"
   ```
   اگر این کار می‌کند، مشکل از Node.js است.

2. **بررسی Firewall:**
   - مطمئن شوید که firewall پورت 33282 را block نمی‌کند
   - در macOS: System Settings > Network > Firewall

3. **بررسی Network:**
   ```bash
   nc -zv apo.liara.cloud 33282
   ```
   باید "succeeded" را ببینید.

4. **تست با IP مستقیم:**
   ```bash
   nslookup apo.liara.cloud
   ```
   سپس با IP تست کنید.

## تنظیمات Connection Pool

Connection pool با تنظیمات زیر بهینه شده است:
- `connectTimeout: 30000` - 30 ثانیه
- `acquireTimeout: 30000` - 30 ثانیه
- `timeout: 30000` - 30 ثانیه

## وضعیت فعلی

- ✅ تنظیمات به‌روزرسانی شده
- ✅ Password اصلاح شده
- ⚠️ نیاز به تست اتصال از سیستم شما

## مراحل بعدی

1. Backend را restart کنید
2. تست کنید که آیا می‌توانید از command line به دیتابیس متصل شوید
3. اگر command line کار می‌کند، مشکل از Node.js connection است
4. اگر command line هم کار نمی‌کند، مشکل از network/firewall است

