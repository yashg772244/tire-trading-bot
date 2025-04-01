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

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  // Handle checkout
  const handleCheckout = (checkoutData?: Message['checkoutData']) => {
    if (!checkoutData) return;
    
    // Add the negotiated items to cart
    const cartItem = {
      id: tireId,
      name: tireName,
      quantity: checkoutData.quantity,
      price: checkoutData.pricePerTire,
      image: `/images/tires/${tireId}.jpg`
    };
    
    // Add to local storage cart
    const existingCart = localStorage.getItem('cart');
    const cart = existingCart ? JSON.parse(existingCart) : [];
    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));
    
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
              message.role === 'user' ? styles.userMessage : styles.botMessage
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
          <div className={`${styles.message} ${styles.botMessage}`}>
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
          className={styles.chatInput}
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