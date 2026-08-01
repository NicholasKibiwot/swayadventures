'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Tours', href: '/tours' },
  { label: 'Booking', href: '/booking' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setMenuOpen(false);
    } catch {}
  };

  const displayName = user?.user_metadata?.full_name
    ? user?.user_metadata?.full_name?.split(' ')?.[0]
    : user?.email?.split('@')?.[0] || '';

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? 'nav-blur border-b border-border shadow-nav py-3'
            : 'nav-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <AppLogo
              size={36}
              className="transition-transform duration-300 group-hover:scale-105"
            />
            <span
              className={`font-display font-semibold text-lg tracking-tight transition-colors duration-300 ${
                scrolled ? 'text-foreground' : 'text-white'
              }`}
            >
              SwayAdventures
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks?.map((link) => (
              <Link
                key={link?.href}
                href={link?.href}
                className={`text-sm font-medium tracking-wide transition-colors duration-200 hover:text-accent ${
                  scrolled ? 'text-foreground' : 'text-white/90 hover:text-white'
                }`}
              >
                {link?.label}
              </Link>
            ))}

            {!loading && user ? (
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 text-sm font-medium ${scrolled ? 'text-foreground' : 'text-white/90'}`}>
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                    <Icon name="UserIcon" size={14} className="text-accent" />
                  </div>
                  <span>{displayName}</span>
                </div>
                <Link
                  href="/my-bookings"
                  className={`text-sm font-medium transition-colors hover:text-accent ${scrolled ? 'text-foreground' : 'text-white/90 hover:text-white'}`}
                >
                  My Bookings
                </Link>
                {(user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin') && (
                  <Link
                    href="/admin/tours"
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                      scrolled
                        ? 'border-primary text-primary hover:bg-primary hover:text-white' :'border-white/40 text-white/80 hover:border-white hover:text-white'
                    }`}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className={`text-sm font-medium transition-colors hover:text-accent ${scrolled ? 'text-muted-foreground' : 'text-white/70 hover:text-white'}`}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/booking"
                className="px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-full hover:bg-amber-600 transition-colors duration-200 shadow-sm"
              >
                Book Now
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Icon
              name="Bars3Icon"
              size={24}
              className={scrolled ? 'text-foreground' : 'text-white'}
            />
          </button>
        </div>
      </nav>
      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="flex flex-col h-full p-8"
            onClick={(e) => e?.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-2.5">
                <AppLogo size={36} />
                <span className="font-display font-semibold text-lg text-foreground">
                  SwayAdventures
                </span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg text-foreground"
                aria-label="Close menu"
              >
                <Icon name="XMarkIcon" size={24} />
              </button>
            </div>

            <nav className="flex flex-col gap-6">
              {navLinks?.map((link) => (
                <Link
                  key={link?.href}
                  href={link?.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-3xl font-display font-medium text-foreground hover:text-accent transition-colors"
                >
                  {link?.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto">
              {!loading && user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Icon name="UserIcon" size={18} className="text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/my-bookings"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-center px-6 py-4 border border-border text-foreground font-semibold rounded-2xl text-lg hover:bg-muted transition-colors"
                  >
                    My Bookings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-center px-6 py-4 border border-border text-foreground font-semibold rounded-2xl text-lg hover:bg-muted transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/booking"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center px-6 py-4 bg-accent text-white font-semibold rounded-2xl text-lg hover:bg-amber-600 transition-colors"
                >
                  Book Now
                </Link>
              )}
              <p className="text-center text-sm text-muted-foreground mt-4">
                Nairobi, Kenya · +254 700 000 000
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}