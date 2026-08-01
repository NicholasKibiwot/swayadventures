'use client';

import React, { useEffect, useRef, useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const testimonials = [
{
  id: 1,
  name: 'Amelia Thornton',
  location: 'London, UK',
  tour: 'Maasai Mara Safari',
  rating: 5,
  quote: "SwayAdventures made our Maasai Mara trip absolutely seamless. Our guide Joseph knew exactly where the lions were at sunrise — I\'ve never felt so close to wild Africa. Worth every shilling.",
  image: "/assets/images/testimonial-amelia.png",
  alt: 'Portrait of smiling woman with light brown hair outdoors'
},
{
  id: 2,
  name: 'Rajiv Menon',
  location: 'Mumbai, India',
  tour: 'Amboseli Elephant Safari',
  rating: 5,
  quote: "Seeing Kilimanjaro at dawn with 300 elephants in the foreground was a moment I'll never forget. The camp was luxury, the food was incredible, and the team handled everything perfectly.",
  image: "/assets/images/testimonial-rajiv.jpg",
  alt: 'Portrait of smiling man with dark hair in casual shirt'
},
{
  id: 3,
  name: 'Sophie Nakamura',
  location: 'Nairobi, Kenya',
  tour: 'Diani Beach Getaway',
  rating: 5,
  quote: "As a Kenyan, I thought I knew my own country — but SwayAdventures showed me Diani in a completely new light. The boutique hotel they chose was extraordinary. Already planning my next trip.",
  image: "/assets/images/testimonial-sophie.png",
  alt: 'Portrait of smiling woman with natural hair in bright daylight'
}];


export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.scroll-reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 100);
            });
          }
        });
      },
      { threshold: 0.15 }
    );
    if (sectionRef?.current) observer?.observe(sectionRef?.current);
    return () => observer?.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-primary overflow-hidden relative">
      {/* Background texture blob */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #D97706 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
      
      <div
        className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #D97706 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="scroll-reveal stagger-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 block mb-3">
              Traveler Stories
            </span>
            <h2 className="text-section font-display font-semibold text-white">
              Heard From<br />Our Explorers.
            </h2>
          </div>
          <div className="flex gap-3 scroll-reveal stagger-2">
            {testimonials?.map((_, i) =>
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`transition-all duration-300 rounded-full ${
              active === i ?
              'w-8 h-2 bg-accent' : 'w-2 h-2 bg-white/30 hover:bg-white/50'}`
              }
              aria-label={`View testimonial ${i + 1}`} />

            )}
          </div>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials?.map((t, i) =>
          <div
            key={t?.id}
            onClick={() => setActive(i)}
            className={`scroll-reveal stagger-${i + 2} cursor-pointer rounded-2xl p-7 border transition-all duration-400 ${
            active === i ?
            'bg-white border-white shadow-xl scale-[1.02]' :
            'bg-white/5 border-white/10 hover:bg-white/10'}`
            }>
            
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {Array.from({ length: t?.rating })?.map((_, si) =>
              <Icon
                key={si}
                name="StarIcon"
                size={14}
                variant="solid"
                className={active === i ? 'text-amber-400' : 'text-amber-300'} />

              )}
              </div>

              {/* Quote */}
              <p className={`text-sm leading-relaxed mb-6 ${active === i ? 'text-foreground' : 'text-white/80'}`}>
                "{t?.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                  <AppImage
                  src={t?.image}
                  alt={t?.alt}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full" />
                
                </div>
                <div>
                  <p className={`text-sm font-semibold ${active === i ? 'text-foreground' : 'text-white'}`}>
                    {t?.name}
                  </p>
                  <p className={`text-xs ${active === i ? 'text-muted-foreground' : 'text-white/50'}`}>
                    {t?.location} · {t?.tour}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>);

}