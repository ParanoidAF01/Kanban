const { sequelize } = require('../src/backend/config/database');
const { testConnection } = require('../src/backend/config/database');

const runMigrations = async () => {
  try {
    console.log('🔄 Testing database connection...');
    await testConnection();
    
    console.log('🔄 Running migrations...');
    await sequelize.sync({ force: false });
    
    console.log('✅ Database migrations completed successfully!');
    console.log('📊 Database schema is up to date.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
