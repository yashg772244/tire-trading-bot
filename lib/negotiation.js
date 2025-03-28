/**
 * Tire Trading Bot - Negotiation and Pricing Engine
 * 
 * This module implements dynamic pricing algorithms and negotiation strategies
 * for the tire trading chatbot.
 */

// Base discount tiers
const DISCOUNT_TIERS = {
  STANDARD: 0.05, // 5% for any customer
  VOLUME: 0.15,   // 15% for 4+ tires
  LOYALTY: 0.05,  // Additional 5% for returning customers
  SEASONAL: 0.08, // Additional 8% during promotions
  COMPETITOR: 0.05 // Additional 5% for price matching
};

// Minimum acceptable margin (30%)
const MIN_MARGIN = 0.30;

/**
 * Calculate the maximum possible discount based on various factors
 * 
 * @param {Object} params Parameters to calculate discount
 * @param {number} params.basePrice Base price of the tire
 * @param {number} params.quantity Number of tires being purchased
 * @param {boolean} params.isReturningCustomer Whether the customer has purchased before
 * @param {boolean} params.isPromotionalPeriod Whether we're in a promotional period
 * @param {number|null} [params.competitorPrice=null] Competitor's price for the same tire (if any)
 * @param {number} params.costPrice Our cost price for the tire
 * @returns {Object} The calculated discount information
 */
function calculateMaxDiscount({
  basePrice,
  quantity = 1,
  isReturningCustomer = false,
  isPromotionalPeriod = false,
  competitorPrice = null,
  costPrice
}) {
  let totalDiscountRate = DISCOUNT_TIERS.STANDARD;
  let discountBreakdown = [
    { type: 'Standard', rate: DISCOUNT_TIERS.STANDARD }
  ];
  
  // Apply volume discount for 4 or more tires
  if (quantity >= 4) {
    totalDiscountRate = DISCOUNT_TIERS.VOLUME;
    discountBreakdown = [
      { type: 'Volume', rate: DISCOUNT_TIERS.VOLUME }
    ];
  }
  
  // Add loyalty discount for returning customers
  if (isReturningCustomer) {
    totalDiscountRate += DISCOUNT_TIERS.LOYALTY;
    discountBreakdown.push({ type: 'Loyalty', rate: DISCOUNT_TIERS.LOYALTY });
  }
  
  // Add seasonal discount during promotional periods
  if (isPromotionalPeriod) {
    totalDiscountRate += DISCOUNT_TIERS.SEASONAL;
    discountBreakdown.push({ type: 'Seasonal', rate: DISCOUNT_TIERS.SEASONAL });
  }
  
  // Check if we need to price match or beat a competitor
  if (competitorPrice && competitorPrice < basePrice) {
    const competitorDiscountRate = 1 - (competitorPrice / basePrice);
    
    // If the competitor discount is better than our current offer
    if (competitorDiscountRate > totalDiscountRate) {
      // Add a bit extra to beat the competitor
      totalDiscountRate = competitorDiscountRate + DISCOUNT_TIERS.COMPETITOR;
      discountBreakdown = [{ 
        type: 'Competitor Match+', 
        rate: totalDiscountRate
      }];
    }
  }
  
  // Calculate the discounted price
  const discountAmount = basePrice * totalDiscountRate;
  let discountedPrice = basePrice - discountAmount;
  
  // Ensure we maintain minimum margin
  const minimumPrice = costPrice ? costPrice / (1 - MIN_MARGIN) : null;
  
  if (minimumPrice && discountedPrice < minimumPrice) {
    // Adjust discount to maintain minimum margin
    discountedPrice = minimumPrice;
    const adjustedDiscountRate = 1 - (discountedPrice / basePrice);
    totalDiscountRate = adjustedDiscountRate;
    
    discountBreakdown = [{ 
      type: 'Maximum Allowed', 
      rate: adjustedDiscountRate,
      note: 'Limited by minimum margin requirement'
    }];
  }
  
  return {
    originalPrice: basePrice,
    discountRate: totalDiscountRate,
    discountPercentage: Math.round(totalDiscountRate * 100),
    discountAmount,
    finalPrice: discountedPrice,
    breakdown: discountBreakdown,
    perTireDiscount: discountAmount,
    totalSavings: discountAmount * quantity
  };
}

/**
 * Generate a negotiation response based on the discount calculation
 * 
 * @param {Object} discountInfo The discount information from calculateMaxDiscount
 * @param {string} tireName The name of the tire
 * @param {number} quantity The quantity being purchased
 * @returns {string} A natural language response for the negotiation
 */
function generateResponse(discountInfo, tireName, quantity) {
  const responseTemplates = [
    `I can offer you a {discountPercentage}% discount on the {tireName}, bringing the price down to ${discountInfo.finalPrice.toFixed(2)} per tire. This is a special offer just for you.`,
    `Based on your interest in the {tireName}, I can offer a price of ${discountInfo.finalPrice.toFixed(2)} per tire, which includes a {discountPercentage}% discount from our regular price.`,
    `For the {tireName}, our regular price is ${discountInfo.originalPrice.toFixed(2)}, but I can offer you a special deal at ${discountInfo.finalPrice.toFixed(2)} per tire, which is a {discountPercentage}% discount.`,
    `I'd be happy to offer you a deal on the {tireName}. How about ${discountInfo.finalPrice.toFixed(2)} per tire? That's {discountPercentage}% off our standard price.`,
    `We value your business, so for the {tireName}, I can offer a {discountPercentage}% discount, making it just ${discountInfo.finalPrice.toFixed(2)} per tire instead of ${discountInfo.originalPrice.toFixed(2)}.`
  ];
  
  // Choose a random response template
  const template = responseTemplates[Math.floor(Math.random() * responseTemplates.length)];
  
  // Fill in the template with tire-specific information
  return template
    .replace(/{discountPercentage}/g, discountInfo.discountPercentage)
    .replace(/{tireName}/g, tireName);
}

/**
 * Process a customer message to determine their intent
 * 
 * @param {string} message The customer's message
 * @returns {Object} Information about the customer's intent
 */
function analyzeCustomerIntent(message) {
  const lowercaseMessage = message.toLowerCase();
  
  const intents = {
    askingForDiscount: false,
    mentioningCompetitor: false,
    mentioningQuantity: false,
    readyToBuy: false,
    quantity: 1
  };
  
  // Check if customer is asking for a discount
  if (lowercaseMessage.includes('discount') || 
      lowercaseMessage.includes('deal') || 
      lowercaseMessage.includes('cheaper') ||
      lowercaseMessage.includes('better price') ||
      lowercaseMessage.includes('too expensive')) {
    intents.askingForDiscount = true;
  }
  
  // Check if customer is mentioning a competitor
  if (lowercaseMessage.includes('competitor') || 
      lowercaseMessage.includes('other shop') ||
      lowercaseMessage.includes('somewhere else') ||
      lowercaseMessage.includes('price match')) {
    intents.mentioningCompetitor = true;
  }
  
  // Check if customer mentions quantity
  const quantityMatch = lowercaseMessage.match(/(\d+)\s*(?:tires?|tyres?)/i);
  if (quantityMatch && quantityMatch[1]) {
    intents.mentioningQuantity = true;
    intents.quantity = parseInt(quantityMatch[1], 10);
  }
  
  // Check if customer is ready to buy
  if (lowercaseMessage.includes('buy') || 
      lowercaseMessage.includes('purchase') ||
      lowercaseMessage.includes('get it') ||
      lowercaseMessage.includes('take it') ||
      lowercaseMessage.includes('deal') ||
      lowercaseMessage.includes('checkout')) {
    intents.readyToBuy = true;
  }
  
  return intents;
}

module.exports = {
  calculateMaxDiscount,
  generateResponse,
  analyzeCustomerIntent,
  DISCOUNT_TIERS
}; 