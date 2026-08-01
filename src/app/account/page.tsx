'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';

interface ProfileForm {
  full_name: string;
  email: string;
  phone: string;
}

interface NotificationPrefs {
  booking_confirmed: boolean;
  booking_status_change: boolean;
  promotions: boolean;
  newsletter: boolean;
}

interface BookingSummary {
  id: string;
  reference: string;
  totalAmount: number;
  currency: string;
  status: string;
  payment_status: string;
  createdAt: string;
  trip: { title: string } | null;
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: 'UserIcon' },
  { id: 'security', label: 'Security', icon: 'LockClosedIcon' },
  { id: 'invoices', label: 'Invoices', icon: 'DocumentTextIcon' },
  { id: 'notifications', label: 'Notifications', icon: 'BellIcon' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TabId>('profile');

  // Profile state
  const [profile, setProfile] = useState<ProfileForm>({ full_name: '', email: '', phone: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Password state
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [showPw, setShowPw] = useState({ current: false, newPass: false, confirm: false });

  // Invoices state
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Notifications state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    booking_confirmed: true,
    booking_status_change: true,
    promotions: false,
    newsletter: false,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/booking');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    setProfile({
      full_name: user.user_metadata?.full_name || '',
      email: user.email || '',
      phone: user.user_metadata?.phone || '',
    });
    // Load notification prefs from user metadata if stored
    const savedPrefs = user.user_metadata?.notification_prefs;
    if (savedPrefs) {
      setNotifPrefs((prev) => ({ ...prev, ...savedPrefs }));
    }
  }, [user]);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setBookingsLoading(true);
    try {
      const { data } = await supabase
        .from('Booking')
        .select('id, reference, totalAmount, currency, status, payment_status, createdAt, trip:Trip(title)')
        .eq('user_id', user.id)
        .order('createdAt', { ascending: false });
      setBookings((data as any[]) || []);
    } catch {}
    finally { setBookingsLoading(false); }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'invoices') fetchBookings();
  }, [activeTab, fetchBookings]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({
        email: profile.email !== user?.email ? profile.email : undefined,
        data: {
          full_name: profile.full_name,
          phone: profile.phone,
        },
      });
      if (error) throw error;
      // Also update user_profiles table
      await supabase
        .from('user_profiles')
        .upsert({ id: user!.id, email: profile.email, full_name: profile.full_name, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      setProfileMsg({ text: 'Profile updated successfully.', ok: true });
    } catch (err: any) {
      setProfileMsg({ text: err.message || 'Failed to update profile.', ok: false });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      setPwMsg({ text: 'New passwords do not match.', ok: false });
      return;
    }
    if (passwords.newPass.length < 8) {
      setPwMsg({ text: 'Password must be at least 8 characters.', ok: false });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
      if (error) throw error;
      setPwMsg({ text: 'Password changed successfully.', ok: true });
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err: any) {
      setPwMsg({ text: err.message || 'Failed to change password.', ok: false });
    } finally {
      setPwSaving(false);
    }
  };

  const handleNotifSave = async () => {
    setNotifSaving(true);
    setNotifMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { notification_prefs: notifPrefs },
      });
      if (error) throw error;
      setNotifMsg({ text: 'Notification preferences saved.', ok: true });
    } catch (err: any) {
      setNotifMsg({ text: err.message || 'Failed to save preferences.', ok: false });
    } finally {
      setNotifSaving(false);
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-purple-100 text-purple-700',
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Traveler';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <Header />
      <main className="pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-6">

          {/* Page header */}
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shrink-0">
              <span className="text-white font-display font-bold text-xl">{initials}</span>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">{displayName}</h1>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar tabs */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-border p-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                      activeTab === tab.id
                        ? 'bg-primary text-white' :'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon name={tab.icon as 'UserIcon'} size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content panel */}
            <div className="lg:col-span-3">

              {/* ── Profile Tab ── */}
              {activeTab === 'profile' && (
                <div className="bg-white rounded-2xl border border-border p-7">
                  <h2 className="text-lg font-semibold text-foreground mb-1">Account Details</h2>
                  <p className="text-sm text-muted-foreground mb-6">Update your personal information.</p>

                  <form onSubmit={handleProfileSave} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profile.full_name}
                        onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Email Address</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                      />
                      {profile.email !== user.email && (
                        <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                          <Icon name="ExclamationTriangleIcon" size={12} />
                          A confirmation email will be sent to verify the new address.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+254 700 000 000"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                      />
                    </div>

                    {profileMsg && (
                      <div className={`flex items-center gap-2 p-3.5 rounded-xl text-sm ${profileMsg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        <Icon name={profileMsg.ok ? 'CheckCircleIcon' : 'ExclamationCircleIcon'} size={16} />
                        {profileMsg.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-secondary transition-colors disabled:opacity-60"
                    >
                      {profileSaving ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                      ) : (
                        <><Icon name="CheckIcon" size={16} /> Save Changes</>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ── Security Tab ── */}
              {activeTab === 'security' && (
                <div className="bg-white rounded-2xl border border-border p-7">
                  <h2 className="text-lg font-semibold text-foreground mb-1">Change Password</h2>
                  <p className="text-sm text-muted-foreground mb-6">Choose a strong password with at least 8 characters.</p>

                  <form onSubmit={handlePasswordChange} className="space-y-5">
                    {(['current', 'newPass', 'confirm'] as const).map((field) => {
                      const labels = { current: 'Current Password', newPass: 'New Password', confirm: 'Confirm New Password' };
                      return (
                        <div key={field}>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{labels[field]}</label>
                          <div className="relative">
                            <input
                              type={showPw[field] ? 'text' : 'password'}
                              value={passwords[field]}
                              onChange={(e) => setPasswords((p) => ({ ...p, [field]: e.target.value }))}
                              placeholder="••••••••"
                              className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPw((p) => ({ ...p, [field]: !p[field] }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Icon name={showPw[field] ? 'EyeSlashIcon' : 'EyeIcon'} size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {pwMsg && (
                      <div className={`flex items-center gap-2 p-3.5 rounded-xl text-sm ${pwMsg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        <Icon name={pwMsg.ok ? 'CheckCircleIcon' : 'ExclamationCircleIcon'} size={16} />
                        {pwMsg.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={pwSaving || !passwords.newPass || !passwords.confirm}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-secondary transition-colors disabled:opacity-60"
                    >
                      {pwSaving ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…</>
                      ) : (
                        <><Icon name="LockClosedIcon" size={16} /> Update Password</>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ── Invoices Tab ── */}
              {activeTab === 'invoices' && (
                <div className="bg-white rounded-2xl border border-border p-7">
                  <h2 className="text-lg font-semibold text-foreground mb-1">Past Invoices</h2>
                  <p className="text-sm text-muted-foreground mb-6">Download invoices for all your bookings.</p>

                  {bookingsLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-16">
                      <Icon name="DocumentTextIcon" size={36} className="text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No invoices yet. Your booking invoices will appear here.</p>
                      <Link href="/booking" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-accent text-white font-semibold rounded-xl text-sm hover:bg-amber-600 transition-colors">
                        <Icon name="MapIcon" size={14} />
                        Book a Tour
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookings.map((b) => (
                        <div key={b.id} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon name="DocumentTextIcon" size={18} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{b.trip?.title || 'Tour Booking'}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs font-mono text-primary">{b.reference}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(b.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-foreground text-sm">{b.currency} {b.totalAmount?.toLocaleString()}</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] || 'bg-muted text-muted-foreground'}`}>
                              {b.status}
                            </span>
                          </div>
                          <Link
                            href={`/booking/invoice/${b.reference}`}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white font-semibold rounded-lg text-xs hover:bg-secondary transition-colors shrink-0"
                          >
                            <Icon name="ArrowDownTrayIcon" size={13} />
                            Invoice
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Notifications Tab ── */}
              {activeTab === 'notifications' && (
                <div className="bg-white rounded-2xl border border-border p-7">
                  <h2 className="text-lg font-semibold text-foreground mb-1">Notification Preferences</h2>
                  <p className="text-sm text-muted-foreground mb-6">Choose which notifications you'd like to receive.</p>

                  <div className="space-y-4">
                    {([
                      { key: 'booking_confirmed', label: 'Booking Confirmations', desc: 'Get notified when a booking is confirmed.' },
                      { key: 'booking_status_change', label: 'Booking Status Updates', desc: 'Alerts when your booking status changes.' },
                      { key: 'promotions', label: 'Promotions & Deals', desc: 'Special offers and seasonal discounts.' },
                      { key: 'newsletter', label: 'Newsletter', desc: 'Monthly travel inspiration and destination guides.' },
                    ] as const).map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-border">
                        <div>
                          <p className="font-medium text-foreground text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => setNotifPrefs((p) => ({ ...p, [item.key]: !p[item.key] }))}
                          className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${notifPrefs[item.key] ? 'bg-primary' : 'bg-muted'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${notifPrefs[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {notifMsg && (
                    <div className={`flex items-center gap-2 p-3.5 rounded-xl text-sm mt-5 ${notifMsg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      <Icon name={notifMsg.ok ? 'CheckCircleIcon' : 'ExclamationCircleIcon'} size={16} />
                      {notifMsg.text}
                    </div>
                  )}

                  <button
                    onClick={handleNotifSave}
                    disabled={notifSaving}
                    className="flex items-center gap-2 mt-6 px-6 py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-secondary transition-colors disabled:opacity-60"
                  >
                    {notifSaving ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                    ) : (
                      <><Icon name="CheckIcon" size={16} /> Save Preferences</>
                    )}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
