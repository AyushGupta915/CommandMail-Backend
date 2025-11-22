const { callLLM } = require('./llmService');
const Prompt = require('../models/Prompt');

async function processEmail(email) {
  try {
    const categorizationPrompt = await Prompt.findOne({ 
      name: 'categorization', 
      isActive: true 
    });
    
    const actionItemPrompt = await Prompt.findOne({ 
      name: 'actionItem', 
      isActive: true 
    });

    if (!categorizationPrompt || !actionItemPrompt) {
      throw new Error('Required prompts not found. Please initialize prompts first.');
    }

    const emailContent = `Subject: ${email.subject}\n\nFrom: ${email.sender}\n\nBody: ${email.body}`;

    console.log(`Processing email: ${email.subject}`);
    
    const categoryResponse = await callLLM(
      categorizationPrompt.content,
      emailContent
    );
    
    let category = categoryResponse.trim();
    const validCategories = ['Important', 'Newsletter', 'Spam', 'To-Do'];
    
    const foundCategory = validCategories.find(cat => 
      category.toLowerCase().includes(cat.toLowerCase())
    );
    category = foundCategory || 'Uncategorized';
    
    const actionItemsResponse = await callLLM(
      actionItemPrompt.content,
      emailContent
    );
    
    let actionItems = [];
    try {
      let cleanResponse = actionItemsResponse.trim();
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const parsed = JSON.parse(cleanResponse);
      actionItems = Array.isArray(parsed) ? parsed : [parsed];
      actionItems = actionItems.filter(item => item && item.task);
    } catch (e) {
      console.log('Action items not in valid JSON format');
      if (actionItemsResponse.toLowerCase().includes('task') || 
          actionItemsResponse.toLowerCase().includes('action')) {
        actionItems = [{
          task: actionItemsResponse.substring(0, 200),
          deadline: null
        }];
      }
    }

    console.log(`Email categorized as: ${category}, Action items: ${actionItems.length}`);

    return {
      category,
      actionItems
    };
  } catch (error) {
    console.error('Email processing error:', error);
    throw error;
  }
}

async function processEmailsBatch(emails, delayMs = 1000) {
  const results = [];
  
  for (let i = 0; i < emails.length; i++) {
    try {
      console.log(`Processing email ${i + 1}/${emails.length}`);
      const result = await processEmail(emails[i]);
      results.push({ email: emails[i], ...result, success: true });
      
      if (i < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Failed to process email ${emails[i]._id}:`, error);
      results.push({ 
        email: emails[i], 
        success: false, 
        error: error.message 
      });
    }
  }
  
  return results;
}

module.exports = { processEmail, processEmailsBatch };