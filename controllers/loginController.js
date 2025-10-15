const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Render login page
exports.loginPage = (req, res) => {
  res.render('login', { title: 'Login' });
};

// Login controller
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Authenticate user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ message: 'Invalid email or password', error: error.message });
    }

    // Respond with user data and access token
    res.status(200).json({
      message: 'Login successful',
      user: data.user,
      access_token: data.session.access_token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};