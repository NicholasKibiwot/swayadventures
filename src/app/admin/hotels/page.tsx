'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface PartnerHotel {
  id: string;
  name: string;
  location: string;
  description: string;
  stars: number;
  price_from: number;
  image_url: string;
  image_alt: string;
  is_active: boolean;
  created_at: string;
}

const emptyForm = {
  name: '',
  location: '',
  description: '',
  stars: 5,
  price_from: 0,
  image_url: '',
  image_alt: '',
  is_active: true,
};

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<PartnerHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState<PartnerHotel | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('partner_hotels')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setHotels(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const openAdd = () => {
    setEditingHotel(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (hotel: PartnerHotel) => {
    setEditingHotel(hotel);
    setForm({
      name: hotel.name,
      location: hotel.location,
      description: hotel.description,
      stars: hotel.stars,
      price_from: hotel.price_from,
      image_url: hotel.image_url,
      image_alt: hotel.image_alt,
      is_active: hotel.is_active,
    });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingHotel(null);
    setForm(emptyForm);
    setFormError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.location.trim()) {
      setFormError('Hotel name and location are required.');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      stars: Number(form.stars),
      price_from: Number(form.price_from),
      image_url: form.image_url.trim(),
      image_alt: form.image_alt.trim(),
      is_active: form.is_active,
    };

    if (editingHotel) {
      const { error: err } = await supabase
        .from('partner_hotels')
        .update(payload)
        .eq('id', editingHotel.id);
      if (err) {
        setFormError(err.message);
      } else {
        await fetchHotels();
        closeForm();
      }
    } else {
      const { error: err } = await supabase.from('partner_hotels').insert(payload);
      if (err) {
        setFormError(err.message);
      } else {
        await fetchHotels();
        closeForm();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const supabase = createClient();
    const { error: err } = await supabase.from('partner_hotels').delete().eq('id', id);
    if (err) {
      setError(err.message);
    } else {
      setHotels((prev) => prev.filter((h) => h.id !== id));
    }
    setDeletingId(null);
    setConfirmDelete(null);
  };

  const handleToggleActive = async (hotel: PartnerHotel) => {
    const supabase = createClient();
    const { error: err } = await supabase
      .from('partner_hotels')
      .update({ is_active: !hotel.is_active })
      .eq('id', hotel.id);
    if (!err) {
      setHotels((prev) =>
        prev.map((h) => (h.id === hotel.id ? { ...h, is_active: !h.is_active } : h))
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Partner Hotels</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage hotels displayed on the homepage
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Icon name="PlusIcon" size={16} />
          Add Hotel
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2">
          <Icon name="ExclamationCircleIcon" size={16} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : hotels.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Icon name="BuildingOffice2Icon" size={24} className="text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium mb-1">No partner hotels yet</p>
          <p className="text-sm text-muted-foreground mb-4">Add your first hotel to display it on the homepage.</p>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Add Hotel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {hotels.map((hotel) => (
            <div
              key={hotel.id}
              className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="relative h-44 bg-muted">
                {hotel.image_url ? (
                  <AppImage
                    src={hotel.image_url}
                    alt={hotel.image_alt || hotel.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon name="PhotoIcon" size={32} className="text-muted-foreground/40" />
                  </div>
                )}
                {/* Active badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      hotel.is_active
                        ? 'bg-green-100 text-green-700' :'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {hotel.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-foreground text-base leading-tight">{hotel.name}</h3>
                  <div className="flex shrink-0 mt-0.5">
                    {Array.from({ length: Math.min(hotel.stars, 5) }).map((_, si) => (
                      <Icon key={si} name="StarIcon" size={10} variant="solid" className="text-amber-400" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <Icon name="MapPinIcon" size={11} className="text-accent" />
                  <span>{hotel.location}</span>
                </div>
                {hotel.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{hotel.description}</p>
                )}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs text-muted-foreground">From </span>
                    <span className="font-display font-semibold text-primary text-lg">${hotel.price_from}</span>
                    <span className="text-xs text-muted-foreground">/night</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => handleToggleActive(hotel)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      hotel.is_active
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' :'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {hotel.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => openEdit(hotel)}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(hotel.id)}
                    className="py-2 px-3 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Icon name="TrashIcon" size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-base font-semibold text-foreground">
                {editingHotel ? 'Edit Hotel' : 'Add Partner Hotel'}
              </h3>
              <button
                onClick={closeForm}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon name="XMarkIcon" size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2">
                  <Icon name="ExclamationCircleIcon" size={15} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Hotel Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    placeholder="e.g. Sarova Stanley"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    required
                    placeholder="e.g. Nairobi CBD"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Stars
                  </label>
                  <select
                    value={form.stars}
                    onChange={(e) => setForm((f) => ({ ...f, stars: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  >
                    {[1, 2, 3, 4, 5].map((s) => (
                      <option key={s} value={s}>{s} Star{s > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Price From ($/night)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.price_from}
                    onChange={(e) => setForm((f) => ({ ...f, price_from: Number(e.target.value) }))}
                    placeholder="180"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Brief description of the hotel..."
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={form.image_url}
                    onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                    placeholder="/assets/images/hotel-name.jpg or https://..."
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Image Alt Text
                  </label>
                  <input
                    type="text"
                    value={form.image_alt}
                    onChange={(e) => setForm((f) => ({ ...f, image_alt: e.target.value }))}
                    placeholder="Describe the image for accessibility"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                        className="sr-only"
                      />
                      <div
                        className={`w-10 h-6 rounded-full transition-colors ${
                          form.is_active ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            form.is_active ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-foreground">Show on homepage</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-2.5 border border-border text-sm font-semibold text-foreground rounded-xl hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : editingHotel ? (
                    'Save Changes'
                  ) : (
                    'Add Hotel'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Icon name="TrashIcon" size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-foreground text-center mb-2">Delete Hotel?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              This action cannot be undone. The hotel will be removed from the homepage.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-border text-sm font-semibold text-foreground rounded-xl hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deletingId === confirmDelete}
                className="flex-1 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deletingId === confirmDelete ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
