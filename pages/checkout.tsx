import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Link from 'next/link';
import styles from '@/styles/Checkout.module.css';

interface CartItem {
  id: string;
  brand: string;
  model: string;
  size: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
}

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function Checkout() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subtotal, setSubtotal] = useState(0);
  const [savings, setSavings] = useState(0);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    // Load cart from localStorage
    const loadCart = () => {
      setLoading(true);
      try {
        const savedCart = localStorage.getItem('tireCart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);
          calculateTotals(parsedCart);
        } else {
          // Redirect to cart page if cart is empty
          router.push('/cart');
        }
      } catch (error) {
        console.error('Failed to load cart:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [router]);

  const calculateTotals = (cartItems: CartItem[]) => {
    let subtotalAmount = 0;
    let savingsAmount = 0;

    cartItems.forEach(item => {
      subtotalAmount += item.price * item.quantity;
      if (item.originalPrice) {
        savingsAmount += (item.originalPrice - item.price) * item.quantity;
      }
    });

    setSubtotal(subtotalAmount);
    setSavings(savingsAmount);
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingInfo({
      ...shippingInfo,
      [name]: value
    });
    
    // Clear error when field is updated
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setPaymentInfo({
        ...paymentInfo,
        [name]: formatted.slice(0, 19) // Limit to 16 digits + 3 spaces
      });
    } 
    // Format expiry as MM/YY
    else if (name === 'expiry') {
      const expiry = value.replace(/\D/g, '');
      if (expiry.length <= 2) {
        setPaymentInfo({
          ...paymentInfo,
          [name]: expiry
        });
      } else {
        setPaymentInfo({
          ...paymentInfo,
          [name]: `${expiry.slice(0, 2)}/${expiry.slice(2, 4)}`
        });
      }
    } 
    // Limit CVV to 3-4 digits
    else if (name === 'cvv') {
      setPaymentInfo({
        ...paymentInfo,
        [name]: value.replace(/\D/g, '').slice(0, 4)
      });
    } 
    else {
      setPaymentInfo({
        ...paymentInfo,
        [name]: value
      });
    }
    
    // Clear error when field is updated
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Validate shipping info
    if (!shippingInfo.firstName) errors.firstName = 'First name is required';
    if (!shippingInfo.lastName) errors.lastName = 'Last name is required';
    if (!shippingInfo.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(shippingInfo.email)) {
      errors.email = 'Email is invalid';
    }
    if (!shippingInfo.phone) errors.phone = 'Phone number is required';
    if (!shippingInfo.address) errors.address = 'Address is required';
    if (!shippingInfo.city) errors.city = 'City is required';
    if (!shippingInfo.state) errors.state = 'State is required';
    if (!shippingInfo.zipCode) errors.zipCode = 'ZIP code is required';
    
    // Validate payment info
    if (!paymentInfo.cardNumber) {
      errors.cardNumber = 'Card number is required';
    } else if (paymentInfo.cardNumber.replace(/\s/g, '').length < 16) {
      errors.cardNumber = 'Card number must be 16 digits';
    }
    
    if (!paymentInfo.cardName) errors.cardName = 'Name on card is required';
    
    if (!paymentInfo.expiry) {
      errors.expiry = 'Expiry date is required';
    } else if (paymentInfo.expiry.length < 5) {
      errors.expiry = 'Valid expiry date required (MM/YY)';
    }
    
    if (!paymentInfo.cvv) {
      errors.cvv = 'CVV is required';
    } else if (paymentInfo.cvv.length < 3) {
      errors.cvv = 'CVV must be 3-4 digits';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = Object.keys(formErrors)[0];
      if (firstErrorField) {
        const element = document.getElementsByName(firstErrorField)[0];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
      return;
    }
    
    setOrderProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      // Clear cart
      localStorage.removeItem('tireCart');
      
      // Store order info in local storage for confirmation page
      localStorage.setItem('lastOrder', JSON.stringify({
        orderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        items: cart,
        subtotal,
        savings,
        tax: subtotal * 0.08,
        shipping: 0,
        total: subtotal + (subtotal * 0.08),
        date: new Date().toISOString(),
        shippingInfo
      }));
      
      // Redirect to confirmation page
      router.push('/order-confirmation');
    }, 2000);
  };

  if (loading) {
    return (
      <Layout title="Checkout - Gilda Tyres">
        <div className={styles.container}>
          <div className={styles.loading}>Loading checkout information...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Checkout - Gilda Tyres">
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/cart">
            <a className={styles.backLink}>← Back to cart</a>
          </Link>
          <h1 className={styles.title}>Checkout</h1>
        </div>

        <div className={styles.checkoutContent}>
          <form className={styles.checkoutForm} onSubmit={placeOrder}>
            <div className={styles.formSection}>
              <h2>Shipping Information</h2>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={shippingInfo.firstName}
                    onChange={handleShippingChange}
                    className={formErrors.firstName ? styles.inputError : ''}
                  />
                  {formErrors.firstName && <span className={styles.errorMessage}>{formErrors.firstName}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={shippingInfo.lastName}
                    onChange={handleShippingChange}
                    className={formErrors.lastName ? styles.inputError : ''}
                  />
                  {formErrors.lastName && <span className={styles.errorMessage}>{formErrors.lastName}</span>}
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={shippingInfo.email}
                    onChange={handleShippingChange}
                    className={formErrors.email ? styles.inputError : ''}
                  />
                  {formErrors.email && <span className={styles.errorMessage}>{formErrors.email}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleShippingChange}
                    className={formErrors.phone ? styles.inputError : ''}
                  />
                  {formErrors.phone && <span className={styles.errorMessage}>{formErrors.phone}</span>}
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={shippingInfo.address}
                  onChange={handleShippingChange}
                  className={formErrors.address ? styles.inputError : ''}
                />
                {formErrors.address && <span className={styles.errorMessage}>{formErrors.address}</span>}
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={shippingInfo.city}
                    onChange={handleShippingChange}
                    className={formErrors.city ? styles.inputError : ''}
                  />
                  {formErrors.city && <span className={styles.errorMessage}>{formErrors.city}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="state">State</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={shippingInfo.state}
                    onChange={handleShippingChange}
                    className={formErrors.state ? styles.inputError : ''}
                  />
                  {formErrors.state && <span className={styles.errorMessage}>{formErrors.state}</span>}
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="zipCode">ZIP Code</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={shippingInfo.zipCode}
                    onChange={handleShippingChange}
                    className={formErrors.zipCode ? styles.inputError : ''}
                  />
                  {formErrors.zipCode && <span className={styles.errorMessage}>{formErrors.zipCode}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="country">Country</label>
                  <select
                    id="country"
                    name="country"
                    value={shippingInfo.country}
                    onChange={handleShippingChange}
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className={styles.formSection}>
              <h2>Payment Information</h2>
              
              <div className={styles.formGroup}>
                <label htmlFor="cardNumber">Card Number</label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  placeholder="XXXX XXXX XXXX XXXX"
                  value={paymentInfo.cardNumber}
                  onChange={handlePaymentChange}
                  className={formErrors.cardNumber ? styles.inputError : ''}
                />
                {formErrors.cardNumber && <span className={styles.errorMessage}>{formErrors.cardNumber}</span>}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="cardName">Name on Card</label>
                <input
                  type="text"
                  id="cardName"
                  name="cardName"
                  value={paymentInfo.cardName}
                  onChange={handlePaymentChange}
                  className={formErrors.cardName ? styles.inputError : ''}
                />
                {formErrors.cardName && <span className={styles.errorMessage}>{formErrors.cardName}</span>}
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="expiry">Expiry Date (MM/YY)</label>
                  <input
                    type="text"
                    id="expiry"
                    name="expiry"
                    placeholder="MM/YY"
                    value={paymentInfo.expiry}
                    onChange={handlePaymentChange}
                    className={formErrors.expiry ? styles.inputError : ''}
                  />
                  {formErrors.expiry && <span className={styles.errorMessage}>{formErrors.expiry}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="cvv">CVV</label>
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    placeholder="XXX"
                    value={paymentInfo.cvv}
                    onChange={handlePaymentChange}
                    className={formErrors.cvv ? styles.inputError : ''}
                  />
                  {formErrors.cvv && <span className={styles.errorMessage}>{formErrors.cvv}</span>}
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              className={styles.placeOrderButton}
              disabled={orderProcessing}
            >
              {orderProcessing ? 'Processing Order...' : 'Place Order'}
            </button>
          </form>
          
          <div className={styles.orderSummary}>
            <div className={styles.summaryHeader}>
              <h2>Order Summary</h2>
              <span className={styles.itemCount}>{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
            </div>
            
            <div className={styles.summaryItems}>
              {cart.map(item => (
                <div key={item.id} className={styles.summaryItem}>
                  <div className={styles.itemInfo}>
                    <h3>{item.brand} {item.model}</h3>
                    <p>Size: {item.size}</p>
                    <p>Qty: {item.quantity}</p>
                  </div>
                  <div className={styles.itemPrice}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.summaryContent}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              {savings > 0 && (
                <div className={styles.summaryRow}>
                  <span>Savings</span>
                  <span className={styles.savingsAmount}>-${savings.toFixed(2)}</span>
                </div>
              )}
              
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span>Free</span>
              </div>
              
              <div className={styles.summaryRow}>
                <span>Estimated Tax</span>
                <span>${(subtotal * 0.08).toFixed(2)}</span>
              </div>
              
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total</span>
                <span>${(subtotal + (subtotal * 0.08)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 