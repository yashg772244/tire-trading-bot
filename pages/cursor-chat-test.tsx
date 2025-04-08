import React from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import CursorChatInterface from '../components/CursorChatInterface';

export default function CursorChatTest() {
  return (
    <Layout>
      <Head>
        <title>Cursor AI Chat Interface - Tire Trading Bot</title>
        <meta name="description" content="Test page for the Cursor AI Chatbot Integration" />
      </Head>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Cursor AI Chat Interface</h1>
        <p className="mb-4">This implementation uses client-side logic instead of external AI APIs.</p>
        
        <div className="border p-4 rounded-lg shadow-md bg-white">
          <CursorChatInterface 
            tireId={1} 
            tireName="Michelin Pilot Sport 4S" 
          />
        </div>
      </div>
    </Layout>
  );
} 