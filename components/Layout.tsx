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
  
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <span className="text-2xl font-bold text-blue-600 cursor-pointer">Gilda Tyres</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <NavLink href="/" label="Home" currentPath={router.pathname} />
            <NavLink href="/brands" label="Brands" currentPath={router.pathname} />
            <NavLink href="/vehicle-search" label="Find by Vehicle" currentPath={router.pathname} />
            <NavLink href="/tire-guide" label="Tire Guide" currentPath={router.pathname} />
            <NavLink href="/contact" label="Contact" currentPath={router.pathname} />
          </nav>
          
          <div className="flex items-center space-x-4">
            <Link href="/cart">
              <span className="relative cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              </span>
            </Link>
            
            <button className="block md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
      
      <footer className="bg-gray-800 text-white mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Gilda Tyres</h3>
              <p className="text-gray-300">Your trusted partner for premium tires and exceptional service.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/about"><span className="text-gray-300 hover:text-white">About Us</span></Link></li>
                <li><Link href="/faq"><span className="text-gray-300 hover:text-white">FAQ</span></Link></li>
                <li><Link href="/shipping"><span className="text-gray-300 hover:text-white">Shipping</span></Link></li>
                <li><Link href="/returns"><span className="text-gray-300 hover:text-white">Returns</span></Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-300">
                <li>123 Tire Street</li>
                <li>New York, NY 10001</li>
                <li>contact@gildatyres.com</li>
                <li>(555) 123-4567</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
              <p className="text-gray-300 mb-2">Subscribe to receive updates on new products and special offers.</p>
              <div className="flex">
                <input type="email" placeholder="Your email" className="px-3 py-2 text-gray-800 rounded-l w-full" />
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-r">Subscribe</button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Gilda Tyres. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const NavLink: React.FC<{ href: string; label: string; currentPath: string }> = ({ 
  href, 
  label, 
  currentPath 
}) => {
  const isActive = currentPath === href || 
    (href !== '/' && currentPath.startsWith(href));
  
  return (
    <Link href={href}>
      <span className={`${
        isActive ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600'
      } cursor-pointer transition-colors`}>
        {label}
      </span>
    </Link>
  );
};

export default Layout; 