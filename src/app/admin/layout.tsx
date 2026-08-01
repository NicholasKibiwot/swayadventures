'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';


const navItems = [
  { label: 'Tours', href: '/admin/tours', icon: 'MapIcon' },
  { label: 'Add Tour', href: '/admin/tours/new', icon: 'PlusCircleIcon' },
  { label: 'Bookings', href: '/admin/bookings', icon: 'CalendarIcon' },
  { label: 'Analytics', href: '/admin/analytics', icon: 'ChartBarIcon' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/admin/login');
      return;
    }
    // Check admin role from user metadata
    const role =
      user?.user_metadata?.role ||
      user?.app_metadata?.role ||
      '';
    if (role !== 'admin') {
      setIsAdmin(false);
    } else {
      setIsAdmin(true);
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/admin/login');
  };

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Icon name="ShieldExclamationIcon" size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground text-sm mb-6">
            You do not have admin privileges to access this panel.
          </p>
          <Link href="/" className="px-5 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:flex`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <AppLogo size={32} />
          <div>
            <p className="text-white font-display font-semibold text-sm leading-tight">SwayAdventures</p>
            <p className="text-white/50 text-xs">Admin Panel</p>
          </div>
          <button
            className="ml-auto lg:hidden text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin/tours' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-white/15 text-white' :'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10">
            <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center shrink-0">
              <Icon name="UserIcon" size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              </p>
              <p className="text-white/40 text-xs truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="text-white/40 hover:text-white transition-colors shrink-0"
            >
              <Icon name="ArrowRightOnRectangleIcon" size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-border px-6 py-4 flex items-center gap-4">
          <button
            className="lg:hidden p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon name="Bars3Icon" size={20} />
          </button>
          <h1 className="text-base font-semibold text-foreground">
            {navItems.find((n) => pathname === n.href || pathname?.startsWith(n.href + '/'))?.label || 'Admin'}
          </h1>
          <Link
            href="/"
            className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="ArrowTopRightOnSquareIcon" size={14} />
            View Site
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
