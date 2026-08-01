'use client';

import React, { useEffect, useRef } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const hotels = [
{
  name: 'Sarova Stanley',
  location: 'Nairobi CBD',
  stars: 5,
  priceFrom: 180,
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_149bfabd5-1772185253146.png",
  alt: 'Grand colonial hotel facade with manicured gardens and warm evening lighting in Nairobi'
},
{
  name: 'Hemingways Watamu',
  location: 'Watamu, Coast',
  stars: 5,
  priceFrom: 320,
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1308fe107-1772752325140.png",
  alt: 'Luxury beachfront resort with infinity pool overlooking turquoise Indian Ocean at sunset'
},
{
  name: 'Angama Mara',
  location: 'Maasai Mara',
  stars: 5,
  priceFrom: 890,
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1fad7d61b-1772249789689.png",
  alt: 'Luxury tented camp on escarpment edge overlooking vast Mara plains at golden hour'
},
{
  name: 'Giraffe Manor',
  location: 'Karen, Nairobi',
  stars: 5,
  priceFrom: 650,
  image: "https://images.unsplash.com/photo-1603877797446-9a86f1076872",
  alt: 'Elegant manor house surrounded by lush tropical gardens with giraffe head visible through window'
}];


export default function PartnerHotels() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.scroll-reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 90);
            });
          }
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef?.current) observer?.observe(sectionRef?.current);
    return () => observer?.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="scroll-reveal stagger-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent block mb-3">
              Where You'll Stay
            </span>
            <h2 className="text-section font-display font-semibold text-foreground">
              Partner Hotels.
            </h2>
          </div>
          <p className="scroll-reveal stagger-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
            We partner exclusively with Kenya's finest properties — from Nairobi's heritage hotels to remote bush camps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {hotels?.map((hotel, i) =>
          <div
            key={hotel?.name}
            className={`scroll-reveal stagger-${i + 2} group rounded-2xl overflow-hidden bg-card border border-border hover:shadow-card-hover hover-lift`}>
            
              <div className="relative h-48 overflow-hidden">
                <AppImage
                src={hotel?.image}
                alt={hotel?.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-600 group-hover:scale-105" />
              
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-foreground text-base leading-tight">{hotel?.name}</h3>
                  <div className="flex shrink-0">
                    {Array.from({ length: Math.min(hotel?.stars, 5) })?.map((_, si) =>
                  <Icon key={si} name="StarIcon" size={10} variant="solid" className="text-amber-400" />
                  )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <Icon name="MapPinIcon" size={11} className="text-accent" />
                  <span>{hotel?.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">From </span>
                    <span className="font-display font-semibold text-primary text-lg">${hotel?.priceFrom}</span>
                    <span className="text-xs text-muted-foreground">/night</span>
                  </div>
                  <button className="text-xs font-semibold text-primary hover:text-accent transition-colors flex items-center gap-1">
                    View <Icon name="ArrowRightIcon" size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>);

}