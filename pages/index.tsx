import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import styles from '../styles/Home.module.css';

type QuantitiesType = {
  [key: number]: number;
};

export default function Home() {
  const router = useRouter();
  const [searchType, setSearchType] = useState('vehicle');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [tireWidth, setTireWidth] = useState('');
  const [tireAspect, setTireAspect] = useState('');
  const [tireRim, setTireRim] = useState('');
  const [quantities, setQuantities] = useState<QuantitiesType>({
    1: 1,
    2: 1,
    3: 1
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchType === 'vehicle' && vehicleMake && vehicleModel && vehicleYear) {
      router.push(`/vehicle/${vehicleMake}/${vehicleModel}/${vehicleYear}`);
    } else if (searchType === 'size' && tireWidth && tireAspect && tireRim) {
      router.push(`/tires/size?width=${tireWidth}&aspect=${tireAspect}&rim=${tireRim}`);
    }
  };

  const updateQuantity = (id: number, change: number) => {
    setQuantities(prev => {
      const newQty = Math.max(1, prev[id] + change);
      return { ...prev, [id]: newQty };
    });
  };

  const addToCart = (id: number, name: string, brand: string, price: number) => {
    // In a real application, this would add to cart state/localStorage
    alert(`Added ${quantities[id]} ${brand} ${name} to cart!`);
  };

  const calculateDiscount = (price: number) => {
    return (price * 0.95).toFixed(2);
  };

  const topBrands = [
    { 
      id: 'michelin', 
      name: 'Michelin', 
      logo: '/images/brands/michelin.png',
      description: 'Premium performance and durability'
    },
    { 
      id: 'bridgestone', 
      name: 'Bridgestone', 
      logo: '/images/brands/bridgestone.png',
      description: 'Innovation for every driving condition'
    },
    { 
      id: 'continental', 
      name: 'Continental', 
      logo: '/images/brands/continental.png',
      description: 'German engineering for optimal safety'
    },
    { 
      id: 'pirelli', 
      name: 'Pirelli', 
      logo: '/images/brands/pirelli.png',
      description: 'Performance-focused tire technology'
    }
  ];

  return (
    <Layout>
      <div className={styles.container}>
        <main className={styles.main}>
          <section className={styles.heroSection}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Find Your Perfect Tires</h1>
              <p className={styles.heroSubtitle}>
                Premium tires for any vehicle, season, or driving style. Experience the difference quality makes.
              </p>
            </div>
          </section>

          <section className={styles.searchSection}>
            <div className={styles.searchTabs}>
              <button 
                className={`${styles.searchTab} ${searchType === 'vehicle' ? styles.activeTab : ''}`}
                onClick={() => setSearchType('vehicle')}
              >
                Search by Vehicle
              </button>
              <button 
                className={`${styles.searchTab} ${searchType === 'size' ? styles.activeTab : ''}`}
                onClick={() => setSearchType('size')}
              >
                Search by Tire Size
              </button>
            </div>

            <form className={styles.searchForm} onSubmit={handleSearch}>
              {searchType === 'vehicle' ? (
                <>
                  <div className={styles.searchRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="make">Make</label>
                      <select 
                        id="make" 
                        value={vehicleMake}
                        onChange={(e) => setVehicleMake(e.target.value)}
                        required
                      >
                        <option value="">Select Make</option>
                        <option value="toyota">Toyota</option>
                        <option value="honda">Honda</option>
                        <option value="ford">Ford</option>
                        <option value="chevrolet">Chevrolet</option>
                        <option value="bmw">BMW</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="model">Model</label>
                      <select 
                        id="model" 
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        required
                      >
                        <option value="">Select Model</option>
                        <option value="camry">Camry</option>
                        <option value="corolla">Corolla</option>
                        <option value="civic">Civic</option>
                        <option value="accord">Accord</option>
                        <option value="f150">F-150</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.searchRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="year">Year</label>
                      <select 
                        id="year"
                        value={vehicleYear}
                        onChange={(e) => setVehicleYear(e.target.value)}
                        required
                      >
                        <option value="">Select Year</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                        <option value="2020">2020</option>
                        <option value="2019">2019</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.searchRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="width">Width (mm)</label>
                    <select 
                      id="width"
                      value={tireWidth}
                      onChange={(e) => setTireWidth(e.target.value)}
                      required
                    >
                      <option value="">Select Width</option>
                      <option value="195">195</option>
                      <option value="205">205</option>
                      <option value="215">215</option>
                      <option value="225">225</option>
                      <option value="235">235</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="aspect">Aspect Ratio (%)</label>
                    <select 
                      id="aspect"
                      value={tireAspect}
                      onChange={(e) => setTireAspect(e.target.value)}
                      required
                    >
                      <option value="">Select Aspect</option>
                      <option value="45">45</option>
                      <option value="50">50</option>
                      <option value="55">55</option>
                      <option value="60">60</option>
                      <option value="65">65</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="rim">Rim Diameter (inches)</label>
                    <select 
                      id="rim"
                      value={tireRim}
                      onChange={(e) => setTireRim(e.target.value)}
                      required
                    >
                      <option value="">Select Rim</option>
                      <option value="16">16</option>
                      <option value="17">17</option>
                      <option value="18">18</option>
                      <option value="19">19</option>
                      <option value="20">20</option>
                    </select>
                  </div>
                </div>
              )}
              <button type="submit" className={styles.searchButton}>
                Find Tires
              </button>
            </form>
          </section>

          <section className={styles.brandsSection}>
            <h2 className={styles.sectionTitle}>Top Tire Brands</h2>
            <div className={styles.brandGrid}>
              {topBrands.map((brand) => (
                <Link href={`/brands/${brand.id}`} key={brand.id}>
                  <a className={styles.brandCard}>
                    <Image 
                      src={brand.logo} 
                      alt={`${brand.name} logo`} 
                      width={120} 
                      height={80}
                      className={styles.brandLogo}
                    />
                    <h3 className={styles.brandName}>{brand.name}</h3>
                    <p className={styles.brandDescription}>{brand.description}</p>
                  </a>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.featuredProducts}>
            <h2 className={styles.sectionTitle}>Featured Tires</h2>
            <div className={styles.productGrid}>
              <div className={styles.productCard}>
                <Image 
                  src="/images/tires/tire-1.jpg"
                  alt="Michelin Pilot Sport 4S"
                  width={300}
                  height={200}
                  className={styles.productImage}
                />
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>Michelin Pilot Sport 4S</h3>
                  <p className={styles.productBrand}>Michelin</p>
                  <div className={styles.priceContainer}>
                    <span className={styles.originalPrice}>$199.99</span>
                    <span className={styles.discountedPrice}>${calculateDiscount(199.99)}</span>
                  </div>
                  <div className={styles.quantitySelector}>
                    <div className={styles.quantityButton} onClick={() => updateQuantity(1, -1)}>-</div>
                    <input 
                      type="text" 
                      className={styles.quantityInput} 
                      value={quantities[1]} 
                      readOnly 
                    />
                    <div className={styles.quantityButton} onClick={() => updateQuantity(1, 1)}>+</div>
                  </div>
                  <div className={styles.actionButtons}>
                    <button 
                      className={styles.productButton} 
                      onClick={() => addToCart(1, "Pilot Sport 4S", "Michelin", 199.99)}
                    >
                      Add to Cart
                    </button>
                    <Link href="/tire/1">
                      <a className={styles.viewDetailsLink}>View Details</a>
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className={styles.productCard}>
                <Image 
                  src="/images/tires/tire-2.jpg"
                  alt="Bridgestone Potenza Sport"
                  width={300}
                  height={200}
                  className={styles.productImage}
                />
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>Bridgestone Potenza Sport</h3>
                  <p className={styles.productBrand}>Bridgestone</p>
                  <div className={styles.priceContainer}>
                    <span className={styles.originalPrice}>$189.99</span>
                    <span className={styles.discountedPrice}>${calculateDiscount(189.99)}</span>
                  </div>
                  <div className={styles.quantitySelector}>
                    <div className={styles.quantityButton} onClick={() => updateQuantity(2, -1)}>-</div>
                    <input 
                      type="text" 
                      className={styles.quantityInput} 
                      value={quantities[2]} 
                      readOnly 
                    />
                    <div className={styles.quantityButton} onClick={() => updateQuantity(2, 1)}>+</div>
                  </div>
                  <div className={styles.actionButtons}>
                    <button 
                      className={styles.productButton} 
                      onClick={() => addToCart(2, "Potenza Sport", "Bridgestone", 189.99)}
                    >
                      Add to Cart
                    </button>
                    <Link href="/tire/3">
                      <a className={styles.viewDetailsLink}>View Details</a>
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className={styles.productCard}>
                <Image 
                  src="/images/tires/tire-3.jpg"
                  alt="Continental ExtremeContact DWS06"
                  width={300}
                  height={200}
                  className={styles.productImage}
                />
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>Continental ExtremeContact</h3>
                  <p className={styles.productBrand}>Continental</p>
                  <div className={styles.priceContainer}>
                    <span className={styles.originalPrice}>$179.99</span>
                    <span className={styles.discountedPrice}>${calculateDiscount(179.99)}</span>
                  </div>
                  <div className={styles.quantitySelector}>
                    <div className={styles.quantityButton} onClick={() => updateQuantity(3, -1)}>-</div>
                    <input 
                      type="text" 
                      className={styles.quantityInput} 
                      value={quantities[3]} 
                      readOnly 
                    />
                    <div className={styles.quantityButton} onClick={() => updateQuantity(3, 1)}>+</div>
                  </div>
                  <div className={styles.actionButtons}>
                    <button 
                      className={styles.productButton} 
                      onClick={() => addToCart(3, "ExtremeContact", "Continental", 179.99)}
                    >
                      Add to Cart
                    </button>
                    <Link href="/tire/2">
                      <a className={styles.viewDetailsLink}>View Details</a>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
} 