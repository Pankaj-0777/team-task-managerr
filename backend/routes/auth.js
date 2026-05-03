// routes/auth.js
// Handles all authentication: signup and login

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');         // For hashing passwords
const jwt = require('jsonwebtoken');         // For creating tokens
const User = require('../models/User');      // Our User model

// ─── Helper: Generate JWT Token ───────────────────────────
// Takes a user and returns a signed token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role }, // Payload (data inside token)
    process.env.JWT_SECRET,                 // Secret key to sign with
    { expiresIn: '7d' }                     // Token expires in 7 days
  );
};

// ─── POST /api/auth/signup ────────────────────────────────
// Creates a new user account
router.post('/signup', async (req, res) => {
  try {
    // GET /api/auth/users — get all users (admin only)
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
    const { name, email, password, role } = req.body;

    // 1. Check all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // 2. Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // 3. Hash the password before saving
    // bcrypt turns "mypassword" into "$2a$10$xyz..." — unreadable
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create and save the new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'member', // Default to member if not provided
    });

    // 5. Generate a token for instant login after signup
    const token = generateToken(user);

    // 6. Send back the token and user info (never send password!)
    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────
// Logs in an existing user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check fields exist
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // 2. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. Compare entered password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. Generate token
    const token = generateToken(user);

    // 5. Send back token and user info
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;