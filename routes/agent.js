const express = require('express');
const router = express.Router();
const { callLLM, callLLMChat } = require('../services/llmService');
const Email = require('../models/Email');
const Prompt = require('../models/Prompt');

// Chat with agent
router.post('/query', async (req, res) => {
  try {
    const { query, emailId, context } = req.body;
    
    let systemPrompt = 'You are a helpful email productivity assistant. Provide clear, concise, and actionable responses based on the email data provided. Always be accurate with numbers and counts.';
    let userContent = '';
    
    // If specific email is requested, get it
    if (emailId) {
      const email = await Email.findById(emailId);
      if (email) {
        userContent = `Email Context:
From: ${email.sender}
Subject: ${email.subject}
Body: ${email.body}
Category: ${email.category || 'Not categorized'}
${email.actionItems && email.actionItems.length > 0 ? `Action Items: ${JSON.stringify(email.actionItems)}` : ''}

User Query: ${query}`;
      }
    } else {
      // If no specific email, check if query is about inbox/emails
      const queryLower = query.toLowerCase();
      
      // Check if it's a count/statistics query
      if (queryLower.includes('how many') || queryLower.includes('count')) {
        // Get all statistics
        const totalEmails = await Email.countDocuments();
        const processedEmails = await Email.countDocuments({ processed: true });
        const unprocessedEmails = await Email.countDocuments({ processed: false });
        const importantEmails = await Email.countDocuments({ category: 'Important', processed: true });
        const todoEmails = await Email.countDocuments({ category: 'To-Do', processed: true });
        const newsletterEmails = await Email.countDocuments({ category: 'Newsletter', processed: true });
        const spamEmails = await Email.countDocuments({ category: 'Spam', processed: true });
        
        userContent = `Email Statistics:
- Total emails: ${totalEmails}
- Processed emails: ${processedEmails}
- Unprocessed emails: ${unprocessedEmails}
- Important emails: ${importantEmails}
- To-Do emails: ${todoEmails}
- Newsletter emails: ${newsletterEmails}
- Spam emails: ${spamEmails}

User Query: ${query}

Please answer the user's question based on these statistics. Be precise with the numbers.`;
      }
      else if (queryLower.includes('urgent') || queryLower.includes('important')) {
        // Get urgent/important emails
        const emails = await Email.find({ 
          category: { $in: ['Important', 'To-Do'] },
          processed: true
        }).sort({ timestamp: -1 });
        
        if (emails && emails.length > 0) {
          const emailsList = emails.slice(0, 10).map((email, idx) => 
            `${idx + 1}. From: ${email.sender}
   Subject: ${email.subject}
   Category: ${email.category}
   ${email.actionItems && email.actionItems.length > 0 ? `Action Items: ${email.actionItems.map(item => item.task).join('; ')}` : 'No action items'}
   Received: ${new Date(email.timestamp).toLocaleDateString()}`
          ).join('\n\n');
          
          userContent = `Found ${emails.length} urgent/important emails. Here are the top 10:

${emailsList}

User Query: ${query}

Please provide a helpful response based on these emails.`;
        } else {
          userContent = `No urgent or important emails found.

User Query: ${query}`;
        }
      }
      else if (queryLower.includes('unprocessed') || queryLower.includes('not processed')) {
        // Get unprocessed emails
        const emails = await Email.find({ processed: false }).sort({ timestamp: -1 });
        
        if (emails && emails.length > 0) {
          const emailsList = emails.slice(0, 10).map((email, idx) => 
            `${idx + 1}. From: ${email.sender}
   Subject: ${email.subject}
   Received: ${new Date(email.timestamp).toLocaleDateString()}`
          ).join('\n\n');
          
          userContent = `You have ${emails.length} unprocessed emails. Here are the first 10:

${emailsList}

User Query: ${query}

Please provide a helpful response.`;
        } else {
          userContent = `No unprocessed emails found. All emails have been processed.

User Query: ${query}`;
        }
      }
      else if (queryLower.includes('todo') || queryLower.includes('action') || queryLower.includes('task')) {
        // Get To-Do emails and extract action items
        const emails = await Email.find({ 
          category: 'To-Do',
          processed: true
        }).sort({ timestamp: -1 });
        
        if (emails && emails.length > 0) {
          const emailsList = emails.slice(0, 10).map((email, idx) => 
            `${idx + 1}. From: ${email.sender}
   Subject: ${email.subject}
   ${email.actionItems && email.actionItems.length > 0 ? `Action Items: ${email.actionItems.map(item => `${item.task}${item.deadline ? ` (Due: ${item.deadline})` : ''}`).join('; ')}` : 'No action items extracted'}`
          ).join('\n\n');
          
          userContent = `Found ${emails.length} To-Do emails. Here are the details:

${emailsList}

User Query: ${query}

Please summarize the action items and priorities.`;
        } else {
          userContent = `No To-Do emails found.

User Query: ${query}`;
        }
      }
      else if (queryLower.includes('summary') || queryLower.includes('summarize') || queryLower.includes('overview')) {
        // Get inbox summary statistics
        const totalEmails = await Email.countDocuments();
        const processedEmails = await Email.countDocuments({ processed: true });
        const unprocessedEmails = await Email.countDocuments({ processed: false });
        const importantEmails = await Email.countDocuments({ category: 'Important', processed: true });
        const todoEmails = await Email.countDocuments({ category: 'To-Do', processed: true });
        const newsletterEmails = await Email.countDocuments({ category: 'Newsletter', processed: true });
        
        // Get recent important emails
        const recentImportant = await Email.find({
          category: { $in: ['Important', 'To-Do'] },
          processed: true
        }).sort({ timestamp: -1 }).limit(5);
        
        const recentList = recentImportant.map((email, idx) => 
          `${idx + 1}. ${email.subject} (from ${email.sender}) - ${email.category}`
        ).join('\n');
        
        userContent = `Inbox Overview:
- Total emails: ${totalEmails}
- Processed: ${processedEmails}
- Unprocessed: ${unprocessedEmails}
- Important: ${importantEmails}
- To-Do: ${todoEmails}
- Newsletters: ${newsletterEmails}

Recent Important Emails:
${recentList}

User Query: ${query}

Please provide a helpful summary of the inbox status.`;
      }
      else {
        // General query - get recent emails for context
        const recentEmails = await Email.find({ processed: true })
          .sort({ timestamp: -1 })
          .limit(5);
        
        if (recentEmails.length > 0) {
          const emailsList = recentEmails.map((email, idx) => 
            `${idx + 1}. From: ${email.sender}, Subject: ${email.subject}, Category: ${email.category}`
          ).join('\n');
          
          userContent = `Recent emails in inbox:
${emailsList}

User Query: ${query}`;
        } else {
          userContent = query;
        }
      }
    }
    
    // Add additional context if provided
    if (context) {
      userContent = `${context}\n\n${userContent}`;
    }
    
    const response = await callLLM(systemPrompt, userContent);
    
    res.json({ response });
  } catch (error) {
    console.error('Agent query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Chat with conversation history
router.post('/chat', async (req, res) => {
  try {
    const { messages, emailId } = req.body;
    
    let chatMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    if (emailId && chatMessages.length > 0) {
      const email = await Email.findById(emailId);
      if (email) {
        const emailContext = `\n\n[Email Context - From: ${email.sender}, Subject: ${email.subject}]`;
        chatMessages[0].content = emailContext + '\n' + chatMessages[0].content;
      }
    }
    
    const response = await callLLMChat(chatMessages);
    
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate draft reply
router.post('/generate-reply', async (req, res) => {
  try {
    const { emailId, customInstructions } = req.body;
    
    const email = await Email.findById(emailId);
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    const autoReplyPrompt = await Prompt.findOne({ 
      name: 'autoReply', 
      isActive: true 
    });
    
    if (!autoReplyPrompt) {
      return res.status(404).json({ error: 'Auto-reply prompt not found' });
    }
    
    let systemPrompt = autoReplyPrompt.content;
    
    if (customInstructions) {
      systemPrompt += `\n\nAdditional Instructions: ${customInstructions}`;
    }
    
    const emailContent = `From: ${email.sender}
Subject: ${email.subject}
Body: ${email.body}`;
    
    const reply = await callLLM(systemPrompt, emailContent);
    
    res.json({ 
      reply,
      originalEmail: {
        sender: email.sender,
        subject: email.subject
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Summarize email
router.post('/summarize', async (req, res) => {
  try {
    const { emailId } = req.body;
    
    const email = await Email.findById(emailId);
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    const systemPrompt = 'Summarize the following email in 2-3 concise sentences. Focus on the main points and any action items.';
    const emailContent = `From: ${email.sender}
Subject: ${email.subject}
Body: ${email.body}`;
    
    const summary = await callLLM(systemPrompt, emailContent);
    
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all urgent/important emails summary
router.post('/urgent-summary', async (req, res) => {
  try {
    const urgentEmails = await Email.find({ 
      category: { $in: ['Important', 'To-Do'] },
      processed: true
    }).sort({ timestamp: -1 });
    
    if (urgentEmails.length === 0) {
      return res.json({ 
        summary: 'No urgent or important emails found in your inbox.',
        count: 0,
        emails: []
      });
    }
    
    const emailsList = urgentEmails.slice(0, 10).map((email, idx) => 
      `${idx + 1}. From: ${email.sender}
   Subject: ${email.subject}
   Category: ${email.category}
   ${email.actionItems && email.actionItems.length > 0 ? `Action Items: ${email.actionItems.map(item => item.task).join('; ')}` : ''}`
    ).join('\n\n');
    
    const systemPrompt = `Provide a brief summary of these ${urgentEmails.length} urgent emails. Highlight the most critical items that need immediate attention.`;
    
    const summary = await callLLM(systemPrompt, `Total urgent emails: ${urgentEmails.length}\n\nTop 10 urgent emails:\n\n${emailsList}`);
    
    res.json({ 
      summary,
      count: urgentEmails.length,
      emails: urgentEmails
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;