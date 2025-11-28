# Fix: Admin Login Implementation

## Problem
- User tried to login with "admin admin" but got 401 Unauthorized
- No backend admin login route existed
- Frontend admin login was using client-side only check (TODO)

## Solution

### 1. Added Admin Login Route ✅

Created `/api/auth/admin/login` endpoint in `backend/src/routes/auth.ts`:
- Validates admin credentials from environment variables
- Returns JWT token with `isAdmin: true`
- Uses `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables

### 2. Updated Frontend Admin Login ✅

Updated `frontend/app/admin/login/page.tsx`:
- Now calls backend API: `/api/auth/admin/login`
- Stores JWT token in localStorage
- Properly handles authentication

## Environment Variables Required

### In Liara Backend App Panel:

Add these environment variables:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
```

**Important:** 
- Change `ADMIN_PASSWORD` to a strong password in production!
- These are separate from company login credentials

## How It Works

### Admin Login Flow:

1. **Frontend:** User enters username/password on `/admin/login`
2. **Backend:** Validates against `ADMIN_USERNAME` and `ADMIN_PASSWORD`
3. **Backend:** Returns JWT token with `isAdmin: true`
4. **Frontend:** Stores token and redirects to `/admin/companies`

### Company Login Flow:

1. **Frontend:** User enters username/password on `/login`
2. **Backend:** Looks up company in database by username
3. **Backend:** Validates password hash
4. **Backend:** Returns JWT token with `isAdmin: false`
5. **Frontend:** Stores token and redirects to `/dashboard`

## Testing

### Test Admin Login:

1. **Set environment variables in Liara:**
   ```
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin
   ```

2. **Redeploy backend**

3. **Go to:** `https://hesabdooni.liara.run/admin/login`

4. **Enter:**
   - Username: `admin`
   - Password: `admin`

5. **Should:**
   - ✅ Login successfully
   - ✅ Redirect to `/admin/companies`
   - ✅ Be able to create companies

### Test Company Login:

1. **First create a company** (via admin panel)

2. **Go to:** `https://hesabdooni.liara.run/login`

3. **Enter:**
   - Username: (company's nationalId)
   - Password: (company's generated password)

4. **Should:**
   - ✅ Login successfully
   - ✅ Redirect to `/dashboard`

## Security Notes

⚠️ **Important for Production:**

1. **Change default admin password:**
   ```
   ADMIN_PASSWORD=your-strong-password-here
   ```

2. **Use strong password:**
   - At least 12 characters
   - Mix of letters, numbers, symbols
   - Don't use "admin" in production!

3. **Consider adding:**
   - Rate limiting on login endpoints
   - IP whitelisting for admin access
   - Two-factor authentication

## Files Modified

- ✅ `backend/src/routes/auth.ts` - Added `/admin/login` route
- ✅ `frontend/app/admin/login/page.tsx` - Updated to use backend API

## Next Steps

1. ✅ Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in Liara
2. ✅ Redeploy backend
3. ✅ Test admin login
4. ✅ Create first company via admin panel
5. ✅ Test company login

Admin login should work now! 🚀

