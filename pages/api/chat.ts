import { NextApiRequest, NextApiResponse } from 'next';
import { calculateMaxDiscount, generateResponse, analyzeCustomerIntent } from '../../lib/negotiation';
const { generateChatResponse } = require('../../lib/gemini');

// Sample tire data for price negotiation
const tireNegotiationData = {
  discounts: {
    firstTime: 0.05, // 5% discount for first-time customers
    seasonal: 0.10, // 10% seasonal discount
    bundle: 0.15, // 15% discount for buying 4 or more tires
    competitor: 0.08, // 8% discount for matching competitor prices
  },
  prices: {
    1: 199.99, // Default price for tire ID 1
    2: 179.99,
    3: 189.99,
    4: 219.99,
    5: 199.99,
  } as Record<number, number>,
  costs: {
    1: 120.00, // Cost price for tire ID 1
    2: 110.00,
    3: 115.00,
    4: 130.00,
    5: 125.00,
  } as Record<number, number>
};

interface ConversationState {
  currentDiscount: number;
  agreedPrice: number | null;
  quantity: number;
  checkoutReady: boolean;
  tireId: number;
  tireName: string;
  basePrice: number;
  costPrice: number;
  isReturningCustomer: boolean;
  isPromotionalPeriod: boolean;
}

interface CustomerIntent {
  askingForDiscount: boolean;
  mentioningCompetitor: boolean;
  mentioningQuantity: boolean;
  readyToBuy: boolean;
  quantity: number;
}

interface DiscountInfo {
  originalPrice: number;
  discountRate: number;
  discountPercentage: number;
  discountAmount: number;
  finalPrice: number;
  breakdown: Array<{type: string; rate: number; note?: string}>;
  perTireDiscount: number;
  totalSavings: number;
}

interface ChatRequest {
  message: string;
  tireId: number;
  selectedTire?: {
    id: number;
    name: string;
    basePrice: number;
    offer_price?: number;
  };
  quantity?: number;
  sessionId?: string;
  messages?: Array<{
    sender: string;
    text: string;
  }>;
}

const userSessions: Record<string, ConversationState> = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { 
    message, 
    tireId, 
    selectedTire,
    quantity = 1,
    sessionId,
    messages = [] 
  } = req.body as ChatRequest;

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  // Create a unique session identifier based on tire and user info
  const sessionIdentifier = sessionId || `tire_${tireId}_${Date.now()}`;
  
  // Get or initialize session state
  if (!userSessions[sessionIdentifier]) {
    const tire = getTireInfo(tireId);
    userSessions[sessionIdentifier] = {
      currentDiscount: 0,
      agreedPrice: null,
      quantity: quantity || 1,
      checkoutReady: false,
      tireId: tire.id,
      tireName: tire.name,
      basePrice: tire.basePrice,
      costPrice: tire.costPrice,
      isReturningCustomer: false,
      isPromotionalPeriod: false
    };
  } else {
    // Update quantity if provided
    if (quantity) {
      userSessions[sessionIdentifier].quantity = quantity;
    }
  }
  
  // Get the current state
  const state = userSessions[sessionIdentifier];
  
  try {
    // First, analyze customer intent for quantity and checkout readiness
    const intent = analyzeCustomerIntent(message);
    
    // Update quantity if mentioned and greater than 0
    if (intent.mentioningQuantity && intent.quantity > 0) {
      state.quantity = intent.quantity;
    }
    
    // Extract quantity from the entire conversation if it exists
    if (!intent.mentioningQuantity && !state.quantity) {
      for (const msg of messages) {
        if (msg.sender === 'user') {
          const msgIntent = analyzeCustomerIntent(msg.text);
          if (msgIntent.mentioningQuantity && msgIntent.quantity > 0) {
            state.quantity = msgIntent.quantity;
            break;
          }
        }
      }
    }
    
    // Default to 1 if we still don't have a quantity
    if (!state.quantity) {
      state.quantity = 1;
    }
    
    // Check for checkout intent
    if (intent.readyToBuy || message.toLowerCase().includes('checkout') || message.toLowerCase().includes('proceed')) {
      state.checkoutReady = true;
      
      // Calculate final price with all discounts
      const discountInfo = calculateMaxDiscount({
        basePrice: state.basePrice,
        quantity: state.quantity,
        isReturningCustomer: state.isReturningCustomer,
        isPromotionalPeriod: state.isPromotionalPeriod,
        costPrice: state.costPrice,
        competitorPrice: null
      });
      
      state.agreedPrice = discountInfo.finalPrice;
      
      const finalPrice = state.agreedPrice || state.basePrice;
      const totalPrice = finalPrice * state.quantity;
      
      return res.status(200).json({ 
        message: `Great! I'll set up your order for ${state.quantity} ${state.tireName} tire${state.quantity > 1 ? 's' : ''} at $${finalPrice.toFixed(2)} each. Your total comes to $${totalPrice.toFixed(2)}. You can proceed to checkout now.`,
        action: {
          type: 'CHECKOUT',
          data: {
            tireId: state.tireId,
            quantity: state.quantity,
            pricePerTire: finalPrice,
            totalPrice: totalPrice
          }
        }
      });
    }
    
    // Format messages for the Gemini API
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    
    // Add the current message
    formattedMessages.push({
      role: 'user',
      content: message
    });
    
    // Get tire info for the chat context
    const tireInfo = selectedTire || getTireInfo(state.tireId);
    
    // Update basePrice if selectedTire provides one
    if (selectedTire?.basePrice) {
      state.basePrice = selectedTire.basePrice;
    }
    
    // Generate response from Gemini
    const geminiResponse = await generateChatResponse(formattedMessages, {
      name: tireInfo.name,
      basePrice: tireInfo.basePrice
    });
    
    // If user is asking for a discount or mentioning a competitor, 
    // we should apply our discount logic
    if (intent.askingForDiscount || intent.mentioningCompetitor) {
      // Calculate base discount based on quantity
      let baseDiscount = 0.05; // Default 5% for 1-3 tires
      if (state.quantity >= 4) {
        baseDiscount = 0.10; // 10% for 4 tires
      }
      if (state.quantity >= 5) {
        baseDiscount = 0.15; // 15% for 5+ tires
      }

      // Calculate additional discount based on context
      let additionalDiscount = 0;
      if (intent.mentioningCompetitor) {
        additionalDiscount = 0.05; // 5% for competitor mention
      }
      if (state.isReturningCustomer) {
        additionalDiscount = Math.max(additionalDiscount, 0.05); // 5% for returning customer
      }
      if (state.isPromotionalPeriod) {
        additionalDiscount = Math.max(additionalDiscount, 0.05); // 5% for promotional period
      }

      // Calculate final discount (capped at 25%)
      const totalDiscount = Math.min(baseDiscount + additionalDiscount, 0.25);
      
      // Calculate final price
      const finalPrice = state.basePrice * (1 - totalDiscount);
      
      // Update the state with new discount information
      state.agreedPrice = finalPrice;
      state.currentDiscount = totalDiscount;
      
      // Add negotiation flag to the response
      return res.status(200).json({ 
        message: geminiResponse,
        negotiation: {
          discountRate: totalDiscount,
          discountPercentage: Math.round(totalDiscount * 100),
          finalPrice: finalPrice
        }
      });
    }
    
    res.status(200).json({ message: geminiResponse });
  } catch (error) {
    console.error('Error in chat handler:', error);
    
    // Fallback to our rule-based response if Gemini API fails
    // We need to create a similar format to what the client expects
    try {
      // Create formatted messages in the format that generateChatResponse expects
      const formattedMessages = messages.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      
      // Add current message
      formattedMessages.push({
        role: 'user',
        content: message
      });
      
      // Get tire info
      const tireInfo = selectedTire || getTireInfo(state.tireId);
      
      // Generate fallback response
      const response = await generateChatResponse(formattedMessages, {
        name: tireInfo.name,
        basePrice: tireInfo.basePrice
      });
      
      res.status(200).json({ message: response });
    } catch (fallbackError) {
      // If even the fallback fails, return a simple message
      res.status(200).json({ 
        message: `I apologize for the confusion. For ${state.quantity} tires, I can offer you our standard discount. Would you like to proceed with checkout?`
      });
    }
  }
}

// Get tire information based on ID
function getTireInfo(tireId: number) {
  const defaultTire = {
    id: 1,
    name: "Michelin Pilot Sport 4S",
    basePrice: 199.99,
    costPrice: 120.00
  };
  
  // If tireId is not provided or invalid, return default tire info
  if (!tireId || !tireNegotiationData.prices[tireId]) {
    return defaultTire;
  }
  
  // Map tire IDs to names
  const tireNames: Record<number, string> = {
    1: "Michelin Pilot Sport 4S",
    2: "Continental ExtremeContact DWS06",
    3: "Bridgestone Potenza Sport",
    4: "Pirelli P Zero",
    5: "Goodyear Eagle F1 Asymmetric 5"
  };
  
  return {
    id: tireId,
    name: tireNames[tireId] || defaultTire.name,
    basePrice: tireNegotiationData.prices[tireId],
    costPrice: tireNegotiationData.costs[tireId] || (tireNegotiationData.prices[tireId] * 0.6) // default to 60% of price if no cost defined
  };
} 