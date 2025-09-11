const bcrypt = require('bcryptjs');
const { sequelize, User, Board, BoardMember, Column, Card, CardAssignment, Activity } = require('../src/backend/models');
const { testConnection } = require('../src/backend/config/database');

const seedDatabase = async () => {
  try {
    console.log('🔄 Testing database connection...');
    await testConnection();
    
    console.log('🔄 Clearing existing data...');
    await sequelize.sync({ force: true });
    
    console.log('🌱 Seeding database with sample data...');
    
    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Create sample users
    const users = await User.bulkCreate([
      {
        email: 'john.doe@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        isEmailVerified: true
      },
      {
        email: 'jane.smith@example.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        isEmailVerified: true
      },
      {
        email: 'mike.johnson@example.com',
        password: hashedPassword,
        firstName: 'Mike',
        lastName: 'Johnson',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        isEmailVerified: true
      },
      {
        email: 'sarah.wilson@example.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Wilson',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        isEmailVerified: true
      },
      {
        email: 'alex.brown@example.com',
        password: hashedPassword,
        firstName: 'Alex',
        lastName: 'Brown',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        isEmailVerified: true
      }
    ]);
    
    console.log(`✅ Created ${users.length} users`);
    
    // Create sample boards
    const boards = await Board.bulkCreate([
      {
        name: 'Project Alpha',
        description: 'Main project board for Alpha team development',
        color: '#3B82F6',
        ownerId: users[0].id,
        isPublic: false
      },
      {
        name: 'Marketing Campaign',
        description: 'Q4 marketing initiatives and campaigns',
        color: '#10B981',
        ownerId: users[1].id,
        isPublic: true
      },
      {
        name: 'Bug Fixes',
        description: 'Critical bug fixes and patches',
        color: '#EF4444',
        ownerId: users[2].id,
        isPublic: false
      },
      {
        name: 'Feature Requests',
        description: 'New feature ideas and requests',
        color: '#8B5CF6',
        ownerId: users[3].id,
        isPublic: true
      }
    ]);
    
    console.log(`✅ Created ${boards.length} boards`);
    
    // Create board members
    const boardMembers = [];
    for (let i = 0; i < boards.length; i++) {
      const board = boards[i];
      
      // Add owner as member
      boardMembers.push({
        userId: board.ownerId,
        boardId: board.id,
        role: 'owner',
        permissions: {
          canEditBoard: true,
          canDeleteBoard: true,
          canInviteMembers: true,
          canRemoveMembers: true,
          canCreateColumns: true,
          canEditColumns: true,
          canDeleteColumns: true,
          canCreateCards: true,
          canEditCards: true,
          canDeleteCards: true,
          canMoveCards: true,
          canAssignCards: true,
          canComment: true,
          canVote: true
        }
      });
      
      // Add other users as members
      for (let j = 0; j < users.length; j++) {
        if (users[j].id !== board.ownerId) {
          boardMembers.push({
            userId: users[j].id,
            boardId: board.id,
            role: Math.random() > 0.5 ? 'member' : 'viewer',
            permissions: {
              canEditBoard: false,
              canDeleteBoard: false,
              canInviteMembers: false,
              canRemoveMembers: false,
              canCreateColumns: true,
              canEditColumns: true,
              canDeleteColumns: false,
              canCreateCards: true,
              canEditCards: true,
              canDeleteCards: false,
              canMoveCards: true,
              canAssignCards: true,
              canComment: true,
              canVote: true
            }
          });
        }
      }
    }
    
    await BoardMember.bulkCreate(boardMembers);
    console.log(`✅ Created ${boardMembers.length} board members`);
    
    // Create columns for each board
    const columns = [];
    for (let i = 0; i < boards.length; i++) {
      const board = boards[i];
      const columnNames = ['To Do', 'In Progress', 'In Review', 'Done'];
      const columnColors = ['#6B7280', '#3B82F6', '#F59E0B', '#10B981'];
      
      for (let j = 0; j < columnNames.length; j++) {
        columns.push({
          name: columnNames[j],
          description: `${columnNames[j]} column for ${board.name}`,
          color: columnColors[j],
          position: j,
          boardId: board.id
        });
      }
    }
    
    const createdColumns = await Column.bulkCreate(columns);
    console.log(`✅ Created ${createdColumns.length} columns`);
    
    // Create sample cards
    const cards = [];
    const cardTitles = [
      'Design new landing page',
      'Implement user authentication',
      'Set up database schema',
      'Create API documentation',
      'Write unit tests',
      'Deploy to staging',
      'Fix responsive design issues',
      'Add dark mode support',
      'Optimize database queries',
      'Implement real-time notifications',
      'Add file upload functionality',
      'Create admin dashboard',
      'Write integration tests',
      'Deploy to production',
      'Monitor application performance'
    ];
    
    const cardDescriptions = [
      'Create mockups and wireframes for the new landing page design',
      'Add secure login and registration functionality with JWT',
      'Design and implement the database schema for the application',
      'Write comprehensive API documentation for all endpoints',
      'Create unit tests for all critical functions and components',
      'Deploy the application to staging environment for testing',
      'Fix responsive design issues on mobile and tablet devices',
      'Add dark mode theme support for better user experience',
      'Optimize database queries to improve application performance',
      'Implement real-time notifications using WebSockets',
      'Add file upload functionality with proper validation',
      'Create admin dashboard for managing users and content',
      'Write integration tests for API endpoints',
      'Deploy the application to production environment',
      'Set up monitoring and alerting for application performance'
    ];
    
    for (let i = 0; i < createdColumns.length; i++) {
      const column = createdColumns[i];
      const cardsInColumn = Math.floor(Math.random() * 4) + 1; // 1-4 cards per column
      
      for (let j = 0; j < cardsInColumn; j++) {
        const titleIndex = Math.floor(Math.random() * cardTitles.length);
        const descriptionIndex = Math.floor(Math.random() * cardDescriptions.length);
        
        cards.push({
          title: cardTitles[titleIndex],
          description: cardDescriptions[descriptionIndex],
          position: j,
          priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
          dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within 30 days
          columnId: column.id,
          boardId: column.boardId,
          labels: [
            { id: '1', name: 'Frontend', color: '#3B82F6' },
            { id: '2', name: 'Backend', color: '#10B981' },
            { id: '3', name: 'Bug', color: '#EF4444' },
            { id: '4', name: 'Feature', color: '#8B5CF6' }
          ].slice(0, Math.floor(Math.random() * 3) + 1), // 1-3 random labels
          metadata: {
            timeSpent: Math.floor(Math.random() * 40), // 0-40 hours
            estimatedTime: Math.floor(Math.random() * 20) + 5, // 5-25 hours
            storyPoints: Math.floor(Math.random() * 8) + 1, // 1-8 story points
            tags: ['urgent', 'important', 'low-priority'][Math.floor(Math.random() * 3)]
          }
        });
      }
    }
    
    const createdCards = await Card.bulkCreate(cards);
    console.log(`✅ Created ${createdCards.length} cards`);
    
    // Create card assignments
    const cardAssignments = [];
    for (let i = 0; i < createdCards.length; i++) {
      const card = createdCards[i];
      const assigneeCount = Math.floor(Math.random() * 3) + 1; // 1-3 assignees per card
      const assignedUsers = users.sort(() => 0.5 - Math.random()).slice(0, assigneeCount);
      
      for (let j = 0; j < assignedUsers.length; j++) {
        cardAssignments.push({
          userId: assignedUsers[j].id,
          cardId: card.id,
          role: 'assignee'
        });
      }
    }
    
    await CardAssignment.bulkCreate(cardAssignments);
    console.log(`✅ Created ${cardAssignments.length} card assignments`);
    
    // Create sample activities
    const activities = [];
    for (let i = 0; i < boards.length; i++) {
      const board = boards[i];
      
      // Board creation activity
      activities.push({
        type: 'board_created',
        description: `Created board "${board.name}"`,
        userId: board.ownerId,
        boardId: board.id,
        metadata: {
          boardName: board.name,
          boardColor: board.color
        }
      });
      
      // Column creation activities
      const boardColumns = createdColumns.filter(col => col.boardId === board.id);
      for (let j = 0; j < boardColumns.length; j++) {
        activities.push({
          type: 'column_created',
          description: `Created column "${boardColumns[j].name}"`,
          userId: board.ownerId,
          boardId: board.id,
          columnId: boardColumns[j].id,
          metadata: {
            columnName: boardColumns[j].name,
            columnColor: boardColumns[j].color
          }
        });
      }
      
      // Card creation activities
      const boardCards = createdCards.filter(card => card.boardId === board.id);
      for (let j = 0; j < boardCards.length; j++) {
        activities.push({
          type: 'card_created',
          description: `Created card "${boardCards[j].title}"`,
          userId: board.ownerId,
          boardId: board.id,
          columnId: boardCards[j].columnId,
          cardId: boardCards[j].id,
          metadata: {
            cardTitle: boardCards[j].title,
            cardPriority: boardCards[j].priority
          }
        });
      }
    }
    
    await Activity.bulkCreate(activities);
    console.log(`✅ Created ${activities.length} activities`);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 Sample data has been created:');
    console.log(`   - ${users.length} users`);
    console.log(`   - ${boards.length} boards`);
    console.log(`   - ${boardMembers.length} board members`);
    console.log(`   - ${createdColumns.length} columns`);
    console.log(`   - ${createdCards.length} cards`);
    console.log(`   - ${cardAssignments.length} card assignments`);
    console.log(`   - ${activities.length} activities`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Run seeding if this script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
