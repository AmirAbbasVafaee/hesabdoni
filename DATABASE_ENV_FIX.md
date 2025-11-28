# Fix: Database Name Environment Variable

## Problem
The backend code had a hardcoded fallback to `'hesabdoni'` in the database configuration, which could cause issues if the environment variable isn't properly set.

## Fix Applied

### Updated `backend/src/config/database.ts`:
- Removed hardcoded fallback `'hesabdoni'`
- Made `DB_NAME` a required environment variable
- Added validation to throw clear error if `DB_NAME` is missing

## Required Environment Variables in Liara

Make sure these are set in **Liara Backend App → Environment Variables**:

```
DB_HOST=apo.liara.cloud
DB_PORT=33282
DB_USER=root
DB_PASSWORD=your-password-here
DB_NAME=vigorous_grothendieck
```

**Important:** 
- `DB_NAME` is now **required** - no fallback
- Must be set to `vigorous_grothendieck` (your actual database name)
- Case-sensitive - must match exactly

## Steps to Fix

### 1. Verify Environment Variables in Liara

1. Go to **Liara Backend App Panel**
2. Click on **Environment Variables**
3. Check that `DB_NAME` exists and is set to:
   ```
   DB_NAME=vigorous_grothendieck
   ```

### 2. If `DB_NAME` is Missing or Wrong

1. **Add or Edit** the `DB_NAME` variable:
   - Key: `DB_NAME`
   - Value: `vigorous_grothendieck`
   - **No quotes, no spaces**

2. **Save** the environment variable

3. **Redeploy** the backend (important!)

### 3. Verify All Database Variables

Check these are all set correctly:
```
DB_HOST=apo.liara.cloud
DB_PORT=33282
DB_USER=root
DB_PASSWORD=your-actual-password
DB_NAME=vigorous_grothendieck
```

### 4. Check Backend Logs

After redeploying, check logs for:
- ✅ `Server is running on 0.0.0.0:5001` - Server started
- ❌ `DB_NAME environment variable is required` - Variable not set
- ❌ `Unknown database` - Wrong database name

## Troubleshooting

### Error: "DB_NAME environment variable is required"

**Solution:** 
- Go to Liara → Environment Variables
- Add `DB_NAME=vigorous_grothendieck`
- Redeploy backend

### Error: "Unknown database 'hesabdoni'"

**Solution:**
- Check `DB_NAME` is set to `vigorous_grothendieck` (not `hesabdoni`)
- Verify no typos
- Redeploy after changing

### Error: "Unknown database 'vigorous_grothendieck'"

**Solution:**
- Verify database exists in phpMyAdmin
- Check database name spelling (case-sensitive)
- Make sure you're using the correct database name from Liara

## Testing

After setting the environment variable and redeploying:

1. **Check backend logs:**
   - Should see: `Server is running on 0.0.0.0:5001`
   - No database connection errors

2. **Test login:**
   - Try logging in from frontend
   - Should work if database and tables exist

3. **Verify database connection:**
   - Backend should connect successfully
   - No "Unknown database" errors

## Files Modified

- ✅ `backend/src/config/database.ts` - Removed hardcoded fallback, made DB_NAME required

## Next Steps

1. ✅ Set `DB_NAME=vigorous_grothendieck` in Liara
2. ✅ Redeploy backend
3. ✅ Check logs for successful connection
4. ✅ Test login

The database connection should work now! 🚀

