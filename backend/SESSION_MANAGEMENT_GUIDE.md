# 🔐 Session Management Testing Guide

## **Overview**

Your authentication now includes:
- ✅ Access Tokens (15 minutes)
- ✅ Refresh Tokens (7 days)
- ✅ Session Persistence (MongoDB)
- ✅ Token Refresh Mechanism
- ✅ Logout & Session Revocation

---

## **New Endpoints**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | Login & create session |
| `/auth/refresh` | POST | Get new access token |
| `/auth/logout` | POST | Revoke session |
| `/auth/logout-all` | POST | Logout from all devices |

---

## **1. Login (GET SESSION)**

**URL:** `POST http://localhost:3001/auth/login`

**Request Body:**
```json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

**PowerShell:**
```powershell
$body = @{
    email = "admin@test.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" `
  -Method Post -Body $body -ContentType "application/json"

$ADMIN_ACCESS_TOKEN = $response.access_token
$ADMIN_REFRESH_TOKEN = $response.refresh_token

Write-Host "✅ Login Successful!"
Write-Host "Access Token: $ADMIN_ACCESS_TOKEN"
Write-Host "Refresh Token: $ADMIN_REFRESH_TOKEN"
Write-Host "Expires In: $($response.expiresIn) seconds"
Write-Host $response | ConvertTo-Json -Depth 3
```

**Expected Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Admin User",
    "email": "admin@test.com",
    "role": "ADMIN",
    "matricule": "ADM001"
  }
}
```

---

## **2. Refresh Token (GET NEW ACCESS TOKEN)**

**URL:** `POST http://localhost:3001/auth/refresh`

**When to Use:** After 15 minutes, when access token expires

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**PowerShell:**
```powershell
# Simulate access token expiration (15 minutes later)
# Use the refresh token to get a new access token

$body = @{
    refreshToken = $ADMIN_REFRESH_TOKEN
} | ConvertTo-Json

$newTokenResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/refresh" `
  -Method Post -Body $body -ContentType "application/json"

$NEW_ACCESS_TOKEN = $newTokenResponse.access_token

Write-Host "✅ Token Refreshed!"
Write-Host "New Access Token: $NEW_ACCESS_TOKEN"
Write-Host $newTokenResponse | ConvertTo-Json -Depth 3
```

**Expected Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**What Happens:**
- Old refresh token still works
- New access token generated
- Session remains active in DB
- User continues working without re-login

---

## **3. Logout (REVOKE SESSION)**

**URL:** `POST http://localhost:3001/auth/logout`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**PowerShell:**
```powershell
$body = @{
    refreshToken = $ADMIN_REFRESH_TOKEN
} | ConvertTo-Json

$logoutResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/logout" `
  -Method Post -Body $body -ContentType "application/json"

Write-Host "✅ Logged Out!"
Write-Host $logoutResponse | ConvertTo-Json
```

**Expected Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

**What Happens:**
- Session marked as `isRevoked: true` in DB
- Refresh token can NO LONGER be used
- User must login again to get new tokens

---

## **4. Logout All Devices**

**URL:** `POST http://localhost:3001/auth/logout-all`

**Headers Required:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**PowerShell:**
```powershell
$headers = @{ Authorization = "Bearer $ADMIN_ACCESS_TOKEN" }

$logoutAllResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/logout-all" `
  -Method Post -Headers $headers -ContentType "application/json"

Write-Host "✅ Logged Out From All Devices!"
Write-Host $logoutAllResponse | ConvertTo-Json
```

**Expected Response:** `200 OK`
```json
{
  "message": "Logged out from all devices"
}
```

**What Happens:**
- ALL sessions for this user are revoked
- Tokens on all devices (phone, laptop, tablet) become invalid
- Must login again on all devices

---

## **📊 Complete Test Scenario**

### **Scenario: Working Session**

**Step 1: User logs in**
```powershell
$body = @{
    email = "admin@test.com"
    password = "admin123"
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" `
  -Method Post -Body $body -ContentType "application/json"

$ACCESS_TOKEN = $login.access_token
$REFRESH_TOKEN = $login.refresh_token

Write-Host "Step 1 ✅: User logged in at 9:00 AM"
Write-Host "Access Token expires at: 9:15 AM"
Write-Host "Refresh Token expires at: March 3"
```

**Step 2: Use the app (access token valid)**
```powershell
$headers = @{ Authorization = "Bearer $ACCESS_TOKEN" }

$users = Invoke-RestMethod -Uri "http://localhost:3001/users" `
  -Method Get -Headers $headers

Write-Host "Step 2 ✅: Fetched users at 9:10 AM (access token still valid)"
```

**Step 3: Token expires, refresh it**
```powershell
# After 15 minutes (9:15 AM), access token expires
# Call refresh endpoint

$body = @{ refreshToken = $REFRESH_TOKEN } | ConvertTo-Json

$refresh = Invoke-RestMethod -Uri "http://localhost:3001/auth/refresh" `
  -Method Post -Body $body -ContentType "application/json"

$NEW_ACCESS_TOKEN = $refresh.access_token

Write-Host "Step 3 ✅: Refreshed token at 9:15 AM"
Write-Host "New access token expires at: 9:30 AM"
```

**Step 4: Continue using app with new token**
```powershell
$headers = @{ Authorization = "Bearer $NEW_ACCESS_TOKEN" }

$skills = Invoke-RestMethod -Uri "http://localhost:3001/skills" `
  -Method Get -Headers $headers

Write-Host "Step 4 ✅: Fetched skills at 9:20 AM (new token valid)"
```

**Step 5: User logs out**
```powershell
$body = @{ refreshToken = $REFRESH_TOKEN } | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/auth/logout" `
  -Method Post -Body $body -ContentType "application/json"

Write-Host "Step 5 ✅: User logged out at 2:00 PM"
Write-Host "Session revoked in database"
Write-Host "Refresh token is now INVALID"
```

**Step 6: Try to use old tokens (will fail)**
```powershell
# Try to refresh with revoked token
$body = @{ refreshToken = $REFRESH_TOKEN } | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:3001/auth/refresh" `
      -Method Post -Body $body -ContentType "application/json"
} catch {
    Write-Host "Step 6 ❌: Can't refresh with revoked token"
    Write-Host "Error: $($_.Exception.Message)"
}
```

---

## **🧪 Error Scenarios**

### **Scenario 1: Invalid Refresh Token**
```powershell
$body = @{ refreshToken = "invalid_token_12345" } | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:3001/auth/refresh" `
      -Method Post -Body $body -ContentType "application/json"
} catch {
    Write-Host "❌ Expected Error: 401 Unauthorized"
    Write-Host $_.Exception.Message
}
```

**Expected Response:** `401 Unauthorized`
```json
{
  "message": "Invalid refresh token"
}
```

---

### **Scenario 2: Revoked Session**
```powershell
# First logout
$body = @{ refreshToken = $REFRESH_TOKEN } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/auth/logout" `
  -Method Post -Body $body -ContentType "application/json"

# Then try to use revoked token
$body = @{ refreshToken = $REFRESH_TOKEN } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:3001/auth/refresh" `
      -Method Post -Body $body -ContentType "application/json"
} catch {
    Write-Host "❌ Expected: Token revoked"
}
```

**Expected Response:** `401 Unauthorized`
```json
{
  "message": "Invalid or expired refresh token"
}
```

---

### **Scenario 3: Expired Refresh Token**
```powershell
# After 7 days, refresh token expires
# Try to use it after March 3

$body = @{ refreshToken = $REFRESH_TOKEN } | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:3001/auth/refresh" `
      -Method Post -Body $body -ContentType "application/json"
} catch {
    Write-Host "❌ Expected: Refresh token expired"
}
```

**Expected Response:** `401 Unauthorized`
```json
{
  "message": "Invalid or expired refresh token"
}
```

---

## **📱 Multi-Device Support**

**Device 1 (Laptop):**
```powershell
# Login on laptop
$login1 = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" `
  -Method Post -Body (@{ email = "admin@test.com"; password = "admin123" } | ConvertTo-Json) `
  -ContentType "application/json"

$LAPTOP_SESSION = $login1.refresh_token
Write-Host "Session 1 (Laptop): $LAPTOP_SESSION"
```

**Device 2 (Phone):**
```powershell
# Login on phone (same user, different session)
$login2 = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" `
  -Method Post -Body (@{ email = "admin@test.com"; password = "admin123" } | ConvertTo-Json) `
  -ContentType "application/json"

$PHONE_SESSION = $login2.refresh_token
Write-Host "Session 2 (Phone): $PHONE_SESSION"
```

**Device 3 (Tablet):**
```powershell
# Login on tablet (same user, another session)
$login3 = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" `
  -Method Post -Body (@{ email = "admin@test.com"; password = "admin123" } | ConvertTo-Json) `
  -ContentType "application/json"

$TABLET_SESSION = $login3.refresh_token
Write-Host "Session 3 (Tablet): $TABLET_SESSION"

# All three sessions are independent
# Logout from one device doesn't affect others
```

**Logout from laptop only:**
```powershell
$body = @{ refreshToken = $LAPTOP_SESSION } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/auth/logout" `
  -Method Post -Body $body -ContentType "application/json"

Write-Host "Laptop logged out"
Write-Host "Phone and Tablet still logged in ✅"
```

**Logout from all devices:**
```powershell
$headers = @{ Authorization = "Bearer $ACCESS_TOKEN" }
Invoke-RestMethod -Uri "http://localhost:3001/auth/logout-all" `
  -Method Post -Headers $headers -ContentType "application/json"

Write-Host "All sessions revoked!"
Write-Host "Must login again on Laptop, Phone, and Tablet"
```

---

## **🔒 Database (Sessions Collection)**

After login, check MongoDB to see stored sessions:

```javascript
// In MongoDB Compass or mongosh
db.sessions.find()

// Result:
[
  {
    "_id": ObjectId("507f1f77bcf86cd799439020"),
    "userId": ObjectId("507f1f77bcf86cd799439011"),
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": ISODate("2026-03-03T20:15:00.000Z"),
    "isRevoked": false,
    "createdAt": ISODate("2026-02-24T20:15:00.000Z"),
    "updatedAt": ISODate("2026-02-24T20:15:00.000Z")
  }
]

// After logout:
{
  ...same session...
  "isRevoked": true
}
```

---

## **📋 Summary**

| Action | Endpoint | Token | Result |
|--------|----------|-------|--------|
| Initial Login | `/auth/login` | Both | Create session |
| After 15 min | `/auth/refresh` | Refresh | New access token |
| User Logout | `/auth/logout` | Refresh | Revoke session |
| Force Logout | `/auth/logout-all` | Access | Revoke all sessions |

---

**Your system is now enterprise-grade! 🚀**
