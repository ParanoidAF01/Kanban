const { createClient } = require('@supabase/supabase-js');

// Supabase client configuration for production deployment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with service role key for backend operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test Supabase connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('boards')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "table not found" which is ok
      throw error;
    }
    
    console.log('✅ Supabase connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to Supabase:', error.message);
    return false;
  }
};

module.exports = {
  supabase,
  testConnection,
  useSupabase: true
};
