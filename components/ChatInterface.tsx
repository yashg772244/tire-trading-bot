import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/ChatInterface.module.css';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';

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

const ChatInterface: React.FC<ChatProps> = ({ tireId, tireName }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: `Hi! I'm your tire expert for the ${tireName}. How can I help you today?` }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [negotiatedDiscount, setNegotiatedDiscount] = useState<number | null>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add this effect to load any previously saved discount on mount
  useEffect(() => {
    // Check if we have a saved negotiated discount for this tire
    const savedDiscounts = localStorage.getItem('negotiatedDiscounts');
    if (savedDiscounts) {
      try {
        const discounts = JSON.parse(savedDiscounts);
        if (discounts[tireId]) {
          setNegotiatedDiscount(discounts[tireId].discountRate);
        }
      } catch (e) {
        console.error('Error parsing saved discounts:', e);
      }
    }
  }, [tireId]);

  // Add this function to save negotiated discounts
  const saveNegotiatedDiscount = (discount: number, price: number) => {
    const savedDiscounts = localStorage.getItem('negotiatedDiscounts') || '{}';
    try {
      const discounts = JSON.parse(savedDiscounts);
      discounts[tireId] = { 
        discountRate: discount,
        negotiatedPrice: price,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('negotiatedDiscounts', JSON.stringify(discounts));
      setNegotiatedDiscount(discount);
    } catch (e) {
      console.error('Error saving negotiated discount:', e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user' as const, content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setApiError(null);

    try {
      // Extract quantity from message if present
      const quantityMatch = inputValue.toLowerCase().match(/(\d+)\s*(?:tire|tyre)s?/i);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;

      // Send message to backend for processing
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          tireId,
          selectedTire: {
            id: tireId,
            name: tireName,
            basePrice: 199.99 // This should be passed as prop in a real implementation
          },
          quantity,
          messages: messages.map(msg => ({
            sender: msg.role,
            text: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();

      // Add handling for negotiation data in the response
      if (data.negotiation) {
        // Save the negotiated discount
        saveNegotiatedDiscount(data.negotiation.discountRate, data.negotiation.finalPrice);
      }

      // Add bot response
      if (data.action && data.action.type === 'CHECKOUT') {
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: data.message,
          showCheckoutButton: true,
          checkoutData: data.action.data
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: data.message 
        }]);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setApiError('Sorry, there was an error communicating with our server. Please try again in a moment.');
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Sorry, there was an error processing your request. Our team is working on it!' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Modify the handleCheckout function
  const handleCheckout = (checkoutData?: Message['checkoutData']) => {
    if (!checkoutData) return;
    
    // Save the negotiated discount when adding to cart
    const originalPrice = checkoutData.pricePerTire * (1 / 0.95); // Assuming 5% standard discount
    const actualDiscount = (originalPrice - checkoutData.pricePerTire) / originalPrice;
    saveNegotiatedDiscount(actualDiscount, checkoutData.pricePerTire);
    
    // Add the negotiated items to cart
    const cartItem = {
      id: tireId,
      name: tireName,
      quantity: checkoutData.quantity || 1,
      price: checkoutData.pricePerTire,
      offerPrice: checkoutData.pricePerTire,
      totalPrice: checkoutData.totalPrice,
      image: `/tires/${tireName.toLowerCase().split(' ').join('-')}.jpg`,
      negotiated: true
    };
    
    // Update/add to local storage cart
    let cart = [];
    const existingCart = localStorage.getItem('tireCart');
    
    if (existingCart) {
      try {
        cart = JSON.parse(existingCart);
        
        // Check if this tire already exists in cart
        const existingItemIndex = cart.findIndex((item: any) => item.id === tireId);
        
        if (existingItemIndex >= 0) {
          // Update the existing item
          cart[existingItemIndex] = {
            ...cart[existingItemIndex],
            quantity: checkoutData.quantity || 1,
            price: checkoutData.pricePerTire,
            offerPrice: checkoutData.pricePerTire,
            totalPrice: checkoutData.totalPrice,
            negotiated: true
          };
        } else {
          // Add new item
          cart.push(cartItem);
        }
      } catch (e) {
        console.error('Error parsing cart:', e);
        cart = [cartItem]; // Reset cart if there's an error
      }
    } else {
      cart = [cartItem];
    }
    
    // Save updated cart
    localStorage.setItem('tireCart', JSON.stringify(cart));
    
    // Display confirmation
    alert(`Added ${checkoutData.quantity} ${tireName} tire${checkoutData.quantity > 1 ? 's' : ''} to your cart with your negotiated price!`);
    
    // Navigate to cart page
    router.push('/cart');
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
        {apiError && (
          <div className={styles.errorMessage}>
            {apiError}
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

export default ChatInterface; 