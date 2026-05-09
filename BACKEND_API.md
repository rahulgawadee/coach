# Coach Platform - Backend Authentication API Documentation

## Overview
This document outlines all authentication endpoints available in the Coach Platform backend.

## Environment Variables
```
MONGODB_URI=mongodb+srv://rahulgawade360_db_user:1111111111@cluster0.36wanpf.mongodb.net/?appName=Cluster0
JWT_SECRET=your_jwt_secret_key_change_this_in_production_12345678901234567890
JWT_EXPIRATION=7d
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

## API Endpoints

### 1. User Registration
**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "Candidate",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Candidate",
    "onboardingStep": 0,
    "profileCompleted": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "User already exists with this email"
}
```

**Validation Rules:**
- Email must be valid email format
- Password must be at least 8 characters
- Passwords must match
- Role must be "Candidate" or "Coach"
- Email must be unique

---

### 2. User Login
**POST** `/api/auth/login`

Authenticate a user and get access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Candidate",
    "onboardingStep": 0,
    "profileCompleted": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Validation Rules:**
- Both email and password are required
- Credentials must match an existing user
- Password is case-sensitive

---

### 3. User Logout
**POST** `/api/auth/logout`

Logout a user and invalidate session.

**Request Body:**
```json
{}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Note:** The HTTP-only auth cookie is cleared automatically.

---

### 4. Verify/Get Current User
**GET** `/api/auth/me`

Get information about the currently authenticated user.

**Headers:**
```
Cookie: token=<JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Candidate",
    "onboardingStep": 0,
    "profileCompleted": false
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "No token provided"
}
```

---

## Authentication Flow

### Registration Flow
1. User fills signup form with email, password, role
2. Frontend calls `POST /api/auth/register`
3. Backend validates input and hashes password with bcryptjs
4. User document created in MongoDB
5. JWT token generated and returned
6. Token stored in HTTP-only cookie
7. Frontend stores user data in localStorage
8. User redirected to appropriate dashboard or onboarding

### Login Flow
1. User fills login form with email and password
2. Frontend calls `POST /api/auth/login`
3. Backend retrieves user and compares password with bcryptjs
4. JWT token generated and returned
5. Token stored in HTTP-only cookie
6. Frontend stores user data in localStorage
7. User redirected to appropriate dashboard

### Logout Flow
1. User clicks logout button
2. Frontend calls `POST /api/auth/logout`
3. Backend clears HTTP-only cookie
4. Frontend clears localStorage
5. User redirected to login page

---

## JWT Token Structure

The JWT token contains the following claims:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "Candidate",
  "iat": 1620000000,
  "exp": 1620604800
}
```

**Token Expiration:** 7 days (configurable via JWT_EXPIRATION)

---

## Security Measures

1. **Password Hashing:** All passwords are hashed using bcryptjs (10 salt rounds)
2. **HTTP-Only Cookies:** JWT tokens stored in HTTP-only cookies to prevent XSS attacks
3. **JWT Verification:** All protected endpoints verify JWT token validity
4. **HTTPS in Production:** Secure flag set on cookies when NODE_ENV=production
5. **SameSite Protection:** SameSite=lax cookie attribute prevents CSRF attacks

---

## User Schema

```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  name: String,
  role: String (Candidate/Coach, required),
  onboardingStep: Number (default: 0),
  profileCompleted: Boolean (default: false),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Error Handling

All endpoints follow this error response format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created (Registration)
- `400`: Bad Request (Validation Error)
- `401`: Unauthorized (Invalid credentials or missing token)
- `404`: Not Found
- `500`: Server Error

---

## Testing with cURL

### Register a new candidate:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "role": "Candidate",
    "name": "John Candidate"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate@example.com",
    "password": "password123"
  }'
```

### Get current user:
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: token=<YOUR_TOKEN>"
```

---

## Integration with Frontend

The frontend uses the `AuthContext` hook to manage authentication:

```javascript
const { user, login, register, logout, loading, error } = useAuth();

// Register
const result = await register(email, password, confirmPassword, role, name);

// Login
const result = await login(email, password);

// Logout
await logout();

// Check authentication status
if (useAuth().isAuthenticated) {
  // User is logged in
}

// Check user role
if (useAuth().hasRole('Candidate')) {
  // User is a candidate
}
```

---

## Notes

- All API responses include a `success` boolean field
- Timestamps are stored in MongoDB as ISO 8601 format
- Passwords are never returned in API responses
- User sessions persist across page refreshes via localStorage
- HTTP-only cookies prevent JavaScript access to auth tokens
