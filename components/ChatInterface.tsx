import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/ChatInterface.module.css';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';

type Message = {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
};

type CheckoutData = {
  tireId: number;
  quantity: number;
  pricePerTire: number;
  totalPrice: number;
};

interface ChatInterfaceProps {
  tireId: number;
  tireName: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ tireId, tireName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Initialize session ID and welcome message
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `tire_${tireId}_${uuidv4()}`;
      setSessionId(newSessionId);
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: uuidv4(),
        sender: 'assistant',
        text: `Hi there! I'm your tire expert. How can I help you with the ${tireName} tires today?`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
    }
  }, [sessionId, tireId, tireName]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (input.trim() === '') return;
    
    // Add user message to state
    const userMessage: Message = {
      id: uuidv4(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      // Make API request to chat endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          tireId,
          sessionId,
          messages: messages
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Check if the response includes a checkout action
      if (data.action && data.action.type === 'CHECKOUT') {
        setCheckoutData(data.action.data);
      }
      
      // Add assistant response to state
      const assistantMessage: Message = {
        id: uuidv4(),
        sender: 'assistant',
        text: data.message,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        sender: 'assistant',
        text: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    if (checkoutData) {
      // Add the negotiated items to cart
      const cartItem = {
        id: tireId,
        name: tireName,
        quantity: checkoutData.quantity,
        price: checkoutData.pricePerTire,
        image: `/images/tires/${tireId}.jpg`
      };
      
      // Get existing cart from localStorage or initialize empty array
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // Check if the item already exists in cart
      const existingItemIndex = existingCart.findIndex((item: any) => item.id === tireId);
      
      if (existingItemIndex !== -1) {
        // Update the existing item
        existingCart[existingItemIndex] = cartItem;
      } else {
        // Add new item
        existingCart.push(cartItem);
      }
      
      // Save back to localStorage
      localStorage.setItem('cart', JSON.stringify(existingCart));
      
      // Navigate to cart page
      router.push('/cart');
    }
  };

  // Scroll to the bottom of the message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h3>Chat with Tire Expert</h3>
      </div>
      
      <div className={styles.messagesContainer}>
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`${styles.message} ${message.sender === 'user' ? styles.userMessage : styles.assistantMessage}`}
          >
            <div className={styles.messageContent}>{message.text}</div>
            <div className={styles.messageTime}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        
        {loading && (
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
      
      {checkoutData && (
        <div className={styles.checkoutContainer}>
          <div className={styles.checkoutInfo}>
            <p>Ready to purchase {checkoutData.quantity} x {tireName}</p>
            <p>Price: ${checkoutData.pricePerTire.toFixed(2)} each</p>
            <p className={styles.totalPrice}>Total: ${checkoutData.totalPrice.toFixed(2)}</p>
          </div>
          <button 
            className={styles.checkoutButton}
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </button>
        </div>
      )}
      
      <form className={styles.inputContainer} onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
          className={styles.inputField}
        />
        <button 
          type="submit" 
          disabled={loading || input.trim() === ''}
          className={styles.sendButton}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface; 