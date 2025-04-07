import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/Brand.module.css';
import Layout from '../../components/Layout';

interface Tire {
  id: number;
  brand: string;
  model: string;
  base_price: number;
  description: string;
  features: string;
  full_size: string;
}

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

const popularTireModels = {
  'bridgestone': [
    {
      id: 1,
      brand: 'Bridgestone',
      model: 'Potenza Sport',
      base_price: 189.99,
      description: 'Ultra-high performance tire with maximum grip and control',
      features: JSON.stringify({ type: 'Summer', runFlat: true }),
      full_size: '245/40R18'
    },
    {
      id: 2,
      brand: 'Bridgestone',
      model: 'Turanza QuietTrack',
      base_price: 169.99,
      description: 'Premium touring tire with exceptional comfort and low noise',
      features: JSON.stringify({ type: 'All-Season', runFlat: false }),
      full_size: '225/45R17'
    },
    {
      id: 3,
      brand: 'Bridgestone',
      model: 'Dueler H/L Alenza Plus',
      base_price: 199.99,
      description: 'Luxury SUV tire with long-lasting performance',
      features: JSON.stringify({ type: 'All-Season', runFlat: false }),
      full_size: '255/55R18'
    }
  ],
  'michelin': [
    {
      id: 4,
      brand: 'Michelin',
      model: 'Pilot Sport 4S',
      base_price: 219.99,
      description: 'High-performance summer tire with excellent grip and handling',
      features: JSON.stringify({ type: 'Summer', runFlat: true }),
      full_size: '245/40R18'
    },
    {
      id: 5,
      brand: 'Michelin',
      model: 'CrossClimate 2',
      base_price: 189.99,
      description: 'All-weather tire with superior year-round performance',
      features: JSON.stringify({ type: 'All-Season', runFlat: false }),
      full_size: '225/45R17'
    }
  ],
  'continental': [
    {
      id: 6,
      brand: 'Continental',
      model: 'ExtremeContact DWS06 Plus',
      base_price: 179.99,
      description: 'Ultra-high performance all-season tire',
      features: JSON.stringify({ type: 'All-Season', runFlat: false }),
      full_size: '245/40R18'
    },
    {
      id: 7,
      brand: 'Continental',
      model: 'PureContact LS',
      base_price: 159.99,
      description: 'Grand touring all-season tire',
      features: JSON.stringify({ type: 'All-Season', runFlat: false }),
      full_size: '225/45R17'
    }
  ],
  'goodyear': [
    {
      id: 8,
      brand: 'Goodyear',
      model: 'Eagle F1 Asymmetric 6',
      base_price: 199.99,
      description: 'Ultra-high performance summer tire',
      features: JSON.stringify({ type: 'Summer', runFlat: false }),
      full_size: '245/40R18'
    },
    {
      id: 9,
      brand: 'Goodyear',
      model: 'Assurance WeatherReady',
      base_price: 169.99,
      description: 'Premium all-weather tire',
      features: JSON.stringify({ type: 'All-Season', runFlat: false }),
      full_size: '225/45R17'
    }
  ],
  'pirelli': [
    {
      id: 10,
      brand: 'Pirelli',
      model: 'P Zero',
      base_price: 229.99,
      description: 'Ultra-high performance tire for luxury and sports cars',
      features: JSON.stringify({ type: 'Summer', runFlat: true }),
      full_size: '245/40R18'
    },
    {
      id: 11,
      brand: 'Pirelli',
      model: 'Cinturato P7',
      base_price: 179.99,
      description: 'Grand touring all-season tire',
      features: JSON.stringify({ type: 'All-Season', runFlat: false }),
      full_size: '225/45R17'
    }
  ]
};

export default function BrandPage() {
  const router = useRouter();
  const { brand } = router.query;
  const [tires, setTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    if (brand) {
      setLoading(true);
      const brandKey = brand.toString().toLowerCase();
      const brandTires = popularTireModels[brandKey as keyof typeof popularTireModels] || [];
      setTires(brandTires);
      setLoading(false);
    }
  }, [brand]);

  const addToCart = (tire: Tire) => {
    // Generate a unique ID
    const uniqueId = `${tire.brand.toLowerCase()}-${tire.model.toLowerCase()}-${tire.full_size.replace(/\//g, '-')}`;
    
    // Get image path based on brand
    const imagePath = (() => {
      switch(tire.brand.toLowerCase()) {
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
    })();

    // Create cart item
    const cartItem: CartItem = {
      id: uniqueId,
      brand: tire.brand,
      model: tire.model,
      size: tire.full_size,
      image: imagePath,
      price: tire.base_price,
      // Add a slight original price to show a discount
      originalPrice: Math.round(tire.base_price * 1.1 * 100) / 100,
      quantity: 1
    };

    // Get current cart or initialize empty cart
    let currentCart: CartItem[] = [];
    try {
      const savedCart = localStorage.getItem('tireCart');
      if (savedCart) {
        currentCart = JSON.parse(savedCart);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    }

    // Check if item already in cart
    const existingItemIndex = currentCart.findIndex(item => item.id === uniqueId);

    // Either update quantity or add new item
    if (existingItemIndex !== -1) {
      currentCart[existingItemIndex].quantity += 1;
    } else {
      currentCart.push(cartItem);
    }

    // Save cart back to localStorage
    localStorage.setItem('tireCart', JSON.stringify(currentCart));
    
    // Update state to show added to cart message
    setAddedToCart({...addedToCart, [tire.id]: true});
    
    // Clear the "Added to cart" message after 3 seconds
    setTimeout(() => {
      setAddedToCart({...addedToCart, [tire.id]: false});
    }, 3000);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  const formattedBrand = typeof brand === 'string' 
    ? brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase() 
    : '';

  return (
    <Layout>
      <div className={styles.container}>
        <Head>
          <title>{formattedBrand} Tires - Tire Trading Bot</title>
          <meta name="description" content={`Browse and buy ${formattedBrand} tires at the best prices`} />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className={styles.main}>
          <Link href="/" className={styles.backLink}>
            ← Back to Home
          </Link>

          <h1 className={styles.title}>{formattedBrand} Tires</h1>

          <section className={styles.popularModels}>
            <h2>Popular {formattedBrand} Models</h2>
            <div className={styles.tireGrid}>
              {tires.map((tire) => (
                <div key={tire.id} className={styles.tireCard}>
                  <div className={styles.tireImage}>
                    <Image
                      src={(() => {
                        switch(tire.brand.toLowerCase()) {
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
                      })()}
                      alt={`${tire.brand} ${tire.model}`}
                      width={300}
                      height={300}
                      priority
                    />
                  </div>
                  <div className={styles.tireInfo}>
                    <h3>{tire.model}</h3>
                    <p className={styles.price}>Starting from ${tire.base_price}</p>
                    <p className={styles.size}>Size: {tire.full_size}</p>
                    <p className={styles.description}>{tire.description}</p>
                    {tire.features && typeof tire.features === 'string' && (
                      <div className={styles.features}>
                        {JSON.parse(tire.features).type && (
                          <span className={styles.feature}>
                            Type: {JSON.parse(tire.features).type}
                          </span>
                        )}
                        {JSON.parse(tire.features).runFlat && (
                          <span className={styles.feature}>
                            Run Flat: Yes
                          </span>
                        )}
                      </div>
                    )}
                    <div className={styles.buttonGroup}>
                      <button 
                        className={styles.chatButton}
                        onClick={() => router.push(`/vehicle/any/${formattedBrand}/${tire.model}`)}
                      >
                        Chat with Expert
                      </button>
                      <button 
                        className={`${styles.addButton} ${addedToCart[tire.id] ? styles.added : ''}`}
                        onClick={() => addToCart(tire)}
                      >
                        {addedToCart[tire.id] ? 'Added to Cart ✓' : 'Add to Cart'}
                      </button>
                    </div>
                    {addedToCart[tire.id] && (
                      <div className={styles.cartNotification}>
                        <Link href="/cart">
                          <a className={styles.viewCartLink}>View Cart</a>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
} 