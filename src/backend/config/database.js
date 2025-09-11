const { Sequelize } = require('sequelize');
const path = require('path');

// Check if we should use Supabase (PostgreSQL) or SQLite
const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NODE_ENV === 'production';

let sequelize;

if (useSupabase) {
  // Supabase PostgreSQL configuration
  const databaseUrl = process.env.DATABASE_URL || 
    `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@${process.env.SUPABASE_DB_HOST}:5432/${process.env.SUPABASE_DB_NAME}`;
  
  sequelize = new Sequelize(databaseUrl, {
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
} else {
  // SQLite configuration for local development
  const sqliteConfig = {
    development: {
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../database.sqlite'),
      logging: console.log
    },
    production: {
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../database.sqlite'),
      logging: false
    }
  };

  const env = process.env.NODE_ENV || 'development';
  const dbConfig = sqliteConfig[env];
  sequelize = new Sequelize(dbConfig);
}

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connection established successfully (${useSupabase ? 'PostgreSQL/Supabase' : 'SQLite'})`);
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  useSupabase
};
