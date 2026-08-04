'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';
import AppLogo from '@/components/ui/AppLogo';

interface InvoiceData {
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
    id: string;
    title: string;
    durationDays: number;
    tripType: string;
    basePrice: number;
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

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'text-amber-600' },
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-600' },
  COMPLETED: { label: 'Completed', color: 'text-green-600' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600' },
  REFUNDED: { label: 'Refunded', color: 'text-purple-600' },
};

export default function InvoicePage() {
  const { ref } = useParams<{ ref: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [printing, setPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/booking');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !ref) return;
    const fetchInvoice = async () => {
      setLoading(true);
      setError('');
      try {
        const supabase = createClient();
        const { data, error: err } = await supabase
          .from('Booking')
          .select(`
            id, reference, bookingType, guests, totalAmount, currency,
            status, payment_status, notes, createdAt,
            customer:Customer(fullName, email, phone, country),
            trip:Trip(id, title, durationDays, tripType, basePrice),
            payments:Payment(id, amount, status, method, gateway, paidAt, createdAt)
          `)
          .eq('reference', ref)
          .eq('user_id', user.id)
          .single();

        if (err) throw err;
        setInvoice(data as any);
      } catch (e: any) {
        setError(e.message || 'Invoice not found');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [user, ref]);

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <Header />
        <main className="pt-28 pb-20">
          <div className="max-w-3xl mx-auto px-6">
            <div className="bg-white rounded-2xl border border-border p-16 text-center">
              <Icon name="ExclamationCircleIcon" size={40} className="text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Invoice Not Found</h2>
              <p className="text-muted-foreground text-sm mb-6">{error || 'This invoice does not exist or you do not have access to it.'}</p>
              <Link href="/my-bookings" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-secondary transition-colors">
                <Icon name="ArrowLeftIcon" size={16} />
                Back to My Bookings
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const latestPayment = invoice.payments?.[0];
  const statusCfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG['PENDING'];
  const pricePerPerson = invoice.trip?.basePrice || (invoice.guests > 0 ? Math.round(invoice.totalAmount / invoice.guests) : invoice.totalAmount);
  const invoiceDate = new Date(invoice.createdAt);
  const invoiceNumber = `INV-${invoice.reference}`;

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <Header />

      <main className="pt-28 pb-20 print:pt-0 print:pb-0">
        <div className="max-w-3xl mx-auto px-6 print:px-0">

          {/* Action bar — hidden on print */}
          <div className="flex items-center justify-between mb-6 print:hidden">
            <Link href="/my-bookings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="ArrowLeftIcon" size={16} />
              My Bookings
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                disabled={printing}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-secondary transition-colors disabled:opacity-60"
              >
                <Icon name="ArrowDownTrayIcon" size={16} />
                {printing ? 'Preparing…' : 'Download PDF'}
              </button>
            </div>
          </div>

          {/* Invoice document */}
          <div ref={printRef} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden print:rounded-none print:border-0 print:shadow-none">

            {/* Header band */}
            <div className="bg-primary px-8 py-7 print:px-8 print:py-7">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AppLogo size={40} />
                  <div>
                    <p className="text-white font-display font-bold text-lg leading-tight">SwayAdventures</p>
                    <p className="text-white/60 text-xs">Nairobi, Kenya · swayadventures.com</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Invoice</p>
                  <p className="text-white font-display font-bold text-2xl">{invoiceNumber}</p>
                  <p className="text-white/60 text-xs mt-1">
                    {invoiceDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Status ribbon */}
            <div className="bg-primary/5 border-b border-border px-8 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Icon name="HashtagIcon" size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">Booking Reference:</span>
                <span className="font-mono font-bold text-primary text-base">{invoice.reference}</span>
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>

            <div className="px-8 py-8">

              {/* Bill to / From grid */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Bill To</p>
                  <p className="font-semibold text-foreground text-base">{invoice.customer?.fullName || 'Guest'}</p>
                  {invoice.customer?.email && <p className="text-sm text-muted-foreground mt-0.5">{invoice.customer.email}</p>}
                  {invoice.customer?.phone && <p className="text-sm text-muted-foreground">{invoice.customer.phone}</p>}
                  {invoice.customer?.country && <p className="text-sm text-muted-foreground">{invoice.customer.country}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">From</p>
                  <p className="font-semibold text-foreground text-base">SwayAdventures Ltd.</p>
                  <p className="text-sm text-muted-foreground mt-0.5">info@swayadventures.com</p>
                  <p className="text-sm text-muted-foreground">+254 700 000 000</p>
                  <p className="text-sm text-muted-foreground">Nairobi, Kenya</p>
                </div>
              </div>

              {/* Line items table */}
              <div className="rounded-xl border border-border overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</th>
                      <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Guests</th>
                      <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Unit Price</th>
                      <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-foreground">{invoice.trip?.title || invoice.bookingType}</p>
                        {invoice.trip?.durationDays && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Icon name="ClockIcon" size={11} />
                            {invoice.trip.durationDays} days · {invoice.trip.tripType || 'Tour'}
                          </p>
                        )}
                        {invoice.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">Note: {invoice.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-foreground font-medium">{invoice.guests}</td>
                      <td className="px-4 py-4 text-right text-foreground font-medium">
                        {invoice.currency} {pricePerPerson.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-foreground">
                        {invoice.currency} {invoice.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-muted/30">
                      <td colSpan={3} className="px-5 py-4 text-right font-bold text-foreground">Total Amount</td>
                      <td className="px-5 py-4 text-right font-display font-bold text-xl text-primary">
                        {invoice.currency} {invoice.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="bg-muted/30 rounded-xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Payment Details</p>
                  {latestPayment ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Method</span>
                        <span className="font-medium capitalize">{latestPayment.method || latestPayment.gateway}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className={`font-semibold capitalize ${invoice.payment_status === 'completed' ? 'text-green-600' : invoice.payment_status === 'refunded' ? 'text-purple-600' : 'text-amber-600'}`}>
                          {invoice.payment_status === 'completed' ? 'Paid' : invoice.payment_status === 'refunded' ? 'Refunded' : 'Pending'}
                        </span>
                      </div>
                      {latestPayment.paidAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Paid On</span>
                          <span className="font-medium">
                            {new Date(latestPayment.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Payment pending</p>
                  )}
                </div>

                <div className="bg-primary/5 rounded-xl p-5 border border-primary/20">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Booking Summary</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Booking Date</span>
                      <span className="font-medium">
                        {invoiceDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Guest Count</span>
                      <span className="font-medium">{invoice.guests} {invoice.guests === 1 ? 'person' : 'people'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Booking Status</span>
                      <span className={`font-semibold ${statusCfg.color}`}>{statusCfg.label}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer note */}
              <div className="border-t border-border pt-6 text-center">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Thank you for choosing SwayAdventures. For questions about this invoice, contact us at{' '}
                  <span className="text-primary font-medium">info@swayadventures.com</span> or call{' '}
                  <span className="font-medium">+254 700 000 000</span>.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Free cancellation up to 48 hours before departure · All prices include applicable taxes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #__next, #__next * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          header, footer, nav { display: none !important; }
        }
        @media print {
          body { background: white; }
          .print\\:pt-0 { padding-top: 0 !important; }
          .print\\:pb-0 { padding-bottom: 0 !important; }
          .print\\:px-0 { padding-left: 0 !important; padding-right: 0 !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:border-0 { border: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
