/**
 * Gemini API integration for the Tire Trading Bot
 * This module provides a wrapper around the Google Generative AI SDK
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Check if API key exists before initializing
const apiKey = process.env.GEMINI_API_KEY || '';
const isApiKeyValid = apiKey && apiKey.length > 0;

// Only initialize if API key is present
const genAI = isApiKeyValid ? new GoogleGenerativeAI(apiKey) : null;

// The model to use for chat
const MODEL_NAME = "gemini-pro";

/**
 * Create a system prompt that combines general instructions and tire knowledge
 * @param {object} tireInfo - Information about the tire being discussed
 * @returns {string} - The system prompt
 */
function createSystemPrompt(tireInfo) {
  return `
You are a professional tire sales assistant with expertise in tire specifications, pricing, and customer service. Your goal is to help customers find the right tires while maintaining a professional and helpful demeanor.

Key Guidelines:
1. Always be polite and professional
2. Focus on tire features and benefits
3. Be transparent about pricing
4. Help customers make informed decisions
5. Maintain context throughout the conversation

Tire Knowledge:
- Understand tire specifications (size, load index, speed rating)
- Know about different tire categories (summer, all-season, winter)
- Be familiar with major tire brands and their specialties
- Understand tire performance characteristics

Negotiation Guidelines:
1. Standard Discounts:
   - 1-3 tires: 5% discount
   - 4 tires: 10% discount
   - 5+ tires: 15% discount

2. Special Discounts (Only through negotiation):
   - First-time customer bonus: +5%
   - Seasonal promotions: +5%
   - Bundle deals: +5%
   - Competitor price matching: Up to +10%

3. Negotiation Rules:
   - Only suggest one tier higher than current quantity
   - Maximum total discount: 25%
   - Always maintain profitability
   - Be transparent about discount calculations

4. Response Structure:
   - Acknowledge customer's request
   - Provide relevant information
   - Suggest appropriate discounts
   - Guide towards checkout when ready

Remember: Your goal is to help customers while maintaining fair pricing and business sustainability.

TIRE INFORMATION:
- You are discussing the ${tireInfo.name} tire
- Regular price: $${tireInfo.basePrice.toFixed(2)}
- This is a ${getTireCategory(tireInfo.name)} tire
- Key features: exceptional grip, responsive handling, and excellent tread life
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
  // Check if API is properly configured
  if (!isApiKeyValid || !genAI) {
    console.warn("Gemini API key not configured. Using rule-based fallback responses.");
    return generateFallbackResponse(messages, tireInfo);
  }
  
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
    return generateFallbackResponse(messages, tireInfo);
  }
}

/**
 * Generate a fallback response when Gemini API is unavailable
 * @param {array} messages - Array of messages in the conversation
 * @param {object} tireInfo - Information about the tire being discussed
 * @returns {string} - A fallback response
 */
async function generateFallbackResponse(messages, tireInfo) {
  const lastUserMessage = messages[messages.length - 1].content.toLowerCase();
  const previousBotMessages = messages.filter(m => m.role === 'assistant').map(m => m.content);
  
  // Extract quantity from user message or previous context
  const quantityMatch = lastUserMessage.match(/\d+/);
  const quantity = quantityMatch ? parseInt(quantityMatch[0]) : 1;
  
  // Calculate base discount
  let baseDiscount = 0.05; // Default 5% for 1-3 tires
  if (quantity >= 4) {
    baseDiscount = 0.10; // 10% for 4 tires
  }
  if (quantity >= 5) {
    baseDiscount = 0.15; // 15% for 5+ tires
  }
  
  // Calculate final price
  const finalPrice = tireInfo.basePrice * (1 - baseDiscount);
  
  // Check for specific intents in the message
  if (lastUserMessage.includes('discount') || lastUserMessage.includes('price')) {
    return `For ${quantity} ${tireInfo.name} tire${quantity > 1 ? 's' : ''}, I can offer you a ${Math.round(baseDiscount * 100)}% discount, bringing the price to $${finalPrice.toFixed(2)} per tire. Would you like to proceed with the purchase?`;
  }
  
  if (lastUserMessage.includes('complain') || lastUserMessage.includes('expensive')) {
    return `I understand your concern about the price. For ${quantity} tire${quantity > 1 ? 's' : ''}, I can offer you a ${Math.round(baseDiscount * 100)}% discount, which brings the price down to $${finalPrice.toFixed(2)} per tire. This is our best price for this quantity. Would you like to proceed with the purchase?`;
  }
  
  if (lastUserMessage.includes('buy') || lastUserMessage.includes('purchase') || lastUserMessage.includes('checkout')) {
    return `Great! I'll set up your order for ${quantity} ${tireInfo.name} tire${quantity > 1 ? 's' : ''} at $${finalPrice.toFixed(2)} per tire with a ${Math.round(baseDiscount * 100)}% discount. Would you like to proceed to checkout?`;
  }
  
  // Default response
  return `The ${tireInfo.name} is an excellent choice! For ${quantity} tire${quantity > 1 ? 's' : ''}, I can offer you a ${Math.round(baseDiscount * 100)}% discount, bringing the price to $${finalPrice.toFixed(2)} per tire. Would you like to learn more about the features or proceed with the purchase?`;
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