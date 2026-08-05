'use client';

import React, { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

type Stat = { value: number; suffix: string; label: string; icon: string };

/* Baselines represent pre-launch history; live DB activity adds on top */
const BASE_TRAVELERS = 1000;
const BASE_TOURS = 50;
const YEARS_EXPERIENCE = 10;

const INITIAL_STATS: Stat[] = [
  { value: BASE_TRAVELERS, suffix: '+', label: 'Travelers Served', icon: 'UsersIcon' },
  { value: BASE_TOURS, suffix: '+', label: 'Curated Tours', icon: 'MapIcon' },
  { value: YEARS_EXPERIENCE, suffix: '+', label: 'Years Experience', icon: 'TrophyIcon' }
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

function StatItem({ stat, active }: { stat: Stat; active: boolean }) {
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
  const [stats, setStats] = useState<Stat[]>(INITIAL_STATS);

  /* ---------- LIVE DATA: travelers = base + booked guests; tours = base + live trips ---------- */
  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      try {
        const [{ count: tripCount }, { data: bookings }] = await Promise.all([
          supabase.from('Trip').select('*', { count: 'exact', head: true }).eq('isActive', true),
          supabase.from('Booking').select('guests')
        ]);

        const guests = (bookings || []).reduce((sum: number, b: any) => sum + (Number(b.guests) || 1), 0);

        setStats([
          { value: BASE_TRAVELERS + guests, suffix: '+', label: 'Travelers Served', icon: 'UsersIcon' },
          { value: BASE_TOURS + (tripCount || 0), suffix: '+', label: 'Curated Tours', icon: 'MapIcon' },
          { value: YEARS_EXPERIENCE, suffix: '+', label: 'Years Experience', icon: 'TrophyIcon' }
        ]);
      } catch {
        /* keep initial stats */
      }
    };

    load();

    const channel = supabase
      .channel('stats-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Trip' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Booking' }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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