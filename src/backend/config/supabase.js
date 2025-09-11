const { createClient } = require('@supabase/supabase-js');
const { Sequelize } = require('sequelize');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// PostgreSQL connection string for Sequelize
const databaseUrl = process.env.DATABASE_URL || `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@${process.env.SUPABASE_DB_HOST}:5432/${process.env.SUPABASE_DB_NAME}`;

// Create Sequelize instance with PostgreSQL
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    return false;
  }
};

// Sync database (create tables if they don't exist)
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('✅ Database synchronized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    return false;
  }
};

module.exports = {
  supabase,
  sequelize,
  testConnection,
  syncDatabase
};
