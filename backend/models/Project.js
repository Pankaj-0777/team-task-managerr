// models/Project.js
// Defines what a Project looks like in the database

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    // The admin who created this project
    createdBy: {
      type: mongoose.Schema.Types.ObjectId, // References a User's _id
      ref: 'User',                          // Links to User model
      required: true,
    },

    // List of users who are members of this project
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    status: {
      type: String,
      enum: ['active', 'completed', 'on-hold'],
      default: 'active',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('Project', projectSchema);