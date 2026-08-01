'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const categories = [
{
  id: 'getaways',
  title: 'Personal Getaways',
  subtitle: 'Solo & Couples',
  description: 'Intimate escapes to Kenya\'s most breathtaking coastal and highland retreats.',
  image: "https://images.unsplash.com/photo-1633421332483-1aa89f0c6b9a",
  alt: 'Turquoise ocean at Diani Beach with white sand and palm trees in bright sunshine',
  count: '18 tours',
  icon: 'HeartIcon'
},
{
  id: 'retreats',
  title: 'Group Retreats',
  subtitle: 'Friends & Corporate',
  description: 'Shared adventures and wellness experiences designed for groups of all sizes.',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1799ef0a6-1772251066851.png",
  alt: 'Luxury safari camp tents in open savanna at golden hour with warm amber light',
  count: '12 tours',
  icon: 'UsersIcon'
},
{
  id: 'safaris',
  title: 'Luxury Safaris',
  subtitle: 'Wildlife & Wilderness',
  description: 'Exclusive Big Five encounters in Kenya\'s iconic national parks and conservancies.',
  image: "https://images.unsplash.com/photo-1727252734589-147155b958be",
  alt: 'Herd of elephants walking across dusty savanna plains with Mount Kilimanjaro in background',
  count: '20 tours',
  icon: 'SparklesIcon'
}];


export default function TourCategories() {
  const sectionRef = useRef<HTMLElement>(null);

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
  }, []);

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
          {categories.map((cat, i) =>
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
          )}
        </div>
      </div>
    </section>);

}