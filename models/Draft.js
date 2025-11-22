const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
  emailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email'
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  metadata: {
    category: String,
    actionItems: Array
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Draft', draftSchema);