'use client';

import React, { useEffect, useRef } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const reasons = [
{
  icon: 'UserGroupIcon',
  title: 'Expert Local Guides',
  description: 'Our guides are born and raised in Kenya — they know every hidden track, watering hole, and sunrise viewpoint.'
},
{
  icon: 'SparklesIcon',
  title: 'Curated Experiences',
  description: 'Every itinerary is handpicked and tested by our team. No cookie-cutter tours — only authentic Kenya.'
},
{
  icon: 'ShieldCheckIcon',
  title: 'Safe Travel, Always',
  description: 'Fully licensed and insured. We partner with Kenya Tourism Board and maintain the highest safety standards.'
},
{
  icon: 'CurrencyDollarIcon',
  title: 'Transparent Pricing',
  description: 'No hidden fees. Pay via M-Pesa, card, or PayPal. What you see is exactly what you pay.'
}];


export default function WhyChooseUs() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.scroll-reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 110);
            });
          }
        });
      },
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: Image */}
          <div className="lg:col-span-5 scroll-reveal stagger-1">
            <div className="relative">
              <div className="img-reveal rounded-3xl overflow-hidden aspect-[4/5]">
                <AppImage
                  src="/assets/images/why-choose-us-guide.png"
                  alt="Safari guide in tan jacket pointing to wildlife tracks on golden savanna, warm afternoon light"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover" />
                
              </div>
              {/* Floating stat card */}
              <div className="absolute -bottom-6 -right-4 md:right-6 bg-primary text-white rounded-2xl p-5 shadow-xl max-w-[180px]">
                <span className="font-display text-4xl font-semibold text-amber-300">98%</span>
                <p className="text-white/80 text-xs mt-1 leading-snug">Travelers would recommend us</p>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="lg:col-span-7">
            <div className="scroll-reveal stagger-2 mb-10">
              <span className="text-xs font-semibold uppercase tracking-widest text-accent block mb-3">
                Why SwayAdventures
              </span>
              <h2 className="text-section font-display font-semibold text-foreground">
                Kenya, Done Right.
              </h2>
              <p className="text-muted-foreground leading-relaxed mt-4 max-w-lg">
                We've spent over a decade perfecting the art of Kenyan travel. Here's what sets us apart.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {reasons.map((reason, i) =>
              <div
                key={reason.title}
                className={`scroll-reveal stagger-${i + 3} flex flex-col gap-3 p-5 rounded-2xl border border-border hover:border-accent/40 hover:bg-muted/50 transition-all duration-300 group`}>
                
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Icon name={reason.icon as 'UserGroupIcon'} size={20} className="text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground text-base">{reason.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{reason.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>);

}