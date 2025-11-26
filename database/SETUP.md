# راهنمای راه‌اندازی دیتابیس MySQL

## نصب MySQL

### macOS (با Homebrew)

```bash
# نصب MySQL
brew install mysql

# راه‌اندازی سرویس MySQL
brew services start mysql

# یا برای اجرای یکباره
mysql.server start
```

### macOS (بدون Homebrew)

می‌توانید MySQL را از [وب‌سایت رسمی](https://dev.mysql.com/downloads/mysql/) دانلود و نصب کنید.

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Linux (CentOS/RHEL)

```bash
sudo yum install mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

### Windows

1. از [وب‌سایت رسمی MySQL](https://dev.mysql.com/downloads/installer/) MySQL Installer را دانلود کنید
2. MySQL Server را نصب کنید
3. MySQL را به عنوان سرویس Windows راه‌اندازی کنید

## تنظیم رمز عبور root (اولین بار)

```bash
# اتصال به MySQL
mysql -u root -p

# اگر رمز عبور ندارید، ابتدا بدون -p وارد شوید
mysql -u root
```

سپس در MySQL:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_password';
FLUSH PRIVILEGES;
EXIT;
```

## ایجاد دیتابیس و جداول

### روش 1: استفاده از فایل schema.sql

```bash
# از پوشه root پروژه
mysql -u root -p < database/schema.sql
```

### روش 2: دستی

```bash
# اتصال به MySQL
mysql -u root -p
```

سپس در MySQL:

```sql
-- ایجاد دیتابیس
CREATE DATABASE IF NOT EXISTS hesabdoni CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hesabdoni;

-- سپس محتوای فایل schema.sql را اجرا کنید
-- یا از SOURCE استفاده کنید:
SOURCE /Users/amirabbasvafaee/Desktop/hesabdoni/database/schema.sql;
```

## بررسی اتصال

```bash
# تست اتصال
mysql -u root -p -e "SHOW DATABASES;"

# بررسی جداول
mysql -u root -p hesabdoni -e "SHOW TABLES;"
```

## تنظیمات Backend

در فایل `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hesabdoni
```

## دستورات مفید

```bash
# توقف MySQL
brew services stop mysql  # macOS
sudo systemctl stop mysql  # Linux

# راه‌اندازی مجدد
brew services restart mysql  # macOS
sudo systemctl restart mysql  # Linux

# مشاهده وضعیت
brew services list  # macOS
sudo systemctl status mysql  # Linux

# اتصال به دیتابیس
mysql -u root -p hesabdoni

# مشاهده جداول
mysql -u root -p hesabdoni -e "SHOW TABLES;"

# مشاهده ساختار یک جدول
mysql -u root -p hesabdoni -e "DESCRIBE companies;"
```

## عیب‌یابی

### مشکل: "Can't connect to local MySQL server"

```bash
# بررسی وضعیت سرویس
brew services list  # macOS
sudo systemctl status mysql  # Linux

# راه‌اندازی مجدد
brew services restart mysql  # macOS
sudo systemctl restart mysql  # Linux
```

### مشکل: "Access denied for user 'root'@'localhost'"

رمز عبور را بررسی کنید یا از دستور زیر استفاده کنید:

```bash
mysql -u root -p
```

### مشکل: "Unknown database 'hesabdoni'"

دیتابیس را ایجاد کنید:

```bash
mysql -u root -p < database/schema.sql
```

## استفاده از MySQL Workbench (اختیاری)

MySQL Workbench یک ابزار گرافیکی برای مدیریت دیتابیس است:

1. از [وب‌سایت MySQL](https://dev.mysql.com/downloads/workbench/) دانلود کنید
2. نصب کنید
3. اتصال جدید ایجاد کنید:
   - Host: localhost
   - Port: 3306
   - Username: root
   - Password: your_password

