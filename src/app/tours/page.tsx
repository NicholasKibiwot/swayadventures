import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToursClientPage from '@/app/tours/components/ToursClientPage';

export const metadata = {
  title: 'Kenya Tours — SwayAdventures',
  description: 'Browse all Kenya tours: Maasai Mara safaris, Diani beach getaways, Mount Kenya treks, and luxury retreats. Book your Kenya adventure today.',
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