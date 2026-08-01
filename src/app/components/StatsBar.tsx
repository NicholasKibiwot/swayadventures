'use client';

import React, { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

const stats = [
  { value: 1000, suffix: '+', label: 'Travelers Served', icon: 'UsersIcon' },
  { value: 50, suffix: '+', label: 'Curated Tours', icon: 'MapIcon' },
  { value: 10, suffix: '+', label: 'Years Experience', icon: 'TrophyIcon' },
];

function useCountUp(target: number, duration: number, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, duration]);
  return count;
}

function StatItem({ stat, active }: { stat: typeof stats[0]; active: boolean }) {
  const count = useCountUp(stat.value, 1200, active);
  return (
    <div className="flex flex-col items-center gap-2 text-center px-6 py-6 md:py-8">
      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-1">
        <Icon name={stat.icon as 'UsersIcon'} size={18} className="text-accent" />
      </div>
      <span className="font-display text-4xl md:text-5xl font-semibold text-primary">
        {count}{stat.suffix}
      </span>
      <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
        {stat.label}
      </span>
    </div>
  );
}

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-white border-y border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
          {stats.map((stat) => (
            <StatItem key={stat.label} stat={stat} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}