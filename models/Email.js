const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    enum: ['Important', 'Newsletter', 'Spam', 'To-Do', 'Uncategorized'],
    default: 'Uncategorized'
  },
  actionItems: [{
    task: {
      type: String,
      required: true
    },
    deadline: String,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  processed: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Email', emailSchema);