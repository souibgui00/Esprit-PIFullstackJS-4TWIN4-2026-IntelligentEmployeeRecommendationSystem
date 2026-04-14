# 📧 Email Notification System - Setup & Testing Guide

## **Overview**

When an admin or HR creates a new user, the system automatically:
1. ✅ Generates a secure password
2. ✅ Creates a session in the database
3. ✅ **Sends login credentials via email to the new user**
4. ✅ The new user can login with the received credentials

---

## **Step 1: Install Nodemailer**

Before using the email feature, install nodemailer:

```powershell
npm install nodemailer
npm install --save-dev @types/nodemailer
```

---

## **Step 2: Configure Email in .env**

### **Option A: Using Gmail (Recommended for Testing)**

1. **Enable 2-Factor Authentication on your Gmail account**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Google will generate a 16-character password

3. **Update .env:**
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_FROM=noreply@yourcompany.com
```

---

### **Option B: Using Other Email Providers**

#### **Office 365 / Outlook:**
```bash
EMAIL_USER=your-email@company.com
EMAIL_PASSWORD=your-password
EMAIL_SMTP_HOST=smtp-mail.outlook.com
EMAIL_SMTP_PORT=587
EMAIL_FROM=your-email@company.com
```

#### **SendGrid API:**
```bash
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-sendgrid-api-key
EMAIL_SMTP_HOST=smtp.sendgrid.net
EMAIL_SMTP_PORT=587
EMAIL_FROM=noreply@yourcompany.com
```

#### **AWS SES:**
```bash
EMAIL_USER=your-aws-ses-username
EMAIL_PASSWORD=your-aws-ses-password
EMAIL_SMTP_HOST=email-smtp.region.amazonaws.com
EMAIL_SMTP_PORT=587
EMAIL_FROM=verified-email@yourcompany.com
```

---

## **Step 3: Test Email Setup**

After configuring .env, restart the server:

```powershell
npm run start:dev
```

You should see:
```
[Nest] ... EmailService initialized with SMTP configuration
```

---

## **Step 4: Test Creating a New User with Email Notification**

### **Test: Admin Creates a New User**

**URL:** `POST http://localhost:3001/users`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@gmail.com",
  "password": "placeholder",
  "matricule": "EMP-2026-0001",
  "telephone": "+1-555-0123",
  "date_embauche": "2026-02-24",
  "department_id": "507f1f77bcf86cd799439011",
  "role": "EMPLOYEE",
  "status": "active"
}
```

**PowerShell Test:**
```powershell
$headers = @{ Authorization = "Bearer YOUR_ADMIN_TOKEN" }

$body = @{
    name = "John Doe"
    email = "john.doe@gmail.com"
    password = "placeholder"
    matricule = "EMP-2026-0001"
    telephone = "+1-555-0123"
    date_embauche = "2026-02-24"
    department_id = "507f1f77bcf86cd799439011"
    role = "EMPLOYEE"
    status = "active"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/users" `
  -Method Post -Body $body -Headers $headers -ContentType "application/json"

Write-Host "✅ User created!"
Write-Host "Generated Password: $($response.generatedPassword)"
Write-Host $response | ConvertTo-Json -Depth 3
```

**What Happens:**
1. ✅ New user saved to MongoDB
2. ✅ Random password generated & hashed
3. ✅ Email sent to `john.doe@gmail.com` with:
   - Email: `john.doe@gmail.com`
   - Password: (the generated one)
   - Matricule: `EMP-2026-0001`
   - Link to login page

---

## **Email Template Preview**

The new user receives an HTML email with:

```
╔═════════════════════════════════════════╗
║ 🎉 Welcome Aboard!                      ║
║ Your account has been created           ║
╚═════════════════════════════════════════╝

Hello John Doe,

Your HR platform account has been successfully created. 
Use the credentials below to log in and get started.

📧 Email:     john.doe@gmail.com
🔐 Password:  xAb7kQ2nM9pL
📇 Matricule: EMP-2026-0001

[Log In Now] →

⚠️ SECURITY NOTE:
Please keep your password confidential. Never share it with anyone. 
You can change your password after logging in from your account settings.

What's Next?
- Log in with the credentials above
- Update your profile information
- Change your password (strongly recommended)
- Start exploring the platform
```

---

## **Step 5: New User Login Flow**

**1. New user receives email with credentials**
```
From: noreply@hrplatform.com
To: john.doe@gmail.com

Subject: 🎉 Welcome to Our HR Platform - Your Login Credentials
```

**2. User logs in with received credentials**
```powershell
$body = @{
    email = "john.doe@gmail.com"
    password = "xAb7kQ2nM9pL"
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" `
  -Method Post -Body $body -ContentType "application/json"

Write-Host "✅ Login successful!"
Write-Host $login | ConvertTo-Json -Depth 3
```

**3. User gets tokens and can access the system**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "507f...",
    "name": "John Doe",
    "email": "john.doe@gmail.com",
    "role": "EMPLOYEE"
  }
}
```

**4. User can change password in account settings** (future feature)

---

## **☑️ Email Sending Scenarios**

| Scenario | Trigger | Email Sent | Contains |
|----------|---------|-----------|----------|
| **New User Created** | Admin/HR adds employee | ✅ Yes | Email, Password, Matricule, Login Link |
| **Password Reset** | User clicks "Forgot Password" | ✅ Yes (when implemented) | Reset Link (expires in 1 hour) |
| **Email Disabled** | No email config in .env | ❌ No | Password logged to console instead |
| **Email Failed** | SMTP connection error | ❌ No | Error logged, user still created |

---

## **🔒 Security Notes**

| Point | Implementation |
|-------|---|
| **Password Storage** | Hashed with bcrypt, never in plain text |
| **Email Transmission** | Encrypted with TLS/SSL via SMTP |
| **Credentials Delivery** | One-time via email, user must change after login |
| **Email Failure** | Non-critical - user still created, can request password reset |
| **No Email Config** | System logs password to console for manual communication |

---

## **⚙️ Configuration in Code**

### **When Email is Disabled:**
```typescript
// In EmailService
if (!emailUser || !emailPassword) {
  this.logger.warn('Email credentials not configured. Email service disabled.');
  return;
}
```

**Behavior:** User is created, password is logged to server console
```
Generated password for john.doe@gmail.com: xAb7kQ2nM9pL
```

### **When Email Fails:**
```typescript
// In EmailService.sendNewUserCredentials()
} catch (error) {
  this.logger.error(`Failed to send email to ${userEmail}: ${error.message}`);
  // Don't throw - email is non-critical
  return false;
}
```

**Behavior:** User is still created, error is logged, admin can resend email manually

---

## **Testing Checklist**

- [ ] Install nodemailer: `npm install nodemailer @types/nodemailer`
- [ ] Configure .env with email credentials
- [ ] Restart server: `npm run start:dev`
- [ ] Create test user (POST /users)
- [ ] Check test email inbox
- [ ] Verify email contains correct credentials
- [ ] Login with new credentials
- [ ] Verify access_token and refresh_token received

---

## **Troubleshooting**

### **Email Not Received**

**Check 1: Email Config**
```powershell
# Verify .env contains:
Get-Content .env | Select-String "EMAIL_"
```

**Check 2: Server Logs**
```
# Should see: EmailService initialized with SMTP configuration
# If missing, restart server: npm run start:dev
```

**Check 3: Gmail Settings (if using Gmail)**
```
1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use 16-character password (without spaces) in .env
4. Verify EMAIL_USER is the same Google account
```

**Check 4: Check Console Output**
```
# Failed emails show:
[Nest] ... EmailService - Failed to send email to john@gmail.com: SMTP error message

# Look for this for hints about what went wrong
```

### **SMTP Connection Errors**

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | SMTP server unreachable | Check host/port, verify firewall |
| `Invalid credentials` | Wrong email/password | Verify .env values, check caps |
| `TLS/SSL error` | Encryption issue | Try different SMTP_PORT (25, 465, 587) |
| `Timeout` | Network issue | Check internet, verify SMTP host |

---

## **API Response Examples**

### **Success: User Created + Email Sent**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "name": "John Doe",
  "email": "john.doe@gmail.com",
  "role": "EMPLOYEE",
  "matricule": "EMP-2026-0001",
  "generatedPassword": "xAb7kQ2nM9pL",
  "status": "active"
}
```
*Server logs:*
```
Generated password for john.doe@gmail.com: xAb7kQ2nM9pL
[Nest] ... EmailService - Email sent successfully to john.doe@gmail.com
```

### **Success: User Created + Email Failed**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "name": "John Doe",
  "email": "john.doe@gmail.com",
  "generatedPassword": "xAb7kQ2nM9pL"
}
```
*Server logs:*
```
Generated password for john.doe@gmail.com: xAb7kQ2nM9pL
[Nest] ... EmailService - Failed to send email to john.doe@gmail.com: SMTP error
```

---

## **Summary**

✅ **Admin/HR creates user** → Password auto-generated
✅ **Email automatically sent** → With all login info
✅ **New user receives email** → With credentials
✅ **New user logs in** → Using received password
✅ **System is fully automated** → No manual password sharing

**Your HR system now has onboarding automation!** 🚀
