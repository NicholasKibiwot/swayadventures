'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';

interface BookingRow {
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
  customer: {
    fullName: string;
    email: string | null;
    phone: string;
    country: string | null;
  } | null;
  trip: {
    title: string;
    durationDays: number;
  } | null;
  payments: {
    id: string;
    amount: number;
    status: string;
    method: string | null;
    gateway: string;
    paidAt: string | null;
    createdAt: string;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-purple-100 text-purple-700',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  refunded: 'bg-purple-100 text-purple-700',
  failed: 'bg-red-100 text-red-700',
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundMsg, setRefundMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  const supabase = createClient();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('Booking')
        .select(`
          id, reference, bookingType, guests, totalAmount, currency,
          status, payment_status, notes, createdAt,
          customer:Customer(fullName, email, phone, country),
          trip:Trip(title, durationDays),
          payments:Payment(id, amount, status, method, gateway, paidAt, createdAt)
        `)
        .order('createdAt', { ascending: false });

      if (err) throw err;
      setBookings((data as any[]) || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleRefund = async (booking: BookingRow) => {
    setRefundingId(booking.id);
    setRefundMsg(null);
    try {
      const { error: err } = await supabase
        .from('Booking')
        .update({ payment_status: 'refunded', status: 'REFUNDED' })
        .eq('id', booking.id);
      if (err) throw err;

      // Update payment records too
      if (booking.payments?.length) {
        await supabase
          .from('Payment')
          .update({ status: 'refunded' })
          .eq('bookingId', booking.id);
      }

      setRefundMsg({ id: booking.id, msg: 'Refund processed successfully.', ok: true });
      fetchBookings();
    } catch (e: any) {
      setRefundMsg({ id: booking.id, msg: e.message || 'Refund failed.', ok: false });
    } finally {
      setRefundingId(null);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await supabase.from('Booking').update({ status: newStatus }).eq('id', bookingId);
      fetchBookings();
    } catch {}
  };

  const filtered = bookings.filter((b) => {
    const matchSearch =
      !search ||
      b.reference?.toLowerCase().includes(search.toLowerCase()) ||
      b.customer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      b.customer?.email?.toLowerCase().includes(search.toLowerCase()) ||
      b.trip?.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchPayment = paymentFilter === 'all' || b.payment_status === paymentFilter;
    return matchSearch && matchStatus && matchPayment;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.payment_status === 'pending').length,
    completed: bookings.filter((b) => b.payment_status === 'completed').length,
    refunded: bookings.filter((b) => b.payment_status === 'refunded').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: stats.total, icon: 'CalendarIcon', color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending Payment', value: stats.pending, icon: 'ClockIcon', color: 'text-amber-600 bg-amber-50' },
          { label: 'Completed', value: stats.completed, icon: 'CheckCircleIcon', color: 'text-green-600 bg-green-50' },
          { label: 'Refunded', value: stats.refunded, icon: 'ArrowUturnLeftIcon', color: 'text-purple-600 bg-purple-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-border">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <Icon name={s.icon} size={20} />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by ref, customer, tour…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
        >
          <option value="all">All Payments</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
        <button
          onClick={fetchBookings}
          className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Refresh"
        >
          <Icon name="ArrowPathIcon" size={16} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Icon name="ExclamationCircleIcon" size={32} className="text-red-400" />
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={fetchBookings} className="text-sm text-primary underline">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Icon name="CalendarIcon" size={40} className="text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Reference</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Tour</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Booking Status</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Payment</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((booking) => (
                  <React.Fragment key={booking.id}>
                    <tr className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-primary">{booking.reference}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{booking.customer?.fullName || '—'}</p>
                        <p className="text-xs text-muted-foreground">{booking.customer?.email || booking.customer?.phone || ''}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{booking.trip?.title || booking.bookingType}</p>
                        <p className="text-xs text-muted-foreground">{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-foreground">
                          {booking.currency} {booking.totalAmount?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${PAYMENT_STATUS_COLORS[booking.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                          {booking.payment_status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(booking.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="View details"
                          >
                            <Icon name={expandedId === booking.id ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={14} />
                          </button>
                          {booking.payment_status !== 'refunded' && (
                            <button
                              onClick={() => handleRefund(booking)}
                              disabled={refundingId === booking.id}
                              className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors font-medium disabled:opacity-50"
                            >
                              {refundingId === booking.id ? 'Processing…' : 'Refund'}
                            </button>
                          )}
                        </div>
                        {refundMsg?.id === booking.id && (
                          <p className={`text-xs mt-1 ${refundMsg.ok ? 'text-green-600' : 'text-red-500'}`}>{refundMsg.msg}</p>
                        )}
                      </td>
                    </tr>
                    {expandedId === booking.id && (
                      <tr>
                        <td colSpan={8} className="px-5 py-4 bg-muted/20 border-b border-border">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Customer details */}
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Customer</p>
                              <p className="text-sm font-medium">{booking.customer?.fullName}</p>
                              <p className="text-xs text-muted-foreground">{booking.customer?.email}</p>
                              <p className="text-xs text-muted-foreground">{booking.customer?.phone}</p>
                              <p className="text-xs text-muted-foreground">{booking.customer?.country}</p>
                            </div>
                            {/* Booking details */}
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Booking</p>
                              <p className="text-xs"><span className="text-muted-foreground">Type:</span> {booking.bookingType}</p>
                              <p className="text-xs"><span className="text-muted-foreground">Guests:</span> {booking.guests}</p>
                              <p className="text-xs"><span className="text-muted-foreground">Tour:</span> {booking.trip?.title || '—'}</p>
                              {booking.notes && <p className="text-xs"><span className="text-muted-foreground">Notes:</span> {booking.notes}</p>}
                            </div>
                            {/* Payment details */}
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Payments</p>
                              {booking.payments?.length ? booking.payments.map((p) => (
                                <div key={p.id} className="text-xs space-y-0.5">
                                  <p><span className="text-muted-foreground">Gateway:</span> {p.gateway} {p.method ? `(${p.method})` : ''}</p>
                                  <p><span className="text-muted-foreground">Amount:</span> {booking.currency} {p.amount?.toLocaleString()}</p>
                                  <p><span className="text-muted-foreground">Status:</span> <span className={`font-semibold capitalize ${p.status === 'completed' ? 'text-green-600' : p.status === 'refunded' ? 'text-purple-600' : 'text-amber-600'}`}>{p.status}</span></p>
                                  {p.paidAt && <p><span className="text-muted-foreground">Paid:</span> {new Date(p.paidAt).toLocaleDateString()}</p>}
                                </div>
                              )) : <p className="text-xs text-muted-foreground">No payment records</p>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
