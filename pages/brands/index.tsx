import { useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import styles from '../../styles/Brands.module.css';

interface Brand {
  name: string;
  image: string;
  description: string;
}

export default function Brands() {
  const brands: Brand[] = [
    {
      name: 'Michelin',
      image: '/Michelin_logo.jpeg',
      description: 'Premium tires with exceptional performance and longevity. Known for innovative technology and superior handling.'
    },
    {
      name: 'Bridgestone',
      image: '/Bridgestone_Logo.png',
      description: 'World-leading tire brand offering high-quality tires for a wide range of vehicles. Excellent grip and durability.'
    },
    {
      name: 'Continental',
      image: '/continental-logo-black-on-gold.png',
      description: 'German engineering at its finest. Premium tires with superior braking and handling capabilities.'
    },
    {
      name: 'Pirelli',
      image: '/Logo-pirelli-icon-PNG.png',
      description: 'Italian premium tire manufacturer known for high-performance tires. Preferred by luxury car brands worldwide.'
    },
    {
      name: 'Gilda Tyres',
      image: '/gilda_tyres-logo-black-on-gold.png',
      description: 'Our own premium house brand offering excellent quality at competitive prices. Designed for everyday driving.'
    }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter brands based on search term
  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Premium Tire Brands</h1>
        <p className={styles.subtitle}>
          Explore our selection of top-quality tire brands for every vehicle and driving style
        </p>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.brandsGrid}>
          {filteredBrands.map((brand) => (
            <Link 
              href={`/brands/${brand.name.toLowerCase()}`} 
              key={brand.name}
              className={styles.brandCard}
            >
              <a className={styles.brandCardLink}>
                <div className={styles.brandLogo}>
                  <img src={brand.image} alt={brand.name} width={180} height={120} />
                </div>
                <h2 className={styles.brandName}>{brand.name}</h2>
                <p className={styles.brandDescription}>{brand.description}</p>
                <span className={styles.viewButton}>View Tires</span>
              </a>
            </Link>
          ))}
        </div>

        <div className={styles.brandsInfo}>
          <h2>Why Choose Premium Tire Brands?</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <h3>Superior Performance</h3>
              <p>Premium tire brands invest heavily in research and development, resulting in better grip, handling, and overall performance.</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Enhanced Safety</h3>
              <p>Higher quality materials and advanced technology provide better braking performance and stability in emergency situations.</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Longer Lifespan</h3>
              <p>Premium tires typically last longer due to better materials and construction, offering better value despite the higher initial cost.</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Fuel Efficiency</h3>
              <p>Many premium tires are designed with low rolling resistance, which can improve your vehicle's fuel economy over time.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 