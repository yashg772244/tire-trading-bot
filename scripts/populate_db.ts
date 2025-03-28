import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function populateDatabase() {
  const db = await open({
    filename: 'tires.db',
    driver: sqlite3.Database
  });

  // Clear existing data
  await db.exec(`
    DELETE FROM tire_vehicle_compatibility;
    DELETE FROM tire_product;
    DELETE FROM tire_size;
    DELETE FROM vehicle;
  `);

  // Insert tire sizes
  const tireSizes = [
    { id: 1, full_size: '205/55R16' },
    { id: 2, full_size: '225/45R17' },
    { id: 3, full_size: '245/40R18' },
    { id: 4, full_size: '265/35R19' },
    { id: 5, full_size: '285/30R20' }
  ];

  for (const size of tireSizes) {
    await db.run(`
      INSERT INTO tire_size (id, full_size)
      VALUES (?, ?)
    `, [size.id, size.full_size]);
  }

  // Insert tire products
  const tireProducts = [
    {
      brand: 'Michelin',
      model: 'Pilot Sport 4S',
      size_id: 3,
      base_price: 220,
      description: 'High-performance summer tire with excellent grip and handling',
      features: 'Asymmetric tread pattern, High-performance compound, Excellent wet and dry grip'
    },
    {
      brand: 'Continental',
      model: 'ExtremeContact DWS06',
      size_id: 2,
      base_price: 190,
      description: 'All-season performance tire with superior wet traction',
      features: 'All-season compound, Enhanced wet traction, Comfortable ride'
    },
    {
      brand: 'Bridgestone',
      model: 'Potenza RE-71R',
      size_id: 4,
      base_price: 200,
      description: 'Ultra-high-performance summer tire for sports cars',
      features: 'Maximum grip, Precise steering, Sporty handling'
    },
    {
      brand: 'Goodyear',
      model: 'Eagle F1 Asymmetric 3',
      size_id: 1,
      base_price: 180,
      description: 'Premium summer tire with balanced performance',
      features: 'Balanced performance, Good wear life, Responsive handling'
    },
    {
      brand: 'Pirelli',
      model: 'P Zero',
      size_id: 5,
      base_price: 230,
      description: 'Luxury performance tire for high-end vehicles',
      features: 'Luxury comfort, High-performance grip, Premium ride quality'
    }
  ];

  for (const tire of tireProducts) {
    const { base_price } = tire;
    const offer_price = base_price * 0.9; // 10% off
    const bulk_price = base_price * 0.85; // 15% off

    await db.run(`
      INSERT INTO tire_product (brand, model, size_id, base_price, offer_price, bulk_price, description, features)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tire.brand,
      tire.model,
      tire.size_id,
      base_price,
      offer_price,
      bulk_price,
      tire.description,
      tire.features
    ]);
  }

  // Insert vehicles
  const vehicles = [
    { make: 'BMW', model: 'M3', year: 2020, tire_size: '245/40R18' },
    { make: 'Mercedes', model: 'C63 AMG', year: 2021, tire_size: '245/40R18' },
    { make: 'Audi', model: 'RS3', year: 2022, tire_size: '225/45R17' },
    { make: 'Porsche', model: '911', year: 2023, tire_size: '265/35R19' },
    { make: 'Ferrari', model: 'F8', year: 2023, tire_size: '285/30R20' }
  ];

  for (const vehicle of vehicles) {
    await db.run(`
      INSERT INTO vehicle (make, model, year, tire_size)
      VALUES (?, ?, ?, ?)
    `, [vehicle.make, vehicle.model, vehicle.year, vehicle.tire_size]);
  }

  await db.close();
  console.log('Database populated successfully!');
}

populateDatabase().catch(console.error); 