const express = require('express');
const router = express.Router();
const Email = require('../models/Email');
const { processEmail, processEmailsBatch } = require('../services/emailProcessor');
const mockInbox = require('../data/mockInbox.json');

// Load mock inbox
router.post('/load', async (req, res) => {
  try {
    await Email.deleteMany({});
    const emails = await Email.insertMany(mockInbox);
    
    res.json({ 
      message: 'Mock inbox loaded successfully', 
      count: emails.length,
      emails 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all emails
router.get('/', async (req, res) => {
  try {
    const { category, processed } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (processed !== undefined) filter.processed = processed === 'true';
    
    const emails = await Email.find(filter).sort({ timestamp: -1 });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single email
router.get('/:id', async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    res.json(email);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process single email
router.post('/process/:id', async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const { category, actionItems } = await processEmail(email);
    
    email.category = category;
    email.actionItems = actionItems;
    email.processed = true;
    await email.save();
    
    res.json(email);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process all unprocessed emails
router.post('/process-all', async (req, res) => {
  try {
    const emails = await Email.find({ processed: false });
    
    if (emails.length === 0) {
      return res.json({ 
        message: 'No unprocessed emails found', 
        count: 0,
        emails: [] 
      });
    }

    console.log(`Starting batch processing of ${emails.length} emails`);
    const results = await processEmailsBatch(emails, 1000);
    
    const successfulResults = [];
    for (const result of results) {
      if (result.success) {
        const email = await Email.findById(result.email._id);
        email.category = result.category;
        email.actionItems = result.actionItems;
        email.processed = true;
        await email.save();
        successfulResults.push(email);
      }
    }
    
    const failedCount = results.filter(r => !r.success).length;
    
    res.json({ 
      message: `Processed ${successfulResults.length} emails successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`, 
      count: successfulResults.length,
      failed: failedCount,
      emails: successfulResults 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle action item completion (use PUT instead of PATCH)
router.put('/:emailId/action-items/:itemIndex/toggle', async (req, res) => {
  try {
    const { emailId, itemIndex } = req.params;
    
    console.log('Toggle request:', { emailId, itemIndex }); // Debug log
    
    const email = await Email.findById(emailId);
    
    if (!email) {
      console.log('Email not found:', emailId);
      return res.status(404).json({ error: 'Email not found' });
    }

    const index = parseInt(itemIndex);
    if (index < 0 || index >= email.actionItems.length) {
      console.log('Invalid index:', index, 'Total items:', email.actionItems.length);
      return res.status(400).json({ error: 'Invalid action item index' });
    }

    // Toggle completion status
    email.actionItems[index].completed = !email.actionItems[index].completed;
    email.actionItems[index].completedAt = email.actionItems[index].completed ? new Date() : null;
    
    await email.save();
    
    console.log('Action item toggled successfully');
    res.json(email);
  } catch (error) {
    console.error('Toggle action item error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;