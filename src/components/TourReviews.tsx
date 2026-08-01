'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/AppIcon';

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  reviewer_name: string;
  created_at: string;
}

interface TourReviewsProps {
  tripId: string;
  tripTitle?: string;
}

function StarRating({
  value,
  onChange,
  size = 20,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? 'cursor-default' : 'cursor-pointer'}
          aria-label={`${star} star`}
        >
          <Icon
            name="StarIcon"
            size={size}
            variant="solid"
            className={
              star <= (hovered || value)
                ? 'text-amber-400' :'text-gray-200'
            }
          />
        </button>
      ))}
    </div>
  );
}

export function TourReviewForm({
  tripId,
  bookingId,
  onSuccess,
}: {
  tripId: string;
  bookingId?: string;
  onSuccess?: () => void;
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const checkExisting = async () => {
      const { data } = await supabase
        .from('TourReview')
        .select('id')
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setAlreadyReviewed(true);
    };
    checkExisting();
  }, [user, tripId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setError('Please sign in to leave a review.'); return; }
    if (rating === 0) { setError('Please select a star rating.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const reviewerName =
        user?.user_metadata?.full_name ||
        user?.email?.split('@')[0] ||
        'Anonymous';

      const { error: err } = await supabase.from('TourReview').insert({
        trip_id: tripId,
        user_id: user.id,
        booking_id: bookingId || null,
        rating,
        review_text: reviewText.trim() || null,
        reviewer_name: reviewerName,
      });
      if (err) {
        if (err.code === '23505') {
          setAlreadyReviewed(true);
          setError('You have already reviewed this tour.');
        } else {
          setError(err.message);
        }
      } else {
        setSuccess(true);
        onSuccess?.();
      }
    } catch (e: any) {
      setError(e.message || 'Failed to submit review.');
    }
    setSubmitting(false);
  };

  if (!user) return null;

  if (alreadyReviewed) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-xl px-4 py-3">
        <Icon name="CheckCircleIcon" size={16} />
        You have already reviewed this tour.
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-xl px-4 py-3">
        <Icon name="CheckCircleIcon" size={16} />
        Thank you for your review!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Your Rating</label>
        <StarRating value={rating} onChange={setRating} size={24} />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Your Review <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Share your experience..."
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1.5">
          <Icon name="ExclamationCircleIcon" size={14} />
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        Submit Review
      </button>
    </form>
  );
}

export function TourReviewsList({ tripId }: TourReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const supabase = createClient();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('TourReview')
      .select('id, rating, review_text, reviewer_name, created_at')
      .eq('trip_id', tripId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setReviews(data as Review[]);
      if (data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
    }
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    fetchReviews();

    const channel = supabase
      .channel(`reviews_${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'TourReview', filter: `trip_id=eq.${tripId}` },
        () => fetchReviews()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tripId, fetchReviews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No reviews yet. Be the first to share your experience!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
        <div className="text-3xl font-bold text-foreground">{avgRating}</div>
        <div>
          <StarRating value={Math.round(avgRating)} size={16} readonly />
          <p className="text-xs text-muted-foreground mt-0.5">
            Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Individual reviews */}
      {reviews.map((review) => (
        <div key={review.id} className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">
                  {review.reviewer_name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{review.reviewer_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <StarRating value={review.rating} size={14} readonly />
          </div>
          {review.review_text && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">{review.review_text}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function TourRatingBadge({ tripId }: { tripId: string }) {
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('TourReview')
        .select('rating')
        .eq('trip_id', tripId)
        .eq('is_approved', true);
      if (data && data.length > 0) {
        const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
        setAvgRating(Math.round(avg * 10) / 10);
        setCount(data.length);
      }
    };
    fetch();
  }, [tripId]);

  if (avgRating === null) return null;

  return (
    <span className="flex items-center gap-1">
      <Icon name="StarIcon" size={13} variant="solid" className="text-amber-400" />
      <span className="font-medium text-foreground">{avgRating}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </span>
  );
}
