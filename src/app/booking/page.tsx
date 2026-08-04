import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BookingClientPage from '@/app/booking/components/BookingClientPage';

export const metadata = {
  title: 'Book Your Kenya Adventure — SwayAdventures',
  description: 'Book your Kenya safari, beach getaway, or retreat with SwayAdventures. Pay via M-Pesa, card, or PayPal. Instant confirmation.',
};

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <BookingClientPage />
      <Footer />
    </main>
  );
}