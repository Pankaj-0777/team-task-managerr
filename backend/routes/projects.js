const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { protect, adminOnly } = require('../middleware/authMiddleware');


// ─────────────────────────────────────────────
// GET /api/projects
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    let projects;

    if (req.user.role === 'admin') {
      projects = await Project.find()
        .populate('createdBy', 'name email')
        .populate('members', 'name email role');
    } else {
      projects = await Project.find({ members: req.user._id })
        .populate('createdBy', 'name email')
        .populate('members', 'name email role');
    }

    res.status(200).json({ projects });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// ─────────────────────────────────────────────
// GET /api/projects/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({ project });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// ─────────────────────────────────────────────
// POST /api/projects  (ADMIN)
// ─────────────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, members = [] } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    // ✅ FIX: Always include creator (admin)
    const allMembers = [
      req.user._id,
      ...members.filter(m => m.toString() !== req.user._id.toString())
    ];

    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members: allMembers,
    });

    res.status(201).json({
      message: 'Project created successfully',
      project,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// ─────────────────────────────────────────────
// PUT /api/projects/:id (ADMIN)
// ─────────────────────────────────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, members, status } = req.body;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, members, status },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({ message: 'Project updated', project });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// ─────────────────────────────────────────────
// ADD MEMBER TO PROJECT (ADMIN)
// ─────────────────────────────────────────────
router.post('/:id/members', protect, adminOnly, async (req, res) => {
  try {
    const { userId } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // ✅ FIX: Proper ObjectId comparison
    if (project.members.some(m => m.toString() === userId)) {
      return res.status(400).json({ message: 'User already in project' });
    }

    project.members.push(userId);
    await project.save();

    await project.populate('members', 'name email role');

    res.status(200).json({
      message: 'Member added successfully',
      project,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// ─────────────────────────────────────────────
// REMOVE MEMBER
// ─────────────────────────────────────────────
router.delete('/:id/members/:userId', protect, adminOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.members = project.members.filter(
      m => m.toString() !== req.params.userId
    );

    await project.save();

    res.status(200).json({
      message: 'Member removed',
      project,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// ─────────────────────────────────────────────
// DELETE PROJECT
// ─────────────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({ message: 'Project deleted' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


module.exports = router;