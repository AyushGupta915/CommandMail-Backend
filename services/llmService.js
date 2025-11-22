const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function callLLM(systemPrompt, userContent, options = {}) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: options.model || 'gemini-2.5-flash'
    });

    const fullPrompt = `${systemPrompt}\n\n${userContent}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`Failed to get Gemini response: ${error.message}`);
  }
}

async function callLLMChat(messages, options = {}) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: options.model || 'gemini-2.5-flash'
    });

    const chat = model.startChat({
      history: messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 1000,
      },
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`Failed to get Gemini response: ${error.message}`);
  }
}

module.exports = { callLLM, callLLMChat };