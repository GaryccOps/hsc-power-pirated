const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware to verify JWT token
const verifyJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header is missing' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token from "Bearer <token>"

  try {
    // Verify the token using Supabase
    const { data: user, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token', error: error?.message });
    }

    // Attach the user to the request object for further use
    req.user = user;

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    console.error('Error verifying token:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = verifyJWT;