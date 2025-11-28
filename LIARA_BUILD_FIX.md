# Fix Liara Build Error: app/public not found

## Error
```
COPY failed: stat app/public: file does not exist
```

## Fixes Applied

### 1. Created Public Directory ✅
- Created `frontend/public/` directory
- Added `.gitkeep` to ensure it's tracked

### 2. Fixed Build Command ✅
- Removed `|| true` from build script (was hiding errors)
- Build command is now: `npm run build`

### 3. Created Dockerfile ✅
- Added proper Dockerfile for Next.js standalone build
- Configured for production deployment

### 4. Created .dockerignore ✅
- Excludes unnecessary files from Docker build

## Liara Configuration

### Option 1: Deploy Frontend Directory

In Liara panel:
1. Set **Root Directory** to: `frontend`
2. **Build Command:** `npm install && npm run build`
3. **Start Command:** `npm start`
4. **Node Version:** 18+

### Option 2: Use liara.json (Monorepo)

If deploying from root, `liara.json` is configured:
```json
{
  "platform": "node",
  "build": {
    "commands": [
      "cd frontend && npm install",
      "cd frontend && npm run build"
    ]
  },
  "start": {
    "command": "cd frontend && npm start"
  }
}
```

## Environment Variables

Set these in Liara panel:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-url/api
```

Replace `your-backend-url` with your actual backend URL.

## Next Steps

1. **Commit the changes:**
   ```bash
   git add frontend/public frontend/Dockerfile frontend/.dockerignore
   git commit -m "Add public directory and Docker config for Liara"
   git push origin main
   ```

2. **In Liara Panel:**
   - If using root directory: Make sure `liara.json` is detected
   - If using frontend directory: Set root to `frontend`
   - Set environment variables
   - Trigger new deployment

3. **Verify Build:**
   - Check build logs in Liara
   - Should see "Build completed successfully"
   - App should be accessible

## Troubleshooting

### If build still fails:

1. **Check Liara logs:**
   - Look for specific error messages
   - Check if all dependencies are installing

2. **Verify structure:**
   ```bash
   ls -la frontend/public
   # Should show .gitkeep file
   ```

3. **Test build locally:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

4. **Check Node version:**
   - Liara should use Node.js 18+
   - Check in Liara app settings

## Files Created/Modified

- ✅ `frontend/public/.gitkeep` - Ensures public directory exists
- ✅ `frontend/Dockerfile` - Docker configuration
- ✅ `frontend/.dockerignore` - Excludes unnecessary files
- ✅ `frontend/package.json` - Fixed build command
- ✅ `liara.json` - Liara deployment config

The build should work now! 🚀

