# Database Connection Troubleshooting

## Error: Can't connect to MySQL server (Error 2003)

This error typically means the connection is being refused. Let's troubleshoot step by step.

## Current Settings

- **Host:** `apo.liara.cloud`
- **Port:** `33282`
- **Username:** `root`
- **Password:** `T3g0IKfniNDE6nPmpE3X0NGz`
- **Database:** `vigorous_grothendieck`

## Possible Causes

### 1. Public Network Not Fully Activated
The public network might need some time to activate, or there might be additional configuration needed in Liara.

**Solution:** Check in Liara panel:
- Go to Database settings
- Verify that "Public Network" is enabled
- Check if there are any additional settings or activation steps

### 2. Firewall/Network Issues
Your local firewall or network might be blocking the connection.

**Test:**
```bash
# Test if port is reachable
nc -zv apo.liara.cloud 33282

# Or with telnet
telnet apo.liara.cloud 33282
```

### 3. Incorrect Host/Port
Double-check the host and port in Liara panel.

**Verify:**
- Host should be exactly: `apo.liara.cloud`
- Port should be exactly: `33282`

### 4. Database Service Not Running
The database service might not be running or accessible.

**Check in Liara:**
- Database status should be "Running"
- Check if there are any error messages in Liara logs

## Solutions to Try

### Solution 1: Use Private Network (If Available)
If you're deploying the backend on Liara, you can use the private network:

```env
DB_HOST=hesabdoni
DB_PORT=3306
```

This only works from within Liara's network.

### Solution 2: Check Liara Database Settings
1. Go to Liara panel
2. Open your database
3. Check "Network Access" or "Public Access" settings
4. Verify that public network is enabled
5. Check if there are any IP restrictions (even for public network)

### Solution 3: Test from Different Network
Try connecting from:
- Different network (mobile hotspot)
- Different device
- VPN (to rule out network issues)

### Solution 4: Contact Liara Support
If nothing works, contact Liara support to:
- Verify public network is properly configured
- Check if there are any restrictions
- Verify database is accessible from outside

## Alternative: Use Private Network for Deployment

If you're deploying the backend on Liara, you should use the private network:

```env
DB_HOST=hesabdoni
DB_PORT=3306
```

This will work when both backend and database are on Liara.

## Testing Commands

### Test MySQL Connection
```bash
mysql -u root -pT3g0IKfniNDE6nPmpE3X0NGz \
  --port 33282 \
  --host apo.liara.cloud \
  vigorous_grothendieck \
  -e "SHOW TABLES;"
```

### Test with Node.js
```bash
cd backend
node -e "
const mysql = require('mysql2/promise');
require('dotenv').config();
mysql.createConnection({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}).then(conn => {
  console.log('✅ Connected!');
  return conn.execute('SELECT 1');
}).then(() => {
  console.log('✅ Query works!');
  process.exit(0);
}).catch(err => {
  console.log('❌ Error:', err.message);
  process.exit(1);
});
"
```

## Next Steps

1. Check Liara panel for database status and network settings
2. Verify public network is enabled and active
3. Try connecting from a different network/device
4. If deploying on Liara, consider using private network instead
5. Contact Liara support if issue persists

