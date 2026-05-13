import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('query', { query_text: "SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'chat_messages';" });
  console.log(data || error);
}
check();
