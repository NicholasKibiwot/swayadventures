'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useLiveTours<T = any>(fallback: T[]) {
  const [tours, setTours] = useState<any[]>(fallback as any[]);

  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('Trip')
          .select('id, slug, title, summary, description, basePrice, durationDays, tripType, Destination(name, region, heroImage), TripImage(url, alt, sortOrder)')
          .eq('isActive', true)
          .order('createdAt', { ascending: true });

        if (error || !data || data.length === 0) return; // keep fallback

        setTours(data.map((t: any) => {
          const imgs = (t.TripImage || []).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          const rawType = Array.isArray(t.tripType) ? (t.tripType[0] || 'safari') : (t.tripType || 'safari');
          const cat = String(rawType).toLowerCase();
          const title = t.title;
          const days = Number(t.durationDays) || 0;
          const price = Number(t.basePrice) || 0;
          const image = imgs[0]?.url || t.Destination?.heroImage || '/assets/images/no_image.png';
          const location = t.Destination ? `${t.Destination.name}, ${t.Destination.region}` : 'Kenya';

          return {
            // aliases so any page's field names resolve
            id: t.id,
            slug: t.slug,
            title, name: title,
            location,
            days, duration: `${days} days`,
            price,
            category: cat, type: cat,
            image, img: image,
            alt: imgs[0]?.alt || title,
            badge: null,
            rating: 0, reviews: 0,
            summary: t.summary || '', description: t.description || ''
          };
        }));
      } catch {
        /* keep fallback */
      }
    };

    load();

    const channel = supabase
      .channel('live-tours-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Trip' }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return tours as T[];
}