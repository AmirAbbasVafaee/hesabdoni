# Fix 502 Bad Gateway Error on Liara

## Error
```
502 Bad Gateway
Request Method: OPTIONS
Request URL: https://hesabdonibackend.liara.run/api/auth/login
```

## Root Cause
The 502 error indicates that Liara's proxy cannot reach your backend application. This is usually because:
1. Backend is not listening on `0.0.0.0` (needed for containerized deployments)
2. Backend is not running or crashed
3. Port configuration mismatch

## Fixes Applied

### 1. Server Listening Configuration ✅
Updated `backend/src/server.ts` to:
- Listen on `0.0.0.0` instead of default (allows external connections)
- Use `HOST` environment variable (defaults to `0.0.0.0`)

### 2. Enhanced CORS Configuration ✅
- Added `preflightContinue: false` to properly handle OPTIONS requests
- Added `optionsSuccessStatus: 204` for proper preflight responses
- Added more allowed headers

## Deployment Checklist

### 1. Verify Backend Environment Variables in Liara

Required variables:
```
NODE_ENV=production
PORT=5001
HOST=0.0.0.0
FRONTEND_URL=https://hesabdooni.liara.run
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
DB_HOST=apo.liara.cloud
DB_PORT=33282
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=hesabdoni
```

**Important:** 
- `PORT` should match what Liara expects (check Liara app settings)
- `HOST=0.0.0.0` is critical for containerized deployments

### 2. Check Liara App Configuration

In Liara Backend App Panel:
1. **Port:** Should match `PORT` environment variable (usually 5001 or check Liara's assigned port)
2. **Start Command:** `npm start` (should run `node dist/server.js`)
3. **Build Command:** `npm install && npm run build`

### 3. Check Backend Logs in Liara

1. Go to **Logs** section in Liara backend app
2. Look for:
   - `Server is running on 0.0.0.0:5001` (or your port)
   - Any error messages
   - Database connection errors

### 4. Test Backend Health Endpoint

After deployment, test:
```bash
curl https://hesabdonibackend.liara.run/health
```

Expected response:
```json
{"status":"ok","message":"HesabDooni API is running"}
```

If this fails, the backend is not running correctly.

## Troubleshooting

### Still Getting 502?

1. **Check if backend is running:**
   - Go to Liara logs
   - Look for "Server is running" message
   - If not found, backend didn't start

2. **Check port configuration:**
   - Liara might assign a different port
   - Check Liara app settings for the port
   - Update `PORT` environment variable to match

3. **Check build output:**
   - Verify `dist/server.js` exists after build
   - Check if TypeScript compilation succeeded

4. **Check database connection:**
   - Backend might be crashing on startup due to DB connection
   - Check logs for database errors

5. **Verify start command:**
   - Should be: `npm start`
   - Which runs: `node dist/server.js`
   - Make sure `dist/` directory exists after build

### Common Issues

#### Issue: Backend starts but immediately crashes
**Solution:** Check database connection settings and ensure database is accessible

#### Issue: Port mismatch
**Solution:** Check Liara app settings for the assigned port and update `PORT` env var

#### Issue: Build fails
**Solution:** Check build logs, ensure all dependencies are installed

## Files Modified

- ✅ `backend/src/server.ts` - Updated to listen on `0.0.0.0` and improved CORS

## Next Steps

1. **Commit and push changes:**
   ```bash
   git add backend/src/server.ts
   git commit -m "Fix 502 error: Listen on 0.0.0.0 and improve CORS"
   git push origin main
   ```

2. **Redeploy backend on Liara**

3. **Check logs** to verify server started correctly

4. **Test health endpoint:**
   ```bash
   curl https://hesabdonibackend.liara.run/health
   ```

5. **Test login** from frontend again

The 502 error should be resolved after these changes! 🚀

