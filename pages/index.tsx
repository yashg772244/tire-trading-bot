import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Find the Perfect Tires for Your Vehicle
              </h1>
              <p className="text-xl mb-8">
                Premium tires at competitive prices with our AI-powered negotiation system.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/vehicle-search">
                  <span className="bg-white text-blue-700 font-semibold py-3 px-6 rounded-lg hover:bg-blue-50 transition duration-300 inline-block text-center">
                    Search by Vehicle
                  </span>
                </Link>
                <Link href="/brands">
                  <span className="bg-transparent border-2 border-white text-white font-semibold py-3 px-6 rounded-lg hover:bg-white hover:text-blue-700 transition duration-300 inline-block text-center">
                    Browse Brands
                  </span>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="relative">
                <img 
                  src="/tire-hero.jpg" 
                  alt="Premium Tires" 
                  className="rounded-lg shadow-xl"
                  width={600}
                  height={400}
                />
                <div className="absolute -bottom-5 -right-5 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg">
                  <span className="font-semibold">AI Price Negotiation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Brands */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Premium Tire Brands</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {['Michelin', 'Bridgestone', 'Continental', 'Pirelli'].map((brand) => (
              <Link key={brand} href={`/brands/${brand.toLowerCase()}`}>
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition duration-300 flex flex-col items-center cursor-pointer">
                  <img
                    src={`/brands/${brand.toLowerCase()}.png`}
                    alt={`${brand} Logo`}
                    className="h-16 object-contain mb-4"
                  />
                  <span className="font-semibold text-lg">{brand}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Gilda Tyres?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600">
                We only stock premium tires from trusted brands, ensuring safety and performance.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Pricing</h3>
              <p className="text-gray-600">
                Our AI-powered negotiation system ensures you get the best price tailored to your needs.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Advice</h3>
              <p className="text-gray-600">
                Our AI assistant provides personalized recommendations based on your driving needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to find your perfect tires?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Start by entering your vehicle information and our system will recommend the best options.
          </p>
          <Link href="/vehicle-search">
            <span className="bg-white text-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition duration-300 inline-block">
              Get Started
            </span>
          </Link>
        </div>
      </section>
    </Layout>
  );
} 