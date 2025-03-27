import { NextApiRequest, NextApiResponse } from 'next';
import { Tire } from '../../../data/tireData';

// Simple mock database of tires
const tires: { [key: string]: Tire & { full_size?: string, features?: string } } = {
  'michelin-pilot': {
    id: 'michelin-pilot',
    brand: 'Michelin',
    model: 'Pilot Sport 4S',
    size: '225/45R17',
    full_size: '225/45R17',
    base_price: 199.99,
    description: 'High-performance summer tire with excellent grip and handling',
    image_url: '/data/Tyre.webp',
    features: JSON.stringify({ type: 'Maximum performance, superior grip, long-lasting' }),
    specifications: {
      loadIndex: '91',
      speedRating: 'Y',
      season: 'Summer',
      runFlat: true
    }
  },
  'continental-extreme': {
    id: 'continental-extreme',
    brand: 'Continental',
    model: 'ExtremeContact DWS06',
    size: '225/45R17',
    full_size: '225/45R17',
    base_price: 179.99,
    description: 'All-season tire with excellent wet and dry performance',
    image_url: '/data/Tyre2.webp',
    features: JSON.stringify({ type: 'All-weather reliability, enhanced safety, German engineering' }),
    specifications: {
      loadIndex: '91',
      speedRating: 'Y',
      season: 'All-Season',
      runFlat: false
    }
  },
  'bridgestone-potenza': {
    id: 'bridgestone-potenza',
    brand: 'Bridgestone',
    model: 'Potenza Sport',
    size: '225/45R17',
    full_size: '225/45R17',
    base_price: 189.99,
    description: 'Ultra-high performance tire with maximum grip and control',
    image_url: '/data/Tyre3.webp',
    features: JSON.stringify({ type: 'Excellent handling, balanced performance, durability' }),
    specifications: {
      loadIndex: '91',
      speedRating: 'Y',
      season: 'Summer',
      runFlat: true
    }
  },
  'pirelli-pzero': {
    id: 'pirelli-pzero',
    brand: 'Pirelli',
    model: 'P Zero',
    size: '245/35R20',
    full_size: '245/35R20',
    base_price: 209.99,
    description: 'Ultra-high performance tire for luxury and sports cars',
    image_url: '/data/Tyre5.webp',
    features: JSON.stringify({ type: 'High-performance, precision control, motorsport heritage' }),
    specifications: {
      loadIndex: '95',
      speedRating: 'Y',
      season: 'Summer',
      runFlat: true
    }
  }
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'Missing tire ID' });
  }

  const tireId = Array.isArray(id) ? id[0] : id;
  
  // Check if the tire exists in our mock database
  if (tires[tireId]) {
    return res.status(200).json(tires[tireId]);
  }
  
  // Handle numeric IDs from previous implementation
  if (!isNaN(parseInt(tireId, 10))) {
    // Return the first tire as a fallback for now
    const firstTire = Object.values(tires)[0];
    return res.status(200).json(firstTire);
  }

  return res.status(404).json({ message: 'Tire not found' });
} 