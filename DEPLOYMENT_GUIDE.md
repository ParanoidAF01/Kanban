# Deployment Guide - Collaborative Kanban Board

## Overview

This guide covers deploying the collaborative Kanban board application to production using Supabase (PostgreSQL) and Render hosting.

## Architecture

- **Frontend**: React.js static site hosted on Render
- **Backend**: Node.js API server hosted on Render
- **Database**: Supabase PostgreSQL with real-time capabilities
- **Authentication**: Supabase Auth (optional) or JWT-based auth
- **Real-time**: Socket.io for live collaboration

## Prerequisites

1. **Supabase Account**: [supabase.com](https://supabase.com)
2. **Render Account**: [render.com](https://render.com)
3. **GitHub Repository**: Code pushed to GitHub

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a project name and database password
3. Wait for project initialization (2-3 minutes)

### 1.2 Configure Database Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql` from the project root
3. Paste and execute the SQL to create all tables and policies

### 1.3 Get Connection Details
Navigate to **Settings > Database** and note:
- Host: `db.[project-ref].supabase.co`
- Database name: `postgres`
- Port: `5432`
- User: `postgres`
- Password: [your chosen password]

### 1.4 Get API Keys
Navigate to **Settings > API** and note:
- Project URL: `https://[project-ref].supabase.co`
- Anon key: `eyJ...` (public key)
- Service role key: `eyJ...` (private key)

## Step 2: Render Deployment

### 2.1 Deploy Backend API

1. **Create Web Service**:
   - Connect your GitHub repository
   - Choose "Web Service"
   - Set **Root Directory**: `src/backend`
   - Set **Build Command**: `npm install`
   - Set **Start Command**: `npm start`

2. **Environment Variables**:
   ```env
   NODE_ENV=production
   USE_SUPABASE=true
   PORT=3000
   
   # Database
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   
   # Supabase
   SUPABASE_URL=https://[PROJECT-REF].supabase.co
   SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
   SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-KEY]
   SUPABASE_DB_PASSWORD=[YOUR-DB-PASSWORD]
   SUPABASE_DB_HOST=db.[PROJECT-REF].supabase.co
   SUPABASE_DB_NAME=postgres
   
   # JWT (Auto-generate these)
   JWT_SECRET=[AUTO-GENERATED]
   JWT_REFRESH_SECRET=[AUTO-GENERATED]
   
   # CORS (Will be set after frontend deployment)
   CORS_ORIGIN=https://[FRONTEND-URL].onrender.com
   FRONTEND_URL=https://[FRONTEND-URL].onrender.com
   ```

3. **Deploy**: Click "Create Web Service"

### 2.2 Deploy Frontend

1. **Create Static Site**:
   - Connect the same GitHub repository
   - Choose "Static Site"
   - Set **Root Directory**: `src/frontend`
   - Set **Build Command**: `npm install && npm run build`
   - Set **Publish Directory**: `build`

2. **Environment Variables**:
   ```env
   REACT_APP_API_URL=https://[BACKEND-URL].onrender.com
   REACT_APP_WS_URL=https://[BACKEND-URL].onrender.com
   ```

3. **Deploy**: Click "Create Static Site"

### 2.3 Update CORS Settings

After both services are deployed:
1. Go to your backend service settings
2. Update `CORS_ORIGIN` and `FRONTEND_URL` with your frontend URL
3. Redeploy the backend service

## Step 3: Verification

### 3.1 Health Checks
- Backend: `https://[backend-url].onrender.com/health`
- Frontend: `https://[frontend-url].onrender.com`

### 3.2 Test Functionality
1. **User Registration**: Create a new account
2. **Board Creation**: Create a new board
3. **Real-time Collaboration**: Open board in multiple tabs
4. **CRUD Operations**: Test creating/editing/deleting columns and cards
5. **Drag & Drop**: Test card movement between columns

## Step 4: Production Optimizations

### 4.1 Database Optimizations
- Enable connection pooling in Supabase
- Set up automated backups
- Monitor query performance

### 4.2 Performance Monitoring
- Set up Render metrics monitoring
- Configure log aggregation
- Set up uptime monitoring

### 4.3 Security
- Enable Supabase Row Level Security (RLS)
- Configure rate limiting
- Set up HTTPS redirects

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify DATABASE_URL format
   - Check Supabase project status
   - Ensure IP allowlisting (if enabled)

2. **CORS Errors**:
   - Verify CORS_ORIGIN matches frontend URL
   - Check protocol (http vs https)

3. **Socket.io Connection Issues**:
   - Ensure WebSocket support is enabled
   - Check firewall settings

4. **Build Failures**:
   - Verify Node.js version compatibility
   - Check for missing dependencies
   - Review build logs

### Logs and Debugging

- **Backend Logs**: Render service dashboard
- **Database Logs**: Supabase dashboard > Logs
- **Frontend Errors**: Browser developer tools

## Scaling Considerations

### Database Scaling
- Supabase automatically handles connection pooling
- Consider read replicas for high-traffic applications
- Monitor database performance metrics

### Application Scaling
- Render automatically handles load balancing
- Consider upgrading to higher-tier plans for better performance
- Implement caching strategies for frequently accessed data

## Backup and Recovery

### Database Backups
- Supabase provides automated daily backups
- Consider setting up additional backup strategies for critical data
- Test restore procedures regularly

### Application Backups
- Code is backed up in GitHub repository
- Environment variables should be documented securely
- Consider infrastructure as code for reproducible deployments

## Monitoring and Alerts

### Key Metrics to Monitor
- Application uptime and response times
- Database connection pool usage
- Error rates and types
- User activity and engagement

### Recommended Tools
- Render built-in monitoring
- Supabase dashboard analytics
- Third-party monitoring services (optional)

## Cost Optimization

### Supabase Costs
- Monitor database usage and optimize queries
- Use appropriate pricing tier based on usage
- Consider data archiving strategies

### Render Costs
- Choose appropriate service tiers
- Monitor resource usage
- Optimize build and deployment processes

This deployment guide ensures a robust, scalable production environment for your collaborative Kanban board application.
