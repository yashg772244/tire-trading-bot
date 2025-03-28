import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import styles from '@/styles/Vehicle.module.css';
import Layout from '@/components/Layout';
import ChatInterface from '@/components/ChatInterface';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  showCheckoutButton?: boolean;
  checkoutData?: any;
}

interface Tire {
  id: string;
  brand: string;
  model: string;
  size: string;
  full_size: string;
  base_price: number;
  description: string;
  image_url: string;
  features: string;
}

interface CartItem {
  id: number;
  brand: string;
  model: string;
  price: number;
  quantity: number;
  offerPrice: number;
  totalPrice: number;
  additionalServices?: boolean;
}

interface Filters {
  brands: {
    [key: string]: boolean;
  };
  price: {
    min: number;
    max: number;
  };
  features: {
    allSeason: boolean;
    winterRated: boolean;
    runFlat: boolean;
    performanceRated: boolean;
    lowNoise: boolean;
    fuelEfficient: boolean;
  };
}

// Component to render checkout button in chat
const CheckoutButton = ({ checkoutData }: { checkoutData: any }) => {
  const router = useRouter();
  
  const handleCheckoutClick = () => {
    // Create checkout URL with data as query params
    const params = new URLSearchParams();
    params.append('tireId', checkoutData.tireId.toString());
    params.append('quantity', checkoutData.quantity.toString());
    params.append('pricePerTire', checkoutData.pricePerTire.toString());
    params.append('totalPrice', checkoutData.totalPrice.toString());
    
    if (checkoutData.additionalServices) {
      params.append('additionalServices', 'true');
      params.append('servicesPrice', checkoutData.servicesPrice.toString());
      
      // Calculate total price including services
      const totalWithServices = checkoutData.totalPrice + checkoutData.servicesPrice;
      params.append('totalWithServices', totalWithServices.toString());
    }

    // Redirect to checkout page
    router.push(`/checkout?${params.toString()}`);
  };
  
  return (
    <div className={styles.checkoutButtonContainer}>
      <button 
        className={styles.checkoutButton}
        onClick={handleCheckoutClick}
      >
        Proceed to Checkout
      </button>
    </div>
  );
};

export default function VehicleTires() {
  const router = useRouter();
  const { make, model, year } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [tires, setTires] = useState<Tire[]>([]);
  const [filteredTires, setFilteredTires] = useState<Tire[]>([]);
  const [selectedTires, setSelectedTires] = useState<Tire[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'bot', content: `Hi! I'm your tire expert for your ${make} ${model}. How can I help you today?` }]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedTireForChat, setSelectedTireForChat] = useState<Tire | null>(null);
  const [offerPrices, setOfferPrices] = useState<{ [key: string]: number }>({});
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    brands: {
      michelin: false,
      bridgestone: false,
      continental: false,
      goodyear: false,
      pirelli: false
    },
    price: {
      min: 0,
      max: 1000
    },
    features: {
      allSeason: false,
      winterRated: false,
      runFlat: false,
      performanceRated: false,
      lowNoise: false,
      fuelEfficient: false
    }
  });
  const [activeTire, setActiveTire] = useState<Tire | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Sample tires data to use as a fallback
  const sampleTires = [
    {
      id: 'michelin-pilot',
      brand: 'Michelin',
      model: 'Pilot Sport 4S',
      size: '225/45R17',
      full_size: '225/45R17',
      base_price: 199.99,
      description: 'High-performance summer tire with excellent grip and handling',
      image_url: '/images/tires/tire-1.jpg',
      features: JSON.stringify({ type: 'Summer' })
    },
    {
      id: 'continental-extreme',
      brand: 'Continental',
      model: 'ExtremeContact DWS06',
      size: '225/45R17',
      full_size: '225/45R17',
      base_price: 179.99,
      description: 'All-season tire with excellent wet and dry performance',
      image_url: '/images/tires/tire-2.jpg',
      features: JSON.stringify({ type: 'All-Season' })
    },
    {
      id: 'bridgestone-potenza',
      brand: 'Bridgestone',
      model: 'Potenza Sport',
      size: '225/45R17',
      full_size: '225/45R17',
      base_price: 189.99,
      description: 'Ultra-high performance tire with maximum grip and control',
      image_url: '/images/tires/tire-3.jpg',
      features: JSON.stringify({ type: 'Summer' })
    }
  ];

  useEffect(() => {
    if (make && model && year) {
      setIsLoading(true);
      
      // Fetch tires from the API based on vehicle details
      fetch(`/api/vehicle-tires/${make}/${model}/${year}`)
        .then(response => response.json())
        .then(data => {
          // The API now returns tires in a "tires" property
          const tireData = data.tires || data;
          
          if (Array.isArray(tireData) && tireData.length > 0) {
            setTires(tireData);
          } else {
            // Use sample data as fallback
            setTires(sampleTires);
          }
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching tires:', error);
          // Use sample data as fallback
          setTires(sampleTires);
          setIsLoading(false);
        });
    }
  }, [make, model, year]);

  useEffect(() => {
    // Calculate offer prices once when tires are loaded
    if (tires.length > 0) {
      const prices: { [key: string]: number } = {};
      tires.forEach(tire => {
        const discountPercent = 15; // Fixed 15% discount
        const discountAmount = (tire.base_price * discountPercent) / 100;
        prices[tire.id.toString()] = Number((tire.base_price - discountAmount).toFixed(2));
      });
      setOfferPrices(prices);
    }
  }, [tires]);

  useEffect(() => {
    const savedCart = localStorage.getItem('tireCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        // Calculate total items in cart
        const totalItems = parsedCart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
        setCartItemCount(totalItems);
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tireCart', JSON.stringify(cart));
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartItemCount(totalItems);
  }, [cart]);

  useEffect(() => {
    if (tires.length > 0) {
      // Create an array of filtered tires
      let filteredResults = [...tires];
      
      // Filter by brands
      const selectedBrands = Object.keys(filters.brands).filter(brand => filters.brands[brand]);
      if (selectedBrands.length > 0) {
        filteredResults = filteredResults.filter(tire => selectedBrands.includes(tire.brand.toLowerCase()));
      }
      
      // Filter by price range
      filteredResults = filteredResults.filter(tire => {
        const offerPrice = Number(offerPrices[tire.id] || calculateOfferPrice(tire.base_price));
        return offerPrice >= filters.price.min && offerPrice <= filters.price.max;
      });
      
      // Set the filtered tires
      setFilteredTires(filteredResults);
    } else {
      // If no tires are loaded yet, set empty array
      setFilteredTires([]);
    }
  }, [tires, filters, offerPrices]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const userMessage = { role: 'user' as const, content: currentMessage };
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');

    try {
      // Extract quantity from message if present
      const quantityMatch = currentMessage.toLowerCase().match(/(\d+)\s*(?:tire|tyre)s?/i);
      
      // If a quantity is mentioned in the current message, use it
      // Otherwise, try to find the most recent quantity from conversation history
      let extractedQuantity = quantityMatch ? parseInt(quantityMatch[1]) : 0;
      
      // If no quantity in current message, look through previous messages
      if (extractedQuantity === 0) {
        // First check bot responses which should have the correct quantity info
        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];
          if (msg.role === 'bot') {
            const prevQuantityMatch = msg.content.match(/(\d+)\s*(?:tire|tyre)s?/i);
            if (prevQuantityMatch) {
              extractedQuantity = parseInt(prevQuantityMatch[1]);
              break;
            }
          }
        }
        
        // If still no quantity, check user messages
        if (extractedQuantity === 0) {
          for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            if (msg.role === 'user') {
              const prevQuantityMatch = msg.content.match(/(\d+)\s*(?:tire|tyre)s?/i);
              if (prevQuantityMatch) {
                extractedQuantity = parseInt(prevQuantityMatch[1]);
                break;
              }
            }
          }
        }
        
        // Default to 1 if no quantity found anywhere
        if (extractedQuantity === 0) {
          extractedQuantity = 1;
        }
      }

      // Get the current offer price for this tire if available
      const currentOfferPrice = selectedTireForChat && offerPrices[selectedTireForChat.id];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          vehicle: { make, model, year },
          selectedTire: selectedTireForChat ? {
            ...selectedTireForChat,
            offer_price: currentOfferPrice
          } : null,
          quantity: extractedQuantity,
          negotiationHistory: messages.map(msg => ({
            message: msg.role === 'user' ? msg.content : 'bot',
            response: msg.role === 'bot' ? msg.content : '',
            timestamp: Date.now()
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      
      // Check if it's a checkout response and store the checkout data
      if (data.action && data.action.type === 'CHECKOUT') {
        // Store checkout data for the button
        setCheckoutData(data.action.data);
        // Add the message with the checkout button flag
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: data.response,
          showCheckoutButton: true 
        }]);
      } else {
        // Regular message without checkout button
        setMessages(prev => [...prev, { role: 'bot', content: data.response }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Sorry, I encountered an error processing your request. Please try again.' 
      }]);
    }
  };

  const calculateOfferPrice = (basePrice: number) => {
    // Example discount calculation - you can modify this logic
    const discountPercent = Math.floor(Math.random() * 15) + 5; // Random discount between 5-20%
    const discountAmount = (basePrice * discountPercent) / 100;
    return (basePrice - discountAmount).toFixed(2);
  };

  const handleCompareToggle = (tire: Tire) => {
    setSelectedTires(prev => {
      const isSelected = prev.some(t => t.id === tire.id);
      if (isSelected) {
        return prev.filter(t => t.id !== tire.id);
      }
      if (prev.length < 3) {
        return [...prev, tire];
      }
      return prev;
    });
  };

  const handleCompareTires = () => {
    setIsCompareModalOpen(true);
  };

  const handleNegotiatePrice = (tire: Tire) => {
    setSelectedTireForChat(tire);
    setIsChatOpen(true);
    setMessages([
      { 
        role: 'bot', 
        content: `Hi! I can help you with the ${tire.brand} ${tire.model}. What would you like to know about it?` 
      }
    ]);
  };

  const handleQuantityChange = (tireId: string, value: number) => {
    setQuantities({
      ...quantities,
      [tireId]: Math.max(1, value)
    });
  };

  const handleAddToCart = (tire: Tire) => {
    // Ensure quantity is a number
    const quantity = Number(quantities[tire.id] || 1);
    // Ensure offer price is a number
    const offerPrice = Number(offerPrices[tire.id] || calculateOfferPrice(tire.base_price));
    
    // Check if this tire is already in the cart
    const existingItemIndex = cart.findIndex(item => item.id.toString() === tire.id.toString());
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedCart = [...cart];
      const newQuantity = Number(updatedCart[existingItemIndex].quantity) + quantity;
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: newQuantity,
        totalPrice: newQuantity * offerPrice
      };
      setCart(updatedCart);
    } else {
      // Add new item
      const newItem: CartItem = {
        id: Number(tire.id),
        brand: tire.brand,
        model: tire.model,
        price: Number(tire.base_price),
        offerPrice: offerPrice,
        quantity: quantity,
        totalPrice: quantity * offerPrice
      };
      setCart([...cart, newItem]);
    }
    
    // Show a confirmation message
    alert(`Added ${quantity} ${tire.brand} ${tire.model} tire${quantity > 1 ? 's' : ''} to your cart!`);
  };

  // New function to handle direct checkout
  const handleBuyNow = (tire: Tire) => {
    // Ensure quantity is a number
    const quantity = Number(quantities[tire.id] || 1);
    // Ensure offer price is a number
    const offerPrice = Number(offerPrices[tire.id] || calculateOfferPrice(tire.base_price));
    
    // Create params for checkout
    const params = new URLSearchParams();
    params.append('tireId', tire.id.toString());
    params.append('quantity', quantity.toString());
    params.append('pricePerTire', offerPrice.toString());
    params.append('totalPrice', (quantity * offerPrice).toString());
    
    // Add the current URL as a referrer parameter
    if (typeof window !== 'undefined') {
      params.append('referrer', encodeURIComponent(window.location.href));
    }
    
    // Redirect to checkout page
    router.push(`/checkout?${params.toString()}`);
  };

  // Cart management functions
  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateCartItemQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cart.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: newQuantity * item.offerPrice
        };
      }
      return item;
    });
    
    setCart(updatedCart);
  };

  const clearCart = () => {
    setCart([]);
  };

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    
    // Prepare cart data for checkout
    const params = new URLSearchParams();
    params.append('cartItems', JSON.stringify(cart));
    
    router.push(`/checkout?${params.toString()}`);
  };

  // Add filter handling functions
  const handleBrandFilterChange = (brand: string) => {
    setFilters(prev => ({
      ...prev,
      brands: {
        ...prev.brands,
        [brand]: !prev.brands[brand]
      }
    }));
  };

  const handlePriceFilterChange = (min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      price: { min, max }
    }));
  };

  // Add this function to handle checkout
  const handleCheckoutFromChat = (checkoutData: any) => {
    // Create checkout URL with data as query params
    const params = new URLSearchParams();
    params.append('tireId', checkoutData.tireId.toString());
    params.append('quantity', checkoutData.quantity.toString());
    params.append('pricePerTire', checkoutData.pricePerTire.toString());
    params.append('totalPrice', checkoutData.totalPrice.toString());
    
    if (checkoutData.additionalServices) {
      params.append('additionalServices', 'true');
      params.append('servicesPrice', checkoutData.servicesPrice.toString());
      
      // Calculate total price including services
      const totalWithServices = checkoutData.totalPrice + checkoutData.servicesPrice;
      params.append('totalWithServices', totalWithServices.toString());
    }

    // Add the current URL as a referrer parameter
    if (typeof window !== 'undefined') {
      params.append('referrer', encodeURIComponent(window.location.href));
    }

    // Redirect to checkout page
    router.push(`/checkout?${params.toString()}`);
  };

  // Toggle tire selection for comparison
  const toggleTireSelection = (tire: Tire) => {
    if (selectedTires.some(t => t.id === tire.id)) {
      setSelectedTires(selectedTires.filter(t => t.id !== tire.id));
    } else {
      setSelectedTires([...selectedTires, tire]);
    }
  };

  // Start chatting about a specific tire
  const handleChatAboutTire = (tire: Tire) => {
    setActiveTire(tire);
    setShowChat(true);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading tires for your {year} {make} {model}...</div>
      </div>
    );
  }

  const formattedMake = typeof make === 'string' ? make.charAt(0).toUpperCase() + make.slice(1) : '';
  const formattedModel = typeof model === 'string' ? model : '';
  const formattedYear = typeof year === 'string' ? year : '';

  return (
    <Layout>
      <Head>
        <title>{formattedMake} {formattedModel} ({formattedYear}) Tires | Gilda Tyres</title>
        <meta name="description" content={`Find the perfect tires for your ${formattedMake} ${formattedModel} ${formattedYear}. Compare top brands and get the best deals.`} />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/vehicle">
            <a className={styles.backLink}>← Back to Vehicle Search</a>
          </Link>
          <h1 className={styles.title}>Tires for {formattedYear} {formattedMake} {formattedModel}</h1>
          <p className={styles.description}>
            We found {tires.length} tire options that are perfect for your vehicle
          </p>
        </div>

        <div className={styles.tiresGrid}>
          {filteredTires.map((tire) => (
            <div key={tire.id} className={styles.tireCard}>
              <div className={styles.tireImageContainer}>
                <img 
                  src={tire.image_url} 
                  alt={`${tire.brand} ${tire.model}`} 
                  className={styles.tireImage}
                />
                <div className={styles.compareCheckbox}>
                  <input
                    type="checkbox"
                    id={`compare-${tire.id}`}
                    checked={selectedTires.some(t => t.id === tire.id)}
                    onChange={() => toggleTireSelection(tire)}
                  />
                  <label htmlFor={`compare-${tire.id}`}>Compare</label>
                </div>
              </div>
              <div className={styles.tireInfo}>
                <h2 className={styles.tireName}>{tire.brand} {tire.model}</h2>
                <p className={styles.tireSize}>Size: {tire.full_size}</p>
                <p className={styles.tirePrice}>${tire.base_price.toFixed(2)}</p>
                <p className={styles.tireDescription}>{tire.description}</p>
                {tire.features && (
                  <div className={styles.tireFeatures}>
                    <span className={styles.featureTag}>
                      {JSON.parse(tire.features).type}
                    </span>
                  </div>
                )}
                <div className={styles.tireActions}>
                  <button 
                    className={styles.chatButton}
                    onClick={() => handleChatAboutTire(tire)}
                  >
                    Get Your Best Price
                  </button>
                  <button 
                    className={styles.buyButton}
                    onClick={() => handleBuyNow(tire)}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedTires.length > 0 && (
          <div className={styles.compareBar}>
            <div className={styles.compareBarContent}>
              <span>
                {selectedTires.length} {selectedTires.length === 1 ? 'tire' : 'tires'} selected
              </span>
              <div className={styles.compareBarActions}>
                <button 
                  className={styles.compareButton}
                  disabled={selectedTires.length < 2}
                >
                  Compare
                </button>
                {selectedTires.length === 1 && (
                  <button 
                    className={styles.buySelectedButton}
                    onClick={() => {
                      router.push({
                        pathname: '/checkout',
                        query: { 
                          tireId: selectedTires[0].id,
                          name: `${selectedTires[0].brand} ${selectedTires[0].model}`,
                          price: selectedTires[0].base_price
                        },
                      });
                    }}
                  >
                    Buy Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showChat && activeTire && (
          <div className={styles.chatModal}>
            <div className={styles.chatModalContent}>
              <div className={styles.chatModalHeader}>
                <h3>Chat about {activeTire.brand} {activeTire.model}</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowChat(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.chatModalBody}>
                <ChatInterface 
                  tireId={parseInt(activeTire.id.split('-')[1] || '1')} 
                  tireName={`${activeTire.brand} ${activeTire.model}`} 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cart Modal */}
      {isCartOpen && (
        <div className={styles.cartModal}>
          <div className={styles.cartContent}>
            <div className={styles.cartHeader}>
              <h2>Your Cart</h2>
              <button onClick={() => setIsCartOpen(false)}>×</button>
            </div>
            
            {cart.length === 0 ? (
              <div className={styles.emptyCart}>
                <p>Your cart is empty.</p>
                <p>Add some tires to get started!</p>
              </div>
            ) : (
              <>
                <div className={styles.cartItems}>
                  {cart.map(item => (
                    <div key={item.id} className={styles.cartItem}>
                      <div className={styles.cartItemDetails}>
                        <h3>{item.brand} {item.model}</h3>
                        <p>${item.offerPrice.toFixed(2)} per tire</p>
                      </div>
                      
                      <div className={styles.cartItemQuantity}>
                        <button 
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}>
                          +
                        </button>
                      </div>
                      
                      <div className={styles.cartItemPrice}>
                        ${item.totalPrice.toFixed(2)}
                      </div>
                      
                      <button 
                        className={styles.removeItem}
                        onClick={() => removeFromCart(item.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className={styles.cartSummary}>
                  <div className={styles.cartTotal}>
                    <span>Total:</span>
                    <span>${cart.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
                  </div>
                  
                  <div className={styles.cartActions}>
                    <button 
                      className={styles.clearCartButton}
                      onClick={clearCart}
                    >
                      Clear Cart
                    </button>
                    <Link 
                      href="/cart"
                      className={styles.checkoutButton}
                    >
                      View Cart
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
} 