import { NextApiRequest, NextApiResponse } from 'next';

interface OrderItem {
  tireId: string;
  quantity: number;
  price: number;
}

interface OrderData {
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  items: OrderItem[];
  paymentMethod: string;
  shippingMethod: string;
  total: number;
}

// In-memory store for orders (would be a database in production)
const orders: { [key: string]: OrderData & { id: string, date: string } } = {};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    // Create a new order
    try {
      const orderData: OrderData = req.body;
      
      // Validate order data
      if (!orderData.customerInfo || !orderData.items || orderData.items.length === 0) {
        return res.status(400).json({ message: 'Invalid order data' });
      }
      
      // Generate a simple order ID
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Store the order
      orders[orderId] = {
        ...orderData,
        id: orderId,
        date: new Date().toISOString()
      };
      
      return res.status(201).json({ 
        orderId,
        message: 'Order created successfully',
        date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing order:', error);
      return res.status(500).json({ message: 'Failed to process order' });
    }
  } else if (req.method === 'GET') {
    // Get a specific order
    const { id } = req.query;
    
    if (!id) {
      // Return all orders (would typically be limited and paginated)
      return res.status(200).json(Object.values(orders));
    }
    
    const orderId = Array.isArray(id) ? id[0] : id;
    const order = orders[orderId];
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    return res.status(200).json(order);
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
} 