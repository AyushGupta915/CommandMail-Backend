const express = require('express');
const router = express.Router();
const Prompt = require('../models/Prompt');

// Get all prompts
router.get('/', async (req, res) => {
  try {
    const prompts = await Prompt.find();
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update prompt
router.post('/', async (req, res) => {
  try {
    const { name, content } = req.body;
    
    const prompt = await Prompt.findOneAndUpdate(
      { name },
      { name, content, isActive: true },
      { upsert: true, new: true }
    );
    
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update prompt
router.put('/:id', async (req, res) => {
  try {
    const prompt = await Prompt.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete prompt
router.delete('/:id', async (req, res) => {
  try {
    const prompt = await Prompt.findByIdAndDelete(req.params.id);
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    res.json({ message: 'Prompt deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize default prompts
router.post('/initialize', async (req, res) => {
  try {
    const defaultPrompts = [
      {
        name: 'categorization',
        content: `You are an email categorization system. Categorize the following email into EXACTLY ONE category.

Categories:
- Important: Urgent or from key stakeholders
- To-Do: Contains a direct request requiring user action
- Newsletter: Marketing or informational content
- Spam: Unsolicited or suspicious content

Respond with ONLY ONE WORD - the category name. No explanation, no punctuation, just the category.`
      },
      {
        name: 'actionItem',
        content: `Extract actionable tasks from the email below. 

Return ONLY a valid JSON array in this exact format:
[{"task": "description of task", "deadline": "date or null"}]

If no tasks exist, return: []

Do not include any markdown formatting, code blocks, or explanations. Only return the JSON array.`
      },
      {
        name: 'autoReply',
        content: `You are drafting a professional email reply.

Instructions:
- If it's a meeting request, ask for an agenda
- Keep tone polite and concise
- Be professional but friendly
- Include appropriate greeting and closing

Draft the complete email reply:`
      }
    ];

    for (const promptData of defaultPrompts) {
      await Prompt.findOneAndUpdate(
        { name: promptData.name },
        promptData,
        { upsert: true }
      );
    }

    const prompts = await Prompt.find();
    res.json({ message: 'Default prompts initialized', prompts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;