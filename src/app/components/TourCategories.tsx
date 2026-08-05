'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

type Category = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  alt: string;
  count: string;
  icon: string;
};

const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'getaways',
    title: 'Personal Getaways',
    subtitle: 'Solo & Couples',
    description: "Intimate escapes to Kenya's most breathtaking coastal and highland retreats.",
    image: "/assets/images/category-personal-getaways.jpg",
    alt: 'Turquoise ocean at Diani Beach with white sand and palm trees in bright sunshine',
    count: '18 tours',
    icon: 'HeartIcon'
  },
  {
    id: 'retreats',
    title: 'Group Retreats',
    subtitle: 'Friends & Corporate',
    description: 'Shared adventures and wellness experiences designed for groups of all sizes.',
    image: "/assets/images/category-group-retreats.png",
    alt: 'Luxury safari camp tents in open savanna at golden hour with warm amber light',
    count: '12 tours',
    icon: 'UsersIcon'
  },
  {
    id: 'safaris',
    title: 'Luxury Safaris',
    subtitle: 'Wildlife & Wilderness',
    description: "Exclusive Big Five encounters in Kenya's iconic national parks and conservancies.",
    image: "/assets/images/tour-amboseli-elephants.jpg",
    alt: 'Herd of elephants walking across dusty savanna plains with Mount Kilimanjaro in background',
    count: '20 tours',
    icon: 'SparklesIcon'
  }
];

/* Maps each category card to the tripType values used in the admin panel */
const CATEGORY_TRIP_TYPE: Record<string, string> = {
  getaways: 'beach',
  retreats: 'retreat',
  safaris: 'safari'
};

export default function TourCategories() {
  const sectionRef = useRef<HTMLElement>(null);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);

  /* LIVE DATA: count active tours per tripType */
  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('Trip')
          .select('tripType')
          .eq('isActive', true);

        if (error || !data) return;

        const counts: Record<string, number> = {};
        data.forEach((t: any) => {
          const types = Array.isArray(t.tripType) ? t.tripType : [t.tripType];
          types.forEach((tt: any) => {
            const k = String(tt || '').toLowerCase();
            counts[k] = (counts[k] || 0) + 1;
          });
        });

        setCategories((prev) =>
          prev.map((cat) => {
            const n = counts[CATEGORY_TRIP_TYPE[cat.id]] || 0;
            return n > 0 ? { ...cat, count: `${n} tour${n === 1 ? '' : 's'}` } : cat;
          })
        );
      } catch {
        /* keep initial counts */
      }
    };

    load();

    const channel = supabase
      .channel('categories-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Trip' }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.scroll-reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 120);
            });
          }
        });
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [categories]);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="scroll-reveal stagger-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent block mb-3">
              What We Offer
            </span>
            <h2 className="text-section font-display font-semibold text-foreground">
              Travel Your Way.
            </h2>
          </div>
          <p className="scroll-reveal stagger-2 max-w-sm text-muted-foreground leading-relaxed text-sm md:text-base">
            Three distinct travel styles — each crafted to deliver Kenya's most unforgettable moments.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              href="/tours"
              className={`scroll-reveal stagger-${i + 2} group relative overflow-hidden rounded-3xl aspect-[3/4] md:aspect-auto md:min-h-[480px] block`}>
              
              <AppImage
                src={cat.image}
                alt={cat.alt}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105" />
              
              {/* Overlay */}
              <div className="category-card-overlay absolute inset-0" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-7">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-accent/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon name={cat.icon as 'HeartIcon'} size={13} className="text-amber-300" />
                  </div>
                  <span className="text-amber-300 text-xs font-semibold uppercase tracking-widest">
                    {cat.subtitle}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-semibold text-white mb-2 leading-tight">
                  {cat.title}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed mb-4 max-w-[260px]">
                  {cat.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-xs font-medium">{cat.count}</span>
                  <div className="flex items-center gap-1.5 text-amber-300 text-sm font-semibold group-hover:gap-3 transition-all duration-300">
                    <span>Explore</span>
                    <Icon name="ArrowRightIcon" size={15} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}