# Backend Build Fix for Liara

## Error Fixed
```
error TS2769: No overload matches this call.
Type 'string' is not assignable to type 'number | StringValue | undefined'.
```

## Solution
Fixed the TypeScript type error in `backend/src/routes/auth.ts` by:
1. Removing the `SignOptions` import (not needed)
2. Using type assertion for the `expiresIn` option: `as jwt.SignOptions`

## Changes Made

### `backend/src/routes/auth.ts`
```typescript
// Before (causing error):
const options: SignOptions = {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};

// After (fixed):
const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as string;
const token = jwt.sign(
  { userId: company.id, companyId: company.id, isAdmin: false },
  secret,
  { expiresIn } as jwt.SignOptions
);
```

## Files Created/Modified

- ✅ `backend/src/routes/auth.ts` - Fixed JWT sign type error
- ✅ `backend/liara.json` - Liara deployment configuration
- ✅ `backend/.dockerignore` - Excludes unnecessary files

## Build Verification

✅ Build now succeeds:
```bash
cd backend
npm run build
# Success! No errors.
```

## Liara Deployment

### Configuration Files
- `backend/liara.json` - Configured for Node.js deployment
- `backend/.dockerignore` - Optimized for Docker builds

### Environment Variables (Set in Liara Panel)

Required:
```
NODE_ENV=production
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
DB_HOST=apo.liara.cloud
DB_PORT=33282
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=hesabdoni
PORT=5001
```

### Deployment Steps

1. **Commit changes:**
   ```bash
   git add backend/src/routes/auth.ts backend/liara.json backend/.dockerignore
   git commit -m "Fix backend TypeScript build error for Liara"
   git push origin main
   ```

2. **In Liara Panel:**
   - Set **Root Directory** to: `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Node Version:** 18+
   - Set all environment variables

3. **Verify:**
   - Check build logs - should show "Build completed successfully"
   - Test API endpoint: `https://your-backend-url/api/health`

## Build Output

The build creates:
- `backend/dist/` - Compiled JavaScript files
- `backend/dist/server.js` - Main entry point

## Next Steps

1. Deploy backend to Liara
2. Test API endpoints
3. Connect frontend to backend URL
4. Test full application flow

The backend is now ready for deployment! 🚀

