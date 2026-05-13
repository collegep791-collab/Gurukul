/**
 * server/supabase.js
 * 
 * Technical Component: Backend Database Client
 * Description: Initializes the Supabase client for the Node.js backend using the 
 * SUPABASE_SERVICE_ROLE_KEY. This key bypasses Row Level Security (RLS), granting
 * the backend full administrative access to the database. This ensures that frontend 
 * clients cannot access data directly; all database operations are securely brokered 
 * through our Express API endpoints.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Please add them to your .env file.');
}

// Service-role client for server-side operations (bypasses RLS)
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

export default supabase;
