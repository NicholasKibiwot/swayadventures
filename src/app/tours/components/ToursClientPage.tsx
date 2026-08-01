'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

const allTours = [
{
  id: 1,
  title: 'Maasai Mara Great Migration',
  location: 'Maasai Mara, Narok County',
  duration: '7 days',
  groupSize: 'Up to 8',
  price: 1200,
  rating: 4.9,
  reviews: 142,
  category: 'safari',
  image: "/assets/images/tours-maasai-mara-migration.png",
  alt: 'Wildebeest migration crossing Mara River with dramatic splashing water, dark storm clouds overhead',
  badge: 'Best Seller',
  highlights: ['Big Five sightings', 'Hot air balloon optional', 'Expert Maasai guides']
},
{
  id: 2,
  title: 'Diani Beach Getaway',
  location: 'Diani, Kwale County',
  duration: '4 days',
  groupSize: 'Up to 12',
  price: 650,
  rating: 4.8,
  reviews: 89,
  category: 'beach',
  image: "/assets/images/tours-diani-beach.jpg",
  alt: 'White sand beach with turquoise Indian Ocean water and palm trees swaying in tropical breeze',
  badge: null,
  highlights: ['Snorkeling & diving', 'Dhow sunset cruise', 'Colobus monkey sanctuary']
},
{
  id: 3,
  title: 'Mount Kenya Trek',
  location: 'Mount Kenya, Central Kenya',
  duration: '5 days',
  groupSize: 'Up to 6',
  price: 850,
  rating: 4.7,
  reviews: 63,
  category: 'retreat',
  image: "/assets/images/tours-mount-kenya.jpg",
  alt: 'Snow-capped peaks of Mount Kenya with dramatic rocky ridgeline and alpine moorland below',
  badge: 'Adventure',
  highlights: ['Summit Point Lenana', 'Alpine flora & fauna', 'Mountain hut accommodation']
},
{
  id: 4,
  title: 'Amboseli Elephant Safari',
  location: 'Amboseli, Kajiado County',
  duration: '3 days',
  groupSize: 'Up to 8',
  price: 750,
  rating: 4.9,
  reviews: 107,
  category: 'safari',
  image: "/assets/images/tours-amboseli-elephants.png",
  alt: 'Large elephant family walking across open plains with snow-capped Kilimanjaro in background',
  badge: null,
  highlights: ['Largest elephant herds in Africa', 'Kilimanjaro backdrop', 'Maasai cultural visit']
},
{
  id: 5,
  title: 'Lamu Island Retreat',
  location: 'Lamu Archipelago, Coast',
  duration: '6 days',
  groupSize: 'Up to 10',
  price: 900,
  rating: 4.8,
  reviews: 54,
  category: 'beach',
  image: "/assets/images/tours-lamu-town.jpg",
  alt: 'Ancient Swahili town narrow streets with ornate wooden doors and white-washed walls in warm light',
  badge: 'UNESCO Site',
  highlights: ['UNESCO World Heritage site', 'Traditional dhow sailing', 'Swahili cooking class']
},
{
  id: 6,
  title: 'Tsavo Red Elephant Safari',
  location: 'Tsavo East & West',
  duration: '4 days',
  groupSize: 'Up to 8',
  price: 700,
  rating: 4.6,
  reviews: 78,
  category: 'safari',
  image: "/assets/images/tours-tsavo-elephants.jpg",
  alt: 'Red dust-covered elephants at waterhole in Tsavo National Park with dry acacia trees',
  badge: null,
  highlights: ['Famous red elephants', 'Mzima Springs', 'Lugard Falls']
},
{
  id: 7,
  title: 'Naivasha Lake Retreat',
  location: 'Lake Naivasha, Rift Valley',
  duration: '3 days',
  groupSize: 'Up to 12',
  price: 450,
  rating: 4.7,
  reviews: 95,
  category: 'retreat',
  image: "/assets/images/tours-naivasha-lake.jpg",
  alt: 'Serene lake with flamingos in shallow water, green hills and cloudy sky reflected in calm surface',
  badge: 'Weekend Special',
  highlights: ['Hippo boat safari', 'Crescent Island walking safari', 'Hell\'s Gate cycling']
},
{
  id: 8,
  title: 'Samburu Rare Species Safari',
  location: 'Samburu, Northern Kenya',
  duration: '5 days',
  groupSize: 'Up to 6',
  price: 980,
  rating: 4.8,
  reviews: 42,
  category: 'safari',
  image: "/assets/images/tours-samburu-giraffe.jpg",
  alt: 'Reticulated giraffe grazing in dry acacia woodland with distant blue mountains in northern Kenya',
  badge: 'Off the Beaten Path',
  highlights: ['Samburu Special Five', 'Ewaso Nyiro River camps', 'Samburu cultural immersion']
}];


const filters = [
{ key: 'all', label: 'All Tours' },
{ key: 'safari', label: 'Safari' },
{ key: 'beach', label: 'Beach' },
{ key: 'retreat', label: 'Retreat' }];


const categoryBadgeClass: Record<string, string> = {
  safari: 'badge-safari',
  beach: 'badge-beach',
  retreat: 'badge-retreat'
};

export default function ToursClientPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const sectionRef = useRef<HTMLDivElement>(null);

  const filtered = activeFilter === 'all' ?
  allTours :
  allTours.filter((t) => t.category === activeFilter);

  useEffect(() => {
    if (!sectionRef.current) return;
    const cards = sectionRef.current.querySelectorAll('.tour-card-item');
    cards.forEach((card, i) => {
      const el = card as HTMLElement;
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      setTimeout(() => {
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * 60);
    });
  }, [activeFilter]);

  return (
    <div>
      {/* Page Hero */}
      <section className="relative pt-32 pb-16 bg-primary overflow-hidden">
        <div className="absolute inset-0 z-0">
          <AppImage
            src="https://images.unsplash.com/photo-1542936586-2620482f0690"
            alt="Panoramic view of Kenyan savanna at golden sunset with acacia trees silhouetted against orange sky"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-25" />
          
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 block mb-3">
            All Experiences
          </span>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-white mb-4">
            Kenya Tours.
          </h1>
          <p className="text-white/70 text-lg max-w-lg leading-relaxed">
            From 3-day getaways to 7-day deep-dive safaris — find the Kenya trip that fits your time and spirit.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="sticky top-[72px] z-40 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0 mr-2">
            Filter:
          </span>
          {filters.map((f) =>
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
            activeFilter === f.key ?
            'bg-primary text-white shadow-sm' :
            'bg-muted text-foreground hover:bg-muted/80'}`
            }>
            
              {f.label}
            </button>
          )}
          <span className="ml-auto shrink-0 text-sm text-muted-foreground">
            {filtered.length} tour{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Tours Grid */}
      <section ref={sectionRef} className="py-14 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((tour) =>
            <TourCard key={tour.id} tour={tour} />
            )}
          </div>
        </div>
      </section>
    </div>);

}

function TourCard({ tour }: {tour: typeof allTours[0];}) {
  const [liveRating, setLiveRating] = useState<{avg: number;count: number;} | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Try to fetch live DB rating if tour has a slug-based id
    const fetchRating = async () => {
      // Match by title slug pattern — look up Trip by title
      const { data } = await supabase.
      from('Trip').
      select('id').
      ilike('title', tour.title).
      maybeSingle();
      if (!data?.id) return;
      const { data: reviews } = await supabase.
      from('TourReview').
      select('rating').
      eq('trip_id', data.id).
      eq('is_approved', true);
      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;
        setLiveRating({ avg: Math.round(avg * 10) / 10, count: reviews.length });
      }
    };
    fetchRating();
  }, [tour.title]);

  const displayRating = liveRating?.avg ?? tour.rating;
  const displayCount = liveRating?.count ?? tour.reviews;

  return (
    <div className="tour-card-item group rounded-2xl overflow-hidden bg-card border border-border hover:shadow-card-hover hover-lift flex flex-col">
      {/* Image */}
      <div className="relative h-56 overflow-hidden">
        <AppImage
          src={tour.image}
          alt={tour.alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover tour-card-img" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Category */}
        <div className="absolute top-4 left-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryBadgeClass[tour.category]}`}>
            {tour.category.charAt(0).toUpperCase() + tour.category.slice(1)}
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

        {/* Price */}
        <div className="absolute bottom-4 left-4">
          <span className="text-white font-display text-2xl font-semibold">${tour.price}</span>
          <span className="text-white/70 text-sm ml-1">/ person</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">
          {tour.title}
        </h3>

        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-4">
          <Icon name="MapPinIcon" size={13} className="text-accent shrink-0" />
          <span>{tour.location}</span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5">
            <Icon name="ClockIcon" size={14} />
            {tour.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="UserGroupIcon" size={14} />
            {tour.groupSize}
          </span>
          <span className="flex items-center gap-1.5 ml-auto">
            <Icon name="StarIcon" size={13} variant="solid" className="text-amber-400" />
            <span className="font-medium text-foreground">{displayRating}</span>
            <span className="text-xs">({displayCount})</span>
          </span>
        </div>

        {/* Highlights */}
        <ul className="space-y-1.5 mb-5">
          {tour.highlights.slice(0, 2).map((h) =>
          <li key={h} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon name="CheckIcon" size={12} className="text-primary shrink-0" />
              {h}
            </li>
          )}
        </ul>

        {/* CTA */}
        <div className="mt-auto flex gap-2">
          <Link
            href="/booking"
            className="flex items-center justify-center gap-2 flex-1 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-secondary transition-colors">
            Book This Tour
            <Icon name="ArrowRightIcon" size={15} />
          </Link>
        </div>
      </div>
    </div>);
}