import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// Singleton Supabase client instance
let supabaseInstance = null;

/**
 * Get or create the singleton Supabase client instance
 * @returns {Object} Supabase client instance
 */
const getSupabaseClient = () => {
  if (!supabaseInstance) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_KEY.');
    }
    
    supabaseInstance = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_KEY
    );
  }
  
  return supabaseInstance;
};

export { getSupabaseClient };
export const supabase = getSupabaseClient(); // Export the instance directly for convenience
