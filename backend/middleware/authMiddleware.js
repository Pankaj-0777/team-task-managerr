// middleware/authMiddleware.js
// Checks that the user has a valid JWT token before allowing access

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Protect Middleware ────────────────────────────────────
// Use this on any route that requires login
const protect = async (req, res, next) => {
  try {
    // 1. Get the token from request headers
    // Frontend sends: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, access denied' });
    }

    // 2. Extract just the token part (remove "Bearer ")
    const token = authHeader.split(' ')[1];

    // 3. Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { userId: '...', role: 'admin', iat: ..., exp: ... }

    // 4. Find the user in database and attach to request
    const user = await User.findById(decoded.userId).select('-password');
    // .select('-password') means: get everything EXCEPT the password field
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user; // Now any route after this can access req.user
    next();          // Move on to the actual route handler

  } catch (error) {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

// ─── Admin Only Middleware ─────────────────────────────────
// Use this on routes that ONLY admins can access
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // User is admin, allow through
  } else {
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

module.exports = { protect, adminOnly };