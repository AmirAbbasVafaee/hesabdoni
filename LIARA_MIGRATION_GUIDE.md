# HesabDooni - Liara Migration Guide

Complete guide for migrating or deploying HesabDooni to a new Liara account.

---

## 📋 Table of Contents

1. [Project Structure](#project-structure)
2. [Database Setup](#database-setup)
3. [Backend Configuration](#backend-configuration)
4. [Frontend Configuration](#frontend-configuration)
5. [Liara Deployment Steps](#liara-deployment-steps)
6. [Environment Variables](#environment-variables)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Project Structure

```
hesabdoni/
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend API
├── database/         # Database schema files
├── liara.json        # Frontend deployment config
└── backend/liara.json # Backend deployment config
```

---

## 🗄️ Database Setup

### Step 1: Create MySQL Database on Liara

1. Log in to your Liara account
2. Go to **Databases** → **Create Database**
3. Select **MySQL**
4. Note down the database credentials:
   - Database Name
   - Host (e.g., `apo.liara.cloud`)
   - Port (e.g., `33282`)
   - Username
   - Password

### Step 2: Import Database Schema

1. Connect to your MySQL database using phpMyAdmin or MySQL client
2. Run the schema file: `database/schema-for-liara.sql`
   - **Important:** Update the `USE` statement with your actual database name
   - Or manually select your database before running the schema

**Schema File Location:** `database/schema-for-liara.sql`

**Tables Created:**
- `companies` - Company information and credentials
- `document_covers` - Document cover/header information
- `document_files` - Document attachments/files

### Step 3: Enable Public Network Access (if needed)

If you need to connect from external tools:
1. Go to your database settings in Liara
2. Enable **Public Network** access
3. Note the public host and port (usually different from internal)

---

## 🔧 Backend Configuration

### Step 1: Create Backend App on Liara

1. Go to **Apps** → **Create App**
2. Select **Node.js** platform
3. Choose **Git** deployment method
4. Connect your repository
5. Set app name (e.g., `hesabdonibackend`)

### Step 2: Configure Backend Environment Variables

Go to your backend app → **Environment Variables** and set:

```bash
# Database Configuration (REQUIRED)
DB_HOST=apo.liara.cloud              # Your MySQL host
DB_PORT=33282                        # Your MySQL port
DB_USER=root                         # Your MySQL username
DB_PASSWORD=your_password_here      # Your MySQL password
DB_NAME=your_database_name          # Your MySQL database name (REQUIRED)

# Server Configuration
PORT=5001                            # Backend port (default: 5000)
HOST=0.0.0.0                         # Listen on all interfaces (required for Liara)
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your_secret_key_here      # Generate a strong random string
JWT_EXPIRES_IN=7d                    # Token expiration (e.g., 7d, 24h)

# Admin Authentication
ADMIN_USERNAME=admin                 # Admin login username
ADMIN_PASSWORD=admin                 # Admin login password (change this!)

# CORS Configuration
FRONTEND_URL=https://your-frontend-url.liara.run  # Your frontend URL
```

**⚠️ Important:**
- `DB_NAME` is **REQUIRED** - backend will fail to start without it
- Generate a strong `JWT_SECRET` (use: `openssl rand -base64 32`)
- Change `ADMIN_PASSWORD` to a secure password
- Set `FRONTEND_URL` to your actual frontend URL

### Step 3: Backend Deployment Configuration

The backend uses `backend/liara.json`:

```json
{
  "platform": "node",
  "build": {
    "commands": [
      "npm install",
      "npm run build"
    ]
  },
  "start": {
    "command": "npm start"
  }
}
```

**Build Process:**
1. `npm install` - Installs dependencies
2. `npm run build` - Compiles TypeScript to JavaScript
3. `npm start` - Runs `node dist/server.js`

### Step 4: Backend File Structure

Ensure these files exist:
- `backend/package.json` - Dependencies and scripts
- `backend/tsconfig.json` - TypeScript configuration
- `backend/src/server.ts` - Main server file
- `backend/src/config/database.ts` - Database connection
- `backend/src/routes/` - API routes
- `backend/src/services/` - Business logic
- `backend/src/middleware/` - Authentication middleware

**Upload Directory:**
- `backend/uploads/` - Created automatically for file uploads

---

## 🎨 Frontend Configuration

### Step 1: Create Frontend App on Liara

1. Go to **Apps** → **Create App**
2. Select **Node.js** platform
3. Choose **Git** deployment method
4. Connect your repository
5. Set app name (e.g., `hesabdooni`)

### Step 2: Configure Frontend Environment Variables

Go to your frontend app → **Environment Variables** and set:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-url.liara.run/api

# Build Configuration
NODE_ENV=production
```

**⚠️ Important:**
- `NEXT_PUBLIC_API_URL` must be the full backend URL with `/api` suffix
- Example: `https://hesabdonibackend.liara.run/api`

### Step 3: Frontend Deployment Configuration

The frontend uses `liara.json` (root level):

```json
{
  "platform": "node",
  "app": "hesabdoni-frontend",
  "build": {
    "commands": [
      "cd frontend && npm install",
      "cd frontend && npm run build"
    ]
  },
  "start": {
    "command": "cd frontend && npm start"
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Build Process:**
1. `cd frontend && npm install` - Installs dependencies
2. `cd frontend && npm run build` - Builds Next.js application
3. `cd frontend && npm start` - Starts Next.js server

### Step 4: Frontend File Structure

Ensure these files exist:
- `frontend/package.json` - Dependencies and scripts
- `frontend/next.config.js` - Next.js configuration
- `frontend/tailwind.config.ts` - Tailwind CSS configuration
- `frontend/app/` - Next.js app directory
- `frontend/components/` - React components
- `frontend/lib/` - Utility functions and API client
- `frontend/public/` - Static files (must exist, even if empty)

**Next.js Configuration:**
- `output: 'standalone'` - Required for Docker deployment
- Image domains configured for backend uploads

---

## 🚀 Liara Deployment Steps

### Backend Deployment

1. **Push code to Git repository**
   ```bash
   git add .
   git commit -m "Deploy backend"
   git push origin main
   ```

2. **In Liara Backend App:**
   - Go to **Deployments** tab
   - Click **Deploy**
   - Select your branch (usually `main`)
   - Wait for build to complete

3. **Verify Backend:**
   - Check logs for: `Server is running on 0.0.0.0:5001`
   - Test health endpoint: `https://your-backend-url.liara.run/health`
   - Should return: `{"status":"ok","message":"HesabDooni API is running"}`

### Frontend Deployment

1. **Push code to Git repository** (if not already done)
   ```bash
   git add .
   git commit -m "Deploy frontend"
   git push origin main
   ```

2. **In Liara Frontend App:**
   - Go to **Deployments** tab
   - Click **Deploy**
   - Select your branch (usually `main`)
   - Wait for build to complete

3. **Verify Frontend:**
   - Check logs for successful build
   - Visit your frontend URL
   - Should see login page

---

## 🔐 Environment Variables Summary

### Backend (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | `apo.liara.cloud` |
| `DB_PORT` | MySQL port | `33282` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `your_password` |
| `DB_NAME` | Database name | `your_database` |
| `PORT` | Server port | `5001` |
| `HOST` | Server host | `0.0.0.0` |
| `JWT_SECRET` | JWT signing secret | `random_string` |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `ADMIN_USERNAME` | Admin username | `admin` |
| `ADMIN_PASSWORD` | Admin password | `secure_password` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-frontend.liara.run` |

### Frontend (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://your-backend.liara.run/api` |

---

## ✅ Testing & Verification

### 1. Test Backend Health

```bash
curl https://your-backend-url.liara.run/health
```

Expected response:
```json
{"status":"ok","message":"HesabDooni API is running"}
```

### 2. Test Database Connection

Check backend logs for:
- ✅ `Server is running on 0.0.0.0:5001`
- ❌ No database connection errors

### 3. Test Admin Login

1. Go to: `https://your-frontend-url.liara.run/admin/login`
2. Username: `admin` (or your `ADMIN_USERNAME`)
3. Password: `admin` (or your `ADMIN_PASSWORD`)
4. Should redirect to `/admin/companies`

### 4. Test Company Login

1. First, create a company via admin panel
2. Go to: `https://your-frontend-url.liara.run/login`
3. Use company credentials
4. Should redirect to `/dashboard`

### 5. Test API Endpoints

```bash
# Health check
curl https://your-backend-url.liara.run/health

# Admin login (replace credentials)
curl -X POST https://your-backend-url.liara.run/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

---

## 🔍 Troubleshooting

### Backend Issues

**Problem: Database connection error**
- ✅ Check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` are correct
- ✅ Verify database exists and schema is imported
- ✅ Check if public network access is enabled (if connecting externally)

**Problem: `DB_NAME environment variable is required`**
- ✅ Set `DB_NAME` in Liara environment variables
- ✅ No fallback value - must be set explicitly

**Problem: Build fails with TypeScript errors**
- ✅ Check `backend/tsconfig.json` exists
- ✅ Verify all dependencies are in `package.json`
- ✅ Check build logs for specific errors

**Problem: Port already in use**
- ✅ Change `PORT` environment variable
- ✅ Liara will assign a port automatically if not set

### Frontend Issues

**Problem: Cannot connect to backend API**
- ✅ Check `NEXT_PUBLIC_API_URL` is set correctly
- ✅ Verify backend URL is accessible
- ✅ Check CORS settings in backend (`FRONTEND_URL`)

**Problem: Build fails**
- ✅ Check `frontend/package.json` dependencies
- ✅ Verify `next.config.js` exists
- ✅ Check build logs for specific errors

**Problem: Images not loading**
- ✅ Verify `next.config.js` has correct image domains
- ✅ Check backend uploads directory is accessible
- ✅ Verify file URLs are correct

### Database Issues

**Problem: Tables not found**
- ✅ Run `database/schema-for-liara.sql` in your database
- ✅ Update `USE database_name;` statement with your database name
- ✅ Verify tables exist: `companies`, `document_covers`, `document_files`

**Problem: Foreign key errors**
- ✅ Ensure `companies` table is created first
- ✅ Check table creation order in schema file

---

## 📝 Quick Checklist

### Before Deployment

- [ ] Database created on Liara
- [ ] Database schema imported
- [ ] Backend app created on Liara
- [ ] Frontend app created on Liara
- [ ] All environment variables set
- [ ] Git repository connected
- [ ] Code pushed to repository

### After Deployment

- [ ] Backend health check passes
- [ ] Frontend loads successfully
- [ ] Admin login works
- [ ] Company creation works
- [ ] Company login works
- [ ] File upload works
- [ ] OCR processing works

---

## 🔗 Important URLs

After deployment, note these URLs:

- **Frontend:** `https://your-frontend-app.liara.run`
- **Backend:** `https://your-backend-app.liara.run`
- **Backend API:** `https://your-backend-app.liara.run/api`
- **Health Check:** `https://your-backend-app.liara.run/health`

---

## 📚 Additional Resources

- **Liara Documentation:** https://docs.liara.ir
- **Next.js Documentation:** https://nextjs.org/docs
- **Express.js Documentation:** https://expressjs.com
- **MySQL Documentation:** https://dev.mysql.com/doc

---

## 🆘 Support

If you encounter issues:

1. Check Liara app logs (both frontend and backend)
2. Verify all environment variables are set correctly
3. Test database connection separately
4. Verify API endpoints are accessible
5. Check CORS configuration

---

**Last Updated:** 2025-01-28  
**Version:** 1.0.0

