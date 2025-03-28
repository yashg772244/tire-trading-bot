import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  // Initialize cart in localStorage if not already present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('tireCart')) {
        localStorage.setItem('tireCart', JSON.stringify([]));
      }
    }
  }, []);

  return <Component {...pageProps} />;
} 