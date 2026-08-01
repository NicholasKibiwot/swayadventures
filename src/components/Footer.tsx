import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

const socialLinks = [
  { name: 'Instagram', icon: 'GlobeAltIcon', href: '#' },
  { name: 'Facebook', icon: 'GlobeAltIcon', href: '#' },
  { name: 'Twitter', icon: 'GlobeAltIcon', href: '#' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          {/* Left: Logo + tagline */}
          <div className="flex flex-col gap-3 max-w-xs">
            <div className="flex items-center gap-2.5">
              <AppLogo size={36} />
              <span className="font-display font-semibold text-lg text-foreground">
                SwayAdventures
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Curated Kenya experiences — from Maasai Mara to the Indian Ocean coast.
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Icon name="MapPinIcon" size={14} className="text-accent shrink-0" />
              <span>Nairobi, Kenya</span>
            </div>
          </div>

          {/* Right: Links */}
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Explore
              </span>
              <Link href="/" className="text-sm text-foreground hover:text-accent transition-colors font-medium">Home</Link>
              <Link href="/tours" className="text-sm text-foreground hover:text-accent transition-colors font-medium">Tours</Link>
              <Link href="/booking" className="text-sm text-foreground hover:text-accent transition-colors font-medium">Book a Trip</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Company
              </span>
              <Link href="/" className="text-sm text-foreground hover:text-accent transition-colors font-medium">About Us</Link>
              <Link href="/" className="text-sm text-foreground hover:text-accent transition-colors font-medium">Contact</Link>
              <Link href="/" className="text-sm text-foreground hover:text-accent transition-colors font-medium">Partners</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Legal
              </span>
              <Link href="/" className="text-sm text-foreground hover:text-accent transition-colors font-medium">Privacy</Link>
              <Link href="/" className="text-sm text-foreground hover:text-accent transition-colors font-medium">Terms</Link>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 SwayAdventures. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="tel:+254700000000" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <Icon name="PhoneIcon" size={14} />
              +254 700 000 000
            </a>
            <a href="mailto:hello@swayadventures.co.ke" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <Icon name="EnvelopeIcon" size={14} />
              hello@swayadventures.co.ke
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}