import { supabase } from '../clients/supabaseClient.js';
import ErrorResponse from '../utils/errorResponse.js';

// Login controller
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Authenticate user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return ErrorResponse.unauthorized('Invalid email or password', error.message).send(res);
    }

    // Respond with user data and access token
    res.status(200).json({
      message: 'Login successful',
      // user: data.user,
      access_token: data.session.access_token,
    });
  } catch (err) {
    console.error(err);
    return ErrorResponse.fromException(err, 500).send(res);
  }
};