import { NextApiRequest, NextApiResponse } from 'next';

// Define the tire interface
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

// Database of popular tire models for different vehicle types
const tireSizesByVehicle: Record<string, Record<string, Record<string, string>>> = {
  'BMW': {
    '3-Series': {
      '2020': '225/45R17',
      '2021': '225/45R17',
      '2022': '225/45R17',
      '2023': '225/45R17',
      '2024': '225/45R17',
    },
    '5-Series': {
      '2020': '245/45R18',
      '2021': '245/45R18',
      '2022': '245/45R18',
      '2023': '245/45R18',
      '2024': '245/45R18',
    },
    'X5': {
      '2020': '275/40R20',
      '2021': '275/40R20',
      '2022': '275/40R20',
      '2023': '275/40R20',
      '2024': '275/40R20',
    },
  },
  'Audi': {
    'A4': {
      '2020': '225/50R17',
      '2021': '225/50R17',
      '2022': '225/50R17',
      '2023': '225/50R17',
      '2024': '225/50R17',
    },
    'A6': {
      '2020': '245/45R18',
      '2021': '245/45R18',
      '2022': '245/45R18',
      '2023': '245/45R18',
      '2024': '245/45R18',
    },
    'Q5': {
      '2020': '235/60R18',
      '2021': '235/60R18',
      '2022': '235/60R18',
      '2023': '235/60R18',
      '2024': '235/60R18',
    },
  },
  'Mercedes': {
    'C-Class': {
      '2020': '225/45R17',
      '2021': '225/45R17',
      '2022': '225/45R17',
      '2023': '225/45R17',
      '2024': '225/45R17',
    },
    'E-Class': {
      '2020': '245/45R18',
      '2021': '245/45R18',
      '2022': '245/45R18',
      '2023': '245/45R18',
      '2024': '245/45R18',
    },
    'GLC': {
      '2020': '235/60R18',
      '2021': '235/60R18',
      '2022': '235/60R18',
      '2023': '235/60R18',
      '2024': '235/60R18',
    },
  },
};

// Database of tire options
const tireOptions: Tire[] = [
  {
    id: 'michelin-pilot',
    brand: 'Michelin',
    model: 'Pilot Sport 4S',
    size: '225/45R17',
    full_size: '225/45R17',
    base_price: 199.99,
    description: 'High-performance summer tire with excellent grip and handling',
    image_url: '/data/Tyre4.webp',
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
    image_url: '/data/Tyre2.webp',
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
    image_url: '/data/Tyre.webp',
    features: JSON.stringify({ type: 'Summer' })
  },
  {
    id: 'pirelli-pzero',
    brand: 'Pirelli',
    model: 'P Zero',
    size: '245/45R18',
    full_size: '245/45R18',
    base_price: 219.99,
    description: 'Premium performance tire with superior handling and grip',
    image_url: '/data/Tyre5.webp',
    features: JSON.stringify({ type: 'Summer' })
  },
  {
    id: 'goodyear-eagle',
    brand: 'Goodyear',
    model: 'Eagle F1 Asymmetric 5',
    size: '245/45R18',
    full_size: '245/45R18',
    base_price: 199.99,
    description: 'High-performance tire with excellent wet braking and handling',
    image_url: '/data/Tyre3.webp',
    features: JSON.stringify({ type: 'Summer' })
  },
  {
    id: 'michelin-primacy',
    brand: 'Michelin',
    model: 'Primacy 4',
    size: '235/60R18',
    full_size: '235/60R18',
    base_price: 189.99,
    description: 'Touring tire with long-lasting performance and comfort',
    image_url: '/data/Tyre4.webp',
    features: JSON.stringify({ type: 'All-Season' })
  },
  {
    id: 'bridgestone-alenza',
    brand: 'Bridgestone',
    model: 'Alenza A/S Ultra',
    size: '275/40R20',
    full_size: '275/40R20',
    base_price: 259.99,
    description: 'Premium all-season tire for SUVs with exceptional comfort and handling',
    image_url: '/data/Tyre.webp',
    features: JSON.stringify({ type: 'All-Season' })
  },
  {
    id: 'continental-contisport',
    brand: 'Continental',
    model: 'ContiSportContact 5 SUV',
    size: '275/40R20',
    full_size: '275/40R20',
    base_price: 249.99,
    description: 'High-performance SUV tire with excellent handling and braking',
    image_url: '/data/Tyre2.webp',
    features: JSON.stringify({ type: 'Summer' })
  }
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { make, model, year } = req.query;
  
  // Validate parameters
  if (!make || !model || !year || 
      Array.isArray(make) || 
      Array.isArray(model) || 
      Array.isArray(year)) {
    return res.status(400).json({ error: 'Invalid parameters. Please provide make, model, and year.' });
  }

  // Check if we have tire sizes for this vehicle
  const vehicleMake = make as string;
  const vehicleModel = model as string;
  const vehicleYear = year as string;
  
  try {
    // Find the correct tire size for the vehicle
    const tireSize = tireSizesByVehicle[vehicleMake]?.[vehicleModel]?.[vehicleYear];
    
    if (!tireSize) {
      // If we don't have a specific size, return a generic set of tires
      return res.status(200).json({ 
        tires: tireOptions.slice(0, 3),
        message: 'Showing generic tire options as exact size not found'
      });
    }
    
    // Filter tires by size
    const matchingTires = tireOptions.filter(tire => 
      tire.size === tireSize || tire.size.includes(tireSize.split('/')[0])
    );
    
    if (matchingTires.length === 0) {
      // If no exact matches, return tires that are close in size
      return res.status(200).json({ 
        tires: tireOptions.slice(0, 3),
        message: 'Showing alternative tire options as exact size match not found'
      });
    }
    
    return res.status(200).json({ 
      tires: matchingTires,
      size: tireSize
    });
  } catch (error) {
    console.error('Error finding tires:', error);
    return res.status(500).json({ error: 'Error finding tires for this vehicle' });
  }
} 