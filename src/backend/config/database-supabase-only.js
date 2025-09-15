const { createClient } = require('@supabase/supabase-js');

// Supabase client configuration for production deployment
const supabaseUrl = process.env.SUPABASE_URL || 'https://kporxdjnhonybhtbvtve.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwb3J4ZGpuaG9ueWJodGJ2dHZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzYxNTA3NCwiZXhwIjoyMDczMTkxMDc0fQ.lCwIFQZh7QsfaAC5KrXDTMWnNyEaEdGCqR92PUEX5zM';

console.log('🔧 Environment check:');
console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set (length: ' + supabaseServiceKey.length + ')' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
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
