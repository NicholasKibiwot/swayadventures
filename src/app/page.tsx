import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/app/components/HeroSection';
import StatsBar from '@/app/components/StatsBar';
import TourCategories from '@/app/components/TourCategories';
import FeaturedTours from '@/app/components/FeaturedTours';
import WhyChooseUs from '@/app/components/WhyChooseUs';
import Testimonials from '@/app/components/Testimonials';
import PartnerHotels from '@/app/components/PartnerHotels';
import NewsletterSection from '@/app/components/NewsletterSection';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <HeroSection />
      <StatsBar />
      <TourCategories />
      <FeaturedTours />
      <WhyChooseUs />
      <Testimonials />
      <PartnerHotels />
      <NewsletterSection />
      <Footer />
    </main>
  );
}