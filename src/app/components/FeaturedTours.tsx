'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const tours = [
{
  id: 1,
  title: 'Maasai Mara Great Migration',
  location: 'Maasai Mara, Kenya',
  duration: '7 days',
  price: 1200,
  rating: 4.9,
  reviews: 142,
  category: 'safari',
  image: "/assets/images/tour-maasai-mara-migration.png",
  alt: 'Wildebeest crossing Mara River during Great Migration with dramatic splashing water and dramatic sky',
  badge: 'Best Seller'
},
{
  id: 2,
  title: 'Diani Beach Getaway',
  location: 'Diani, South Coast',
  duration: '4 days',
  price: 650,
  rating: 4.8,
  reviews: 89,
  category: 'beach',
  image: "/assets/images/tour-diani-beach.jpg",
  alt: 'Pristine white sand beach with turquoise water and palm trees in bright tropical sunlight',
  badge: null
},
{
  id: 3,
  title: 'Mount Kenya Trek',
  location: 'Mount Kenya, Central',
  duration: '5 days',
  price: 850,
  rating: 4.7,
  reviews: 63,
  category: 'retreat',
  image: "/assets/images/tour-mount-kenya-trek.jpg",
  alt: 'Snow-capped mountain peaks with dramatic rocky terrain and alpine vegetation in morning light',
  badge: 'Adventure'
},
{
  id: 4,
  title: 'Amboseli Elephant Safari',
  location: 'Amboseli, Kajiado',
  duration: '3 days',
  price: 750,
  rating: 4.9,
  reviews: 107,
  category: 'safari',
  image: "/assets/images/tour-amboseli-elephants.jpg",
  alt: 'Large elephant herd on dusty plains with Mount Kilimanjaro clearly visible in background at sunset',
  badge: null
},
{
  id: 5,
  title: 'Lamu Island Retreat',
  location: 'Lamu Archipelago',
  duration: '6 days',
  price: 900,
  rating: 4.8,
  reviews: 54,
  category: 'beach',
  image: "/assets/images/tour-lamu-island.png",
  alt: 'Ancient Swahili architecture of Lamu Old Town with narrow streets and ornate wooden doors in warm afternoon light',
  badge: 'UNESCO Site'
},
{
  id: 6,
  title: 'Tsavo Red Elephant Safari',
  location: 'Tsavo East & West',
  duration: '4 days',
  price: 700,
  rating: 4.6,
  reviews: 78,
  category: 'safari',
  image: "/assets/images/tour-tsavo-elephants.jpg",
  alt: 'Red dust-covered elephants at a waterhole in Tsavo with dry acacia trees in warm afternoon light',
  badge: null
}];


const categoryBadgeClass: Record<string, string> = {
  safari: 'badge-safari',
  beach: 'badge-beach',
  retreat: 'badge-retreat'
};

const categoryLabel: Record<string, string> = {
  safari: 'Safari',
  beach: 'Beach',
  retreat: 'Retreat'
};

export default function FeaturedTours() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.scroll-reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 80);
            });
          }
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 pb-24 bg-muted">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="scroll-reveal stagger-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent block mb-3">
              Featured Experiences
            </span>
            <h2 className="text-section font-display font-semibold text-foreground">
              Journeys Worth<br />Taking.
            </h2>
          </div>
          <Link
            href="/tours"
            className="scroll-reveal stagger-2 inline-flex items-center gap-2 text-sm font-semibold text-primary border-b border-primary pb-0.5 hover:text-accent hover:border-accent transition-colors">
            
            View All Tours
            <Icon name="ArrowRightIcon" size={16} />
          </Link>
        </div>

        {/* BENTO GRID AUDIT:
           Array has 6 cards: [MaasaiMara(id1), Diani(id2), MtKenya(id3), Amboseli(id4), Lamu(id5), Tsavo(id6)]
           Row 1: [col-1: MaasaiMara cs-1 rs-2] [col-2: Diani cs-1] [col-3: MtKenya cs-1]
           Row 2: [col-1: MaasaiMara(cont)] [col-2: Amboseli cs-1] [col-3: Lamu cs-1]
           Row 3: [col-1: Tsavo cs-3]
           Placed 6/6 cards ✓
          */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 — row-span-2 (tall) */}
          <TourCard tour={tours[0]} className="scroll-reveal stagger-1 md:row-span-2" tall />
          {/* Card 2 */}
          <TourCard tour={tours[1]} className="scroll-reveal stagger-2" />
          {/* Card 3 */}
          <TourCard tour={tours[2]} className="scroll-reveal stagger-3" />
          {/* Card 4 */}
          <TourCard tour={tours[3]} className="scroll-reveal stagger-4" />
          {/* Card 5 */}
          <TourCard tour={tours[4]} className="scroll-reveal stagger-5" />
          {/* Card 6 — col-span-3 (full row) */}
          <TourCard tour={tours[5]} className="scroll-reveal stagger-6 md:col-span-3" wide />
        </div>
      </div>
    </section>);

}

function TourCard({
  tour,
  className = '',
  tall = false,
  wide = false





}: {tour: typeof tours[0];className?: string;tall?: boolean;wide?: boolean;}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-card-hover hover-lift ${className}`}>
      
      {/* Image container */}
      <div
        className={`relative overflow-hidden ${
        tall ? 'h-[340px] md:h-full md:min-h-[520px]' : wide ? 'h-64 md:h-72' : 'h-52 md:h-60'}`
        }>
        
        <AppImage
          src={tour.image}
          alt={tour.alt}
          fill
          sizes={tall ? '(max-width: 768px) 100vw, 33vw' : wide ? '100vw' : '(max-width: 768px) 100vw, 33vw'}
          className="object-cover tour-card-img" />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Category badge */}
        <div className="absolute top-4 left-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryBadgeClass[tour.category]}`}>
            {categoryLabel[tour.category]}
          </span>
        </div>

        {/* Special badge */}
        {tour.badge &&
        <div className="absolute top-4 right-4">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent text-white">
              {tour.badge}
            </span>
          </div>
        }

        {/* Price overlay on image bottom */}
        <div className="absolute bottom-4 left-4">
          <span className="text-white font-display text-2xl font-semibold">
            ${tour.price}
          </span>
          <span className="text-white/70 text-sm ml-1">/ person</span>
        </div>
      </div>

      {/* Card body */}
      <div className={`p-5 ${wide ? 'md:flex md:items-center md:justify-between md:gap-8' : ''}`}>
        <div className={wide ? 'flex-1' : ''}>
          <h3 className="text-card-title font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
            {tour.title}
          </h3>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <Icon name="MapPinIcon" size={13} className="text-accent" />
            <span>{tour.location}</span>
          </div>
        </div>

        <div className={`flex items-center ${wide ? 'md:flex-col md:items-end gap-4 md:gap-2' : 'justify-between'} mt-4`}>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Icon name="ClockIcon" size={13} />
              {tour.duration}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="StarIcon" size={13} variant="solid" className="text-amber-400" />
              {tour.rating} ({tour.reviews})
            </span>
          </div>
          <Link
            href="/booking"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-full hover:bg-secondary transition-colors">
            
            Book Now
            <Icon name="ArrowRightIcon" size={13} />
          </Link>
        </div>
      </div>
    </div>);

}