import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToursClientPage from '@/app/tours/components/ToursClientPage';

export const metadata = {
  title: 'Tours in Kenya & Beyond — SwayAdventures',
  description: 'Browse all SwayAdventures tours: Kenyan safaris, beach getaways and retreats, plus international escapes to Bali, Mauritius, Egypt, Dubai, the Maldives and Greece.',
};

export default function ToursPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <ToursClientPage />
      <Footer />
    </main>
  );
}