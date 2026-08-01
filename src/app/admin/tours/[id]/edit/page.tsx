'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import TourForm from '../../components/TourForm';

export default function EditTourPage() {
  const params = useParams();
  const tripId = params?.id as string;
  const [trip, setTrip] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tripId) return;
    const fetch = async () => {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from('Trip')
        .select('*, TripImage(id, url, alt, sortOrder)')
        .eq('id', tripId)
        .single();

      if (err) {
        setError(err.message);
      } else {
        setTrip(data);
        setImages(data?.TripImage || []);
      }
      setLoading(false);
    };
    fetch();
  }, [tripId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-red-500">{error || 'Tour not found.'}</p>
        <Link href="/admin/tours" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to Tours
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/admin/tours" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Icon name="MapIcon" size={14} />
          Tours
        </Link>
        <Icon name="ChevronRightIcon" size={14} />
        <span className="text-foreground font-medium line-clamp-1">{trip.title}</span>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Edit Tour</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Update the details for "{trip.title}".</p>
      </div>

      <TourForm
        tripId={tripId}
        initialData={{
          title: trip.title,
          summary: trip.summary,
          description: trip.description,
          tripType: trip.tripType,
          durationDays: trip.durationDays,
          basePrice: trip.basePrice,
          currency: trip.currency,
          groupSizeMin: trip.groupSizeMin,
          groupSizeMax: trip.groupSizeMax,
          difficulty: trip.difficulty,
          isFeatured: trip.isFeatured,
          isActive: trip.isActive,
        }}
        initialImages={images}
      />
    </div>
  );
}
