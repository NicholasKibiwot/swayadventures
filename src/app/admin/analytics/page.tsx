'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  bookingsByStatus: Record<string, number>;
  topTours: { title: string; bookings: number; revenue: number }[];
  monthlyTrend: { month: string; bookings: number; revenue: number }[];
  peakPeriods: { period: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  COMPLETED: '#22c55e',
  CANCELLED: '#ef4444',
  REFUNDED: '#a855f7',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TOUR_NAMES: Record<string, string> = {
  '1': 'Maasai Mara Migration',
  '2': 'Diani Beach Getaway',
  '3': 'Mount Kenya Trek',
  '4': 'Amboseli Elephant Safari',
  '5': 'Lamu Island Retreat',
  '6': 'Tsavo Red Elephant Safari',
  '7': 'Naivasha Lake Retreat',
  '8': 'Samburu Rare Species Safari',
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartView, setChartView] = useState<'bookings' | 'revenue'>('bookings');

  const supabase = createClient();

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all bookings with trip info
      const { data: bookings, error: err } = await supabase
        .from('Booking')
        .select('id, status, totalAmount, currency, createdAt, tripId, payment_status')
        .order('createdAt', { ascending: true });

      if (err) throw err;

      const rows = (bookings as any[]) || [];

      // Total revenue (completed/confirmed payments)
      const totalRevenue = rows
        .filter((b) => b.payment_status === 'completed')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      // Bookings by status
      const bookingsByStatus: Record<string, number> = {};
      rows.forEach((b) => {
        bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1;
      });

      // Top tours
      const tourMap: Record<string, { bookings: number; revenue: number }> = {};
      rows.forEach((b) => {
        const tid = b.tripId || 'unknown';
        if (!tourMap[tid]) tourMap[tid] = { bookings: 0, revenue: 0 };
        tourMap[tid].bookings += 1;
        if (b.payment_status === 'completed') tourMap[tid].revenue += b.totalAmount || 0;
      });
      const topTours = Object.entries(tourMap)
        .map(([id, stats]) => ({
          title: TOUR_NAMES[id] || `Tour ${id}`,
          bookings: stats.bookings,
          revenue: stats.revenue,
        }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      // Monthly trend (last 12 months)
      const now = new Date();
      const monthlyMap: Record<string, { bookings: number; revenue: number }> = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap[key] = { bookings: 0, revenue: 0 };
      }
      rows.forEach((b) => {
        const d = new Date(b.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[key]) {
          monthlyMap[key].bookings += 1;
          if (b.payment_status === 'completed') monthlyMap[key].revenue += b.totalAmount || 0;
        }
      });
      const monthlyTrend = Object.entries(monthlyMap).map(([key, stats]) => {
        const [year, month] = key.split('-');
        return {
          month: `${MONTH_NAMES[parseInt(month) - 1]} ${year.slice(2)}`,
          bookings: stats.bookings,
          revenue: stats.revenue,
        };
      });

      // Peak booking periods (by day of week)
      const dayMap: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      rows.forEach((b) => {
        const day = dayNames[new Date(b.createdAt).getDay()];
        dayMap[day] = (dayMap[day] || 0) + 1;
      });
      const peakPeriods = Object.entries(dayMap).map(([period, count]) => ({ period, count }));

      setData({
        totalRevenue,
        totalBookings: rows.length,
        bookingsByStatus,
        topTours,
        monthlyTrend,
        peakPeriods,
      });
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Icon name="ExclamationCircleIcon" size={40} className="text-red-400" />
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={fetchAnalytics} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-secondary transition-colors">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const totalBookings = data.totalBookings;
  const confirmedCount = data.bookingsByStatus['CONFIRMED'] || 0;
  const completedCount = data.bookingsByStatus['COMPLETED'] || 0;
  const pendingCount = data.bookingsByStatus['PENDING'] || 0;
  const cancelledCount = data.bookingsByStatus['CANCELLED'] || 0;

  const statCards = [
    {
      label: 'Total Revenue',
      value: `USD ${data.totalRevenue.toLocaleString()}`,
      icon: 'BanknotesIcon',
      color: 'bg-green-50 text-green-600',
      change: 'From paid bookings',
    },
    {
      label: 'Total Bookings',
      value: totalBookings.toLocaleString(),
      icon: 'CalendarIcon',
      color: 'bg-blue-50 text-blue-600',
      change: `${confirmedCount} confirmed`,
    },
    {
      label: 'Completed Tours',
      value: completedCount.toLocaleString(),
      icon: 'CheckCircleIcon',
      color: 'bg-primary/10 text-primary',
      change: `${totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 0}% completion rate`,
    },
    {
      label: 'Pending Bookings',
      value: pendingCount.toLocaleString(),
      icon: 'ClockIcon',
      color: 'bg-amber-50 text-amber-600',
      change: `${cancelledCount} cancelled`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Live data from Supabase</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted transition-colors"
        >
          <Icon name="ArrowPathIcon" size={15} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon name={card.icon as 'BanknotesIcon'} size={20} />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{card.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{card.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.change}</p>
          </div>
        ))}
      </div>

      {/* Monthly trend chart */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-foreground">Monthly Trend</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Last 12 months</p>
          </div>
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            <button
              onClick={() => setChartView('bookings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${chartView === 'bookings' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              Bookings
            </button>
            <button
              onClick={() => setChartView('revenue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${chartView === 'revenue' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              Revenue
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.monthlyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              formatter={(value: number) => chartView === 'revenue' ? [`USD ${value.toLocaleString()}`, 'Revenue'] : [value, 'Bookings']}
            />
            <Bar dataKey={chartView} fill="#1a3c2e" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by status */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Bookings by Status</h2>
          <div className="space-y-3">
            {Object.entries(data.bookingsByStatus).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No bookings yet</p>
            ) : (
              Object.entries(data.bookingsByStatus)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => {
                  const pct = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] || '#9ca3af' }} />
                          <span className="text-sm font-medium text-foreground capitalize">{status.toLowerCase()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-foreground">{count}</span>
                          <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[status] || '#9ca3af' }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Peak booking periods */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Peak Booking Days</h2>
          <div className="space-y-3">
            {data.peakPeriods.every((p) => p.count === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8">No booking data yet</p>
            ) : (
              (() => {
                const maxCount = Math.max(...data.peakPeriods.map((p) => p.count), 1);
                return data.peakPeriods.map((p) => {
                  const pct = Math.round((p.count / maxCount) * 100);
                  return (
                    <div key={p.period}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-foreground">{p.period}</span>
                        <span className="text-sm font-bold text-foreground">{p.count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>
      </div>

      {/* Top tours */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-semibold text-foreground mb-4">Top Tours</h2>
        {data.topTours.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No tour data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tour</th>
                  <th className="text-center pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Bookings</th>
                  <th className="text-right pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue</th>
                  <th className="text-right pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.topTours.map((tour, i) => {
                  const share = totalBookings > 0 ? Math.round((tour.bookings / totalBookings) * 100) : 0;
                  return (
                    <tr key={tour.title} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <span className="font-medium text-foreground">{tour.title}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-center font-semibold text-foreground">{tour.bookings}</td>
                      <td className="py-3.5 text-right font-semibold text-foreground">
                        USD {tour.revenue.toLocaleString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <span className="text-xs font-semibold text-muted-foreground">{share}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
