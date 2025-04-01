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
You are a tire expert and sales representative for an online tire store. You're helpful, friendly, and knowledgeable about tires.

Your name is TireBot, and you work for Gilda Tyres, a premium tire retailer.

TIRE INFORMATION:
- You are discussing the ${tireInfo.name} tire
- Regular price: $${tireInfo.basePrice.toFixed(2)}
- This is a ${getTireCategory(tireInfo.name)} tire
- Key features: exceptional grip, responsive handling, and excellent tread life

NEGOTIATION GUIDELINES:
- You can offer discounts based on quantity:
  * 5% discount for 1 tire
  * 8% discount for 2-3 tires
  * 11% discount for 4-6 tires
  * 15% discount for 7-9 tires
  * 18% discount for 10-12 tires
  * 20% discount for 13+ tires
- You can offer up to an additional 5% discount if the customer mentions competitors
- Don't offer more than 20% discount under any circumstances
- Be friendly but firm about your best prices
- For every negotiation, make the customer feel they're getting a special deal
- If the customer is interested in multiple tires, suggest the next quantity tier for a better discount

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
function generateFallbackResponse(messages, tireInfo) {
  // Get the last user message if available
  const lastUserMessage = messages.length > 0 ? messages[messages.length - 1].content.toLowerCase() : '';
  
  // Check for price negotiation intent
  if (lastUserMessage.includes('price') || 
      lastUserMessage.includes('discount') || 
      lastUserMessage.includes('deal') || 
      lastUserMessage.includes('offer')) {
    
    // Extract quantity information
    const quantityMatch = lastUserMessage.match(/(\d+)\s*tire/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    
    // Calculate discount based on quantity
    let discountPercent = 5;
    if (quantity >= 13) discountPercent = 20;
    else if (quantity >= 10) discountPercent = 18;
    else if (quantity >= 7) discountPercent = 15;
    else if (quantity >= 4) discountPercent = 11;
    else if (quantity >= 2) discountPercent = 8;
    
    const discountedPrice = tireInfo.basePrice * (1 - discountPercent/100);
    
    return `For the ${tireInfo.name}, I can offer you a ${discountPercent}% discount, bringing the price to $${discountedPrice.toFixed(2)} per tire. This is a great deal for this premium tire!`;
  }
  
  // Check for checkout or purchase intent
  if (lastUserMessage.includes('buy') || 
      lastUserMessage.includes('purchase') || 
      lastUserMessage.includes('checkout')) {
    return `Great choice! I'll set up your order for the ${tireInfo.name}. Would you like to proceed to checkout now?`;
  }
  
  // Default response
  return `The ${tireInfo.name} is one of our most popular tires. It offers exceptional performance, with excellent grip and handling characteristics. The regular price is $${tireInfo.basePrice.toFixed(2)} per tire, but we have special discounts available based on quantity. How many tires are you looking to purchase?`;
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