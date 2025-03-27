import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '@/styles/OrderConfirmation.module.css';

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

interface Order {
  orderId: string;
  items: CartItem[];
  subtotal: number;
  savings: number;
  tax: number;
  shipping: number;
  total: number;
  date: string;
  shippingInfo: ShippingInfo;
}

export default function OrderConfirmation() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Retrieve order information from localStorage
    const getOrderDetails = () => {
      setLoading(true);
      try {
        const orderData = localStorage.getItem('lastOrder');
        if (orderData) {
          const parsedOrder = JSON.parse(orderData);
          setOrder(parsedOrder);
        } else {
          // If no order data found, redirect to home
          router.push('/');
        }
      } catch (error) {
        console.error('Failed to load order details:', error);
      } finally {
        setLoading(false);
      }
    };

    getOrderDetails();
  }, [router]);

  if (loading) {
    return (
      <Layout title="Order Confirmation - Gilda Tyres">
        <div className={styles.container}>
          <div className={styles.loading}>Loading order details...</div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout title="Order Confirmation - Gilda Tyres">
        <div className={styles.container}>
          <div className={styles.errorMessage}>
            <h1>Order Details Not Found</h1>
            <p>We couldn't find your order details. Please check your email for confirmation.</p>
            <Link href="/">
              <a className={styles.returnButton}>Return to Home</a>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Layout title="Order Confirmation - Gilda Tyres">
      <div className={styles.container}>
        <div className={styles.confirmation}>
          <div className={styles.checkmarkContainer}>
            <div className={styles.checkmark}>✓</div>
          </div>
          
          <h1 className={styles.title}>Order Confirmed!</h1>
          <p className={styles.subtitle}>Thank you for your purchase!</p>
          
          <div className={styles.orderInfo}>
            <div className={styles.orderDetail}>
              <span className={styles.label}>Order Number:</span>
              <span className={styles.value}>{order.orderId}</span>
            </div>
            <div className={styles.orderDetail}>
              <span className={styles.label}>Order Date:</span>
              <span className={styles.value}>{formatDate(order.date)}</span>
            </div>
            <div className={styles.orderDetail}>
              <span className={styles.label}>Shipping To:</span>
              <span className={styles.value}>
                {order.shippingInfo.firstName} {order.shippingInfo.lastName}, {order.shippingInfo.address}, {order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.zipCode}, {order.shippingInfo.country}
              </span>
            </div>
            <div className={styles.orderDetail}>
              <span className={styles.label}>Email:</span>
              <span className={styles.value}>{order.shippingInfo.email}</span>
            </div>
          </div>
          
          <div className={styles.orderSummary}>
            <h2>Order Summary</h2>
            
            <div className={styles.orderItems}>
              {order.items.map(item => (
                <div key={item.id} className={styles.orderItem}>
                  <div className={styles.itemInfo}>
                    <h3>{item.brand} {item.model}</h3>
                    <p>Size: {item.size}</p>
                    <p>Quantity: {item.quantity}</p>
                  </div>
                  <div className={styles.itemPrice}>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              
              {order.savings > 0 && (
                <div className={styles.totalRow}>
                  <span>Savings</span>
                  <span className={styles.savings}>-${order.savings.toFixed(2)}</span>
                </div>
              )}
              
              <div className={styles.totalRow}>
                <span>Shipping</span>
                <span>{order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`}</span>
              </div>
              
              <div className={styles.totalRow}>
                <span>Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              
              <div className={`${styles.totalRow} ${styles.finalTotal}`}>
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.nextSteps}>
            <h2>What's Next?</h2>
            <p>You will receive an email confirmation shortly at <strong>{order.shippingInfo.email}</strong> with your order details.</p>
            <p>Our team will process your order and prepare it for shipment. You'll receive another email with tracking information once your order has been shipped.</p>
          </div>
          
          <div className={styles.actions}>
            <Link href="/">
              <a className={styles.primaryButton}>Continue Shopping</a>
            </Link>
            <button className={styles.secondaryButton} onClick={() => window.print()}>
              Print Receipt
            </button>
          </div>
          
          <div className={styles.support}>
            <h3>Need Help?</h3>
            <p>If you have any questions about your order, please contact our customer support team at <a href="mailto:support@gildatyres.com">support@gildatyres.com</a> or call us at (555) 123-4567.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
} 