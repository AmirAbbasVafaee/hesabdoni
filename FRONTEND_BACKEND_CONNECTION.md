# Frontend-Backend Connection Setup

## Issue
Frontend couldn't connect to backend API after deployment. The frontend was still using `localhost:5001` instead of the production backend URL.

## Solution

### 1. Frontend API Configuration ✅

Updated `frontend/lib/api.ts` to:
- Use `NEXT_PUBLIC_API_URL` environment variable
- Auto-detect production vs development
- Fallback to production URL if not on localhost

### 2. Backend CORS Configuration ✅

Updated `backend/src/server.ts` to:
- Configure CORS with proper options
- Allow credentials
- Set allowed methods and headers
- Use `FRONTEND_URL` environment variable for production

### 3. Environment Variables

#### Frontend (Set in Liara Panel)

```
NEXT_PUBLIC_API_URL=https://hesabdonibackend.liara.run/api
```

**Note:** In Next.js, environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

#### Backend (Set in Liara Panel)

```
FRONTEND_URL=https://your-frontend-url.liara.run
```

Replace `your-frontend-url` with your actual frontend domain.

## Setup Steps

### 1. Set Frontend Environment Variable

In Liara Frontend App Panel:
1. Go to **Environment Variables**
2. Add:
   ```
   NEXT_PUBLIC_API_URL=https://hesabdonibackend.liara.run/api
   ```
3. **Important:** Redeploy the frontend after adding the variable

### 2. Set Backend Environment Variable (Optional but Recommended)

In Liara Backend App Panel:
1. Go to **Environment Variables**
2. Add:
   ```
   FRONTEND_URL=https://your-frontend-url.liara.run
   ```
   Replace with your actual frontend URL
3. Redeploy the backend

### 3. Verify Connection

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try to login
4. Check the login request:
   - **Request URL** should be: `https://hesabdonibackend.liara.run/api/auth/login`
   - **Status** should be `200` (success) or `401` (wrong credentials)
   - If you see `CORS error`, check backend CORS configuration

## Troubleshooting

### Error: Network Error / Failed to fetch

**Possible causes:**
1. Backend URL is incorrect
2. Backend is not running
3. CORS issue

**Solutions:**
1. Verify backend URL in frontend environment variable
2. Check backend health: `https://hesabdonibackend.liara.run/health`
3. Check browser console for CORS errors

### Error: CORS policy blocked

**Solution:**
1. Update backend `FRONTEND_URL` environment variable
2. Make sure it matches your frontend domain exactly
3. Redeploy backend

### Error: 404 Not Found

**Possible causes:**
1. API endpoint path is wrong
2. Backend routes not configured correctly

**Solutions:**
1. Verify backend routes are mounted at `/api/*`
2. Check backend logs in Liara
3. Test backend directly: `https://hesabdonibackend.liara.run/api/auth/login`

### Error: 401 Unauthorized

This is **normal** - it means the connection works but credentials are wrong.

## Testing

### Test Backend Directly

```bash
curl https://hesabdonibackend.liara.run/health
# Should return: {"status":"ok","message":"HesabDooni API is running"}
```

### Test Login Endpoint

```bash
curl -X POST https://hesabdonibackend.liara.run/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## Files Modified

- ✅ `frontend/lib/api.ts` - Updated API base URL logic
- ✅ `frontend/next.config.js` - Added backend domain to image domains
- ✅ `backend/src/server.ts` - Improved CORS configuration
- ✅ `frontend/.env.example` - Added example environment variables

## Next Steps

1. Set `NEXT_PUBLIC_API_URL` in Liara frontend panel
2. Redeploy frontend
3. Test login functionality
4. Verify all API calls work correctly

The connection should work now! 🚀

