# Admin Invite Setup

## What Happened

Medusa setup created an admin user and sent you an invite link. You need to:
1. Accept the invite
2. Set a password
3. Then you can login

---

## Option 1: Accept the Invite (Easiest)

**On the invite page (`http://localhost:9000/app/invite?...`):**

1. **Set your password** (enter a strong password)
2. **Confirm password**
3. **Click "Accept Invite"**
4. **You'll be logged in automatically!**

---

## Option 2: Create New Admin User

If you want to create a different admin user:

```bash
cd ../medusa-backend
npx medusa user -e admin@example.com -p supersecret
```

Then login at: `http://localhost:9000/app`

---

## After Accepting Invite

**You'll be logged into the admin dashboard!**

You can now:
- ✅ See the admin dashboard
- ✅ Manage products
- ✅ View orders
- ✅ Manage inventory

---

## Next Steps

1. ✅ Accept invite and set password
2. ✅ You're logged in!
3. ✅ Seed products: `cd custom-store-test && npm run seed`
4. ✅ Test storefront: `npm run dev`

---

## Troubleshooting

### "User account already exists" Error

If you see: `User account for following email(s) already exist: admin@medusa-test.com`

**This means the user already exists!** You have 3 options:

**Option A: Log in directly** (if you know the password)
- Go to: `http://localhost:9000/app`
- Login with: `admin@medusa-test.com` and your password

**Option B: Create a new admin user** (with different email)
```bash
cd ../medusa-backend
npx medusa user -e admin@example.com -p supersecret
```
Then login at: `http://localhost:9000/app` with the new credentials

**Option C: Reset password** (if you forgot it)
- You'll need to use Medusa's password reset feature or create a new user

### Can't accept invite?
- Check backend is running: `npm run start` (in medusa-backend folder)
- Check token hasn't expired (invites expire after 24 hours)
- Create new admin: `npx medusa user -e admin@example.com -p supersecret`

### Want to skip invite?
Create admin directly (without --invite flag):
```bash
cd ../medusa-backend
npx medusa user -e admin@example.com -p supersecret
```

Then login at: `http://localhost:9000/app`

