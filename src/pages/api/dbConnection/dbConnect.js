// db.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mvqaptgoblyycfsjzfly.supabase.co';
const supabaseKey = '***REMOVED***';
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
