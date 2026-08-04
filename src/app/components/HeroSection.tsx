'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

export default function HeroSection() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = [badgeRef.current, headlineRef.current, subRef.current, ctaRef.current];
    els.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(32px)';
      setTimeout(() => {
        if (!el) return;
        el.style.transition = 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 200 + i * 140);
    });
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <AppImage
          src="/assets/images/hero-savanna-sunrise.png"
          alt="Golden savanna at sunrise with acacia trees silhouetted against amber sky, vast open plains stretching to the horizon"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center" />
        
        {/* Desktop scrim: left-heavy */}
        <div className="hero-scrim absolute inset-0 hidden md:block" />
        {/* Mobile scrim: bottom-heavy */}
        <div className="hero-scrim-mobile absolute inset-0 md:hidden" />
      </div>

      {/* Floating badge */}
      <div
        ref={badgeRef}
        className="absolute top-28 right-6 md:top-32 md:right-12 z-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 hidden sm:flex items-center gap-3">
        
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
          <Icon name="StarIcon" size={14} variant="solid" className="text-white" />
        </div>
        <div>
          <p className="text-white text-xs font-semibold leading-none">5-Star Rated</p>
          <p className="text-white/70 text-xs mt-0.5">1,000+ happy travelers</p>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-28 pb-24 md:pt-0 md:pb-0">
        <div className="max-w-2xl">
          <div ref={badgeRef} className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm border border-accent/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-white text-xs font-semibold uppercase tracking-widest">
              Kenya's Premier Travel Company
            </span>
          </div>

          <h1
            ref={headlineRef}
            className="text-hero font-display font-semibold text-white mb-6 leading-none">
            
            Discover<br />
            <span className="italic font-light text-amber-300">Kenya's</span>
            <br />Hidden Wonders.
          </h1>

          <p
            ref={subRef}
            className="text-white/80 text-lg md:text-xl font-light leading-relaxed max-w-lg mb-10">
            
            From the thundering herds of the Maasai Mara to the turquoise shores of Diani — we craft journeys that stay with you forever.
          </p>

          <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/tours"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white font-semibold rounded-full hover:bg-amber-600 transition-all duration-300 hover:scale-105 shadow-lg text-base">
              
              Explore Tours
              <Icon name="ArrowRightIcon" size={18} />
            </Link>
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full border border-white/30 hover:bg-white/20 transition-all duration-300 text-base">
              
              Book Now
            </Link>
          </div>

          {/* Quick trust signals */}
          <div className="flex flex-wrap items-center gap-6 mt-10">
            {[
            { icon: 'ShieldCheckIcon', text: 'Safe & Certified' },
            { icon: 'MapPinIcon', text: 'Local Expert Guides' },
            { icon: 'CreditCardIcon', text: 'M-Pesa & Card' }].
            map((item) =>
            <div key={item.text} className="flex items-center gap-2 text-white/70">
                <Icon name={item.icon as 'ShieldCheckIcon'} size={15} className="text-accent" />
                <span className="text-sm">{item.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/50">
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <div className="w-px h-8 bg-white/30 animate-pulse" />
      </div>
    </section>);

}