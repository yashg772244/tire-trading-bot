import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/ChatInterface.module.css';
import { useRouter } from 'next/router';

interface Message {
  role: 'user' | 'bot';
  content: string;
  showCheckoutButton?: boolean;
  checkoutData?: {
    tireId: number;
    quantity: number;
    pricePerTire: number;
    totalPrice: number;
  }
}

interface ChatProps {
  tireId: number;
  tireName: string;
}

interface TireInfo {
  brand: string;
  model: string;
  basePrice: number;
  features: string[];
  reviews: string[];
  warranty: string;
}

// Sample tire data - this would normally come from a database
const tireData: Record<string, TireInfo> = {
  "michelin pilot sport 4s": {
    brand: "Michelin",
    model: "Pilot Sport 4S",
    basePrice: 299.99,
    features: [
      "Summer performance",
      "Maximum grip",
      "Precise handling",
      "Short braking distances",
      "Sporty driving experience",
      "Premium construction"
    ],
    reviews: [
      "Exceptional grip and handling on dry roads",
      "Very responsive steering and cornering",
      "Excellent braking performance",
      "Premium price but premium performance"
    ],
    warranty: "30,000 miles"
  }
};

const CursorChatInterface: React.FC<ChatProps> = ({ tireId, tireName }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: `Hi! I'm your tire expert for the ${tireName}. How can I help you today?` }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processClientSideChat = (userMessage: string) => {
    // This function contains the business logic to determine responses
    // without relying on external API calls
    
    const lowerMessage = userMessage.toLowerCase();
    const normalizedTireName = tireName.toLowerCase();
    const tireInfo = tireData[normalizedTireName] || tireData["michelin pilot sport 4s"];
    
    // Extract quantity from message
    const quantityMatch = lowerMessage.match(/(\d+)\s*(?:tire|tyre)s?/i);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    
    // Determine intent
    let intent = 'general';
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || 
        lowerMessage.includes('discount') || lowerMessage.includes('offer') ||
        lowerMessage.includes('deal')) {
      intent = 'price';
    } else if (lowerMessage.includes('feature') || lowerMessage.includes('spec') || 
               lowerMessage.includes('quality') || lowerMessage.includes('performance')) {
      intent = 'features';
    } else if (lowerMessage.includes('buy') || lowerMessage.includes('purchase') || 
               lowerMessage.includes('checkout') || lowerMessage.includes('get')) {
      intent = 'purchase';
    } else if (lowerMessage.includes('review') || lowerMessage.includes('rating') || 
               lowerMessage.includes('what do people say')) {
      intent = 'reviews';
    }
    
    // Generate appropriate response based on intent
    let response = '';
    let showCheckout = false;
    let checkoutData: Message['checkoutData'] = undefined;
    
    // Add upselling suggestion based on quantity
    const getUpsellSuggestion = (qty: number): string => {
      if (qty === 1) {
        return " I notice you're only looking at a single tire. For optimal performance and balanced handling, I'd recommend getting a matching set of at least 2 tires for the same axle. Would you like to consider 2 instead?";
      } else if (qty === 2) {
        return " While 2 tires is good for replacing a single axle, most drivers find that replacing all 4 tires gives you the best handling, traction, and safety benefits. Would you like to upgrade to 4 tires for complete performance?";
      } else if (qty === 3) {
        return " I notice you're looking at 3 tires. For optimal performance and balanced handling, I'd recommend getting a complete set of 4 tires. This ensures even wear and the best driving experience. Would you like to add one more for a complete set?";
      } else if (qty === 4) {
        return " A set of 4 is perfect! Though many of our customers also purchase a 5th tire as a full-size spare for peace of mind, especially for longer trips. Would you be interested in adding a spare tire?";
      }
      return "";
    };
    
    switch (intent) {
      case 'price':
        // Calculate discount based on quantity
        const discountPercent = quantity >= 4 ? 15 : (quantity >= 2 ? 12 : 8);
        const discountAmount = (tireInfo.basePrice * discountPercent) / 100;
        const finalPrice = tireInfo.basePrice - discountAmount;
        const totalPrice = finalPrice * quantity;
        
        response = `For the ${tireInfo.brand} ${tireInfo.model}, I can offer you a ${discountPercent}% discount, bringing the price down to $${finalPrice.toFixed(2)} per tire. For ${quantity} tire${quantity > 1 ? 's' : ''}, that would be a total of $${totalPrice.toFixed(2)}.`;
        
        // Add upsell suggestion based on quantity
        if (quantity <= 4) {
          response += getUpsellSuggestion(quantity);
        }
        
        if (lowerMessage.includes('best') || lowerMessage.includes('offer') || lowerMessage.includes('deal')) {
          response += ` This is our best offer for quality tires like these, and includes free mounting and balancing (a $25 value per tire).`;
          showCheckout = true;
          checkoutData = {
            tireId,
            quantity,
            pricePerTire: finalPrice,
            totalPrice
          };
        }
        break;
        
      case 'features':
        const featuresList = tireInfo.features.slice(0, 3).join(', ');
        response = `The ${tireInfo.brand} ${tireInfo.model} features ${featuresList}. They're designed for excellent performance in both wet and dry conditions, with superior grip and responsive handling. The warranty covers ${tireInfo.warranty}.`;
        break;
        
      case 'reviews':
        response = `Customers love the ${tireInfo.brand} ${tireInfo.model}. Here's what they say: "${tireInfo.reviews[0]}" and "${tireInfo.reviews[1]}". These tires consistently receive 4.8/5 stars from our customers.`;
        break;
        
      case 'purchase':
        const purchaseDiscountPercent = quantity >= 4 ? 20 : (quantity >= 2 ? 15 : 10);
        const purchaseDiscountAmount = (tireInfo.basePrice * purchaseDiscountPercent) / 100;
        const purchaseFinalPrice = tireInfo.basePrice - purchaseDiscountAmount;
        const purchaseTotalPrice = purchaseFinalPrice * quantity;
        
        response = `Great choice! I can set you up with ${quantity} ${tireInfo.brand} ${tireInfo.model} tire${quantity > 1 ? 's' : ''} for a total of $${purchaseTotalPrice.toFixed(2)} (that's $${purchaseFinalPrice.toFixed(2)} per tire, which includes a special ${purchaseDiscountPercent}% discount).`;
        
        // Add upsell suggestion based on quantity
        if (quantity <= 4) {
          response += getUpsellSuggestion(quantity);
        }
        
        response += " Would you like to proceed to checkout?";
        
        showCheckout = true;
        checkoutData = {
          tireId,
          quantity,
          pricePerTire: purchaseFinalPrice,
          totalPrice: purchaseTotalPrice
        };
        break;
        
      default:
        response = `I'm happy to help with information about the ${tireInfo.brand} ${tireInfo.model}. These are premium ${tireInfo.features[0].toLowerCase()} tires with ${tireInfo.features[1].toLowerCase()}. Would you like to know about pricing, features, or customer reviews?`;
    }
    
    return {
      response,
      showCheckout,
      checkoutData
    };
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user' as const, content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Process the message client-side
    setTimeout(() => {
      const { response, showCheckout, checkoutData } = processClientSideChat(inputValue);
      
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: response,
        showCheckoutButton: showCheckout,
        checkoutData
      }]);
      
      setIsLoading(false);
    }, 800); // Small delay to simulate processing
  };

  const handleCheckout = (checkoutData?: Message['checkoutData']) => {
    if (!checkoutData) return;
    
    // Create checkout URL with data as query params
    const params = new URLSearchParams();
    params.append('tireId', tireId.toString());
    params.append('quantity', checkoutData.quantity.toString());
    params.append('pricePerTire', checkoutData.pricePerTire.toString());
    params.append('totalPrice', checkoutData.totalPrice.toString());
    
    // Calculate mounting price - $25 per tire
    const mountingPrice = checkoutData.quantity * 25;
    params.append('mountingPrice', mountingPrice.toString());
    
    // Navigate directly to checkout page
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messagesContainer}>
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`${styles.message} ${
              message.role === 'user' ? styles.userMessage : styles.assistantMessage
            }`}
          >
            <div className={styles.messageContent}>{message.content}</div>
            {message.showCheckoutButton && message.checkoutData && (
              <button 
                className={styles.checkoutButton}
                onClick={() => handleCheckout(message.checkoutData)}
              >
                Proceed to Checkout
              </button>
            )}
          </div>
        ))}
        {isLoading && (
          <div className={`${styles.message} ${styles.assistantMessage}`}>
            <div className={styles.typingIndicator}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className={styles.inputContainer}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask me about this tire..."
          className={styles.inputField}
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className={styles.sendButton}
          disabled={isLoading || !inputValue.trim()}
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default CursorChatInterface; 