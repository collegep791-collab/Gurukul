/**
 * src/lib/supabase.js
 * 
 * Technical Component: Frontend Realtime Client
 * Description: Initializes the Supabase client for the React frontend using the
 * VITE_SUPABASE_ANON_KEY. Because Gurukul uses a custom JWT backend for auth,
 * this client operates anonymously. It is strictly used to establish WebSocket
 * subscriptions for Supabase Realtime (chat messages, typing indicators, notifications).
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
