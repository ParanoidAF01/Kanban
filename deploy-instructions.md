# Deployment Instructions

## Email Configuration Setup

Before deploying, you need to configure email notifications:

### Option 1: Gmail (Recommended for Development/Testing)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. Set environment variables:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

### Option 2: SendGrid (Recommended for Production)

1. Create a SendGrid account
2. Generate an API key
3. Update `emailService.js` to use SendGrid instead of nodemailer
4. Set environment variables:
   ```
   SENDGRID_API_KEY=your-sendgrid-api-key
   FROM_EMAIL=noreply@yourdomain.com
   ```

## Render.com Deployment

### Prerequisites
- GitHub repository with your code
- Render.com account

### Steps

1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "Add email notifications and production deployment"
   git push origin main
   ```

2. **Create Render service**:
   - Go to Render.com dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Use these settings:
     - **Name**: collaborative-kanban
     - **Environment**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`

3. **Configure environment variables** in Render dashboard:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=Kanban App <noreply@kanban.com>
   FRONTEND_URL=https://your-app-name.onrender.com
   CORS_ORIGIN=https://your-app-name.onrender.com
   ```

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your app will be available at `https://your-app-name.onrender.com`

### Database Configuration

For production, you may want to use PostgreSQL instead of SQLite:

1. **Add PostgreSQL service** in Render:
   - Create a new PostgreSQL database
   - Copy the connection string

2. **Update environment variables**:
   ```
   DATABASE_URL=your-postgresql-connection-string
   DB_DIALECT=postgres
   ```

3. **Install PostgreSQL driver**:
   ```bash
   npm install pg pg-hstore
   ```

## Local Development with Email Testing

1. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Configure email settings** in `.env`:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=Kanban App <noreply@kanban.com>
   ```

3. **Test email functionality**:
   - Register a new user (should receive welcome email)
   - Assign a card to a user (should receive assignment notification)
   - Create cards with due dates (will receive reminders at 9 AM daily)

## Features Included

✅ **Email Notifications**:
- Welcome email on user registration
- Card assignment notifications
- Due date reminders (daily cron job at 9 AM)
- Board invitation emails

✅ **Production Ready**:
- Docker containerization
- Health check endpoint
- Security headers (Helmet)
- Rate limiting
- CORS configuration
- Environment-based configuration

✅ **Real-time Collaboration**:
- WebSocket integration
- Live user presence
- Real-time card updates
- Drag and drop functionality

## Troubleshooting

### Email Issues
- Verify Gmail app password is correct (16 characters, no spaces)
- Check spam folder for test emails
- Ensure 2FA is enabled on Gmail account

### Deployment Issues
- Check Render logs for errors
- Verify all environment variables are set
- Ensure build command completes successfully

### Database Issues
- For SQLite: File permissions in production
- For PostgreSQL: Connection string format and credentials

## Next Steps

After deployment:
1. Test all functionality in production
2. Set up monitoring and logging
3. Configure custom domain (optional)
4. Set up automated backups
5. Add performance monitoring
