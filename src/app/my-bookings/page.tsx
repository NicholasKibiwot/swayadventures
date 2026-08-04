'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';
import { TourReviewForm } from '@/components/TourReviews';

interface BookingDetail {
  id: string;
  reference: string;
  bookingType: string;
  guests: number;
  totalAmount: number;
  currency: string;
  status: string;
  payment_status: string;
  notes: string | null;
  createdAt: string;
  trip: {
    id: string;
    title: string;
    durationDays: number;
    tripType: string;
  } | null;
  payments: {
    id: string;
    amount: number;
    status: string;
    method: string | null;
    gateway: string;
    paidAt: string | null;
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: 'ClockIcon' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', icon: 'CheckBadgeIcon' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: 'CheckCircleIcon' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: 'XCircleIcon' },
  REFUNDED: { label: 'Refunded', color: 'bg-purple-100 text-purple-700', icon: 'ArrowUturnLeftIcon' },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Payment Pending', color: 'text-amber-600' },
  completed: { label: 'Paid', color: 'text-green-600' },
  refunded: { label: 'Refunded', color: 'text-purple-600' },
  failed: { label: 'Payment Failed', color: 'text-red-600' },
};

export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/booking');
    }
  }, [user, authLoading, router]);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('Booking')
        .select(`
          id, reference, bookingType, guests, totalAmount, currency,
          status, payment_status, notes, createdAt,
          trip:Trip(id, title, durationDays, tripType),
          payments:Payment(id, amount, status, method, gateway, paidAt)
        `)
        .eq('user_id', user.id)
        .order('createdAt', { ascending: false });

      if (err) throw err;
      setBookings((data as any[]) || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user, fetchBookings]);

  const now = new Date();

  const upcomingBookings = bookings.filter(
    (b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && b.status !== 'REFUNDED'
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'REFUNDED'
  );

  const displayed = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <Header />
      <main className="pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground">My Bookings</h1>
            <p className="text-muted-foreground mt-1">View and manage your adventure bookings</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-border mb-6 w-fit">
            {(['upcoming', 'past'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'upcoming' ? `Upcoming (${upcomingBookings.length})` : `Past (${pastBookings.length})`}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-border p-10 text-center">
              <Icon name="ExclamationCircleIcon" size={36} className="text-red-400 mx-auto mb-3" />
              <p className="text-red-500 text-sm">{error}</p>
              <button onClick={fetchBookings} className="mt-4 text-sm text-primary underline">Try again</button>
            </div>
          ) : displayed.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Icon name="CalendarIcon" size={28} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {activeTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                {activeTab === 'upcoming' ?'Ready for your next adventure? Browse our tours and book today.' :'Your completed trips will appear here.'}
              </p>
              {activeTab === 'upcoming' && (
                <Link
                  href="/tours"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-full hover:bg-amber-600 transition-colors text-sm"
                >
                  <Icon name="MapIcon" size={16} />
                  Explore Tours
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {displayed.map((booking) => {
                const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG['PENDING'];
                const paymentCfg = PAYMENT_CONFIG[booking.payment_status] || PAYMENT_CONFIG['pending'];
                const isExpanded = expandedId === booking.id;
                const latestPayment = booking.payments?.[0];

                return (
                  <div key={booking.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                    {/* Card header */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Tour icon */}
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon name="MapPinIcon" size={22} className="text-primary" />
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground text-base">
                            {booking.trip?.title || booking.bookingType}
                          </h3>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${statusCfg.color}`}>
                            <Icon name={statusCfg.icon} size={11} />
                            {statusCfg.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Icon name="HashtagIcon" size={11} />
                            {booking.reference}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="UsersIcon" size={11} />
                            {booking.guests} guest{booking.guests !== 1 ? 's' : ''}
                          </span>
                          {booking.trip?.durationDays && (
                            <span className="flex items-center gap-1">
                              <Icon name="ClockIcon" size={11} />
                              {booking.trip.durationDays} days
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Icon name="CalendarIcon" size={11} />
                            {new Date(booking.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Amount + payment status */}
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-foreground">
                          {booking.currency} {booking.totalAmount?.toLocaleString()}
                        </p>
                        <p className={`text-xs font-semibold ${paymentCfg.color}`}>{paymentCfg.label}</p>
                      </div>

                      {/* Expand toggle */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                      >
                        <Icon name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={18} />
                      </button>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/20 p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {/* Booking confirmation */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Booking Confirmation</p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Reference</span>
                                <span className="font-mono font-semibold text-primary">{booking.reference}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tour</span>
                                <span className="font-medium text-right max-w-[60%]">{booking.trip?.title || booking.bookingType}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Guests</span>
                                <span className="font-medium">{booking.guests}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Booking Status</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
                              </div>
                              {booking.notes && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Notes</span>
                                  <span className="text-right max-w-[60%] text-xs">{booking.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Payment details */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Payment Details</p>
                            {latestPayment ? (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Amount</span>
                                  <span className="font-semibold">{booking.currency} {latestPayment.amount?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Method</span>
                                  <span className="font-medium capitalize">{latestPayment.method || latestPayment.gateway}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Status</span>
                                  <span className={`text-xs font-semibold capitalize ${paymentCfg.color}`}>{paymentCfg.label}</span>
                                </div>
                                {latestPayment.paidAt && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Paid on</span>
                                    <span className="font-medium">{new Date(latestPayment.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Icon name="InformationCircleIcon" size={16} />
                                <span>No payment records yet</span>
                              </div>
                            )}

                            {/* Total */}
                            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                              <span className="text-sm font-semibold text-foreground">Total Paid</span>
                              <span className="text-lg font-bold text-foreground">{booking.currency} {booking.totalAmount?.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Refund notice */}
                        {booking.payment_status === 'refunded' && (
                          <div className="mt-4 flex items-center gap-2 p-3 bg-purple-50 rounded-xl text-sm text-purple-700">
                            <Icon name="ArrowUturnLeftIcon" size={16} />
                            <span>A refund has been processed for this booking. Please allow 5–10 business days for it to reflect.</span>
                          </div>
                        )}

                        {/* Review form for completed tours */}
                        {booking.status === 'COMPLETED' && booking.trip?.id && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Leave a Review</p>
                            <TourReviewForm
                              tripId={booking.trip.id}
                              bookingId={booking.id}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
