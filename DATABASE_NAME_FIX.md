# Fix: Unknown database 'hesabdoni'

## Error
```
Error: Unknown database 'hesabdoni'
code: 'ER_BAD_DB_ERROR'
```

## Problem
The backend is trying to connect to a database named `hesabdoni`, but your actual database on Liara is named `vigorous_grothendieck`.

## Solution

### Update Database Name in Liara Environment Variables

1. **Go to Liara Backend App Panel:**
   - Open your backend application
   - Go to **Environment Variables** section

2. **Update `DB_NAME` variable:**
   - Find `DB_NAME` in the list
   - Change it from `hesabdoni` to `vigorous_grothendieck`
   - Or if it doesn't exist, add it:
     ```
     DB_NAME=vigorous_grothendieck
     ```

3. **Verify all database environment variables:**
   ```
   DB_HOST=apo.liara.cloud
   DB_PORT=33282
   DB_USER=root
   DB_PASSWORD=your-password
   DB_NAME=vigorous_grothendieck
   ```

4. **Redeploy the backend** after updating the environment variable

## Verify Database Tables Exist

After updating the database name, make sure the tables exist:

1. **Access phpMyAdmin on Liara:**
   - Go to your MySQL service
   - Open phpMyAdmin
   - Select database `vigorous_grothendieck`

2. **Check if tables exist:**
   - You should see 3 tables:
     - `companies`
     - `document_covers`
     - `document_files`

3. **If tables don't exist, import the schema:**
   - Go to **SQL** tab in phpMyAdmin
   - Copy and paste the SQL from `database/schema-for-liara.sql`
   - Click **Go** to execute

## Quick Fix Summary

**In Liara Backend Environment Variables:**
```
DB_NAME=vigorous_grothendieck
```

**Then:**
1. Save the environment variable
2. Redeploy backend
3. Test login again

## Files Reference

- `database/LIARA_SETUP.md` - Contains your database name: `vigorous_grothendieck`
- `database/schema-for-liara.sql` - SQL to create tables (already uses correct database name)

The error should be resolved after updating `DB_NAME`! 🚀
