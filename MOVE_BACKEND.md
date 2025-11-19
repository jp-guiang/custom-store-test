# Move Medusa Backend to Correct Location

## Current Location
```
/Users/jp-guiang/Documents/Eriks Curiosa/medusa-backend
```

## Target Location
```
/Users/jp-guiang/Documents/Eriks Curiosa/custom-store-test/medusa-backend
```

---

## Option 1: Using Terminal (Recommended)

**Run this command:**

```bash
cd "/Users/jp-guiang/Documents/Eriks Curiosa"
mv medusa-backend custom-store-test/medusa-backend
```

**Verify it moved:**
```bash
ls custom-store-test/ | grep medusa-backend
```

---

## Option 2: Using Finder (Mac)

1. Open Finder
2. Navigate to: `/Users/jp-guiang/Documents/Eriks Curiosa/`
3. Drag `medusa-backend` folder into `custom-store-test` folder

---

## After Moving

**1. Update your `.env` file in `custom-store-test/.env`:**

Make sure it still has:
```env
MEDUSA_BACKEND_URL=http://localhost:9000
DATABASE_URL=postgres://medusa_user:password123@localhost:5432/medusa_db
```

**2. Start the backend from the new location:**
```bash
cd custom-store-test/medusa-backend
npm run start
```

**3. Start your Next.js storefront:**
```bash
cd custom-store-test
npm run dev
```

---

## Final Structure

```
custom-store-test/
├── app/
├── components/
├── lib/
├── medusa-backend/        ← Backend is now here
│   ├── src/
│   ├── .env
│   └── package.json
├── .env
└── package.json
```





