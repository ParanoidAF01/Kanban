const express = require('express');
const { SupabaseAuth } = require('../auth/supabaseAuth');
const { User } = require('../models');
const router = express.Router();

// Register with Supabase Auth
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Create user in Supabase Auth
    const { user: supabaseUser, session } = await SupabaseAuth.signUp(email, password, {
      firstName,
      lastName
    });

    // Create user record in our database
    const user = await User.create({
      id: supabaseUser.id,
      email: supabaseUser.email,
      firstName,
      lastName,
      isActive: true,
      emailVerified: supabaseUser.email_confirmed_at ? true : false
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: user.getPublicInfo(),
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login with Supabase Auth
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Authenticate with Supabase
    const { user: supabaseUser, session } = await SupabaseAuth.signIn(email, password);

    // Get user from our database
    const user = await User.findByPk(supabaseUser.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    res.json({
      message: 'Login successful',
      user: user.getPublicInfo(),
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    if (token) {
      await SupabaseAuth.signOut(token);
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const { session } = await SupabaseAuth.refreshToken(refresh_token);

    res.json({
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await SupabaseAuth.resetPassword(email);

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update password
router.post('/update-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    await SupabaseAuth.updatePassword(token, newPassword);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
