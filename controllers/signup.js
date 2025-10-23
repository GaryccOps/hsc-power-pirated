import { supabase } from '../clients/supabaseClient.js';
import ErrorResponse from '../utils/errorResponse.js';

// Signup controller
export const signup = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  // Basic validation
  if (!email || !password) {
    return ErrorResponse.badRequest('Email and password are required').send(res);
  }
  
  try {
    // Create user with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (error) {
      return ErrorResponse.badRequest('Signup failed', error.message).send(res);
    }

    // Respond with success message
    res.status(201).json({
      message: 'Signup successful! Please check your email to verify your account.',
      user: data.user,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return ErrorResponse.fromException(err, 500).send(res);
  }
};
