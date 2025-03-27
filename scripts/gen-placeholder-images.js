const fs = require('fs');
const path = require('path');

// Ensure directories exist
const brandDir = path.join(__dirname, '../public/images/brands');
const tireDir = path.join(__dirname, '../public/images/tires');
const bgDir = path.join(__dirname, '../public/images/backgrounds');

[brandDir, tireDir, bgDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Function to create a basic SVG
function createSVG(width, height, text, color = '#800000', textColor = '#FFFFFF') {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${color}" />
    <text x="50%" y="50%" font-family="Arial" font-size="${Math.min(width, height) / 10}px" 
      fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${text}</text>
  </svg>`;
}

// Function to create a circular tire SVG
function createTireSVG(width, height, brand) {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f0f0f0" />
    <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height) * 0.4}" fill="#333" stroke="#444" stroke-width="10" />
    <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height) * 0.3}" fill="#222" stroke="#666" stroke-width="5" />
    <text x="50%" y="50%" font-family="Arial" font-weight="bold" font-size="${Math.min(width, height) / 10}px" 
      fill="#fff" text-anchor="middle" dominant-baseline="middle">${brand} Tire</text>
  </svg>`;
}

// Create brand logos
const brands = [
  { name: 'Michelin', color: '#0046AD' },
  { name: 'Bridgestone', color: '#E10000' },
  { name: 'Continental', color: '#F9A01B' },
  { name: 'Pirelli', color: '#D40000' }
];

brands.forEach(brand => {
  const svg = createSVG(200, 100, brand.name, brand.color);
  fs.writeFileSync(path.join(brandDir, `${brand.name.toLowerCase()}.svg`), svg);
  
  // Save as PNG for browsers that don't support SVG
  fs.writeFileSync(path.join(brandDir, `${brand.name.toLowerCase()}.png`), svg);
});

// Create tire images
const tires = [
  { id: 1, brand: 'Michelin' },
  { id: 2, brand: 'Bridgestone' },
  { id: 3, brand: 'Continental' }
];

tires.forEach(tire => {
  const svg = createTireSVG(400, 400, tire.brand);
  fs.writeFileSync(path.join(tireDir, `tire-${tire.id}.svg`), svg);
  
  // Save as JPG for browsers that don't support SVG
  fs.writeFileSync(path.join(tireDir, `tire-${tire.id}.jpg`), svg);
});

// Create background image
const bgSvg = createSVG(1200, 600, 'Tire Background', '#222222');
fs.writeFileSync(path.join(bgDir, 'tire-background.svg'), bgSvg);
fs.writeFileSync(path.join(bgDir, 'tire-background.jpg'), bgSvg);

console.log('Generated placeholder images for the tire trading bot'); 