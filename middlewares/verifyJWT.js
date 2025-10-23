import { supabase } from '../clients/supabaseClient.js';
import ErrorResponse from '../utils/errorResponse.js';

// Middleware to verify JWT token
const verifyJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return ErrorResponse.unauthorized('Authorization header is missing').send(res);
  }

  const token = authHeader.split(' ')[1]; // Extract the token from "Bearer <token>"

  try {
    // Verify the token using Supabase
    const { data: user, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return ErrorResponse.unauthorized('Invalid or expired token', error?.message).send(res);
    }

    // Attach the user to the request object for further use
    req.user = user;

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    console.error('Error verifying token:', err.message);
    return ErrorResponse.fromException(err, 500).send(res);
  }
};

export default verifyJWT;