import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import styles from '@/styles/Vehicle.module.css';
import Layout from '@/components/Layout';
import CursorChatInterface from '@/components/CursorChatInterface';

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
  features: string[];
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
  brand: string[];
  size: string[];
  priceRange: [number, number];
  performance: string[];
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'bot', content: `Hi! I'm your tire expert for your ${make} ${model}. How can I help you today?` }]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedTireForChat, setSelectedTireForChat] = useState<Tire | null>(null);
  const [offerPrices, setOfferPrices] = useState<{ [key: string]: number }>({});
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    brand: [],
    size: [],
    priceRange: [0, 1000],
    performance: []
  });
  const [activeTire, setActiveTire] = useState<Tire | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Sample tire data for fallback
  const sampleTires: Tire[] = [
    {
      id: 'michelin-pilot-sport-4s',
      brand: 'michelin',
      model: 'Pilot Sport 4S',
      size: '225/45R18',
      full_size: '225/45R18 95Y',
      base_price: 299.99,
      description: 'High-performance summer tire with excellent grip and handling',
      image_url: '/tires/michelin-pilot-sport-4s.jpg',
      features: ['summer', 'performance', 'grip']
    },
    {
      id: 'continental-dws06',
      brand: 'continental',
      model: 'ExtremeContact DWS06 Plus',
      size: '225/45R18',
      full_size: '225/45R18 95V',
      base_price: 249.99,
      description: 'All-season tire with excellent wet and dry performance',
      image_url: '/tires/continental-dws06.jpg',
      features: ['all-season', 'performance', 'wet']
    },
    {
      id: 'bridgestone-potenza',
      brand: 'bridgestone',
      model: 'Potenza Sport',
      size: '225/45R18',
      full_size: '225/45R18 95Y',
      base_price: 279.99,
      description: 'Sport performance tire with responsive handling',
      image_url: '/tires/bridgestone.webp',
      features: ['summer', 'performance', 'handling']
    },
    {
      id: 'pirelli-p7',
      brand: 'pirelli',
      model: 'Cinturato P7',
      size: '225/45R18',
      full_size: '225/45R18 95V',
      base_price: 259.99,
      description: 'All-season tire with balanced performance',
      image_url: '/tires/Pirelli-Cintaurato-P7.jpg',
      features: ['all-season', 'comfort', 'efficiency']
    },
    {
      id: 'goodyear-eagle-f1',
      brand: 'goodyear',
      model: 'Eagle F1 Asymmetric 6',
      size: '225/45R18',
      full_size: '225/45R18 95Y',
      base_price: 289.99,
      description: 'Ultra-high performance summer tire',
      image_url: '/tires/goodyear-nascar-225-60r16.webp',
      features: ['summer', 'performance', 'grip']
    }
  ];

  useEffect(() => {
    if (make && model && year) {
      setIsLoading(true);
      
      // Fetch tires from the API based on vehicle details
      fetch(`/api/vehicle-tires/${make}/${model}/${year}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          console.log('API response:', data);
          
          // The API returns tires in a "tires" property
          const tireData = data.tires || [];
          
          if (Array.isArray(tireData) && tireData.length > 0) {
            setTires(tireData);
            // Initialize filtered tires with all tires
            setFilteredTires(tireData);
          } else {
            // Use sample data as fallback
            console.log('Using sample tires as fallback');
            setTires(sampleTires);
            setFilteredTires(sampleTires);
          }
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching tires:', error);
          // Use sample data as fallback
          setTires(sampleTires);
          setFilteredTires(sampleTires);
          setIsLoading(false);
        });
    }
  }, [make, model, year]);

  useEffect(() => {
    // Calculate offer prices once when tires are loaded
    if (tires.length > 0) {
      const prices: { [key: string]: number } = {};
      tires.forEach(tire => {
        const discountPercent = 5; // Fixed 5% discount
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

  // Apply filters whenever filters or tires change
  useEffect(() => {
    let filtered = [...tires];
    
    // Apply brand filter
    if (filters.brand.length > 0) {
      filtered = filtered.filter(tire => 
        filters.brand.includes(tire.brand.toLowerCase())
      );
    }
    
    // Apply price range filter
    filtered = filtered.filter(tire => 
      tire.base_price >= filters.priceRange[0] && 
      tire.base_price <= filters.priceRange[1]
    );
    
    // Apply performance/feature filter
    if (filters.performance.length > 0) {
      filtered = filtered.filter(tire => 
        tire.features.some((feature: string) => 
          filters.performance.includes(feature.toLowerCase())
        )
      );
    }
    
    setFilteredTires(filtered);
  }, [filters, tires]);

  // Initialize quantities with 1 for each tire when tires are loaded
  useEffect(() => {
    if (tires.length > 0) {
      const initialQuantities: Record<string, number> = {};
      tires.forEach(tire => {
        initialQuantities[tire.id] = 1;
      });
      setQuantities(initialQuantities);
    }
  }, [tires]);

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

  // Calculate discounted price (with fixed 5% discount regardless of quantity)
  const calculateOfferPrice = (basePrice: number, quantity: number = 1) => {
    // Fixed 5% discount, regardless of quantity
    // Higher discounts are only available through chatbot negotiation
    const discountRate = 0.05;
    const discountedPrice = basePrice * (1 - discountRate);
    return discountedPrice.toFixed(2);
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
    // Ensure quantity is between 1 and 99
    const safeValue = Math.max(1, Math.min(99, value));
    
    setQuantities({
      ...quantities,
      [tireId]: safeValue
    });
  };

  const handleAddToCart = (tire: Tire, quantity: number) => {
    const pricePerTire = offerPrices[tire.id] || tire.base_price;
    const totalPrice = pricePerTire * quantity;
    const mountingPrice = quantity * 25; // $25 per tire for mounting
    
    // Show a message that the item was added to cart
    alert(`Added ${quantity} ${tire.brand} ${tire.model} tire${quantity > 1 ? 's' : ''} to cart. Redirecting to checkout...`);
    
    // Create checkout URL with data as query params
    const params = new URLSearchParams();
    params.append('tireId', tire.id);
    params.append('quantity', quantity.toString());
    params.append('pricePerTire', pricePerTire.toString());
    params.append('totalPrice', totalPrice.toString());
    params.append('mountingPrice', mountingPrice.toString());
    
    // Redirect to checkout page
    router.push(`/checkout?${params.toString()}`);
  };

  // Add this function to handle direct checkout from tire card
  const handleBuyNow = (tire: Tire, quantity: number) => {
    const pricePerTire = offerPrices[tire.id] || tire.base_price;
    const totalPrice = pricePerTire * quantity;
    const mountingPrice = quantity * 25; // $25 per tire for mounting
    
    // Create checkout URL with data as query params
    const params = new URLSearchParams();
    params.append('tireId', tire.id);
    params.append('quantity', quantity.toString());
    params.append('pricePerTire', pricePerTire.toString());
    params.append('totalPrice', totalPrice.toString());
    params.append('mountingPrice', mountingPrice.toString());
    
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
    if (filters.brand.includes(brand)) {
      setFilters(prev => ({
        ...prev,
        brand: prev.brand.filter(b => b !== brand)
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        brand: [...prev.brand, brand]
      }));
    }
  };

  const handlePriceFilterChange = (min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      priceRange: [min, max]
    }));
  };

  // Add this function to handle checkout
  const handleCheckoutFromChat = (tireId: string, quantity: number, pricePerTire: number, totalPrice: number, additionalServices?: boolean, servicesPrice?: number) => {
    // Create checkout URL with data as query params
    const params = new URLSearchParams();
    params.append('tireId', tireId);
    params.append('quantity', quantity.toString());
    params.append('pricePerTire', pricePerTire.toString());
    params.append('totalPrice', totalPrice.toString());
    
    // Add mounting price (default to $25 per tire)
    const mountingPrice = quantity * 25;
    params.append('mountingPrice', mountingPrice.toString());
    
    if (additionalServices) {
      params.append('additionalServices', 'true');
      if (servicesPrice) {
        params.append('servicesPrice', servicesPrice.toString());
        
        // Calculate total price including services
        const totalWithServices = totalPrice + servicesPrice;
        params.append('totalWithServices', totalWithServices.toString());
      }
    }

    // Redirect to checkout page
    router.push(`/checkout?${params.toString()}`);
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
          <Link href="/vehicle" className={styles.backLink}>
            ← Back to vehicle search
          </Link>
          <h1 className={styles.title}>
            {formattedMake} {formattedModel} ({formattedYear}) Tires
          </h1>
          <p className={styles.description}>
            We found {filteredTires.length} tire options that are perfect for your vehicle
          </p>
        </div>

        <div className={styles.main}>
          {/* Filter Section */}
          <div className={styles.filterSection}>
            <h2>Filter Options</h2>
            
            <div className={styles.filterGroup}>
              <h3>Brand</h3>
              {['Michelin', 'Continental', 'Bridgestone', 'Pirelli', 'Goodyear'].map((brand) => (
                <div key={brand} className={styles.filterOption}>
                  <input
                    type="checkbox"
                    id={`brand-${brand}`}
                    checked={filters.brand.includes(brand.toLowerCase())}
                    onChange={() => handleBrandFilterChange(brand.toLowerCase())}
                  />
                  <label htmlFor={`brand-${brand}`}>
                    {brand}
                  </label>
                </div>
              ))}
            </div>

            <div className={styles.filterGroup}>
              <h3>Price Range</h3>
              <div className={styles.priceSlider}>
                <label htmlFor="min-price">Min: ${filters.priceRange[0]}</label>
                <input
                  type="range"
                  id="min-price"
                  min="0"
                  max="500"
                  step="10"
                  value={filters.priceRange[0]}
                  onChange={(e) => handlePriceFilterChange(Number(e.target.value), filters.priceRange[1])}
                  className={styles.priceInput}
                />
              </div>
              <div className={styles.priceSlider}>
                <label htmlFor="max-price">Max: ${filters.priceRange[1]}</label>
                <input
                  type="range"
                  id="max-price"
                  min="100"
                  max="1000"
                  step="10"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceFilterChange(filters.priceRange[0], Number(e.target.value))}
                  className={styles.priceInput}
                />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <h3>Features</h3>
              {['Summer', 'All-Season', 'Winter'].map((feature) => (
                <div key={feature} className={styles.filterOption}>
                  <input
                    type="checkbox"
                    id={`feature-${feature}`}
                    checked={filters.performance.includes(feature.toLowerCase())}
                    onChange={() => setFilters({
                      ...filters,
                      performance: filters.performance.includes(feature.toLowerCase())
                        ? filters.performance.filter(f => f !== feature.toLowerCase())
                        : [...filters.performance, feature.toLowerCase()]
                    })}
                  />
                  <label htmlFor={`feature-${feature}`}>{feature}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Tire Listings */}
          <div className={styles.tireListings}>
            {isLoading ? (
              <div className={styles.loading}>Loading tire options...</div>
            ) : filteredTires.length === 0 ? (
              <div className={styles.noResults}>
                No tires found matching your criteria. Try adjusting your filters.
              </div>
            ) : (
              filteredTires.map((tire) => (
                <div key={tire.id} className={styles.tireCard}>
                  <div className={styles.tireImage}>
                    <Image
                      src={tire.image_url}
                      alt={`${tire.brand} ${tire.model}`}
                      width={300}
                      height={300}
                      className={styles.tireImage}
                    />
                  </div>
                  <div className={styles.tireInfo}>
                    <h3>{tire.brand} {tire.model}</h3>
                    <p className={styles.tireSize}>{tire.full_size}</p>
                    <p className={styles.tirePrice}>
                      <span className={styles.originalPrice}>${tire.base_price}</span>
                      <span className={styles.discountedPrice}>
                        ${offerPrices[tire.id] || (tire.base_price * 0.95).toFixed(2)}
                      </span>
                    </p>
                    
                    <div className={styles.quantityWrapper}>
                      <span className={styles.quantityLabel}>Quantity:</span>
                      <div className={styles.quantityControl}>
                        <button
                          className={styles.quantityButton}
                          onClick={() => handleQuantityChange(tire.id, (quantities[tire.id] || 1) - 1)}
                          disabled={(quantities[tire.id] || 1) <= 1}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={quantities[tire.id] || 1}
                          onChange={(e) => handleQuantityChange(tire.id, parseInt(e.target.value) || 1)}
                          className={styles.quantityInput}
                          aria-label="Tire quantity"
                        />
                        <button
                          className={styles.quantityButton}
                          onClick={() => handleQuantityChange(tire.id, (quantities[tire.id] || 1) + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <p className={styles.tireDescription}>{tire.description}</p>
                    <div className={styles.tireFeatures}>
                      {tire.features.map((feature: string, index: number) => (
                        <span key={index} className={styles.featureTag}>
                          {feature}
                        </span>
                      ))}
                    </div>
                    <div className={styles.tireActions}>
                      <button
                        className={styles.chatButton}
                        onClick={() => handleChatAboutTire(tire)}
                      >
                        Chat about this tire
                      </button>
                      
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.addToCartButton}
                          onClick={() => handleAddToCart(tire, quantities[tire.id] || 1)}
                        >
                          Add to Cart ({quantities[tire.id] || 1})
                        </button>
                        <button
                          className={styles.buyNowButton}
                          onClick={() => handleBuyNow(tire, quantities[tire.id] || 1)}
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

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
                <CursorChatInterface 
                  tireId={parseInt(activeTire.id.split('-')[1] || '1')} 
                  tireName={`${activeTire.brand} ${activeTire.model}`} 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 