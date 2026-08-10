'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

type Tour = {
  id: string | number;
  title: string;
  location: string;
  duration: string;
  price: number;
  rating: number;
  reviews: number;
  category: string;
  image: string;
  alt: string;
  badge: string | null;
};

/* Fallback keeps the site looking exactly like today until tours exist in the DB */
const FALLBACK_TOURS: Tour[] = [
  {
    id: 1,
    title: 'Maasai Mara Great Migration',
    location: 'Maasai Mara, Kenya',
    duration: '7 days',
    price: 1200,
    rating: 4.9,
    reviews: 142,
    category: 'safari',
    image: '/assets/images/tour-maasai-mara-migration.png',
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
    image: '/assets/images/tour-diani-beach.jpg',
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
    image: '/assets/images/tour-mount-kenya-trek.jpg',
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
    image: '/assets/images/tour-amboseli-elephants.jpg',
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
    image: '/assets/images/tour-lamu-island.png',
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
    image: '/assets/images/tour-tsavo-elephants.jpg',
    alt: 'Red dust-covered elephants at a waterhole in Tsavo with dry acacia trees in warm afternoon light',
    badge: null
  }
];

/* Keep the original special badges for the legacy slugs */
const LEGACY_BADGES: Record<string, string> = {
  'maasai-mara-migration': 'Best Seller',
  'mount-kenya-trek': 'Adventure',
  'lamu-island-retreat': 'UNESCO Site'
};

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
  const [tours, setTours] = useState<Tour[]>(FALLBACK_TOURS);

  /* ---------- LIVE DATA: fetch tours from Supabase (same tables the admin edits) ---------- */
  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('Trip')
          .select(
            'id, title, slug, basePrice, durationDays, tripType, Destination(name, region, heroImage), TripImage(url, alt, sortOrder)'
          )
          .eq('isActive', true)
          .order('createdAt', { ascending: true })
          .limit(6);

        if (error || !data || data.length === 0) return; // keep fallback

        // Real ratings from the TourReview table
        const ids = data.map((t: any) => t.id);
        const { data: revs } = await supabase
          .from('TourReview')
          .select('trip_id, rating')
          .in('trip_id', ids)
          .eq('is_approved', true);

        const stats = new Map<string, { sum: number; count: number }>();
        (revs || []).forEach((r: any) => {
          const cur = stats.get(r.trip_id) || { sum: 0, count: 0 };
          cur.sum += Number(r.rating);
          cur.count += 1;
          stats.set(r.trip_id, cur);
        });

        setTours(
          data.map((t: any) => {
            const imgs = (t.TripImage || []).sort(
              (a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
            );
            const dest = t.Destination;
            const rawType = Array.isArray(t.tripType) ? (t.tripType[0] || 'safari') : (t.tripType || 'safari');
            const cat = String(rawType).toLowerCase();
            const s = stats.get(t.id);
            return {
              id: t.id,
              title: t.title,
              location: dest ? `${dest.name}, ${dest.region}` : 'Kenya',
              duration: `${t.durationDays} days`,
              price: Number(t.basePrice),
              rating: s ? Math.round((s.sum / s.count) * 10) / 10 : 0,
              reviews: s ? s.count : 0,
              category: cat,
              image: imgs[0]?.url || dest?.heroImage || '/assets/images/no_image.png',
              alt: imgs[0]?.alt || t.title,
              badge: LEGACY_BADGES[t.slug] ?? null
            };
          })
        );
      } catch {
        /* keep fallback on any error */
      }
    };

    load();

    // Real-time: refetch automatically whenever the admin adds/edits/deletes a tour
    const channel = supabase
      .channel('featured-tours-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Trip' }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ---------- Scroll reveal (unchanged) ---------- */
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
  }, [tours]);

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

        {/* BENTO GRID:
           Card 1 = tall (row-span-2), cards 2–5 normal, card 6 = wide (col-span-3).
           Works with any number of tours coming from the DB. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tours.map((tour, i) => (
            <TourCard
              key={tour.id}
              tour={tour}
              className={`scroll-reveal stagger-${Math.min(i + 1, 6)} ${
                i === 0 && tours.length > 2 ? 'md:row-span-2' : ''
              } ${i === 5 ? 'md:col-span-3' : ''}`}
              tall={i === 0 && tours.length > 2}
              wide={i === 5}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TourCard({
  tour,
  className = '',
  tall = false,
  wide = false
}: {
  tour: Tour;
  className?: string;
  tall?: boolean;
  wide?: boolean;
}) {
  const categoryText =
    (categoryLabel[tour.category] || tour.category).charAt(0).toUpperCase() +
    (categoryLabel[tour.category] || tour.category).slice(1);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-card-hover hover-lift flex flex-col ${className}`}>

      {/* Image container — flexes on tall cards instead of hiding the body */}
      <div
        className={`relative overflow-hidden ${
          tall
            ? 'h-[340px] md:h-auto md:flex-1 md:min-h-[380px]'
            : wide
            ? 'h-64 md:h-72'
            : 'h-52 md:h-60'
        }`}>

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
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryBadgeClass[tour.category] || 'badge-safari'}`}>
            {categoryText}
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

      {/* Card body — shrink-0 keeps it visible */}
      <div className={`p-5 shrink-0 ${wide ? 'md:flex md:items-center md:justify-between md:gap-8' : ''}`}>
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
              {tour.reviews > 0 ? `${tour.rating} (${tour.reviews})` : 'New'}
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
    </div>
  );
}