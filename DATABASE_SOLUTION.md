# Database Connection Solution

## Problem
Connection is being refused (Error 2003 / ECONNREFUSED) when trying to connect to `apo.liara.cloud:33282`.

## Analysis
- Host resolves correctly: `apo.liara.cloud` → `185.208.181.162`
- Port 33282 is not accessible (connection refused)
- This suggests the public network might not be fully configured or activated

## Solutions

### Option 1: Check Liara Public Network Configuration

1. **Go to Liara Panel:**
   - Navigate to your database
   - Check "Network" or "Public Access" section

2. **Verify Public Network:**
   - Ensure "Public Network" is enabled
   - Check if it needs activation/confirmation
   - Look for any status indicators (Active/Inactive)

3. **Check for Additional Settings:**
   - Some services require explicit activation
   - There might be a toggle or button to "Enable Public Access"
   - Check if there are any warnings or pending actions

### Option 2: Use Private Network (If Deploying on Liara)

If you're planning to deploy the backend on Liara, use the private network instead:

**Update `backend/.env`:**
```env
DB_HOST=hesabdoni
DB_PORT=3306
DB_USER=root
DB_PASSWORD=T3g0IKfniNDE6nPmpE3X0NGz
DB_NAME=vigorous_grothendieck
```

This will work when both backend and database are on Liara's network.

### Option 3: Wait for Public Network Activation

Sometimes public networks need a few minutes to activate after configuration. Try:
1. Wait 5-10 minutes
2. Refresh Liara panel
3. Try connecting again

### Option 4: Contact Liara Support

If the public network should be working but isn't:
1. Contact Liara support
2. Provide them with:
   - Database name: `vigorous_grothendieck`
   - Public host: `apo.liara.cloud`
   - Public port: `33282`
   - Error: Connection refused

## Current Configuration

The backend is configured with:
- Host: `apo.liara.cloud`
- Port: `33282`
- All settings are correct in `.env` file

## Testing

Once the public network is working, test with:

```bash
# Test MySQL connection
mysql -u root -pT3g0IKfniNDE6nPmpE3X0NGz \
  --port 33282 \
  --host apo.liara.cloud \
  vigorous_grothendieck \
  -e "SHOW TABLES;"

# Test Backend
cd backend
npm run dev
# Then test: curl http://localhost:5001/health
```

## Recommendation

**For Development:**
- If you need to develop locally, wait for public network to be activated
- Or use a local MySQL database for development

**For Production:**
- Deploy backend on Liara
- Use private network (hesabdoni:3306)
- This is more secure and faster

## Next Steps

1. Check Liara panel for public network status
2. If deploying on Liara, switch to private network
3. If developing locally, wait for public network activation or contact support

