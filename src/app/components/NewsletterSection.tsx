'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
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
              className="px-7 py-3.5 bg-accent text-white font-semibold rounded-full hover:bg-amber-600 transition-colors text-sm shrink-0"
            >
              Subscribe
            </button>
          </form>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          Join 3,200+ travelers already subscribed.
        </p>
      </div>
    </section>
  );
}