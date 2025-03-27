export interface Tire {
  id: string;
  brand: string;
  model: string;
  size: string;
  base_price: number;
  description: string;
  image_url: string;
  specifications: {
    loadIndex: string;
    speedRating: string;
    season: 'Summer' | 'Winter' | 'All-Season';
    runFlat: boolean;
  };
}

// Tire recommendations for specific car models
const carTireRecommendations: { [key: string]: { size: string; recommended: string[] } } = {
  // BMW Models
  '3-Series': {
    size: "225/45R17",
    recommended: ['Michelin', 'Bridgestone', 'Continental'] // Sport sedan focus
  },
  '5-Series': {
    size: "245/45R18",
    recommended: ['Michelin', 'Continental', 'Pirelli'] // Luxury sedan focus
  },
  'X5': {
    size: "255/50R19",
    recommended: ['Bridgestone', 'Pirelli', 'Goodyear'] // SUV focus
  },
  
  // Audi Models
  'A4': {
    size: "225/50R17",
    recommended: ['Continental', 'Michelin', 'Goodyear'] // Sport sedan focus
  },
  'A6': {
    size: "245/45R18",
    recommended: ['Pirelli', 'Michelin', 'Continental'] // Luxury sedan focus
  },
  'Q5': {
    size: "235/60R18",
    recommended: ['Goodyear', 'Bridgestone', 'Continental'] // SUV focus
  },
  
  // Mercedes Models
  'C-Class': {
    size: "225/45R17",
    recommended: ['Continental', 'Michelin', 'Pirelli'] // Sport luxury focus
  },
  'E-Class': {
    size: "245/45R18",
    recommended: ['Michelin', 'Pirelli', 'Continental'] // Luxury focus
  },
  'GLC': {
    size: "235/60R18",
    recommended: ['Bridgestone', 'Goodyear', 'Continental'] // SUV focus
  }
};

// Helper function to get tire image based on brand
function getTireImage(brand: string): string {
  switch (brand.toLowerCase()) {
    case 'michelin':
      return '/data/Tyre.webp';
    case 'continental':
      return '/data/Tyre2.webp';
    case 'bridgestone':
      return '/data/Tyre3.webp';
    case 'goodyear':
      return '/data/Tyre4.webp';
    case 'pirelli':
      return '/data/Tyre5.webp';
    default:
      return '/data/Tyre.webp';
  }
}

// Tire model specifications
const tireModels: { [key: string]: { model: string; description: string; base_price: number; specs: any } } = {
  'Michelin': {
    model: "Pilot Sport 4S",
    description: "High-performance summer tire with excellent grip and handling",
    base_price: 199.99,
    specs: {
      loadIndex: "91",
      speedRating: "Y",
      season: "Summer",
      runFlat: true
    }
  },
  'Continental': {
    model: "ExtremeContact DWS06",
    description: "All-season tire with excellent wet and dry performance",
    base_price: 179.99,
    specs: {
      loadIndex: "91",
      speedRating: "Y",
      season: "All-Season",
      runFlat: false
    }
  },
  'Bridgestone': {
    model: "Potenza Sport",
    description: "Ultra-high performance tire with maximum grip and control",
    base_price: 189.99,
    specs: {
      loadIndex: "91",
      speedRating: "Y",
      season: "Summer",
      runFlat: true
    }
  },
  'Goodyear': {
    model: "Eagle F1 Asymmetric 6",
    description: "Premium performance tire with superior wet handling",
    base_price: 185.99,
    specs: {
      loadIndex: "91",
      speedRating: "Y",
      season: "Summer",
      runFlat: false
    }
  },
  'Pirelli': {
    model: "P Zero",
    description: "Ultra-high performance tire for luxury and sports cars",
    base_price: 209.99,
    specs: {
      loadIndex: "91",
      speedRating: "Y",
      season: "Summer",
      runFlat: true
    }
  }
};

// Helper function to generate tire data for a specific model and size
function generateTireData(modelKey: string, size: string): Tire[] {
  console.log('Generating tire data for model:', modelKey); // Debug log
  
  // Remove any potential underscores from the model key
  const carModel = modelKey.replace('_', '-');
  console.log('Looking up recommendations for:', carModel); // Debug log
  
  const recommendations = carTireRecommendations[carModel]?.recommended || Object.keys(tireModels);
  console.log('Found recommendations:', recommendations); // Debug log
  
  const tires = recommendations.map(brand => {
    const tireModel = tireModels[brand];
    return {
      id: `${brand.toLowerCase()}-${modelKey}`,
      brand: brand,
      model: tireModel.model,
      size: size,
      base_price: tireModel.base_price,
      description: tireModel.description,
      image_url: getTireImage(brand),
      specifications: tireModel.specs
    };
  });
  
  console.log(`Generated ${tires.length} tires for ${modelKey}`); // Debug log
  return tires;
}

// Generate database entries for all years
const years = Array.from({ length: 10 }, (_, i) => (2024 - i).toString());
const tireDatabase: { [key: string]: Tire[] } = {};

// BMW Models
years.forEach(year => {
  tireDatabase[`BMW-3-Series-${year}`] = generateTireData('3-Series', carTireRecommendations['3-Series'].size);
  tireDatabase[`BMW-5-Series-${year}`] = generateTireData('5-Series', carTireRecommendations['5-Series'].size);
  tireDatabase[`BMW-X5-${year}`] = generateTireData('X5', carTireRecommendations['X5'].size);
});

// Audi Models
years.forEach(year => {
  tireDatabase[`Audi-A4-${year}`] = generateTireData('A4', carTireRecommendations['A4'].size);
  tireDatabase[`Audi-A6-${year}`] = generateTireData('A6', carTireRecommendations['A6'].size);
  tireDatabase[`Audi-Q5-${year}`] = generateTireData('Q5', carTireRecommendations['Q5'].size);
});

// Mercedes Models
years.forEach(year => {
  tireDatabase[`Mercedes-C-Class-${year}`] = generateTireData('C-Class', carTireRecommendations['C-Class'].size);
  tireDatabase[`Mercedes-E-Class-${year}`] = generateTireData('E-Class', carTireRecommendations['E-Class'].size);
  tireDatabase[`Mercedes-GLC-${year}`] = generateTireData('GLC', carTireRecommendations['GLC'].size);
});

export function getTiresForVehicle(make: string, model: string, year: string): Tire[] {
  // Format the key to match the database
  const key = `${make}-${model}-${year}`;
  console.log('Searching for key:', key); // Debug log
  
  // Get the tires from the database
  const tires = tireDatabase[key] || [];
  console.log('Found tires:', tires.length); // Debug log
  
  // If no tires found, return all available tires for that size
  if (tires.length === 0) {
    console.log('No specific recommendations found, returning all tire options');
    const defaultSize = "225/45R17"; // Default size if none found
    return Object.keys(tireModels).map(brand => {
      const tireModel = tireModels[brand];
      return {
        id: `${brand.toLowerCase()}-default`,
        brand: brand,
        model: tireModel.model,
        size: defaultSize,
        base_price: tireModel.base_price,
        description: tireModel.description,
        image_url: getTireImage(brand),
        specifications: tireModel.specs
      };
    });
  }
  
  return tires;
}

export const tireWidths = ["185", "195", "205", "215", "225", "235", "245", "255", "265", "275", "285", "295", "305", "315", "325", "335", "345", "355"];
export const tireProfiles = ["25", "30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80"];
export const rimSizes = ["14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"]; 