const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Supabase Auth Integration
class SupabaseAuth {
  // Sign up a new user
  static async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            ...userData
          }
        }
      });

      if (error) throw error;
      return { user: data.user, session: data.session };
    } catch (error) {
      throw new Error(`Signup failed: ${error.message}`);
    }
  }

  // Sign in user
  static async signIn(email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { user: data.user, session: data.session };
    } catch (error) {
      throw new Error(`Signin failed: ${error.message}`);
    }
  }

  // Sign out user
  static async signOut(accessToken) {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(`Signout failed: ${error.message}`);
    }
  }

  // Get user from JWT token
  static async getUserFromToken(token) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error) throw error;
      return data.user;
    } catch (error) {
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  // Refresh access token
  static async refreshToken(refreshToken) {
    try {
      const { data, error } = await supabaseClient.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) throw error;
      return { session: data.session };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  // Reset password
  static async resetPassword(email) {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  // Update user password
  static async updatePassword(accessToken, newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(`Password update failed: ${error.message}`);
    }
  }

  // Verify email
  static async verifyEmail(token, type) {
    try {
      const { error } = await supabaseClient.auth.verifyOtp({
        token_hash: token,
        type: type || 'email'
      });

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(`Email verification failed: ${error.message}`);
    }
  }
}

// Middleware to check Supabase JWT token
const authenticateSupabaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const user = await SupabaseAuth.getUserFromToken(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      ...user.user_metadata
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = {
  SupabaseAuth,
  authenticateSupabaseToken,
  supabase,
  supabaseClient
};
