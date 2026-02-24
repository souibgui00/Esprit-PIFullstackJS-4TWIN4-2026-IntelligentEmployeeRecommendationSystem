# How to Test the Backend API

This project now has JWT authentication. Follow these steps to test the endpoints.

## 1. Create a Test User
First, create a user if you haven't already.

**Bash/Curl:**
```bash
curl -X POST http://localhost:3001/users \
-H "Content-Type: application/json" \
-d '{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "matricule": "EMP002",
  "telephone": "+21611223344",
  "date_embauche": "2024-01-01T00:00:00.000Z",
  "department_id": "65a12f9a8e12a9b123456789"
}'
```

---

## 2. Login to get a Token
Use the email and password to log in and receive an `access_token`.

**Bash/Curl:**
```bash
curl -X POST http://localhost:3001/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "jane@example.com",
  "password": "password123"
}'
```
*Copy the `access_token` from the response.*

---

## 3. Test Protected Route (GET /users)
Now, try to get the users list.

### 🔴 Scenario A: Fail Without Token
If you try to access the route without a token, you will get a **401 Unauthorized**.

**Bash/Curl:**
```bash
curl -i http://localhost:3001/users
```

### 🟢 Scenario B: Success With Token
Use the token in the `Authorization` header.

**Bash/Curl:**
*(Replace YOUR_TOKEN with the one you copied)*
```bash
curl http://localhost:3001/users \
-H "Authorization: Bearer YOUR_TOKEN"
```

---

## 4. Automation script (Node.js)
You can also run this quick node command to do it all at once:

```bash
node -e "const email='jane@example.com', pass='password123'; fetch('http://localhost:3001/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) }).then(r => r.json()).then(data => { const token = data.access_token; console.log('Token Received:', token.substring(0, 20) + '...'); return fetch('http://localhost:3001/users', { headers: { 'Authorization': 'Bearer ' + token } }); }).then(r => r.json()).then(users => console.log('Users found:', users.length))"
```
