import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import styles from '../../styles/Vehicle.module.css';

export default function VehicleSearch() {
  const router = useRouter();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Available car models grouped by make
  const carModels: { [key: string]: string[] } = {
    'BMW': ['3-Series', '5-Series', 'X5'],
    'Audi': ['A4', 'A6', 'Q5'],
    'Mercedes': ['C-Class', 'E-Class', 'GLC']
  };

  // Handle form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!make || !model || !year) {
      setError('Please select all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Redirect to the vehicle-specific tire page
      router.push(`/vehicle/${make}/${model}/${year}`);
    } catch (error) {
      console.error('Error during vehicle search:', error);
      setError('An error occurred during search. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Find Tires by Vehicle</h1>
        <p className={styles.description}>
          Select your vehicle details to find the perfect tires for your ride.
        </p>

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.formGroup}>
            <label htmlFor="make" className={styles.label}>Make</label>
            <select 
              id="make"
              value={make}
              onChange={(e) => {
                setMake(e.target.value);
                setModel(''); // Reset model when make changes
              }}
              className={styles.select}
              required
            >
              <option value="">Select Make</option>
              {Object.keys(carModels).map(makeName => (
                <option key={makeName} value={makeName}>{makeName}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="model" className={styles.label}>Model</label>
            <select 
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={styles.select}
              disabled={!make}
              required
            >
              <option value="">Select Model</option>
              {make && carModels[make]?.map(modelName => (
                <option key={modelName} value={modelName}>{modelName}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="year" className={styles.label}>Year</label>
            <select 
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={styles.select}
              disabled={!model}
              required
            >
              <option value="">Select Year</option>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={2024 - i} value={2024 - i}>
                  {2024 - i}
                </option>
              ))}
            </select>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button 
            type="submit" 
            className={styles.searchButton}
            disabled={loading || !make || !model || !year}
          >
            {loading ? 'Searching...' : 'Find Tires'}
          </button>
        </form>

        <div className={styles.infoSection}>
          <h2>Why Vehicle-Specific Tires Matter</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <h3>Perfect Fit</h3>
              <p>Vehicle-specific tires are designed to match your car's specifications for optimal performance and safety.</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Enhanced Handling</h3>
              <p>The right tires improve your vehicle's handling characteristics, giving you better control on the road.</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Improved Efficiency</h3>
              <p>Proper tire selection can improve your fuel efficiency and reduce wear on other vehicle components.</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Longer Lifespan</h3>
              <p>Tires matched to your vehicle typically last longer because they're designed for your car's weight and driving dynamics.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 