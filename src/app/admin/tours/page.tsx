'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface Trip {
  id: string;
  title: string;
  tripType: string;
  basePrice: number;
  currency: string;
  durationDays: number;
  groupSizeMax: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  images?: { url: string; alt: string }[];
}

export default function AdminToursPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('Trip')
      .select('id, title, tripType, basePrice, currency, durationDays, groupSizeMax, isFeatured, isActive, createdAt, TripImage(url, alt)')
      .order('createdAt', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setTrips(
        (data || []).map((t: any) => ({
          ...t,
          images: t.TripImage || [],
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const supabase = createClient();
    // Delete images first
    await supabase.from('TripImage').delete().eq('tripId', id);
    const { error: err } = await supabase.from('Trip').delete().eq('id', id);
    if (err) {
      setError(err.message);
    } else {
      setTrips((prev) => prev.filter((t) => t.id !== id));
    }
    setDeletingId(null);
    setConfirmDelete(null);
  };

  const handleToggleActive = async (trip: Trip) => {
    const supabase = createClient();
    const { error: err } = await supabase
      .from('Trip')
      .update({ isActive: !trip.isActive })
      .eq('id', trip.id);
    if (!err) {
      setTrips((prev) =>
        prev.map((t) => (t.id === trip.id ? { ...t, isActive: !t.isActive } : t))
      );
    }
  };

  const categoryColors: Record<string, string> = {
    safari: 'bg-amber-100 text-amber-700',
    beach: 'bg-blue-100 text-blue-700',
    retreat: 'bg-green-100 text-green-700',
    adventure: 'bg-orange-100 text-orange-700',
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">All Tours</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{trips.length} tour{trips.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          href="/admin/tours/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Icon name="PlusIcon" size={16} />
          Add Tour
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-center gap-2">
          <Icon name="ExclamationCircleIcon" size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-border animate-pulse">
              <div className="h-44 bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Icon name="MapIcon" size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-2">No tours yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Add your first tour to get started.</p>
          <Link
            href="/admin/tours/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Icon name="PlusIcon" size={16} />
            Add Tour
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white rounded-2xl overflow-hidden border border-border hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Image */}
              <div className="relative h-44 bg-muted overflow-hidden">
                {trip.images?.[0]?.url ? (
                  <AppImage
                    src={trip.images[0].url}
                    alt={trip.images[0].alt || trip.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Icon name="PhotoIcon" size={32} className="text-muted-foreground/40" />
                  </div>
                )}
                {/* Active badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      trip.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {trip.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {trip.isFeatured && (
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent text-white">
                      Featured
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">{trip.title}</h3>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                      categoryColors[trip.tripType?.toLowerCase()] || 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {trip.tripType}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Icon name="ClockIcon" size={12} />
                    {trip.durationDays} day{trip.durationDays !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="UsersIcon" size={12} />
                    Up to {trip.groupSizeMax}
                  </span>
                  <span className="ml-auto font-semibold text-foreground text-sm">
                    ${trip.basePrice?.toLocaleString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
                  <Link
                    href={`/admin/tours/${trip.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
                  >
                    <Icon name="PencilSquareIcon" size={14} />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleToggleActive(trip)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
                    title={trip.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <Icon name={trip.isActive ? 'EyeSlashIcon' : 'EyeIcon'} size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(trip.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                    title="Delete"
                  >
                    <Icon name="TrashIcon" size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Icon name="TrashIcon" size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-foreground text-center mb-2">Delete Tour?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              This will permanently delete the tour and all its images. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deletingId === confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deletingId === confirmDelete ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
