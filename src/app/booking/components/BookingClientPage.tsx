'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface BookingFormData {
  tourId: string | null;
  tourName: string;
  tourPrice: number;
  tourImage: string;
  tourLocation: string;
  checkIn: string;
  checkOut: string;
  groupSize: number;
  specialRequests: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  paymentMethod: 'mpesa' | 'card' | 'paypal' | 'flutterwave' | '';
  mpesaPhone: string;
  cardNumber: string;
  cardExpiry: string;
  cardCVC: string;
  cardName: string;
}

type TourOption = {
  id: string;
  title: string;
  price: number;
  duration: string;
  category: string;
  image: string;
  location: string;
};

/* Fallback until DB tours load — ids match the seeded Trip rows */
const FALLBACK_TOUR_OPTIONS: TourOption[] = [
  { id: 'trip-maasai-mara', title: 'Maasai Mara Great Migration', price: 1200, duration: '7 days', category: 'safari', image: '/assets/images/tour-maasai-mara-migration.png', location: 'Maasai Mara, Kenya' },
  { id: 'trip-diani', title: 'Diani Beach Getaway', price: 650, duration: '4 days', category: 'beach', image: '/assets/images/tour-diani-beach.jpg', location: 'Diani, South Coast' },
  { id: 'trip-mount-kenya', title: 'Mount Kenya Trek', price: 850, duration: '5 days', category: 'retreat', image: '/assets/images/tour-mount-kenya-trek.jpg', location: 'Mount Kenya, Central' },
  { id: 'trip-amboseli', title: 'Amboseli Elephant Safari', price: 750, duration: '3 days', category: 'safari', image: '/assets/images/tour-amboseli-elephants.jpg', location: 'Amboseli, Kajiado' },
  { id: 'trip-lamu', title: 'Lamu Island Retreat', price: 900, duration: '6 days', category: 'beach', image: '/assets/images/tour-lamu-island.png', location: 'Lamu Archipelago' },
  { id: 'trip-tsavo', title: 'Tsavo Red Elephant Safari', price: 700, duration: '4 days', category: 'safari', image: '/assets/images/tour-tsavo-elephants.jpg', location: 'Tsavo East & West' },
  { id: 'trip-naivasha', title: 'Naivasha Lake Retreat', price: 450, duration: '3 days', category: 'retreat', image: '/assets/images/tours-naivasha-lake.jpg', location: 'Lake Naivasha, Rift Valley' },
  { id: 'trip-samburu', title: 'Samburu Rare Species Safari', price: 980, duration: '5 days', category: 'safari', image: '/assets/images/tours-samburu-giraffe.jpg', location: 'Samburu, Northern Kenya' }
];

const steps = [
  { id: 1, label: 'Select Tour', icon: 'MapIcon' },
  { id: 2, label: 'Travel Details', icon: 'CalendarIcon' },
  { id: 3, label: 'Personal Info', icon: 'UserIcon' },
  { id: 4, label: 'Payment', icon: 'CreditCardIcon' }
];

const paymentMethods = [
  { id: 'mpesa' as const, label: 'M-Pesa', description: 'STK Push to your phone', icon: 'DevicePhoneMobileIcon', color: 'text-green-600', bgColor: 'bg-green-50' },
  { id: 'card' as const, label: 'Credit / Debit Card', description: 'Visa, Mastercard, Amex', icon: 'CreditCardIcon', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'paypal' as const, label: 'PayPal', description: 'Secure PayPal checkout', icon: 'GlobeAltIcon', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  { id: 'flutterwave' as const, label: 'Flutterwave', description: 'Pan-African payments', icon: 'BoltIcon', color: 'text-orange-600', bgColor: 'bg-orange-50' }
];

function generateRef() {
  return `SWY-${Math.floor(Math.random() * 90000) + 10000}`;
}

export default function BookingClientPage() {
  const { user } = useAuth();
  const [tourOptions, setTourOptions] = useState<TourOption[]>(FALLBACK_TOUR_OPTIONS);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState<BookingFormData>({
    tourId: null,
    tourName: '',
    tourPrice: 0,
    tourImage: '',
    tourLocation: '',
    checkIn: '',
    checkOut: '',
    groupSize: 2,
    specialRequests: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    paymentMethod: '',
    mpesaPhone: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    cardName: ''
  });

  /* ---------- LIVE DATA: fetch tour options from Trip table (admin-edited) ---------- */
  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('Trip')
          .select('id, title, basePrice, durationDays, tripType, Destination(name, region), TripImage(url, alt, sortOrder)')
          .eq('isActive', true)
          .order('createdAt', { ascending: true });

        if (error || !data || data.length === 0) return; // keep fallback

        setTourOptions(data.map((t: any) => {
          const imgs = (t.TripImage || []).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          const rawType = Array.isArray(t.tripType) ? (t.tripType[0] || 'safari') : (t.tripType || 'safari');
          return {
            id: t.id,
            title: t.title,
            price: Number(t.basePrice) || 0,
            duration: `${Number(t.durationDays) || 0} days`,
            category: String(rawType).toLowerCase(),
            image: imgs[0]?.url || '/assets/images/no_image.png',
            location: t.Destination ? `${t.Destination.name}, ${t.Destination.region}` : 'Kenya'
          };
        }));
      } catch {
        /* keep fallback */
      }
    };

    load();

    const channel = supabase
      .channel('booking-options-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Trip' }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ---------- Pre-select tour from ?trip= URL parameter ---------- */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tripParam = new URLSearchParams(window.location.search).get('trip');
    if (!tripParam) return;
    const t = tourOptions.find((x) => x.id === tripParam);
    if (t && form.tourId !== t.id) {
      setForm((prev) => ({
        ...prev,
        tourId: t.id,
        tourName: t.title,
        tourPrice: t.price,
        tourImage: t.image,
        tourLocation: t.location
      }));
    }
  }, [tourOptions]);

  const updateForm = (key: keyof BookingFormData, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectTour = (tour: TourOption) => {
    setForm((prev) => ({
      ...prev,
      tourId: tour.id,
      tourName: tour.title,
      tourPrice: tour.price,
      tourImage: tour.image,
      tourLocation: tour.location
    }));
  };

  const totalPrice = form.tourPrice * form.groupSize;

  const canProceed = (): boolean => {
    if (currentStep === 1) return !!form.tourId;
    if (currentStep === 2) return !!form.checkIn && !!form.checkOut && form.groupSize >= 1;
    if (currentStep === 3) return !!form.firstName && !!form.lastName && !!form.email && !!form.phone;
    if (currentStep === 4) return !!form.paymentMethod;
    return false;
  };

  const handleContinue = () => {
    if (!canProceed()) return;
    if (currentStep === 2 && !user) {
      setShowAuthModal(true);
      return;
    }
    setCurrentStep((s) => s + 1);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (user?.user_metadata) {
      const fullName: string = user.user_metadata?.full_name || '';
      const parts = fullName.trim().split(' ');
      if (parts.length >= 2 && !form.firstName) {
        updateForm('firstName', parts[0]);
        updateForm('lastName', parts.slice(1).join(' '));
      }
      if (user.email && !form.email) {
        updateForm('email', user.email);
      }
    }
    setCurrentStep(3);
  };

  const handleConfirmBooking = async () => {
    if (!canProceed() || !user) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const supabase = createClient();
      const ref = generateRef();

      // 1. Upsert customer record
      let customerId: string;
      const { data: existing } = await supabase
        .from('Customer')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (existing) {
        customerId = existing.id;
        await supabase
          .from('Customer')
          .update({
            fullName: `${form.firstName} ${form.lastName}`.trim(),
            phone: form.phone,
            email: form.email,
            country: form.nationality || 'KE',
            user_id: user.id
          })
          .eq('id', existing.id);
      } else {
        const { data: newCustomer, error: newCustomerError } = await supabase
          .from('Customer')
          .insert({
            id: user.id,
            fullName: `${form.firstName} ${form.lastName}`.trim(),
            phone: form.phone,
            email: form.email,
            country: form.nationality || 'KE',
            user_id: user.id
          })
          .select()
          .single();
        if (newCustomerError) throw new Error(newCustomerError.message);
        customerId = newCustomer.id;
      }

      // 2. Insert booking with the REAL trip id (syncs with admin, my-bookings & invoice)
      const { data: booking, error: bookingError } = await supabase
        .from('Booking')
        .insert({
          id: crypto.randomUUID(),
          reference: ref,
          customerId,
          tripId: String(form.tourId),
          tripDateId: null,
          bookingType: 'direct',
          guests: form.groupSize,
          totalAmount: totalPrice,
          currency: 'USD',
          status: 'PENDING',
          payment_status: 'pending',
          notes: form.specialRequests || null,
          user_id: user.id
        })
        .select()
        .single();
      if (bookingError) throw new Error(bookingError.message);

      // 3. Payment record (appears in admin + invoice as pending)
      try {
        await supabase.from('Payment').insert({
          id: crypto.randomUUID(),
          bookingId: booking.id,
          gateway: form.paymentMethod,
          method: form.paymentMethod,
          amount: totalPrice,
          currency: 'USD',
          status: 'pending'
        });
      } catch {
        /* payment record is optional */
      }

      setBookingRef(ref);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to save booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return <BookingSuccess form={form} totalPrice={totalPrice} bookingRef={bookingRef} />;
  }

  return (
    <div className="bg-background">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        message="Create a free account to save your booking details and manage your trips."
      />

      <div className="bg-primary pt-28 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 block mb-3">
            Secure Booking
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-white mb-2">
            Book Your Adventure.
          </h1>
          <p className="text-white/70 text-lg">
            Complete your booking in 4 simple steps.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 pb-20">
        <StepIndicator currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
          <div className="lg:col-span-8">
            <div className="bg-card rounded-3xl border border-border p-7 md:p-10 shadow-card">
              {currentStep === 1 && <Step1SelectTour form={form} selectTour={selectTour} tourOptions={tourOptions} />}
              {currentStep === 2 && <Step2TravelDetails form={form} updateForm={updateForm} />}
              {currentStep === 3 && <Step3PersonalInfo form={form} updateForm={updateForm} />}
              {currentStep === 4 && <Step4Payment form={form} updateForm={updateForm} totalPrice={totalPrice} />}

              {submitError && (
                <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200">
                  <Icon name="ExclamationCircleIcon" size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 leading-snug">{submitError}</p>
                </div>
              )}

              <div className="flex items-center justify-between mt-10 pt-8 border-t border-border">
                <button
                  onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors ${
                    currentStep === 1 ? 'invisible' : ''
                  }`}>
                  <Icon name="ArrowLeftIcon" size={16} />
                  Back
                </button>
                {currentStep < 4 ? (
                  <button
                    onClick={handleContinue}
                    disabled={!canProceed()}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {currentStep === 2 && !user ? (
                      <>
                        Continue
                        <Icon name="LockClosedIcon" size={16} />
                      </>
                    ) : (
                      <>
                        Continue
                        <Icon name="ArrowRightIcon" size={16} />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleConfirmBooking}
                    disabled={!canProceed() || submitting}
                    className="flex items-center gap-2 px-8 py-3 bg-accent text-white font-semibold rounded-xl text-sm hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Confirm Booking
                        <Icon name="CheckIcon" size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <BookingSummary form={form} totalPrice={totalPrice} currentStep={currentStep} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, i) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-2">
            <div
              className={`step-indicator w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                currentStep > step.id
                  ? 'completed'
                  : currentStep === step.id
                  ? 'active'
                  : 'border-border text-muted-foreground bg-white'
              }`}>
              {currentStep > step.id ? <Icon name="CheckIcon" size={16} /> : <span>{step.id}</span>}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block whitespace-nowrap ${
                currentStep === step.id ? 'text-primary' : 'text-muted-foreground'
              }`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`step-connector flex-1 mx-2 mb-5 ${currentStep > step.id ? 'completed' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Step1SelectTour({
  form,
  selectTour,
  tourOptions
}: {
  form: BookingFormData;
  selectTour: (t: TourOption) => void;
  tourOptions: TourOption[];
}) {
  const catColor: Record<string, string> = {
    safari: 'badge-safari',
    beach: 'badge-beach',
    retreat: 'badge-retreat'
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-foreground mb-2">Choose Your Tour</h2>
      <p className="text-muted-foreground text-sm mb-7">Select the Kenya experience you'd like to book.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tourOptions.map((tour) => (
          <button
            key={tour.id}
            onClick={() => selectTour(tour)}
            className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 hover:border-accent/50 ${
              form.tourId === tour.id ? 'border-accent bg-accent/5' : 'border-border hover:bg-muted/40'
            }`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catColor[tour.category] || 'badge-safari'}`}>
                {tour.category}
              </span>
              {form.tourId === tour.id && (
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <Icon name="CheckIcon" size={11} className="text-white" />
                </div>
              )}
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-2 leading-snug">{tour.title}</h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon name="ClockIcon" size={11} />
                {tour.duration}
              </span>
              <span className="font-display font-semibold text-primary text-base">
                ${tour.price}
                <span className="text-xs font-normal text-muted-foreground">/person</span>
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step2TravelDetails({
  form,
  updateForm
}: {
  form: BookingFormData;
  updateForm: (k: keyof BookingFormData, v: string | number | null) => void;
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-foreground mb-2">Travel Details</h2>
      <p className="text-muted-foreground text-sm mb-7">Tell us when you're traveling and how many people are joining.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Check-In Date</label>
          <input
            type="date"
            value={form.checkIn}
            onChange={(e) => updateForm('checkIn', e.target.value)}
            min={todayStr}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Check-Out Date</label>
          <input
            type="date"
            value={form.checkOut}
            onChange={(e) => updateForm('checkOut', e.target.value)}
            min={form.checkIn || todayStr}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Group Size</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateForm('groupSize', Math.max(1, form.groupSize - 1))}
              className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0">
              <Icon name="MinusIcon" size={16} />
            </button>
            <span className="w-12 text-center font-display text-xl font-semibold text-foreground">{form.groupSize}</span>
            <button
              type="button"
              onClick={() => updateForm('groupSize', Math.min(20, form.groupSize + 1))}
              className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0">
              <Icon name="PlusIcon" size={16} />
            </button>
            <span className="text-sm text-muted-foreground ml-1">{form.groupSize === 1 ? 'person' : 'people'}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Price Estimate</label>
          <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold text-primary">${form.tourPrice * form.groupSize}</span>
            <span className="text-sm text-muted-foreground">({form.groupSize} × ${form.tourPrice})</span>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Special Requests (optional)</label>
          <textarea
            value={form.specialRequests}
            onChange={(e) => updateForm('specialRequests', e.target.value)}
            rows={3}
            placeholder="Dietary requirements, accessibility needs, special occasions, preferred room type..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm resize-none" />
        </div>
      </div>
    </div>
  );
}

function Step3PersonalInfo({
  form,
  updateForm
}: {
  form: BookingFormData;
  updateForm: (k: keyof BookingFormData, v: string | number | null) => void;
}) {
  const fields: Array<{ key: keyof BookingFormData; label: string; type: string; placeholder: string; colSpan?: number }> = [
    { key: 'firstName', label: 'First Name', type: 'text', placeholder: 'James' },
    { key: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Mwangi' },
    { key: 'email', label: 'Email Address', type: 'email', placeholder: 'james@email.com', colSpan: 2 },
    { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+254 700 000 000' },
    { key: 'nationality', label: 'Nationality', type: 'text', placeholder: 'Kenyan' }
  ];

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-foreground mb-2">Personal Information</h2>
      <p className="text-muted-foreground text-sm mb-7">We need a few details to confirm your booking and send your itinerary.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => (
          <div key={String(field.key)} className={field.colSpan === 2 ? 'md:col-span-2' : ''}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{field.label}</label>
            <input
              type={field.type}
              value={String(form[field.key] ?? '')}
              onChange={(e) => updateForm(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm" />
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex gap-3">
        <Icon name="ShieldCheckIcon" size={18} className="text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-foreground/80 leading-relaxed">
          Your personal information is encrypted and never shared with third parties. We comply with Kenya's Data Protection Act 2019.
        </p>
      </div>
    </div>
  );
}

function Step4Payment({
  form,
  updateForm,
  totalPrice
}: {
  form: BookingFormData;
  updateForm: (k: keyof BookingFormData, v: string | number | null) => void;
  totalPrice: number;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-foreground mb-2">Payment</h2>
      <p className="text-muted-foreground text-sm mb-7">
        Total due: <span className="font-display font-semibold text-primary text-lg">${totalPrice}</span>. Choose your preferred payment method.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => updateForm('paymentMethod', method.id)}
            className={`payment-option text-left p-5 rounded-2xl flex items-start gap-4 ${
              form.paymentMethod === method.id ? 'selected' : ''
            }`}>
            <div className={`w-10 h-10 rounded-xl ${method.bgColor} flex items-center justify-center shrink-0`}>
              <Icon name={method.icon as 'CreditCardIcon'} size={20} className={method.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm text-foreground">{method.label}</p>
                {form.paymentMethod === method.id && (
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <Icon name="CheckIcon" size={11} className="text-white" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
            </div>
          </button>
        ))}
      </div>

      {form.paymentMethod === 'mpesa' && (
        <div className="p-6 rounded-2xl bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="DevicePhoneMobileIcon" size={18} className="text-green-600" />
            <h3 className="font-semibold text-green-900 text-sm">M-Pesa STK Push</h3>
          </div>
          <p className="text-xs text-green-700 mb-4 leading-relaxed">
            Enter your Safaricom number. You'll receive a push notification to authorize payment of{' '}
            <strong>KES {(totalPrice * 130).toLocaleString()}</strong> (~${totalPrice}).
          </p>
          <label className="block text-xs font-semibold uppercase tracking-wider text-green-700 mb-2">M-Pesa Phone Number</label>
          <input
            type="tel"
            value={form.mpesaPhone}
            onChange={(e) => updateForm('mpesaPhone', e.target.value)}
            placeholder="0712 345 678"
            className="w-full px-4 py-3 rounded-xl border border-green-300 bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-400/40 text-sm" />
          <p className="text-xs text-green-600 mt-3 flex items-center gap-1.5">
            <Icon name="ShieldCheckIcon" size={12} />
            Powered by Safaricom M-Pesa · Instant confirmation
          </p>
        </div>
      )}

      {form.paymentMethod === 'card' && (
        <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2 mb-5">
            <Icon name="CreditCardIcon" size={18} className="text-blue-600" />
            <h3 className="font-semibold text-blue-900 text-sm">Card Details</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">Cardholder Name</label>
              <input
                type="text"
                value={form.cardName}
                onChange={(e) => updateForm('cardName', e.target.value)}
                placeholder="James Mwangi"
                className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/40 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">Card Number</label>
              <input
                type="text"
                value={form.cardNumber}
                onChange={(e) => updateForm('cardNumber', e.target.value)}
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/40 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">Expiry</label>
                <input
                  type="text"
                  value={form.cardExpiry}
                  onChange={(e) => updateForm('cardExpiry', e.target.value)}
                  placeholder="MM / YY"
                  maxLength={7}
                  className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/40 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">CVC</label>
                <input
                  type="text"
                  value={form.cardCVC}
                  onChange={(e) => updateForm('cardCVC', e.target.value)}
                  placeholder="123"
                  maxLength={4}
                  className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/40 text-sm" />
              </div>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-4 flex items-center gap-1.5">
            <Icon name="LockClosedIcon" size={12} />
            256-bit SSL encrypted · Processed securely
          </p>
        </div>
      )}

      {form.paymentMethod === 'paypal' && (
        <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-200 text-center">
          <Icon name="GlobeAltIcon" size={36} className="text-indigo-500 mx-auto mb-3" />
          <h3 className="font-semibold text-indigo-900 mb-2">Pay with PayPal</h3>
          <p className="text-sm text-indigo-700 leading-relaxed">
            You'll be redirected to PayPal to complete your secure payment of <strong>${totalPrice}</strong>. Your booking will be confirmed immediately after.
          </p>
        </div>
      )}

      {form.paymentMethod === 'flutterwave' && (
        <div className="p-6 rounded-2xl bg-orange-50 border border-orange-200 text-center">
          <Icon name="BoltIcon" size={36} className="text-orange-500 mx-auto mb-3" />
          <h3 className="font-semibold text-orange-900 mb-2">Pay with Flutterwave</h3>
          <p className="text-sm text-orange-700 leading-relaxed">
            Accept payments across Africa — mobile money, bank cards, and bank transfers. You'll be redirected to complete payment of <strong>${totalPrice}</strong>.
          </p>
        </div>
      )}
    </div>
  );
}

function BookingSummary({
  form,
  totalPrice,
  currentStep
}: {
  form: BookingFormData;
  totalPrice: number;
  currentStep: number;
}) {
  return (
    <div className="sticky top-28 space-y-4">
      <div className="bg-card rounded-3xl border border-border p-6 shadow-card">
        <h3 className="font-semibold text-foreground mb-5 text-base flex items-center gap-2">
          <Icon name="ClipboardDocumentListIcon" size={18} className="text-accent" />
          Booking Summary
        </h3>

        {form.tourId ? (
          <>
            <div className="relative h-36 rounded-2xl overflow-hidden mb-5">
              <AppImage
                src={form.tourImage || '/assets/images/hero-savanna-sunrise.png'}
                alt={form.tourName || 'Kenyan safari landscape'}
                fill
                sizes="400px"
                className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="text-white text-xs font-semibold bg-accent px-2 py-0.5 rounded-full">Selected Tour</span>
              </div>
            </div>

            <h4 className="font-display font-semibold text-foreground mb-1 leading-snug">{form.tourName}</h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-5">
              <Icon name="MapPinIcon" size={11} className="text-accent" />
              <span>{form.tourLocation || 'Kenya'}</span>
            </div>

            <div className="space-y-3 text-sm border-t border-border pt-5">
              {form.checkIn && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-In</span>
                  <span className="font-medium text-foreground">{form.checkIn}</span>
                </div>
              )}
              {form.checkOut && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-Out</span>
                  <span className="font-medium text-foreground">{form.checkOut}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Travelers</span>
                <span className="font-medium text-foreground">{form.groupSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price/person</span>
                <span className="font-medium text-foreground">${form.tourPrice}</span>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-display text-2xl font-semibold text-primary">${totalPrice}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                KES {(totalPrice * 130).toLocaleString()} · All taxes included
              </p>
            </div>

            {form.paymentMethod && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-muted">
                <Icon name="CreditCardIcon" size={14} className="text-accent" />
                <span className="text-xs font-medium text-foreground capitalize">
                  {form.paymentMethod === 'mpesa'
                    ? 'M-Pesa STK Push'
                    : form.paymentMethod === 'card'
                    ? 'Credit/Debit Card'
                    : form.paymentMethod === 'paypal'
                    ? 'PayPal'
                    : 'Flutterwave'}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Icon name="MapIcon" size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Select a tour to see your booking summary here.</p>
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Booking Guarantee</p>
        <div className="space-y-3">
          {[
            { icon: 'ShieldCheckIcon', text: 'Free cancellation up to 48 hours before' },
            { icon: 'LockClosedIcon', text: 'Secure payment processing' },
            { icon: 'PhoneIcon', text: '24/7 support from Nairobi team' }
          ].map((item) => (
            <div key={item.text} className="flex items-start gap-2.5">
              <Icon name={item.icon as 'ShieldCheckIcon'} size={14} className="text-primary shrink-0 mt-0.5" />
              <span className="text-xs text-muted-foreground leading-snug">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BookingSuccess({
  form,
  totalPrice,
  bookingRef
}: {
  form: BookingFormData;
  totalPrice: number;
  bookingRef: string;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center pt-24 pb-20 px-6">
      <div className="max-w-lg w-full text-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <Icon name="CheckIcon" size={32} className="text-white" />
          </div>
        </div>

        <h1 className="font-display text-4xl font-semibold text-foreground mb-3">Booking Confirmed!</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Your Kenya adventure is booked. We've sent a confirmation email to <strong className="text-foreground">{form.email}</strong>.
        </p>

        <div className="bg-card rounded-3xl border border-border p-7 text-left mb-8 shadow-card">
          <div className="flex items-center justify-between mb-5 pb-5 border-b border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Booking Reference</p>
              <p className="font-display text-2xl font-semibold text-primary">{bookingRef}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Icon name="TicketIcon" size={22} className="text-accent" />
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tour</span>
              <span className="font-medium text-foreground text-right max-w-[200px]">{form.tourName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Traveler</span>
              <span className="font-medium text-foreground">
                {form.firstName} {form.lastName}
              </span>
            </div>
            {form.checkIn && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dates</span>
                <span className="font-medium text-foreground">
                  {form.checkIn} → {form.checkOut}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Group Size</span>
              <span className="font-medium text-foreground">
                {form.groupSize} {form.groupSize === 1 ? 'person' : 'people'}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-border">
              <span className="font-semibold text-foreground">Total Paid</span>
              <span className="font-display text-xl font-semibold text-primary">${totalPrice}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/booking/invoice/${bookingRef}`}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-accent text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors">
            <Icon name="DocumentTextIcon" size={16} />
            View Invoice
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-secondary transition-colors">
            <Icon name="HomeIcon" size={16} />
            Back to Home
          </Link>
          <Link
            href="/tours"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-colors">
            Browse More Tours
          </Link>
        </div>
      </div>
    </div>
  );
}