import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/Cart.module.css';

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

export default function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subtotal, setSubtotal] = useState(0);
  const [savings, setSavings] = useState(0);

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
        }
      } catch (error) {
        console.error('Failed to load cart:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, []);

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

  const updateCart = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem('tireCart', JSON.stringify(updatedCart));
    calculateTotals(updatedCart);
  };

  const updateQuantity = (id: string, change: number) => {
    const updatedCart = cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    updateCart(updatedCart);
  };

  const removeItem = (id: string) => {
    const updatedCart = cart.filter(item => item.id !== id);
    updateCart(updatedCart);
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('tireCart');
    setSubtotal(0);
    setSavings(0);
  };

  const proceedToCheckout = () => {
    // Implement checkout logic (redirect to checkout page, etc.)
    alert('Redirecting to checkout...');
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.loading}>Loading your cart...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>
            ← Back to shopping
          </Link>
          <h1 className={styles.title}>Your Cart</h1>
        </div>

        {cart.length === 0 ? (
          <div className={styles.emptyCart}>
            <h2>Your cart is empty</h2>
            <p>You haven't added any tires to your cart yet.</p>
            <Link href="/" className={styles.shopButton}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className={styles.cartContent}>
            <div className={styles.cartItems}>
              <div className={styles.cartHeader}>
                <div>Product</div>
                <div>Price</div>
                <div>Quantity</div>
                <div>Total</div>
                <div></div>
              </div>

              {cart.map(item => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.productCol}>
                    <div className={styles.productInfo}>
                      <h3>{item.brand} {item.model}</h3>
                      <p>Size: {item.size}</p>
                      {item.originalPrice && (
                        <span className={styles.discount}>
                          {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.priceCol}>
                    {item.originalPrice && (
                      <span className={styles.originalPrice}>${item.originalPrice.toFixed(2)}</span>
                    )}
                    <span className={item.originalPrice ? styles.salePrice : ''}>
                      ${item.price.toFixed(2)}
                    </span>
                  </div>

                  <div className={styles.quantityCol}>
                    <div className={styles.quantityControl}>
                      <button 
                        className={styles.quantityButton}
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className={styles.quantityValue}>{item.quantity}</span>
                      <button 
                        className={styles.quantityButton}
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className={styles.totalCol}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>

                  <div className={styles.actionCol}>
                    <button 
                      className={styles.removeButton}
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.cartSummary}>
              <div className={styles.summaryHeader}>
                <h2>Order Summary</h2>
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
              
              <div className={styles.summaryActions}>
                <button 
                  className={styles.checkoutButton}
                  onClick={proceedToCheckout}
                >
                  Proceed to Checkout
                </button>
                
                <button 
                  className={styles.clearButton}
                  onClick={clearCart}
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 