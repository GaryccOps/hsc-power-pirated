# Authentication System with JWT Middleware

This application includes a complete authentication system with signup, login, and JWT verification middleware.

## Features

- **Sign Up Page**: Create new user accounts with Supabase
- **Login Page**: Authenticate existing users
- **JWT Middleware**: Protect routes that require authentication
- **Modern UI**: Clean, responsive design for authentication forms

## Routes

### Public Routes
- `GET /` - Homepage with auth links
- `GET /auth/signup` - Sign up page
- `POST /auth/signup` - Handle signup form submission
- `GET /auth/login` - Login page
- `POST /auth/login` - Handle login form submission

### Protected Routes (require JWT token)
- `GET /users` - User dashboard (protected by JWT middleware)
- `POST /users/add_book` - Add book (protected by JWT middleware)

## JWT Middleware Usage

The JWT middleware (`verifyJWT.js`) is already integrated into the `/users` routes. To protect additional routes:

```javascript
const verifyJWT = require('../middlewares/verifyJWT');

// Protect all routes in this router
router.use(verifyJWT);

// Or protect specific routes
router.get('/protected-route', verifyJWT, (req, res) => {
  // req.user contains the authenticated user data
  res.json({ user: req.user });
});
```

## Frontend Integration

The frontend JavaScript automatically:
- Handles form submissions via AJAX
- Stores JWT tokens in localStorage
- Provides user feedback with success/error messages
- Redirects users after successful authentication

## Environment Setup

Make sure you have the following environment variables set:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon key

## Testing the Authentication

1. Start the server: `npm start`
2. Visit `http://localhost:3000` to see the homepage
3. Click "Sign Up" to create a new account
4. Click "Login" to authenticate
5. After login, you'll be redirected to `/users` (protected route)

## API Usage

### Signup
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","firstName":"John","lastName":"Doe"}'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Protected Route Access
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
