# RBAC Testing Guide - Postman

## Prerequisites

1. **MongoDB running** - Ensure MongoDB is accessible at `mongodb://localhost:27017/companyDB`
2. **NestJS backend running** - Start with `npm run start:dev` on port 3001
3. **Postman installed** - [Download Postman](https://www.postman.com/downloads/)
4. **Environment variables set** - `.env` file in backend root with:
   ```
   MONGODB_URI=mongodb://localhost:27017/companyDB
   JWT_SECRET=super-secret-key-123
   ```

## Step 1: Start MongoDB

**Option 1: Docker**
```bash
docker run --name mongo -p 27017:27017 -d mongo:6
```

**Option 2: Local MongoDB**
Ensure `mongod` is running.

## Step 2: Start the Backend

```bash
cd backend
npm install
npm run start:dev
```

You should see: `[Nest] X  02/24/2026, Y:YY:YY AM     LOG [NestFactory] Nest application successfully started`

## Step 3: Postman Collection Setup

### Create a new Collection
1. Open Postman
2. Click **+ New** → **Collection**
3. Name it `RBAC Testing`
4. Click **Create**

### Add Environment Variables
1. Click the **gear icon** (Environment) in top-right
2. Click **Create New Environment**
3. Name it `RBAC Local`
4. Add these variables:
   - `base_url` = `http://localhost:3001`
   - `admin_token` = (will be filled after login)
   - `hr_token` = (will be filled after login)
   - `manager_token` = (will be filled after login)
   - `employee_token` = (will be filled after login)
5. Click **Save**
6. Select this environment in the top-right dropdown

## Step 4: Create Test Users

Create 4 POST requests under your collection. For each, use:
- **Method:** POST
- **URL:** `{{base_url}}/users`
- **Header:** `Content-Type: application/json`
- **Body:** (raw JSON)

### Request 4.1: Create ADMIN User
```json
{
  "name": "Admin User",
  "matricule": "ADM001",
  "telephone": "1111111111",
  "email": "admin@test.com",
  "password": "Password123",
  "date_embauche": "2020-01-01T00:00:00.000Z",
  "department_id": "000000000000000000000001",
  "role": "ADMIN"
}
```

### Request 4.2: Create HR User
```json
{
  "name": "HR User",
  "matricule": "HR001",
  "telephone": "2222222222",
  "email": "hr@test.com",
  "password": "Password123",
  "date_embauche": "2020-06-01T00:00:00.000Z",
  "department_id": "000000000000000000000002",
  "role": "HR"
}
```

### Request 4.3: Create MANAGER User
```json
{
  "name": "Manager User",
  "matricule": "MGR001",
  "telephone": "3333333333",
  "email": "manager@test.com",
  "password": "Password123",
  "date_embauche": "2021-01-01T00:00:00.000Z",
  "department_id": "000000000000000000000003",
  "role": "MANAGER"
}
```

### Request 4.4: Create EMPLOYEE User
```json
{
  "name": "Employee User",
  "matricule": "EMP001",
  "telephone": "4444444444",
  "email": "employee@test.com",
  "password": "Password123",
  "date_embauche": "2022-01-01T00:00:00.000Z",
  "department_id": "000000000000000000000004",
  "role": "EMPLOYEE"
}
```

Send all 4 requests. Expected response: 201 Created with user object.

## Step 5: Login and Get Tokens

Create 4 POST requests for login. For each:
- **Method:** POST
- **URL:** `{{base_url}}/auth/login`
- **Header:** `Content-Type: application/json`
- **Body:** (raw JSON)

### Request 5.1: Login as ADMIN
**Body:**
```json
{
  "email": "admin@test.com",
  "password": "Password123"
}
```

**Tests tab:** Add this to extract token:
```javascript
if (pm.response.code === 200) {
  pm.environment.set("admin_token", pm.response.json().access_token);
}
```

### Request 5.2: Login as HR
**Body:**
```json
{
  "email": "hr@test.com",
  "password": "Password123"
}
```

**Tests tab:**
```javascript
if (pm.response.code === 200) {
  pm.environment.set("hr_token", pm.response.json().access_token);
}
```

### Request 5.3: Login as MANAGER
**Body:**
```json
{
  "email": "manager@test.com",
  "password": "Password123"
}
```

**Tests tab:**
```javascript
if (pm.response.code === 200) {
  pm.environment.set("manager_token", pm.response.json().access_token);
}
```

### Request 5.4: Login as EMPLOYEE
**Body:**
```json
{
  "email": "employee@test.com",
  "password": "Password123"
}
```

**Tests tab:**
```javascript
if (pm.response.code === 200) {
  pm.environment.set("employee_token", pm.response.json().access_token);
}
```

Send all 4 login requests. You should see:
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "ADMIN|HR|MANAGER|EMPLOYEE"
  }
}
```

## Step 6: Test Endpoints by Role

### Test 6.1: POST /users (Create User) - ADMIN & HR Only

#### Should Work ✅
- **ADMIN with token**
  - Method: POST
  - URL: `{{base_url}}/users`
  - Header: `Authorization: Bearer {{admin_token}}`
  - Body: User JSON (see below)
  - Expected: 201 Created

```json
{
  "name": "New User from ADMIN",
  "matricule": "NEW001",
  "telephone": "5555555555",
  "email": "newadmin@test.com",
  "password": "Password123",
  "date_embauche": "2024-01-01T00:00:00.000Z",
  "department_id": "000000000000000000000005",
  "role": "EMPLOYEE"
}
```

- **HR with token**
  - Same request but use `{{hr_token}}`
  - Expected: 201 Created

#### Should Fail ❌
- **MANAGER with token**
  - Same endpoint, use `{{manager_token}}`
  - Expected: 403 Forbidden
  - Response: `"Access denied. Required roles: ADMIN, HR"`

- **EMPLOYEE with token**
  - Same endpoint, use `{{employee_token}}`
  - Expected: 403 Forbidden

- **No token**
  - Same endpoint, no Authorization header
  - Expected: 401 Unauthorized

---

### Test 6.2: GET /users (List Users) - ADMIN, HR & MANAGER

#### Should Work ✅
- **ADMIN with token**
  - Method: GET
  - URL: `{{base_url}}/users`
  - Header: `Authorization: Bearer {{admin_token}}`
  - Expected: 200 OK with array of users

- **HR with token**
  - Same request with `{{hr_token}}`
  - Expected: 200 OK

- **MANAGER with token**
  - Same request with `{{manager_token}}`
  - Expected: 200 OK

#### Should Fail ❌
- **EMPLOYEE with token**
  - Same endpoint with `{{employee_token}}`
  - Expected: 403 Forbidden

- **No token**
  - No Authorization header
  - Expected: 401 Unauthorized

---

### Test 6.3: GET /users/:id (Retrieve User) - All Authenticated

First, get a user ID from the GET /users response (copy any `_id` value).

#### Should Work ✅ (All roles)
- **ADMIN with token**
  - Method: GET
  - URL: `{{base_url}}/users/{user_id}`
  - Header: `Authorization: Bearer {{admin_token}}`
  - Expected: 200 OK

- **HR with token**
  - Same with `{{hr_token}}`
  - Expected: 200 OK

- **MANAGER with token**
  - Same with `{{manager_token}}`
  - Expected: 200 OK

- **EMPLOYEE with token**
  - Same with `{{employee_token}}`
  - Expected: 200 OK

#### Should Fail ❌
- **No token**
  - No Authorization header
  - Expected: 401 Unauthorized

---

### Test 6.4: PUT /users/:id (Update User) - ADMIN, HR & MANAGER

#### Should Work ✅
- **ADMIN with token**
  - Method: PUT
  - URL: `{{base_url}}/users/{user_id}`
  - Header: `Authorization: Bearer {{admin_token}}`
  - Body: 
    ```json
    {
      "name": "Updated by Admin"
    }
    ```
  - Expected: 200 OK

- **HR with token**
  - Same request with `{{hr_token}}`
  - Expected: 200 OK

- **MANAGER with token**
  - Same with `{{manager_token}}`
  - Expected: 200 OK

#### Should Fail ❌
- **EMPLOYEE with token**
  - Same endpoint with `{{employee_token}}`
  - Expected: 403 Forbidden
  - Response: `"Access denied. Required roles: ADMIN, HR, MANAGER"`

---

### Test 6.5: DELETE /users/:id (Delete User) - ADMIN & HR Only

#### Should Work ✅
- **ADMIN with token**
  - Method: DELETE
  - URL: `{{base_url}}/users/{user_id_to_delete}`
  - Header: `Authorization: Bearer {{admin_token}}`
  - Expected: 200 OK or 204 No Content

- **HR with token**
  - Same with `{{hr_token}}`
  - Expected: 200 OK or 204 No Content

#### Should Fail ❌
- **MANAGER with token**
  - Same endpoint with `{{manager_token}}`
  - Expected: 403 Forbidden

- **EMPLOYEE with token**
  - Same with `{{employee_token}}`
  - Expected: 403 Forbidden

---

### Test 6.6: POST /auth/login (Login) - Public (No Auth Required)

#### Should Work ✅
- **Method:** POST
- **URL:** `{{base_url}}/auth/login`
- **Body:**
  ```json
  {
    "email": "admin@test.com",
    "password": "Password123"
  }
  ```
- **Expected:** 200 OK with token

#### Should Fail ❌
- **Wrong password**
  - Email: `admin@test.com`
  - Password: `WrongPassword`
  - Expected: 401 Unauthorized
  - Response: `"Invalid credentials"`

- **Non-existent email**
  - Email: `notexist@test.com`
  - Password: `Password123`
  - Expected: 401 Unauthorized

---

## Quick Reference Table

| Endpoint | Method | ADMIN | HR | MANAGER | EMPLOYEE | No Auth |
|----------|--------|-------|----|---------|-----------| --------|
| `/users` | POST | ✅ 201 | ✅ 201 | ❌ 403 | ❌ 403 | ❌ 401 |
| `/users` | GET | ✅ 200 | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 401 |
| `/users/:id` | GET | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ❌ 401 |
| `/users/:id` | PUT | ✅ 200 | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 401 |
| `/users/:id` | DELETE | ✅ 200 | ✅ 200 | ❌ 403 | ❌ 403 | ❌ 401 |
| `/auth/login` | POST | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 | ✅ 200 |

## Troubleshooting

### 401 Unauthorized
- **Cause:** Missing or expired token
- **Fix:** Ensure Authorization header format: `Bearer {token}` (with space between Bearer and token)

### 403 Forbidden with "User role not found"
- **Cause:** User object missing role in JWT
- **Fix:** Re-login to get a new token with role included

### 404 Not Found
- **Cause:** Invalid user ID in URL
- **Fix:** Get valid user IDs from `GET /users` response

### 400 Bad Request
- **Cause:** Missing or invalid required fields
- **Fix:** Check request body structure matches schema

### Cannot connect to MongoDB
- **Cause:** MongoDB not running
- **Fix:** Start MongoDB with Docker or local installation

## Postman Collection Export

You can also export this as a JSON file to share. In Postman:
1. Click the three dots next to collection name → **Export**
2. Select Format: **Collection v2.1**
3. Click **Export** and save the file
