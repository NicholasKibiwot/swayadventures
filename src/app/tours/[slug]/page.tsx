'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { TourReviewsList } from '@/components/TourReviews';

interface Trip {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  durationDays: number;
  basePrice: number;
  currency: string;
  tripType: string;
  difficulty: string;
  groupSizeMin: number;
  groupSizeMax: number;
  images: { url: string; alt: string }[];
  inclusions: { label: string; included: boolean }[];
  itinerary: { dayNumber: number; title: string; details: string }[];
}

export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'reviews'>('overview');
  const supabase = createClient();

  useEffect(() => {
    if (!slug) return;
    const fetch = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('Trip')
        .select(`
          id, title, slug, summary, description, durationDays, basePrice, currency,
          tripType, difficulty, groupSizeMin, groupSizeMax,
          images:TripImage(url, alt, sortOrder),
          inclusions:TripInclusion(label, included),
          itinerary:Itinerary(dayNumber, title, details)
        `)
        .eq('slug', slug)
        .eq('isActive', true)
        .single();
      if (err || !data) {
        setError('Tour not found.');
      } else {
        setTrip(data as any);
      }
      setLoading(false);
    };
    fetch();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-32 pb-20 max-w-4xl mx-auto px-6 text-center">
          <Icon name="ExclamationCircleIcon" size={40} className="text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Tour Not Found</h1>
          <p className="text-muted-foreground mb-6">This tour may no longer be available.</p>
          <Link href="/tours" className="px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-secondary transition-colors">
            Browse All Tours
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const heroImage = trip.images?.[0];
  const sortedItinerary = [...(trip.itinerary || [])].sort((a, b) => a.dayNumber - b.dayNumber);

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <Header />

      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        {heroImage ? (
          <AppImage
            src={heroImage.url}
            alt={heroImage.alt || trip.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-primary/80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 block mb-2">
            {trip.tripType}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-3">{trip.title}</h1>
          <div className="flex flex-wrap gap-4 text-white/80 text-sm">
            <span className="flex items-center gap-1.5">
              <Icon name="ClockIcon" size={15} />
              {trip.durationDays} days
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="UserGroupIcon" size={15} />
              {trip.groupSizeMin}–{trip.groupSizeMax} people
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="BoltIcon" size={15} />
              {trip.difficulty}
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-border mb-6 w-fit">
              {(['overview', 'itinerary', 'reviews'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
                    activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-border p-6">
                  <h2 className="font-display text-xl font-semibold text-foreground mb-3">About This Tour</h2>
                  <p className="text-muted-foreground leading-relaxed">{trip.description || trip.summary}</p>
                </div>

                {trip.inclusions && trip.inclusions.length > 0 && (
                  <div className="bg-white rounded-2xl border border-border p-6">
                    <h2 className="font-display text-xl font-semibold text-foreground mb-4">What&apos;s Included</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {trip.inclusions.map((inc, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Icon
                            name={inc.included ? 'CheckCircleIcon' : 'XCircleIcon'}
                            size={16}
                            className={inc.included ? 'text-green-500' : 'text-red-400'}
                          />
                          <span className={inc.included ? 'text-foreground' : 'text-muted-foreground line-through'}>
                            {inc.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'itinerary' && (
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">Day-by-Day Itinerary</h2>
                {sortedItinerary.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Itinerary details coming soon.</p>
                ) : (
                  <div className="space-y-4">
                    {sortedItinerary.map((day) => (
                      <div key={day.dayNumber} className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                          {day.dayNumber}
                        </div>
                        <div className="flex-1 pb-4 border-b border-border last:border-0">
                          <h3 className="font-semibold text-foreground text-sm mb-1">{day.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{day.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">Guest Reviews</h2>
                <TourReviewsList tripId={trip.id} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-border p-6 sticky top-24">
              <div className="mb-4">
                <span className="text-3xl font-bold text-foreground">
                  {trip.currency} {trip.basePrice?.toLocaleString()}
                </span>
                <span className="text-muted-foreground text-sm ml-1">/ person</span>
              </div>
              <Link
                href={`/booking?trip=${trip.id}`}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-accent text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors mb-3"
              >
                Book This Tour
                <Icon name="ArrowRightIcon" size={16} />
              </Link>
              <Link
                href="/tours"
                className="flex items-center justify-center gap-2 w-full py-3 border border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-colors text-sm"
              >
                Browse All Tours
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
