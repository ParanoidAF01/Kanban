const { sequelize, testConnection, useSupabase } = require('./config/database');

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Migration...\n');
  
  console.log(`Database Mode: ${useSupabase ? 'Supabase (PostgreSQL)' : 'SQLite'}`);
  
  // Test database connection
  console.log('1. Testing database connection...');
  const connected = await testConnection();
  
  if (!connected) {
    console.log('❌ Database connection failed');
    process.exit(1);
  }
  
  if (useSupabase) {
    console.log('2. Testing Supabase-specific features...');
    
    try {
      // Test JSONB functionality
      const result = await sequelize.query(`
        SELECT '{"test": "value"}'::jsonb as test_json;
      `);
      console.log('✅ JSONB support confirmed');
      
      // Test UUID functionality
      const uuidResult = await sequelize.query(`
        SELECT gen_random_uuid() as test_uuid;
      `);
      console.log('✅ UUID generation confirmed');
      
      // Test database info
      const dbInfo = await sequelize.query(`
        SELECT version() as postgres_version;
      `);
      console.log(`✅ PostgreSQL Version: ${dbInfo[0][0].postgres_version.split(' ')[1]}`);
      
    } catch (error) {
      console.log('❌ Supabase feature test failed:', error.message);
    }
  }
  
  console.log('\n🎉 Database test completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Set USE_SUPABASE=true in your .env file');
  console.log('2. Add your Supabase credentials to .env');
  console.log('3. Run the schema in your Supabase SQL editor');
  console.log('4. Restart your server');
  
  process.exit(0);
}

// Run the test
testSupabaseConnection().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
