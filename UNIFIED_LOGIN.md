# Unified Login Route

## Changes Made

✅ **Unified login route** - Both admin and company logins now use the same `/api/auth/login` endpoint

## How It Works

### Single Login Route: `/api/auth/login`

The backend route checks credentials in this order:

1. **First:** Checks if credentials match admin (from `ADMIN_USERNAME` and `ADMIN_PASSWORD` env vars)
   - If match → Returns JWT with `isAdmin: true`
   - Redirects to `/admin/companies`

2. **Second:** If not admin, checks company database
   - Looks up company by username
   - Validates password hash
   - If match → Returns JWT with `isAdmin: false`
   - Redirects to `/dashboard`

### Frontend Behavior

**Regular Login Page (`/login`):**
- Uses `/api/auth/login`
- If admin → Redirects to `/admin/companies`
- If company → Redirects to `/dashboard`

**Admin Login Page (`/admin/login`):**
- Uses `/api/auth/login`
- If admin → Redirects to `/admin/companies`
- If not admin → Shows error (no admin access)

## Environment Variables

Set in Liara Backend:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
```

## Usage

### Admin Login:
- **URL:** `/login` or `/admin/login`
- **Username:** `admin` (or value from `ADMIN_USERNAME`)
- **Password:** `admin` (or value from `ADMIN_PASSWORD`)
- **Result:** JWT with `isAdmin: true` → Redirects to admin panel

### Company Login:
- **URL:** `/login`
- **Username:** Company's nationalId (or custom username)
- **Password:** Company's generated password
- **Result:** JWT with `isAdmin: false` → Redirects to dashboard

## Benefits

1. ✅ Single endpoint for all authentication
2. ✅ Simpler API structure
3. ✅ Consistent authentication flow
4. ✅ Both login pages work the same way

## Files Modified

- ✅ `backend/src/routes/auth.ts` - Unified login route
- ✅ `frontend/app/login/page.tsx` - Handles admin redirect
- ✅ `frontend/app/admin/login/page.tsx` - Uses same route

The login system is now unified! 🚀

