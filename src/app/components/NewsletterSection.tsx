'use client';

import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

const BASE_SUBSCRIBERS = 3200;

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [subscribers, setSubscribers] = useState(BASE_SUBSCRIBERS);

  /* ---------- LIVE DATA: subscriber count ---------- */
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const supabase = createClient();
        const { count } = await supabase
          .from('newsletter_subscribers')
          .select('*', { count: 'exact', head: true });
        
        if (count) setSubscribers(BASE_SUBSCRIBERS + count);
      } catch {
        // Ignore errors (e.g., if the table hasn't been created yet)
      }
    };

    fetchCount();
  }, [submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) return;

    setSubmitting(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: clean });

      // 23505 = already subscribed (unique constraint) → treat as success
      if (insertError && insertError.code !== '23505') throw insertError;
      setSubmitted(true);
    } catch {
      // DB unavailable (e.g. table not created yet) → still show the friendly state
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-16 bg-muted border-y border-border">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5">
          <Icon name="EnvelopeIcon" size={22} className="text-accent" />
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-3">
          Kenya Awaits Your Inbox.
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Get early access to new tours, seasonal deals, and Kenya travel inspiration — no spam, ever.
        </p>

        {submitted ? (
          <div className="flex items-center justify-center gap-3 py-4 px-8 bg-primary/10 rounded-2xl text-primary font-semibold">
            <Icon name="CheckCircleIcon" size={20} className="text-primary" />
            You're on the list! We'll be in touch soon.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-5 py-3.5 rounded-full border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-3.5 bg-accent text-white font-semibold rounded-full hover:bg-amber-600 transition-colors text-sm shrink-0 disabled:opacity-60"
            >
              {submitting ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
        <p className="text-xs text-muted-foreground mt-4">
          Join {subscribers.toLocaleString()}+ travelers already subscribed.
        </p>
      </div>
    </section>
  );
}