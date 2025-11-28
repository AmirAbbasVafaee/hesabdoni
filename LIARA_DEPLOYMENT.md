# Liara Deployment Guide

## Build Error Fix

### Error: `COPY failed: stat app/public: file does not exist`

This error occurs because Liara expects a `public` directory. I've created it for you.

## Project Structure for Liara

Liara needs to know which directory contains your Next.js app. You have two options:

### Option 1: Deploy Frontend Only (Recommended)

If you're deploying only the frontend to Liara:

1. **Set the root directory in Liara:**
   - In Liara panel, go to your app settings
   - Set "Root Directory" to: `frontend`
   - Or deploy from the `frontend` directory

2. **Build command:**
   ```
   npm install && npm run build
   ```

3. **Start command:**
   ```
   npm start
   ```

### Option 2: Deploy from Root (Monorepo)

If deploying from the root directory:

1. **Create `liara.json` in root:**
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

2. **Or use environment variables:**
   - Set `NEXT_PUBLIC_API_URL` to your backend URL
   - Example: `https://your-backend.liara.run/api`

## Environment Variables

Set these in Liara panel:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-url/api
```

## Build Configuration

### If deploying frontend only:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Node Version:**
- Use Node.js 18+ (check in Liara settings)

## Public Directory

I've created the `frontend/public` directory. This is where Next.js serves static files from.

## Common Issues

### Issue 1: Build fails with "app/public not found"
✅ **Fixed:** Created `public` directory

### Issue 2: API calls fail
- Set `NEXT_PUBLIC_API_URL` environment variable
- Make sure backend is deployed and accessible

### Issue 3: Build timeout
- Increase build timeout in Liara settings
- Or optimize build (remove unused dependencies)

## Deployment Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add public directory and Liara config"
   git push origin main
   ```

2. **In Liara Panel:**
   - Connect your GitHub repository
   - Set root directory to `frontend` (if deploying frontend only)
   - Or use `liara.json` if deploying from root
   - Set environment variables
   - Deploy

3. **Verify:**
   - Check build logs in Liara
   - Visit your app URL
   - Test API connections

## Backend Deployment

For backend, deploy separately:

1. **Create another app in Liara** for backend
2. **Set root directory** to `backend`
3. **Build command:** `npm install && npm run build`
4. **Start command:** `npm start`
5. **Environment variables:** Copy from `backend/.env`

## Notes

- The `public` directory is now created and will be included in git
- `liara.json` is created for monorepo deployment
- Make sure to set all environment variables in Liara panel

