import { PatternInfo } from './types';

// Analyze customer intent from their message
export function analyzeCustomerIntent(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Check for discount-related keywords
  const askingForDiscount = 
    lowerMessage.includes('discount') || 
    lowerMessage.includes('cheaper') || 
    lowerMessage.includes('better price') || 
    lowerMessage.includes('lower price') ||
    lowerMessage.includes('deal') ||
    lowerMessage.includes('offer') ||
    lowerMessage.includes('dscont') || // Handle typos
    lowerMessage.includes('more discount') ||
    lowerMessage.includes('further discount') ||
    lowerMessage.includes('better deal') ||
    lowerMessage.includes('good price') ||
    lowerMessage.includes('best price');
  
  // Check for competitor mentions
  const mentioningCompetitor = 
    lowerMessage.includes('competitor') || 
    lowerMessage.includes('other store') || 
    lowerMessage.includes('somewhere else') ||
    lowerMessage.includes('tire kingdom') ||
    lowerMessage.includes('discount tire') ||
    lowerMessage.includes('costco') ||
    lowerMessage.includes('walmart') ||
    lowerMessage.includes('amazon') ||
    lowerMessage.includes('cheaper at') ||
    lowerMessage.includes('less at') ||
    lowerMessage.includes('better price at');
  
  // Extract quantity mentions - support multiple formats
  let quantity = 1;
  let mentioningQuantity = false;
  
  // Method 1: Number followed by "tire/tires/tyres"
  const tireQuantityMatch = lowerMessage.match(/\b(\d+)\s*(?:tire|tires|tyres?)\b/i);
  if (tireQuantityMatch) {
    quantity = parseInt(tireQuantityMatch[1]);
    mentioningQuantity = true;
  } 
  // Method 2: Just a number (1-20 range to avoid confusion)
  else if (/^\s*(\d{1,2})\s*$/.test(lowerMessage)) {
    const numMatch = lowerMessage.match(/^\s*(\d{1,2})\s*$/);
    if (numMatch) {
      const parsedNum = parseInt(numMatch[1]);
      // Only consider pure numbers between 1-20 as quantities
      if (parsedNum >= 1 && parsedNum <= 20) {
        quantity = parsedNum;
        mentioningQuantity = true;
      }
    }
  }
  // Method 3: Text numbers
  else {
    const textNumbers: {[key: string]: number} = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 
      'five': 5, 'six': 6, 'seven': 7, 'eight': 8,
      'nine': 9, 'ten': 10, 'eleven': 11, 'twelve': 12,
      'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
      'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
      'nineteen': 19, 'twenty': 20
    };
    
    for (const [word, value] of Object.entries(textNumbers)) {
      const regex = new RegExp(`\\b${word}\\s*(?:tire|tires|tyres?)?\\b`, 'i');
      if (regex.test(lowerMessage)) {
        quantity = value;
        mentioningQuantity = true;
        break;
      }
    }
  }
  
  // Check if ready to buy
  const readyToBuy = 
    lowerMessage.includes('buy now') ||
    lowerMessage.includes('purchase') ||
    lowerMessage.includes('check out') ||
    lowerMessage.includes('checkout') ||
    lowerMessage.includes('add to cart') ||
    lowerMessage.includes('buy it') ||
    lowerMessage.includes('proceed') ||
    lowerMessage.includes('get it') ||
    lowerMessage.includes('i\'ll take it') ||
    lowerMessage.includes('i will take it') ||
    lowerMessage.includes('sounds good');
    
  return {
    askingForDiscount,
    mentioningCompetitor,
    mentioningQuantity,
    quantity: Math.max(1, quantity), // Ensure quantity is at least 1
    readyToBuy
  };
}

// Calculate maximum discount based on various factors
export function calculateMaxDiscount(params: {
  basePrice: number;
  quantity: number;
  isReturningCustomer: boolean;
  isPromotionalPeriod: boolean;
  costPrice: number;
  competitorPrice: number | null;
}) {
  const { basePrice, quantity, isReturningCustomer, isPromotionalPeriod, costPrice, competitorPrice } = params;
  
  // Track all applicable discounts to explain to customer
  const discountBreakdown: Array<{type: string; rate: number; note?: string}> = [];
  
  // Base discount rate starts at 0
  let totalDiscountRate = 0;
  
  // Quantity-based discounts - this is the primary discount structure
  let quantityDiscountRate = 0;
  
  // Implement the new quantity-based discount tiers
  if (quantity >= 13) {
    quantityDiscountRate = 0.20; // 20% for 13+ tires
    discountBreakdown.push({ type: 'Bulk Purchase', rate: quantityDiscountRate, note: '20% off for 13+ tires' });
  } else if (quantity >= 10) {
    quantityDiscountRate = 0.18; // 18% for 10-12 tires
    discountBreakdown.push({ type: 'Bulk Purchase', rate: quantityDiscountRate, note: '18% off for 10-12 tires' });
  } else if (quantity >= 7) {
    quantityDiscountRate = 0.15; // 15% for 7-9 tires
    discountBreakdown.push({ type: 'Bulk Purchase', rate: quantityDiscountRate, note: '15% off for 7-9 tires' });
  } else if (quantity >= 4) {
    quantityDiscountRate = 0.11; // 11% for 4-6 tires
    discountBreakdown.push({ type: 'Bulk Purchase', rate: quantityDiscountRate, note: '11% off for 4-6 tires' });
  } else if (quantity >= 2) {
    quantityDiscountRate = 0.08; // 8% for 2-3 tires
    discountBreakdown.push({ type: 'Bulk Purchase', rate: quantityDiscountRate, note: '8% off for 2-3 tires' });
  } else {
    quantityDiscountRate = 0.05; // 5% for 1 tire
    discountBreakdown.push({ type: 'Standard Discount', rate: quantityDiscountRate, note: '5% off for single tire purchase' });
  }
  
  // Add the quantity discount to total
  totalDiscountRate += quantityDiscountRate;
  
  // Additional small discount for returning customers
  if (isReturningCustomer) {
    const loyaltyRate = 0.02; // 2% loyalty discount
    totalDiscountRate += loyaltyRate;
    discountBreakdown.push({ type: 'Loyalty', rate: loyaltyRate, note: '2% for returning customers' });
  }
  
  // Promotional period discount (seasonal sales, etc.)
  if (isPromotionalPeriod) {
    const promoRate = 0.03; // 3% promo discount
    totalDiscountRate += promoRate;
    discountBreakdown.push({ type: 'Promotional', rate: promoRate, note: '3% seasonal promotion' });
  }
  
  // Match competitor pricing if provided and it would result in a bigger discount
  if (competitorPrice && competitorPrice < basePrice) {
    const competitorDiscountRate = (basePrice - competitorPrice) / basePrice;
    
    // Only use competitor price if it would give a better discount
    if (competitorDiscountRate > totalDiscountRate) {
      totalDiscountRate = competitorDiscountRate;
      discountBreakdown.length = 0; // Clear previous breakdown
      discountBreakdown.push({ 
        type: 'Competitor Match', 
        rate: competitorDiscountRate, 
        note: 'Price matched to competitor offer'
      });
    }
  }
  
  // Ensure we don't go below cost + minimum margin
  const minimumMarginPercent = 0.15; // 15% minimum margin
  const floorPrice = costPrice * (1 + minimumMarginPercent);
  
  // Calculate the discounted price
  let discountAmount = basePrice * totalDiscountRate;
  let finalPrice = basePrice - discountAmount;
  
  // Ensure price doesn't go below floor price
  if (finalPrice < floorPrice) {
    finalPrice = floorPrice;
    discountAmount = basePrice - finalPrice;
    totalDiscountRate = discountAmount / basePrice;
    
    // Update the breakdown to reflect the adjusted discount
    discountBreakdown.push({ 
      type: 'Adjustment', 
      rate: 0, 
      note: 'Discount limited by minimum pricing policy'
    });
  }
  
  // Calculate total savings
  const perTireDiscount = discountAmount;
  const totalSavings = perTireDiscount * quantity;
  
  return {
    originalPrice: basePrice,
    discountRate: totalDiscountRate,
    discountPercentage: Math.round(totalDiscountRate * 100),
    discountAmount: discountAmount,
    finalPrice: finalPrice,
    breakdown: discountBreakdown,
    perTireDiscount: perTireDiscount,
    totalSavings: totalSavings
  };
}

// Generate human-friendly response about pricing
export function generateResponse(customerIntent: any, discountInfo: any, tireName: string, quantity: number) {
  const { discountPercentage, finalPrice, originalPrice, totalSavings } = discountInfo;
  
  // Different response templates based on discount amount
  const responseTemplates = {
    small: [
      `I can offer you the ${tireName} at $${finalPrice.toFixed(2)} each, which includes a ${discountPercentage}% discount.`,
      `For the ${tireName}, I can give you a ${discountPercentage}% discount, making it $${finalPrice.toFixed(2)} per tire.`
    ],
    medium: [
      `I'd be happy to offer you a special deal on the ${tireName}. How about $${finalPrice.toFixed(2)} per tire? That's ${discountPercentage}% off our regular price of $${originalPrice.toFixed(2)}.`,
      `For your order of ${quantity} ${tireName} tires, I can offer them at $${finalPrice.toFixed(2)} each with a ${discountPercentage}% discount. You'll save a total of $${totalSavings.toFixed(2)}.`
    ],
    large: [
      `Great news! I can offer you an exceptional deal on the ${tireName}. With our ${discountPercentage}% discount, you'll pay just $${finalPrice.toFixed(2)} per tire instead of the regular $${originalPrice.toFixed(2)}. For ${quantity} tires, that's a total savings of $${totalSavings.toFixed(2)}!`,
      `I've got a special offer for you on the ${tireName}. With our ${discountPercentage}% discount, the price drops from $${originalPrice.toFixed(2)} to just $${finalPrice.toFixed(2)} per tire. On your order of ${quantity} tires, you'll save $${totalSavings.toFixed(2)} total!`
    ]
  };
  
  // Select appropriate template based on discount percentage
  let templateCategory;
  if (discountPercentage >= 15) {
    templateCategory = responseTemplates.large;
  } else if (discountPercentage >= 10) {
    templateCategory = responseTemplates.medium;
  } else {
    templateCategory = responseTemplates.small;
  }
  
  // Randomly select a template from the appropriate category
  const selectedTemplate = templateCategory[Math.floor(Math.random() * templateCategory.length)];
  
  // Check if we should suggest buying more tires - only for the immediate next tier
  let upsellSuggestion = '';
  
  // Find the immediate next tier based on current quantity
  let nextTier = 0;
  let nextDiscount = 0;
  
  if (quantity < 2) {
    nextTier = 2;
    nextDiscount = 8;
  } else if (quantity >= 2 && quantity < 4) {
    nextTier = 4;
    nextDiscount = 11;
  } else if (quantity >= 4 && quantity < 7) {
    nextTier = 7;
    nextDiscount = 15;
  } else if (quantity >= 7 && quantity < 10) {
    nextTier = 10;
    nextDiscount = 18;
  } else if (quantity >= 10 && quantity < 13) {
    nextTier = 13;
    nextDiscount = 20;
  }
  
  // Only add upsell suggestion if there is a next tier
  if (nextTier > 0) {
    const additionalTires = nextTier - quantity;
    upsellSuggestion = ` By the way, if you purchase ${additionalTires} more tire${additionalTires > 1 ? 's' : ''} (total of ${nextTier}), I could offer you a ${nextDiscount}% discount instead!`;
  }
  
  return selectedTemplate + upsellSuggestion;
} 