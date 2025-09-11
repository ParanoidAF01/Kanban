# Collaborative Kanban Board

A real-time collaborative Kanban board application built with React, Node.js, Express, and Socket.io.

## Features

- 🚀 **Real-time Collaboration** - Multiple users can work on the same board simultaneously
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 🎨 **Modern UI** - Clean, intuitive interface built with Tailwind CSS
- 🔐 **User Authentication** - Secure login and registration system
- 📊 **Drag & Drop** - Intuitive card and column management
- 🔔 **Real-time Notifications** - Stay updated with live activity feeds
- 👥 **Team Management** - Invite and manage team members
- 📈 **Activity Tracking** - Monitor changes and user activity

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Tailwind CSS
- @dnd-kit (Drag & Drop)
- Socket.io Client
- Axios
- React Hot Toast

### Backend
- Node.js
- Express.js
- Socket.io
- PostgreSQL (Supabase)
- Redis (Upstash)
- JWT Authentication
- Sequelize ORM

### DevOps
- Docker
- Webpack
- Babel
- ESLint
- Jest

## Quick Start

### Prerequisites
- Node.js 18+
- npm 8+
- PostgreSQL database (or Supabase account)
- Redis instance (or Upstash account)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd collaborative-kanban
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key
   DATABASE_URL=postgresql://user:password@localhost:5432/kanban
   REDIS_URL=redis://localhost:6379
   ```

4. **Set up the database**
   ```bash
   npm run migrate
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:3000
   - Frontend development server on http://localhost:3001

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the frontend development server
- `npm run dev:backend` - Start only the backend server
- `npm run build` - Build the frontend for production
- `npm start` - Start the production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed the database with sample data

## Project Structure

```
collaborative-kanban/
├── src/
│   ├── backend/
│   │   ├── config/          # Database and app configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── sockets/         # Socket.io handlers
│   │   └── utils/           # Utility functions
│   ├── frontend/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React context providers
│   │   ├── services/        # API services
│   │   └── styles/          # CSS and styling
│   └── shared/              # Shared utilities and types
├── public/                  # Static assets
├── tests/                   # Test files
├── scripts/                 # Build and deployment scripts
└── docs/                    # Documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Boards
- `GET /api/boards` - Get user's boards
- `POST /api/boards` - Create a new board
- `GET /api/boards/:id` - Get board details
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Columns
- `POST /api/boards/:boardId/columns` - Create column
- `PUT /api/columns/:id` - Update column
- `DELETE /api/columns/:id` - Delete column

### Cards
- `POST /api/columns/:columnId/cards` - Create card
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card
- `PUT /api/cards/:id/move` - Move card between columns

## Deployment

### Using Docker

1. **Build the Docker image**
   ```bash
   docker build -t collaborative-kanban .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 --env-file .env collaborative-kanban
   ```

### Using Render

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy automatically on push to main branch

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help, please open an issue on GitHub or contact the development team.
