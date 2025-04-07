import React, { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../styles/Layout.module.css';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'Gilda Tyres - Premium Tire Trading Platform', 
  description = 'Premium tire e-commerce platform with AI-powered negotiation' 
}) => {
  const router = useRouter();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Update the cart count from localStorage when component mounts and when route changes
  useEffect(() => {
    const updateCartCount = () => {
      const savedCart = localStorage.getItem('tireCart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          const totalItems = parsedCart.reduce((sum: number, item: any) => sum + item.quantity, 0);
          setCartItemCount(totalItems);
        } catch (error) {
          console.error('Error parsing cart from localStorage:', error);
          setCartItemCount(0);
        }
      } else {
        setCartItemCount(0);
      }
    };
    
    // Update count initially
    updateCartCount();
    
    // Update count on route change
    router.events.on('routeChangeComplete', updateCartCount);
    
    // Clean up event listener
    return () => {
      router.events.off('routeChangeComplete', updateCartCount);
    };
  }, [router.events]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <style jsx global>{`
        /* Global style overrides to ensure link colors are correct */
        .header a {
          color: white !important;
          text-decoration: none;
        }
        .header a:visited {
          color: white !important;
        }
        .header a:hover {
          color: #FFD700 !important;
        }
        .header .logo a {
          color: #FFD700 !important;
        }
        .header .activeLink a {
          color: #FFD700 !important;
        }
        .footer a {
          color: white !important;
          text-decoration: none;
        }
        .footer a:hover {
          color: #FFD700 !important;
        }
      `}</style>

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logo} style={{color: '#FFD700', textDecoration: 'none'}}>
            Gilda Tyres
          </Link>
          
          <nav className={styles.nav}>
            <Link 
              href="/" 
              className={router.pathname === '/' ? styles.activeLink : styles.navLink} 
              style={{color: router.pathname === '/' ? '#FFD700' : 'white', textDecoration: 'none'}}
            >
              Home
            </Link>
            <Link 
              href="/brands" 
              className={router.pathname.includes('/brands') ? styles.activeLink : styles.navLink} 
              style={{color: router.pathname.includes('/brands') ? '#FFD700' : 'white', textDecoration: 'none'}}
            >
              Brands
            </Link>
            <Link 
              href="/vehicle" 
              className={router.pathname.includes('/vehicle') ? styles.activeLink : styles.navLink} 
              style={{color: router.pathname.includes('/vehicle') ? '#FFD700' : 'white', textDecoration: 'none'}}
            >
              Vehicle Search
            </Link>
            <Link 
              href="/cart" 
              className={styles.cartIcon} 
              style={{color: 'white', textDecoration: 'none'}}
            >
              Cart
              {cartItemCount > 0 && (
                <span className={styles.cartCount}>{cartItemCount}</span>
              )}
            </Link>
          </nav>
          
          <button className={styles.mobileMenuButton} onClick={toggleMobileMenu}>
            ☰
          </button>
        </div>
      </header>
      
      {isMobileMenuOpen && (
        <div className={`${styles.mobileMenu} ${styles.open}`}>
          <div className={styles.mobileMenuHeader}>
            <span className={styles.logo}>Gilda Tyres</span>
            <button className={styles.mobileMenuClose} onClick={toggleMobileMenu}>
              ✕
            </button>
          </div>
          
          <nav className={styles.mobileNav}>
            <Link 
              href="/" 
              className={styles.mobileNavLink} 
              onClick={toggleMobileMenu}
            >
              Home
            </Link>
            <Link 
              href="/brands" 
              className={styles.mobileNavLink} 
              onClick={toggleMobileMenu}
            >
              Brands
            </Link>
            <Link 
              href="/vehicle" 
              className={styles.mobileNavLink} 
              onClick={toggleMobileMenu}
            >
              Vehicle Search
            </Link>
            <Link 
              href="/cart" 
              className={styles.mobileNavLink} 
              onClick={toggleMobileMenu}
            >
              Cart {cartItemCount > 0 && `(${cartItemCount})`}
            </Link>
          </nav>
        </div>
      )}
      
      <main>
        {children}
      </main>
      
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerColumn}>
            <h3>Gilda Tyres</h3>
            <p>Your trusted partner for premium tires and exceptional service.</p>
            <div className={styles.socialIcons}>
              <span className={styles.socialIcon}>f</span>
              <span className={styles.socialIcon}>t</span>
              <span className={styles.socialIcon}>in</span>
              <span className={styles.socialIcon}>ig</span>
            </div>
          </div>
          
          <div className={styles.footerColumn}>
            <h3>Quick Links</h3>
            <Link 
              href="/about" 
              className={styles.footerLink} 
              style={{color: 'white', textDecoration: 'none'}}
            >
              About Us
            </Link>
            <Link 
              href="/faq" 
              className={styles.footerLink} 
              style={{color: 'white', textDecoration: 'none'}}
            >
              FAQ
            </Link>
            <Link 
              href="/shipping" 
              className={styles.footerLink} 
              style={{color: 'white', textDecoration: 'none'}}
            >
              Shipping
            </Link>
            <Link 
              href="/returns" 
              className={styles.footerLink} 
              style={{color: 'white', textDecoration: 'none'}}
            >
              Returns
            </Link>
          </div>
          
          <div className={styles.footerColumn}>
            <h3>Contact</h3>
            <p>123 Tire Street</p>
            <p>New York, NY 10001</p>
            <p>contact@gildatyres.com</p>
            <p>(555) 123-4567</p>
          </div>
          
          <div className={styles.footerColumn}>
            <h3>Newsletter</h3>
            <p>Subscribe to receive updates on new products and special offers.</p>
            <div className={styles.newsletterForm}>
              <input type="email" placeholder="Your email" className={styles.newsletterInput} />
              <button className={styles.newsletterButton}>Subscribe</button>
            </div>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} Gilda Tyres. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 