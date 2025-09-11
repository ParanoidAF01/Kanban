const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100]
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        boardUpdates: true,
        cardAssignments: true
      },
      language: 'en'
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.getPublicProfile = function() {
  return {
    id: this.id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    avatar: this.avatar,
    isEmailVerified: this.isEmailVerified,
    lastLoginAt: this.lastLoginAt,
    preferences: this.preferences,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

User.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Class methods
User.findByEmail = function(email) {
  return this.findOne({ where: { email: email.toLowerCase() } });
};

User.findByVerificationToken = function(token) {
  return this.findOne({ where: { emailVerificationToken: token } });
};

User.findByPasswordResetToken = function(token) {
  return this.findOne({ 
    where: { 
      passwordResetToken: token,
      passwordResetExpires: {
        [sequelize.Sequelize.Op.gt]: new Date()
      }
    }
  });
};

module.exports = User;
