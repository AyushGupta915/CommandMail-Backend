const express = require('express');
const router = express.Router();
const Draft = require('../models/Draft');

// Get all drafts
router.get('/', async (req, res) => {
  try {
    const drafts = await Draft.find()
      .populate('emailId')
      .sort({ createdAt: -1 });
    res.json(drafts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single draft
router.get('/:id', async (req, res) => {
  try {
    const draft = await Draft.findById(req.params.id).populate('emailId');
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    res.json(draft);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create draft
router.post('/', async (req, res) => {
  try {
    const draft = new Draft(req.body);
    await draft.save();
    const populatedDraft = await Draft.findById(draft._id).populate('emailId');
    res.status(201).json(populatedDraft);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update draft
router.put('/:id', async (req, res) => {
  try {
    const draft = await Draft.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('emailId');
    
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    res.json(draft);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete draft
router.delete('/:id', async (req, res) => {
  try {
    const draft = await Draft.findByIdAndDelete(req.params.id);
    
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    res.json({ message: 'Draft deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;