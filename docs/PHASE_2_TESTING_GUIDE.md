# Phase 2: Authentication & RBAC Testing Guide

This guide provides step-by-step instructions for testing the Authentication & RBAC System implementation.

## Prerequisites

Before testing, ensure you have:
- Node.js 20+ installed
- PostgreSQL 15+ installed and running
- npm dependencies installed (`npm install`)

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

### 2. Generate Required Secrets

Generate secure secrets for your `.env` file:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -hex 32
```

### 3. Configure Database

Update the `DATABASE_URL` in your `.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/crms"
```

Replace `username`, `password`, and `crms` with your PostgreSQL credentials and database name.

### 4. Create Database and Run Migrations

```bash
# Push Prisma schema to database
npm run db:push

# Generate Prisma client
npm run db:generate
```

### 5. Seed the Database

Seed initial data (roles, permissions, stations, and SuperAdmin):

```bash
npm run db:seed
```

This will create:
- 6 roles (SuperAdmin, Admin, StationCommander, Officer, EvidenceClerk, Viewer)
- All necessary permissions
- Police Headquarters station
- SuperAdmin user (Badge: SA-00001, PIN: 12345678)

### 6. Start the Development Server

```bash
npm run dev
```

The application should now be running at http://localhost:3000

## Test Scenarios

### Test 1: Login with SuperAdmin

**Purpose:** Verify basic authentication flow

1. Navigate to http://localhost:3000/login
2. Enter credentials:
   - Badge: `SA-00001`
   - PIN: `12345678`
3. Click "Sign In"

**Expected Result:**
- Should redirect to `/dashboard`
- Should see welcome message with officer name
- Should see navigation sidebar with all menu items (SuperAdmin has full access)
- Should see user info in header (SA-00001 • SuperAdmin)

### Test 2: Invalid Credentials

**Purpose:** Verify authentication error handling

1. Navigate to http://localhost:3000/login
2. Enter invalid credentials:
   - Badge: `INVALID`
   - PIN: `00000000`
3. Click "Sign In"

**Expected Result:**
- Should show error message: "Invalid credentials. Please check your badge and PIN."
- Should remain on login page
- Audit log should record failed login attempt

### Test 3: Badge Validation

**Purpose:** Verify input validation

1. Navigate to http://localhost:3000/login
2. Test various invalid badge formats:
   - `abc` - Should show "Badge number must be at least 3 characters"
   - `sa-00001` - Should auto-convert to uppercase
   - `SA-001!` - Should show "Badge must contain only uppercase letters, numbers, and hyphens"

**Expected Result:**
- Validation messages should appear in real-time
- Form should not submit with invalid data

### Test 4: PIN Validation

**Purpose:** Verify PIN validation

1. Navigate to http://localhost:3000/login
2. Test various invalid PINs:
   - `123` - Should show "PIN must be exactly 8 digits"
   - `1234abcd` - Should show "PIN must contain only digits"

**Expected Result:**
- Validation messages should appear
- Form should not submit with invalid PIN

### Test 5: Account Locking

**Purpose:** Verify account locking after failed attempts

1. Navigate to http://localhost:3000/login
2. Attempt login with correct badge but wrong PIN 5 times:
   - Badge: `SA-00001`
   - PIN: `11111111` (wrong)
3. Try 5 times

**Expected Result:**
- After 5 failed attempts, account should be locked for 30 minutes
- Next login attempt should show: "Account is locked. Try again later."
- Audit log should record account lock event

**Note:** To unlock for continued testing, run:
```bash
npx prisma studio
```
Navigate to the Officer table, find SA-00001, and set:
- `lockedUntil`: null
- `failedAttempts`: 0

### Test 6: Session Management

**Purpose:** Verify session timeout

1. Login successfully
2. Wait 16 minutes (session expires after 15 minutes)
3. Try to navigate or refresh the page

**Expected Result:**
- Should be redirected to login page
- Should see message: "Session expired. Please log in again."

### Test 7: Logout

**Purpose:** Verify logout functionality

1. Login successfully
2. Click "Logout" button in header

**Expected Result:**
- Should redirect to `/login`
- Session should be destroyed
- Audit log should record logout event
- Attempting to access `/dashboard` should redirect back to login

### Test 8: Protected Routes

**Purpose:** Verify authentication middleware

1. Without logging in, try to access protected routes:
   - http://localhost:3000/dashboard
   - http://localhost:3000/dashboard/cases
   - http://localhost:3000/dashboard/admin

**Expected Result:**
- All attempts should redirect to `/login`
- No content from protected pages should be visible

### Test 9: Role-Based Navigation

**Purpose:** Verify permission-based menu visibility

This test requires creating additional officers with different roles. Use Prisma Studio:

```bash
npx prisma studio
```

Create test officers:
- Admin level (role level 2)
- Officer level (role level 4)
- Viewer level (role level 6)

Login with each and verify navigation sidebar:
- **SuperAdmin**: Should see all menu items including "Admin"
- **Admin**: Should see most items but not "Admin"
- **Officer**: Should see operational items (Cases, Persons, Evidence, etc.)
- **Viewer**: Should see limited read-only items

### Test 10: Audit Logging

**Purpose:** Verify audit trail

1. Perform various actions (login, logout, failed login)
2. Open Prisma Studio: `npx prisma studio`
3. Navigate to AuditLog table

**Expected Result:**
- All actions should be logged with:
  - entityType: "officer"
  - entityId: Officer ID
  - action: "login", "logout", "account_locked", etc.
  - success: true/false
  - details: Relevant information (badge, reason, etc.)
  - ipAddress and userAgent (if available)
  - createdAt timestamp

## Verification Checklist

After completing all tests, verify:

- [ ] ✅ Login works with correct credentials
- [ ] ✅ Login fails with incorrect credentials
- [ ] ✅ Badge input auto-converts to uppercase
- [ ] ✅ Form validation works for badge and PIN
- [ ] ✅ Account locks after 5 failed attempts
- [ ] ✅ Session expires after 15 minutes
- [ ] ✅ Logout destroys session properly
- [ ] ✅ Protected routes require authentication
- [ ] ✅ Navigation shows role-appropriate items
- [ ] ✅ All actions are audited in AuditLog table
- [ ] ✅ Dashboard displays user info correctly
- [ ] ✅ UI is responsive and accessible

## Database Inspection

Use Prisma Studio to inspect the database:

```bash
npx prisma studio
```

### Key Tables to Check

1. **Officer**
   - Verify SuperAdmin exists (badge: SA-00001)
   - Check pinHash is encrypted (Argon2id format)
   - Verify failedAttempts and lockedUntil fields

2. **Role**
   - Verify 6 roles exist
   - Check level hierarchy (1-6)
   - Verify role-permission relationships

3. **Permission**
   - Verify all resource-action-scope combinations exist
   - Check permission assignments to roles

4. **Station**
   - Verify HQ station exists
   - Check countryCode is "SLE"

5. **AuditLog**
   - Verify login attempts are logged
   - Check success/failure status
   - Verify details are captured

## Common Issues and Solutions

### Issue: "NEXTAUTH_SECRET environment variable is not set"
**Solution:** Generate and add NEXTAUTH_SECRET to .env:
```bash
openssl rand -base64 32
```

### Issue: "ENCRYPTION_KEY must be 64 hex characters"
**Solution:** Generate correct format:
```bash
openssl rand -hex 32
```

### Issue: "Can't reach database server"
**Solution:**
- Ensure PostgreSQL is running
- Verify DATABASE_URL in .env
- Check PostgreSQL credentials

### Issue: "Module not found" errors
**Solution:** Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Prisma client not generated
**Solution:**
```bash
npm run db:generate
```

### Issue: Account permanently locked
**Solution:** Use Prisma Studio to reset:
1. Open Officer table
2. Find the locked officer
3. Set `lockedUntil` to null
4. Set `failedAttempts` to 0

## Next Steps

After successful testing of Phase 2:

1. **Security Hardening:**
   - Change default SuperAdmin PIN
   - Review and secure environment variables
   - Enable HTTPS for production

2. **Move to Phase 3:** Offline-First Architecture
   - Service Workers
   - IndexedDB
   - Sync Queue

3. **Production Deployment:**
   - Set up production database
   - Configure environment for production
   - Set up monitoring and logging

## Support

For issues or questions:
- Check `docs/SERVICE_REPOSITORY_ARCHITECTURE.md`
- Review `docs/IMPLEMENTATION_PLAN.md`
- Inspect code comments in source files

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file to version control
- Change default SuperAdmin PIN after first login
- Use strong passwords for database
- Rotate secrets regularly (every 90 days)
- Enable HTTPS in production
- Monitor audit logs regularly

---

**Phase 2 Complete!** ✅

The Authentication & RBAC System is now fully implemented and tested. Proceed to Phase 3: Offline-First Architecture.
