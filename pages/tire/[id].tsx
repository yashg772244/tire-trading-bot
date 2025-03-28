import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ChatInterface from '../../components/ChatInterface';
import Layout from '../../components/Layout';
import styles from '../../styles/TireDetails.module.css';

interface TireDetails {
  id: number;
  brand: string;
  model: string;
  base_price: number;
  offer_price: number;
  bulk_price: number;
  description: string;
  features: string;
  full_size: string;
}

export default function TireDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [tire, setTire] = useState<TireDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/tire/${id}`)
        .then(res => res.json())
        .then(data => {
          setTire(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching tire details:', error);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return <Layout><div>Loading...</div></Layout>;
  }

  if (!tire) {
    return <Layout><div>Tire not found</div></Layout>;
  }

  return (
    <Layout>
      <div className={styles.container}>
        <Head>
          <title>{tire.brand} {tire.model} - Tire Trading Bot</title>
          <meta name="description" content={tire.description} />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className={styles.main}>
          <div className={styles.tireInfo}>
            <h1 className={styles.title}>{tire.brand} {tire.model}</h1>
            <p className={styles.size}>Size: {tire.full_size}</p>
            
            <div className={styles.pricing}>
              <div className={styles.priceRow}>
                <span>Base Price:</span>
                <span>${tire.base_price.toFixed(2)}</span>
              </div>
              <div className={styles.priceRow}>
                <span>Offer Price (10% off):</span>
                <span>${tire.offer_price.toFixed(2)}</span>
              </div>
              <div className={styles.priceRow}>
                <span>Bulk Price (15% off for 4+):</span>
                <span>${tire.bulk_price.toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.description}>
              <h2>Description</h2>
              <p>{tire.description}</p>
            </div>

            <div className={styles.features}>
              <h2>Features</h2>
              <p>{tire.features}</p>
            </div>
          </div>

          <div className={styles.chatSection}>
            <ChatInterface 
              tireId={tire.id} 
              tireName={`${tire.brand} ${tire.model}`} 
            />
          </div>
        </main>
      </div>
    </Layout>
  );
} 