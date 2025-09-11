# Supabase Migration Guide

## Prerequisites

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and API keys

2. **Get Database Connection Details**
   - Go to Settings > Database in your Supabase dashboard
   - Copy the connection string and credentials

## Step 1: Set Up Environment Variables

Create a `.env` file in `/src/backend/` with the following variables:

```env
# Enable Supabase
USE_SUPABASE=true
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Supabase Configuration
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DB_PASSWORD=your_database_password
SUPABASE_DB_HOST=db.[YOUR-PROJECT-REF].supabase.co
SUPABASE_DB_NAME=postgres

# Keep existing JWT and other configs
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
```

## Step 2: Run Database Schema

1. Copy the contents of `supabase-schema.sql`
2. Go to your Supabase dashboard > SQL Editor
3. Paste and run the schema to create all tables

## Step 3: Test the Migration

1. Set `USE_SUPABASE=true` in your `.env` file
2. Restart your backend server
3. The application should now connect to Supabase PostgreSQL instead of SQLite

## Step 4: Deploy to Render

1. **Create a Render Account** at [render.com](https://render.com)

2. **Deploy Backend**:
   - Connect your GitHub repository
   - Choose "Web Service"
   - Set build command: `cd src/backend && npm install`
   - Set start command: `cd src/backend && npm start`
   - Add all environment variables from your `.env` file
   - Set `NODE_ENV=production`

3. **Deploy Frontend**:
   - Create another service for frontend
   - Set build command: `cd src/frontend && npm install && npm run build`
   - Set publish directory: `src/frontend/build`
   - Update `REACT_APP_API_URL` to point to your backend URL

## Features Preserved

✅ All existing functionality works with Supabase:
- Board management with real-time updates
- Column and card CRUD operations
- Drag and drop with priority handling
- One-way card completion
- User authentication
- Real-time collaboration via WebSocket
- Activity tracking

## Database Differences

- **SQLite → PostgreSQL**: Better performance and scalability
- **UUID Primary Keys**: All tables use UUID instead of auto-increment
- **JSONB Support**: Better JSON handling for settings and metadata
- **Row Level Security**: Built-in security policies
- **Real-time Subscriptions**: Native real-time capabilities (optional upgrade)

## Rollback Plan

To rollback to SQLite:
1. Set `USE_SUPABASE=false` in `.env`
2. Restart the server
3. The app will use the local SQLite database

## Next Steps

After successful migration:
1. Test all functionality thoroughly
2. Set up automated backups in Supabase
3. Configure production environment variables
4. Deploy to Render with proper domain setup
