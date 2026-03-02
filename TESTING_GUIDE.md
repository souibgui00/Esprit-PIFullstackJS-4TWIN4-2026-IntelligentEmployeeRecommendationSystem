# How to Test the Backend API (Auth & RBAC)

This project implements JWT authentication with Role-Based Access Control (RBAC). Follow these steps to verify the implementation.

## 1. Registration (`/auth/register`)
You can register a new user. The system will automatically hash the password and return a JWT token.

**PowerShell:**
```powershell
$body = @{
    name = "HR Manager"
    email = "hr@example.com"
    password = "password123"
    matricule = "HR001"
    telephone = "123456789"
    date_embauche = "2024-01-01T00:00:00.000Z"
    department_id = "507f1f77bcf86cd799439011"
    role = "HR"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/auth/register" -Method Post -Body $body -ContentType "application/json"
```

## 2. Login (`/auth/login`)
Login to get **both** an `access_token` and a `refresh_token`.

**PowerShell:**
```powershell
$login = @{ email = "hr@example.com"; password = "password123" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Body $login -ContentType "application/json"
$at = $response.access_token
$rt = $response.refresh_token
Write-Host "Access Token: $at"
Write-Host "Refresh Token: $rt"
```

## 3. Refreshing Session (`/auth/refresh`)
Access tokens expire in **15 minutes**. Use the `refresh_token` to get a new one.

**PowerShell:**
```powershell
$body = @{ refreshToken = "PASTE_YOUR_REFRESH_TOKEN_HERE" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3001/auth/refresh" -Method Post -Body $body -ContentType "application/json"
$newAt = $response.access_token
Write-Host "New Access Token: $newAt"
```

## 4. Logout (`/auth/logout`)
Invalidates the session in MongoDB.

**PowerShell:**
```powershell
$body = @{ refreshToken = "PASTE_YOUR_REFRESH_TOKEN_HERE" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/auth/logout" -Method Post -Body $body -ContentType "application/json"
```

## 5. Testing Role-Based Access Control (RBAC)

The routes are protected as follows:
- `GET /users`: HR or MANAGER only.
- `DELETE /users/:id`: HR only.
- `GET /users/:id`: Any authenticated user.

### 🔴 Scenario A: No Token (Unauthorized)
Try to access users without a token. You should get a **401 Unauthorized**.
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/users" -Method Get
```

### 🟠 Scenario B: Manager Access (Forbidden for Delete)
1. Register/Login as a user with `role: "MANAGER"`.
2. Try to Delete a user. You should get a **403 Forbidden**.
```powershell
$headers = @{ Authorization = "Bearer $MANAGER_AT" }
Invoke-RestMethod -Uri "http://localhost:3001/users/USER_ID" -Method Delete -Headers $headers
```

### 🟢 Scenario C: HR Access (Success)
1. Login as a user with `role: "HR"`.
2. Try to Delete a user. It should succeed (**200 OK**).
```powershell
$headers = @{ Authorization = "Bearer $HR_AT" }
Invoke-RestMethod -Uri "http://localhost:3001/users/USER_ID" -Method Delete -Headers $headers
```

## 4. Quick Verification Script
I've included a comprehensive test script in the root: `test_auth.ps1`. You can run it to see all scenarios in action:
```powershell
powershell -File test_auth.ps1
```

---
*Note: Ensure the backend is running (`npm run start:dev`) before testing.*
