// routes/tasks.js
// All API endpoints for Tasks

const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ─── GET /api/tasks?project=projectId ─────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { project } = req.query;
    if (!project) return res.status(400).json({ message: 'Project ID is required' });

    const tasks = await Task.find({ project })
      .populate('assignedTo', 'name email _id')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── GET /api/tasks/my-tasks ───────────────────────────────
router.get('/my-tasks', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'name _id')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email _id');

    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── POST /api/tasks ───────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, project, assignedTo, dueDate, priority } = req.body;

    if (!title || !project) {
      return res.status(400).json({ message: 'Title and project are required' });
    }

    const projectExists = await Project.findById(project);
    if (!projectExists) return res.status(404).json({ message: 'Project not found' });

    const task = await Task.create({
      title,
      description,
      project,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      dueDate: dueDate || null,
      priority: priority || 'medium',
      progress: 0,
      progressNote: '',
    });

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── PUT /api/tasks/:id ────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role === 'admin') {
      // Admin can update everything
      const {
        title, description, assignedTo,
        status, dueDate, priority,
        progress, progressNote
      } = req.body;

      const updated = await Task.findByIdAndUpdate(
        req.params.id,
        {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(assignedTo !== undefined && { assignedTo }),
          ...(status !== undefined && { status }),
          ...(dueDate !== undefined && { dueDate }),
          ...(priority !== undefined && { priority }),
          ...(progress !== undefined && { progress: Number(progress) }),
          ...(progressNote !== undefined && { progressNote }),
        },
        { new: true, runValidators: true }
      )
        .populate('assignedTo', 'name email _id')
        .populate('project', 'name');

      return res.status(200).json({ message: 'Task updated', task: updated });

    } else {
      // Member can only update their own task's progress + status
      const assignedId = task.assignedTo
        ? task.assignedTo.toString()
        : null;
      const userId = req.user._id.toString();

      if (assignedId !== userId) {
        return res.status(403).json({
          message: 'You can only update tasks assigned to you'
        });
      }

      const { status, progress, progressNote } = req.body;

      if (status !== undefined) task.status = status;
      if (progress !== undefined) task.progress = Number(progress);
      if (progressNote !== undefined) task.progressNote = progressNote;

      await task.save();

      const updated = await Task.findById(task._id)
        .populate('assignedTo', 'name email _id')
        .populate('project', 'name');

      return res.status(200).json({ message: 'Task updated', task: updated });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── DELETE /api/tasks/:id ─────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;