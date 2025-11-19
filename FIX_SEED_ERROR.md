# Fix Seed Script Errors

## Common Errors & Fixes

### Error: "Failed to login" or "Connection refused"

**Problem:** Backend is not running

**Fix:**
```bash
# Terminal 1: Start Medusa backend
cd ../medusa-backend
npm run start

# Terminal 2: Run seed script
cd custom-store-test
npm run seed
```

---

### Error: "ECONNREFUSED" or "Cannot connect"

**Problem:** Backend URL is wrong or backend isn't running

**Fix:**
1. Check backend is running: `curl http://localhost:9000/health`
2. Check `.env` has: `MEDUSA_BACKEND_URL=http://localhost:9000`
3. Make sure backend started successfully

---

### Error: "Failed to login: 401" or "Unauthorized"

**Problem:** Admin credentials are wrong

**Fix:**
```bash
# Create admin user in backend
cd ../medusa-backend
npx medusa user -e admin@example.com -p supersecret

# Or update seed script with correct credentials
```

---

### Error: "Failed to create product: 400" or "Bad Request"

**Problem:** Product data format is wrong or currency code invalid

**Fix:**
- Check if `dust` currency is registered in Medusa backend
- Make sure product format matches Medusa API requirements

---

## Quick Test

**1. Check backend is running:**
```bash
curl http://localhost:9000/health
# Should return: OK
```

**2. Test login:**
```bash
curl -X POST http://localhost:9000/admin/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"supersecret"}'
```

**3. Run seed:**
```bash
cd custom-store-test
npm run seed
```

---

## Still Having Issues?

Paste the exact error message and I'll help fix it!




