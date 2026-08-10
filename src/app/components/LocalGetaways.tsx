'use client';

import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { createClient } from '@/lib/supabase/client';

type Deal = {
  id: string; title: string; location: string;
  kesPrice: number; usdPrice: number;
  slotsTotal: number; slotsLeft: number;
  validTill: string; perks: string[]; image: string;
};

export default function LocalGetaways() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [till, setTill] = useState('5678278');
  const [business, setBusiness] = useState('TembeaNaSway');
  const [openDeal, setOpenDeal] = useState<Deal | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      try {
        const [{ data: trips }, { data: settings }] = await Promise.all([
          supabase
            .from('Trip')
            .select('id, title, summary, basePrice, priceNonResident, groupSizeMax, Destination(name), TripImage(url, alt, sortOrder), inclusions:TripInclusion(label, included)')
            .eq('isActive', true)
            .ilike('tripType', 'day trip'),
          supabase.from('site_settings').select('key, value')
        ]);

        if (settings) {
          const s = Object.fromEntries(settings.map((x: any) => [x.key, x.value]));
          if (s.mpesa_till_number) setTill(s.mpesa_till_number);
          if (s.mpesa_business_name) setBusiness(s.mpesa_business_name);
        }
        if (!trips || trips.length === 0) { setDeals([]); return; }

        const ids = trips.map((t: any) => t.id);
        const { data: booked } = await supabase
          .from('Booking').select('tripId, guests').in('tripId', ids)
          .not('status', 'in', ['CANCELLED', 'REFUNDED']);
        const taken = new Map<string, number>();
        (booked || []).forEach((b: any) => taken.set(b.tripId, (taken.get(b.tripId) || 0) + Number(b.guests || 0)));

        setDeals(trips.map((t: any) => {
          const imgs = (t.TripImage || []).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          const total = Number(t.groupSizeMax) || 10;
          const m = (t.summary || '').match(/Valid till ([^.]+)/i);
          return {
            id: t.id,
            title: t.title,
            location: t.Destination?.name || 'Kenya',
            kesPrice: Number(t.basePrice) || 0,
            usdPrice: Number(t.priceNonResident) || 0,
            slotsTotal: total,
            slotsLeft: Math.max(total - (taken.get(t.id) || 0), 0),
            validTill: m ? m[1].trim() : '',
            perks: (t.inclusions || []).filter((i: any) => i.included).map((i: any) => i.label),
            image: imgs[0]?.url || '/assets/images/no_image.png'
          };
        }));
      } catch {}
    };
    load();

    const ch = supabase.channel('local-getaways-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Trip' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Booking' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (deals.length === 0) return null;

  return (
    <section className="py-20 md:py-24 bg-primary relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 block mb-3">
              🔥 Limited Slots Available · #TembeaNaSway
            </span>
            <h2 className="text-section font-display font-semibold text-white">
              Local Getaways.<br />
              <span className="text-amber-300 italic font-light">Work. Save. Travel. Repeat.</span>
            </h2>
          </div>
          <p className="max-w-sm text-white/70 text-sm leading-relaxed">
            One-day adventures for residents & visitors — pay easily via M‑Pesa Till Number{' '}
            <span className="text-amber-300 font-semibold">{till}</span> ({business}).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deals.map((deal) => (
            <div key={deal.id} className="rounded-3xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <div className="relative h-52">
                <AppImage src={deal.image} alt={deal.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span className="absolute top-4 left-4 text-xs font-semibold px-2.5 py-1 rounded-full bg-accent text-white">
                  🔥 {deal.slotsLeft}/{deal.slotsTotal} slots left
                </span>
                {deal.validTill && (
                  <span className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-stone-800">
                    📅 Valid till {deal.validTill}
                  </span>
                )}
                <div className="absolute bottom-4 left-4 flex items-baseline gap-3 flex-wrap">
                  <span className="text-white font-display text-2xl font-semibold">KES {deal.kesPrice.toLocaleString()}</span>
                  <span className="text-white/70 text-sm">residents · ${deal.usdPrice} non-residents</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-semibold text-white mb-1">{deal.title}</h3>
                <div className="flex items-center gap-1.5 text-white/60 text-sm mb-4">
                  <Icon name="MapPinIcon" size={13} className="text-amber-400" />
                  <span>{deal.location}</span>
                </div>
                <ul className="space-y-1.5 mb-5">
                  {deal.perks.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-white/80">
                      <Icon name="CheckCircleIcon" size={14} className="text-amber-400 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setOpenDeal(deal)}
                  disabled={deal.slotsLeft === 0}
                  className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <Icon name="DevicePhoneMobileIcon" size={16} />
                  {deal.slotsLeft === 0 ? 'Sold Out' : 'Book & Pay via M-Pesa'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-white/50 text-sm mt-8">Don't wait — adventure is calling! 🌍✨</p>
      </div>

      {openDeal && <PayModal deal={openDeal} till={till} business={business} onClose={() => setOpenDeal(null)} />}
    </section>
  );
}

/* ─── Pay via Till Number modal ─────────────────────────────────────────── */
function PayModal({ deal, till, business, onClose }: { deal: Deal; till: string; business: string; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', date: '', guests: 1, rate: 'resident' as 'resident' | 'non-resident', code: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [err, setErr] = useState('');

  const currency = form.rate === 'resident' ? 'KES' : 'USD';
  const unit = form.rate === 'resident' ? deal.kesPrice : deal.usdPrice;
  const total = unit * form.guests;
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const supabase = createClient();
      const ref = `SWY-${Math.floor(Math.random() * 90000) + 10000}`;

      const { data: customer, error: cErr } = await supabase
        .from('Customer')
        .insert({ id: crypto.randomUUID(), fullName: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), country: 'KE' })
        .select().single();
      if (cErr) throw new Error(cErr.message);

      const { data: booking, error: bErr } = await supabase
        .from('Booking')
        .insert({
          id: crypto.randomUUID(),
          reference: ref,
          customerId: customer.id,
          tripId: deal.id,
          tripDateId: null,
          bookingType: 'local-deal',
          guests: form.guests,
          totalAmount: total,
          currency,
          status: 'PENDING',
          payment_status: 'pending',
          notes: `${form.rate === 'resident' ? 'Resident' : 'Non-resident'} rate · M-Pesa Till ${till} (${business}) · Conf: ${form.code || 'n/a'} · Date: ${form.date}`
        })
        .select().single();
      if (bErr) throw new Error(bErr.message);

      await supabase.from('Payment').insert({
        id: crypto.randomUUID(),
        bookingId: booking.id,
        gateway: 'mpesa',
        method: 'mpesa_till',
        amount: total,
        currency,
        status: 'pending'
      });

      setDone(ref);
    } catch (e: any) {
      setErr(e?.message || 'Failed to save booking.');
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full p-7 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Icon name="CheckIcon" size={28} className="text-green-600" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-foreground mb-2">You're booked! 🎉</h3>
            <p className="text-sm text-muted-foreground mb-1">Reference: <span className="font-mono font-semibold text-primary">{done}</span></p>
            <p className="text-sm text-muted-foreground mb-6">We'll verify your M‑Pesa payment to Till {till} and confirm shortly. Adventure is calling!</p>
            <button onClick={onClose} className="px-6 py-3 bg-primary text-white font-semibold rounded-xl text-sm">Close</button>
          </div>
        ) : (
          <>
            <h3 className="font-display text-2xl font-semibold text-foreground mb-1">{deal.title}</h3>
            <p className="text-xs text-muted-foreground mb-5">{deal.slotsLeft} slots left · Valid till {deal.validTill}</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {(['resident', 'non-resident'] as const).map((r) => (
                <button key={r} type="button" onClick={() => set('rate', r)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-colors capitalize ${form.rate === r ? 'border-accent bg-accent/5 text-foreground' : 'border-border text-muted-foreground'}`}>
                  {r === 'resident' ? `Resident · KES ${deal.kesPrice.toLocaleString()}` : `Non-resident · $${deal.usdPrice}`}
                </button>
              ))}
            </div>

            <div className="space-y-3 mb-4">
              <input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Full name"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} required type="tel" placeholder="07XX XXX XXX"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
                <input value={form.email} onChange={(e) => set('email', e.target.value)} required type="email" placeholder="you@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={form.date} onChange={(e) => set('date', e.target.value)} required type="date"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
                <input value={form.guests} onChange={(e) => set('guests', Math.max(1, Math.min(deal.slotsLeft, Number(e.target.value) || 1)))} type="number" min={1} max={deal.slotsLeft}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
              </div>
            </div>

                     {/* Till payment instructions */}
            <div className="rounded-2xl bg-green-50 border border-green-200 p-4 mb-4">
              <p className="text-xs font-semibold text-green-900 mb-2 flex items-center gap-1.5">
                <Icon name="DevicePhoneMobileIcon" size={14} className="text-green-600" />
                Pay via M-Pesa Buy Goods
              </p>
              <p className="text-sm text-green-800 leading-relaxed">
                Send <strong>{currency} {total.toLocaleString()}</strong> to Till Number{' '}
                <strong className="text-base">{till}</strong> ({business}), then enter the confirmation code below.
              </p>
            </div>

            <input
              value={form.code}
              onChange={(e) => set('code', e.target.value)}
              placeholder="M-Pesa confirmation code (e.g. SHK7X8Y9Z1)"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 mb-4" />

            {err && <p className="text-xs text-red-600 mb-3">{err}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted">
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 py-3 bg-accent text-white font-semibold rounded-xl text-sm hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {busy && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {busy ? 'Saving…' : `Confirm Booking · ${currency} ${total.toLocaleString()}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}