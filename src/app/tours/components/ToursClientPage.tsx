'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

type Tour = {
  id: string;
  slug: string;
  title: string;
  location: string;
  destinationName: string;
  duration: string;
  groupSize: string;
  price: number;
  rating: number;
  reviews: number;
  category: string;
  image: string;
  alt: string;
  badge: string | null;
  highlights: string[];
};

const FALLBACK_TOURS: Tour[] = [
  { id: 'trip-maasai-mara', slug: 'maasai-mara-migration', title: 'Maasai Mara Great Migration', location: 'Maasai Mara, Narok County', destinationName: 'Maasai Mara', duration: '7 days', groupSize: 'Up to 8', price: 1200, rating: 4.9, reviews: 142, category: 'safari', image: '/assets/images/tours-maasai-mara-migration.png', alt: 'Wildebeest migration crossing Mara River', badge: 'Best Seller', highlights: ['Big Five sightings', 'Hot air balloon optional', 'Expert Maasai guides'] },
  { id: 'trip-diani', slug: 'diani-beach-getaway', title: 'Diani Beach Getaway', location: 'Diani, Kwale County', destinationName: 'Diani Beach', duration: '4 days', groupSize: 'Up to 12', price: 650, rating: 4.8, reviews: 89, category: 'beach', image: '/assets/images/tours-diani-beach.jpg', alt: 'White sand beach with turquoise Indian Ocean water', badge: null, highlights: ['Snorkeling & diving', 'Dhow sunset cruise', 'Colobus monkey sanctuary'] },
  { id: 'trip-mount-kenya', slug: 'mount-kenya-trek', title: 'Mount Kenya Trek', location: 'Mount Kenya, Central Kenya', destinationName: 'Mount Kenya', duration: '5 days', groupSize: 'Up to 6', price: 850, rating: 4.7, reviews: 63, category: 'retreat', image: '/assets/images/tours-mount-kenya.jpg', alt: 'Snow-capped peaks of Mount Kenya', badge: 'Adventure', highlights: ['Summit Point Lenana', 'Alpine flora & fauna', 'Mountain hut accommodation'] },
  { id: 'trip-amboseli', slug: 'amboseli-elephant-safari', title: 'Amboseli Elephant Safari', location: 'Amboseli, Kajiado County', destinationName: 'Amboseli', duration: '3 days', groupSize: 'Up to 8', price: 750, rating: 4.9, reviews: 107, category: 'safari', image: '/assets/images/tours-amboseli-elephants.png', alt: 'Elephants with Kilimanjaro backdrop', badge: null, highlights: ['Largest elephant herds in Africa', 'Kilimanjaro backdrop', 'Maasai cultural visit'] },
  { id: 'trip-lamu', slug: 'lamu-island-retreat', title: 'Lamu Island Retreat', location: 'Lamu Archipelago, Coast', destinationName: 'Lamu Island', duration: '6 days', groupSize: 'Up to 10', price: 900, rating: 4.8, reviews: 54, category: 'beach', image: '/assets/images/tours-lamu-town.jpg', alt: 'Ancient Swahili town narrow streets', badge: 'UNESCO Site', highlights: ['UNESCO World Heritage site', 'Traditional dhow sailing', 'Swahili cooking class'] },
  { id: 'trip-tsavo', slug: 'tsavo-red-elephant-safari', title: 'Tsavo Red Elephant Safari', location: 'Tsavo East & West', destinationName: 'Tsavo', duration: '4 days', groupSize: 'Up to 8', price: 700, rating: 4.6, reviews: 78, category: 'safari', image: '/assets/images/tours-tsavo-elephants.jpg', alt: 'Red dust-covered elephants in Tsavo', badge: null, highlights: ['Famous red elephants', 'Mzima Springs', 'Lugard Falls'] },
  { id: 'trip-naivasha', slug: 'naivasha-lake-retreat', title: 'Naivasha Lake Retreat', location: 'Lake Naivasha, Rift Valley', destinationName: 'Naivasha Lake', duration: '3 days', groupSize: 'Up to 12', price: 450, rating: 4.7, reviews: 95, category: 'retreat', image: '/assets/images/tours-naivasha-lake.jpg', alt: 'Serene lake with flamingos', badge: 'Weekend Special', highlights: ['Hippo boat safari', 'Crescent Island walking safari', "Hell's Gate cycling"] },
  { id: 'trip-samburu', slug: 'samburu-rare-species-safari', title: 'Samburu Rare Species Safari', location: 'Samburu, Northern Kenya', destinationName: 'Samburu', duration: '5 days', groupSize: 'Up to 6', price: 980, rating: 4.8, reviews: 42, category: 'safari', image: '/assets/images/tours-samburu-giraffe.jpg', alt: 'Reticulated giraffe in Samburu', badge: 'Off the Beaten Path', highlights: ['Samburu Special Five', 'Ewaso Nyiro River camps', 'Samburu cultural immersion'] }
];

const LEGACY_BADGES: Record<string, string> = {
  'maasai-mara-migration': 'Best Seller',
  'mount-kenya-trek': 'Adventure',
  'lamu-island-retreat': 'UNESCO Site',
  'naivasha-lake-retreat': 'Weekend Special',
  'samburu-rare-species-safari': 'Off the Beaten Path'
};

/* Destinations that count as "Kenya" — everything else is International */
const KENYA_DESTINATIONS = new Set([
  'Maasai Mara', 'Diani Beach', 'Mount Kenya', 'Amboseli',
  'Lamu Island', 'Tsavo', 'Naivasha Lake', 'Lake Naivasha', 'Samburu'
]);

const filters = [
  { key: 'all', label: 'All Tours' },
  { key: 'safari', label: 'Safari' },
  { key: 'beach', label: 'Beach' },
  { key: 'retreat', label: 'Retreat' },
  { key: 'international', label: 'International' }
];

const categoryBadgeClass: Record<string, string> = {
  safari: 'badge-safari',
  beach: 'badge-beach',
  retreat: 'badge-retreat'
};

export default function ToursClientPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [tours, setTours] = useState<Tour[]>(FALLBACK_TOURS);
  const sectionRef = useRef<HTMLDivElement>(null);

  /* ---------- LIVE DATA ---------- */
  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('Trip')
          .select('id, slug, title, summary, durationDays, groupSizeMax, basePrice, tripType, Destination(name, region), TripImage(url, alt, sortOrder), inclusions:TripInclusion(label, included)')
          .eq('isActive', true)
          .order('createdAt', { ascending: true });

        if (error || !data || data.length === 0) return;

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

        setTours(data.map((t: any) => {
          const imgs = (t.TripImage || []).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          const rawType = Array.isArray(t.tripType) ? (t.tripType[0] || 'safari') : (t.tripType || 'safari');
          const s = stats.get(t.id);
          const included = (t.inclusions || []).filter((i: any) => i.included).map((i: any) => i.label);
          return {
            id: t.id,
            slug: t.slug,
            title: t.title,
            location: t.Destination ? `${t.Destination.name}, ${t.Destination.region}` : 'Kenya',
            destinationName: t.Destination?.name || '',
            duration: `${Number(t.durationDays) || 0} days`,
            groupSize: `Up to ${Number(t.groupSizeMax) || 8}`,
            price: Number(t.basePrice) || 0,
            rating: s ? Math.round((s.sum / s.count) * 10) / 10 : 0,
            reviews: s ? s.count : 0,
            category: String(rawType).toLowerCase(),
            image: imgs[0]?.url || '/assets/images/no_image.png',
            alt: imgs[0]?.alt || t.title,
            badge: LEGACY_BADGES[t.slug] ?? null,
            highlights: included.length > 0 ? included.slice(0, 3) : [t.summary || '']
          };
        }));
      } catch {
        /* keep fallback */
      }
    };

    load();

    const channel = supabase
      .channel('tours-page-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Trip' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'TourReview' }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered =
    activeFilter === 'all' ? tours :
    activeFilter === 'international' ? tours.filter((t) => !KENYA_DESTINATIONS.has(t.destinationName)) :
    tours.filter((t) => t.category === activeFilter);

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
  }, [activeFilter, tours]);

  return (
    <div>
      {/* Page Hero */}
      <section className="relative pt-32 pb-16 bg-primary overflow-hidden">
        <div className="absolute inset-0 z-0">
          <AppImage
            src="https://images.unsplash.com/photo-1542936586-2620482f0690?auto=format&fit=crop&w=2000&q=80"
            alt="Panoramic savanna at golden sunset with acacia trees silhouetted against orange sky"
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
            Kenya & Beyond.
          </h1>
          <p className="text-white/70 text-lg max-w-lg leading-relaxed">
            From Maasai Mara safaris to Bali beaches, Nile cruises and Aegean sunsets — find the journey that fits your time and spirit.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="sticky top-[72px] z-40 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0 mr-2">
            Filter:
          </span>
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeFilter === f.key ?
                'bg-primary text-white shadow-sm' :
                'bg-muted text-foreground hover:bg-muted/80'
              }`}>
              {f.label}
            </button>
          ))}
          <span className="ml-auto shrink-0 text-sm text-muted-foreground">
            {filtered.length} tour{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Tours Grid */}
      <section ref={sectionRef} className="py-14 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function TourCard({ tour }: { tour: Tour }) {
  return (
    <div className="tour-card-item group rounded-2xl overflow-hidden bg-card border border-border hover:shadow-card-hover hover-lift flex flex-col">
      <Link href={`/tours/${tour.slug}`} className="relative h-56 overflow-hidden block">
        <AppImage
          src={tour.image}
          alt={tour.alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover tour-card-img" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute top-4 left-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryBadgeClass[tour.category] || 'badge-safari'}`}>
            {tour.category.charAt(0).toUpperCase() + tour.category.slice(1)}
          </span>
        </div>
        {tour.badge && (
          <div className="absolute top-4 right-4">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent text-white">
              {tour.badge}
            </span>
          </div>
        )}
        <div className="absolute bottom-4 left-4">
          <span className="text-white font-display text-2xl font-semibold">${tour.price}</span>
          <span className="text-white/70 text-sm ml-1">/ person</span>
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <Link href={`/tours/${tour.slug}`}>
          <h3 className="font-display font-semibold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">
            {tour.title}
          </h3>
        </Link>
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-4">
          <Icon name="MapPinIcon" size={13} className="text-accent shrink-0" />
          <span>{tour.location}</span>
        </div>

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
            <span className="font-medium text-foreground">{tour.reviews > 0 ? tour.rating : 'New'}</span>
            {tour.reviews > 0 && <span className="text-xs">({tour.reviews})</span>}
          </span>
        </div>

        <ul className="space-y-1.5 mb-5">
          {tour.highlights.slice(0, 2).map((h) => (
            <li key={h} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon name="CheckIcon" size={12} className="text-primary shrink-0" />
              {h}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex gap-2">
          <Link
            href={`/tours/${tour.slug}`}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-border text-foreground text-sm font-semibold rounded-xl hover:bg-muted transition-colors">
            Details
          </Link>
          <Link
            href={`/booking?trip=${tour.id}`}
            className="flex items-center justify-center gap-2 flex-1 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-secondary transition-colors">
            Book This Tour
            <Icon name="ArrowRightIcon" size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}