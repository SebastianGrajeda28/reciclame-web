# Access Control Implementation

## Overview
This document describes the access control rules implemented to block unauthorized access based on user roles, account status, and registration method.

## Changes Made

### 1. Database Schema Update
**File:** `src/db/schema.ts`

Added `registrationMethod` field to the `users` table:
```typescript
registrationMethod: text("registration_method").notNull().default("web")
```

This field tracks how users were created:
- `google`: User registered via Google OAuth
- `sysadmin`: User created by system administrator
- `web`: User registered via web form (default)

### 2. Database Migration
**File:** `migrations/add_registration_method.sql`

SQL migration to add the new field and update existing records:
- Adds `registration_method` column to `users` table
- Creates index on `registration_method` for performance
- Updates existing admin accounts to have `sysadmin` registration method

### 3. Authentication Middleware Update
**File:** `src/middleware/auth.ts`

Enhanced the `authMiddleware` to implement the following blocking rules:

#### Rule 1: Block Inactive Administrator Accounts
```typescript
if (roleNames.includes("admin") && !userData.isActive) {
  return c.json({ error: "Administrator account is inactive" }, 403);
}
```

#### Rule 2: Block User Accounts
```typescript
if (roleNames.includes("user") && !roleNames.includes("admin") && !roleNames.includes("sysadmin")) {
  return c.json({ error: "User accounts are not allowed access" }, 403);
}
```

#### Rule 3: Block Non-Google/Sysadmin Registrations
```typescript
const allowedRegistrationMethods = ["google", "sysadmin"];
if (!allowedRegistrationMethods.includes(userData.registrationMethod || "")) {
  return c.json({ error: "Account must be created through Google registration or sysadmin" }, 403);
}
```

### 4. User Provision Endpoint Update
**File:** `src/modules/users/routes.ts`

Updated the `/api/users/provision` endpoint to:
- Accept `registrationMethod` parameter in request body
- Validate the registration method (must be `google`, `sysadmin`, or `web`)
- Store the registration method when creating users
- Default to `sysadmin` if not specified

## Access Control Rules Summary

| Rule | Condition | Action | HTTP Status |
|------|-----------|--------|-------------|
| Inactive Admin | User has `admin` role AND `isActive = false` | Block access | 403 |
| User Role | User has `user` role (not admin/sysadmin) | Block access | 403 |
| Invalid Registration | User not created via Google or sysadmin | Block access | 403 |

## Allowed Roles and Registration Methods

### Roles
- `admin`: System administrator
- `sysadmin`: System administrator (alternative name)
- `user`: Regular user (blocked from access)

### Registration Methods
- `google`: Created via Google OAuth (allowed)
- `sysadmin`: Created by system administrator (allowed)
- `web`: Created via web form (blocked)

## API Usage

### Creating Users with Registration Method

**Request:**
```bash
POST /api/users/provision
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "roleName": "admin",
  "registrationMethod": "sysadmin"
}
```

**Response (Success):**
```json
{
  "message": "Usuario creado",
  "userId": "uuid"
}
```

**Response (Invalid Registration Method):**
```json
{
  "error": "registrationMethod debe ser 'google', 'sysadmin' o 'web'"
}
```

## Testing the Implementation

### Test Case 1: Inactive Admin Account
1. Create an admin user with `isActive = false`
2. Attempt to authenticate with this user
3. Expected: 403 Forbidden with error "Administrator account is inactive"

### Test Case 2: User Role Account
1. Create a user with `user` role
2. Attempt to authenticate with this user
3. Expected: 403 Forbidden with error "User accounts are not allowed access"

### Test Case 3: Web Registration Method
1. Create a user with `registrationMethod = "web"`
2. Attempt to authenticate with this user
3. Expected: 403 Forbidden with error "Account must be created through Google registration or sysadmin"

### Test Case 4: Valid Google Registration
1. Create a user with `registrationMethod = "google"` and `admin` role
2. Attempt to authenticate with this user
3. Expected: Authentication successful

### Test Case 5: Valid Sysadmin Registration
1. Create a user with `registrationMethod = "sysadmin"` and `admin` role
2. Attempt to authenticate with this user
3. Expected: Authentication successful

## Migration Instructions

To apply the database changes:

1. Run the migration script:
```bash
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f backend/migrations/add_registration_method.sql
```

2. Or use Supabase Studio SQL Editor at `http://127.0.0.1:54323`

3. Verify the column was added:
```sql
\d users
```

## Notes

- The blocking rules are applied in the authentication middleware, which means they affect ALL endpoints under `/api/*`
- The `isActive` field is already part of the users table and supports soft deletion
- The `registrationMethod` field defaults to `"web"` for backward compatibility
- Existing admin accounts are automatically updated to have `"sysadmin"` registration method via the migration
- The lint errors shown in the IDE are related to missing type definitions and do not affect runtime functionality
