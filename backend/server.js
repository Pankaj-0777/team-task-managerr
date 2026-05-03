const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// 🔥 FORCE CORS (works everywhere)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});
// ─── Routes ───────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');  // ← ADD THIS
const taskRoutes = require('./routes/tasks');          // ← ADD THIS

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);              // ← ADD THIS
app.use('/api/tasks', taskRoutes);                    // ← ADD THIS

// ─── Database Connection ───────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection failed:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));