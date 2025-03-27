/**
 * Gemini API integration for the Tire Trading Bot
 * This module provides a wrapper around the Google Generative AI SDK
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini API with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// The model to use for chat
const MODEL_NAME = "gemini-pro";

/**
 * Create a system prompt that combines general instructions and tire knowledge
 * @param {object} tireInfo - Information about the tire being discussed
 * @returns {string} - The system prompt
 */
function createSystemPrompt(tireInfo) {
  return `
You are a tire expert and sales representative for an online tire store. You're helpful, friendly, and knowledgeable about tires.

Your name is TireBot, and you work for Gilda Tyres, a premium tire retailer.

TIRE INFORMATION:
- You are discussing the ${tireInfo.name} tire
- Regular price: $${tireInfo.basePrice.toFixed(2)}
- This is a ${getTireCategory(tireInfo.name)} tire
- Key features: exceptional grip, responsive handling, and excellent tread life

NEGOTIATION GUIDELINES:
- You can offer discounts based on quantity (15% for 4+ tires)
- Standard discount is 5% for any customer
- You can offer up to 10% discount if the customer mentions competitors
- Don't offer more than 20% discount under any circumstances
- Be friendly but firm about your best prices
- For every negotiation, make the customer feel they're getting a special deal

Focus on building rapport and understanding the customer's needs while guiding them toward a purchase.
`;
}

/**
 * Determine the tire category based on the name
 * @param {string} tireName - The name of the tire
 * @returns {string} - The category of the tire
 */
function getTireCategory(tireName) {
  const tireCategories = {
    "Michelin Pilot Sport 4S": "Ultra High Performance Summer",
    "Continental ExtremeContact DWS06": "Ultra High Performance All-Season",
    "Bridgestone Potenza Sport": "Max Performance Summer",
    "Pirelli P Zero": "Max Performance Summer",
    "Goodyear Eagle F1 Asymmetric 5": "Ultra High Performance Summer"
  };
  
  return tireCategories[tireName] || "High Performance";
}

/**
 * Generate a chat response using Gemini API
 * @param {array} messages - Array of previous messages in the conversation
 * @param {object} tireInfo - Information about the tire being discussed
 * @returns {Promise<string>} - The generated response
 */
async function generateChatResponse(messages, tireInfo) {
  try {
    // Get the model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Format messages for Gemini API
    const systemPrompt = createSystemPrompt(tireInfo);
    
    // Create a chat instance
    const chat = model.startChat({
      history: formatMessagesForGemini(messages),
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });
    
    // Send the system prompt as the first message if this is a new conversation
    if (messages.length === 0) {
      const result = await chat.sendMessage(systemPrompt);
      return result.response.text();
    }
    
    // Get the last user message
    const lastUserMessage = messages[messages.length - 1].content;
    
    // Send the message and get the response
    const result = await chat.sendMessage(lastUserMessage);
    return result.response.text();
  } catch (error) {
    console.error("Error generating chat response with Gemini:", error);
    // Fallback to a predefined response if Gemini API fails
    return `I apologize, but I'm having trouble connecting to my knowledge base right now. The ${tireInfo.name} is available for $${tireInfo.basePrice.toFixed(2)}. Please let me know if you'd like to know more about this tire or if you're interested in making a purchase.`;
  }
}

/**
 * Format messages for Gemini API
 * @param {array} messages - Array of messages in the conversation
 * @returns {array} - Formatted messages for Gemini API
 */
function formatMessagesForGemini(messages) {
  return messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));
}

module.exports = {
  generateChatResponse
}; 