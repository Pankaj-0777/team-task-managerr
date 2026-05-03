const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.options("*", cors());
// ─── Routes ───────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');  // ← ADD THIS
const taskRoutes = require('./routes/tasks');          // ← ADD THIS

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);              // ← ADD THIS
app.use('/api/tasks', taskRoutes);                    // ← ADD THIS

// ─── Database Connection ───────────────────────────────────
console.log("MONGO_URI:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection failed:', err.message));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));