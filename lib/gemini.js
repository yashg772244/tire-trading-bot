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
  
  // Keep track of previous conversations to avoid repetition
  const previousBotMessages = messages
    .filter(msg => msg.role === 'assistant' || msg.role === 'bot')
    .map(msg => msg.content);
  
  // Extract quantity information from the entire conversation context
  let quantity = 1;
  for (const message of messages) {
    const quantityMatch = message.content.toLowerCase().match(/(\d+)\s*tire/);
    if (quantityMatch) {
      quantity = parseInt(quantityMatch[1]);
      // Use the most recent quantity mentioned
    }
  }
  
  // Calculate discount based on quantity
  let discountPercent = 5;
  if (quantity >= 13) discountPercent = 20;
  else if (quantity >= 10) discountPercent = 18;
  else if (quantity >= 7) discountPercent = 15;
  else if (quantity >= 4) discountPercent = 11;
  else if (quantity >= 2) discountPercent = 8;
  
  const discountedPrice = (tireInfo.basePrice * (1 - discountPercent/100)).toFixed(2);
  const totalPrice = (discountedPrice * quantity).toFixed(2);
  
  // Check for discount or price questions
  if (lastUserMessage.includes('discount') || 
      lastUserMessage.includes('price') || 
      lastUserMessage.includes('offer') ||
      lastUserMessage.includes('deal')) {
    
    return `For ${quantity} ${tireInfo.name} tire${quantity > 1 ? 's' : ''}, I can offer an ${discountPercent}% discount, which brings the price to $${discountedPrice} per tire. This is a total of $${totalPrice} for all ${quantity} tires. Would you like to proceed with this purchase?`;
  }
  
  // Check for quantity updates
  if (/^[0-9]+$/.test(lastUserMessage.trim())) {
    // User just entered a number, likely a quantity
    const newQuantity = parseInt(lastUserMessage.trim());
    
    // Recalculate discount for the new quantity
    let newDiscountPercent = 5;
    if (newQuantity >= 13) newDiscountPercent = 20;
    else if (newQuantity >= 10) newDiscountPercent = 18;
    else if (newQuantity >= 7) newDiscountPercent = 15;
    else if (newQuantity >= 4) newDiscountPercent = 11;
    else if (newQuantity >= 2) newDiscountPercent = 8;
    
    const newDiscountedPrice = (tireInfo.basePrice * (1 - newDiscountPercent/100)).toFixed(2);
    const newTotalPrice = (newDiscountedPrice * newQuantity).toFixed(2);
    
    return `Great! For ${newQuantity} ${tireInfo.name} tire${newQuantity > 1 ? 's' : ''}, I can offer you a ${newDiscountPercent}% discount. That's $${newDiscountedPrice} per tire, for a total of $${newTotalPrice}. Would you like to proceed with this purchase?`;
  }
  
  // Check for complaints or frustration
  if (lastUserMessage.includes('not working') || 
      lastUserMessage.includes('not responding') || 
      lastUserMessage.includes('bad') ||
      lastUserMessage.includes('terrible') ||
      lastUserMessage.includes('useless') ||
      lastUserMessage.includes('wrong') ||
      lastUserMessage.includes('not conversing')) {
    
    return `I apologize for the confusion. Let me help you with your purchase of ${quantity} ${tireInfo.name} tire${quantity > 1 ? 's' : ''}. With our current promotion, you qualify for a ${discountPercent}% discount, bringing the price to $${discountedPrice} per tire. Would you like to proceed or do you have any other questions?`;
  }
  
  // Check for checkout or purchase intent
  if (lastUserMessage.includes('buy') || 
      lastUserMessage.includes('purchase') || 
      lastUserMessage.includes('checkout') ||
      lastUserMessage.includes('get it') ||
      lastUserMessage.includes('proceed')) {
    
    return `Perfect! I'll set up your order for ${quantity} ${tireInfo.name} tire${quantity > 1 ? 's' : ''} at $${discountedPrice} each, with a total of $${totalPrice}. You can proceed to checkout now, or ask if you have any other questions.`;
  }
  
  // Avoid repeating the same message
  if (previousBotMessages.length > 0 && 
      previousBotMessages[previousBotMessages.length - 1].includes("How many tires are you looking to purchase?")) {
    
    return `For the ${tireInfo.name}, we offer different discount tiers based on quantity:
    • 5% off for 1 tire
    • 8% off for 2-3 tires
    • 11% off for 4-6 tires
    • 15% off for 7-9 tires
    • 18% off for 10-12 tires
    • 20% off for 13+ tires
    
    Based on ${quantity} tire${quantity > 1 ? 's' : ''}, your price would be $${discountedPrice} per tire. Would you like to proceed with this purchase?`;
  }
  
  // Default response
  return `The ${tireInfo.name} is one of our premium tires, offering exceptional performance with excellent grip and handling. The regular price is $${tireInfo.basePrice.toFixed(2)} per tire, but I can offer you a ${discountPercent}% discount for ${quantity} tire${quantity > 1 ? 's' : ''}, bringing the price to $${discountedPrice} each. Would you like to proceed with this purchase?`;
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