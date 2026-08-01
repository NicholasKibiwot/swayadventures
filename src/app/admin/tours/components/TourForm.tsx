'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface TripFormData {
  title: string;
  summary: string;
  description: string;
  tripType: string;
  durationDays: number;
  basePrice: number;
  currency: string;
  groupSizeMin: number;
  groupSizeMax: number;
  difficulty: string;
  isFeatured: boolean;
  isActive: boolean;
}

interface ExistingImage {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
}

interface TourFormProps {
  tripId?: string;
  initialData?: Partial<TripFormData>;
  initialImages?: ExistingImage[];
}

const TRIP_TYPES = ['safari', 'beach', 'retreat', 'adventure', 'cultural', 'trekking'];
const DIFFICULTIES = ['easy', 'moderate', 'challenging', 'expert'];
const CURRENCIES = ['USD', 'KES', 'EUR', 'GBP'];

export default function TourForm({ tripId, initialData, initialImages = [] }: TourFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!tripId;

  const [form, setForm] = useState<TripFormData>({
    title: initialData?.title || '',
    summary: initialData?.summary || '',
    description: initialData?.description || '',
    tripType: initialData?.tripType || 'safari',
    durationDays: initialData?.durationDays || 3,
    basePrice: initialData?.basePrice || 500,
    currency: initialData?.currency || 'USD',
    groupSizeMin: initialData?.groupSizeMin || 1,
    groupSizeMax: initialData?.groupSizeMax || 12,
    difficulty: initialData?.difficulty || 'moderate',
    isFeatured: initialData?.isFeatured ?? false,
    isActive: initialData?.isActive ?? true,
  });

  const [existingImages, setExistingImages] = useState<ExistingImage[]>(initialImages);
  const [newImageFiles, setNewImageFiles] = useState<{ file: File; preview: string; alt: string }[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleCheckbox = (name: keyof TripFormData) => {
    setForm((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newEntries = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
    }));
    setNewImageFiles((prev) => [...prev, ...newEntries]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (id: string) => {
    setRemovedImageIds((prev) => [...prev, id]);
    setExistingImages((prev) => prev.filter((img) => img.id !== id));
  };

  const updateNewImageAlt = (index: number, alt: string) => {
    setNewImageFiles((prev) =>
      prev.map((img, i) => (i === index ? { ...img, alt } : img))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const supabase = createClient();

      let currentTripId = tripId;

      if (isEdit) {
        // Update existing trip
        const { error: updateErr } = await supabase
          .from('Trip')
          .update({
            title: form.title,
            summary: form.summary,
            description: form.description,
            tripType: form.tripType,
            durationDays: form.durationDays,
            basePrice: form.basePrice,
            currency: form.currency,
            groupSizeMin: form.groupSizeMin,
            groupSizeMax: form.groupSizeMax,
            difficulty: form.difficulty,
            isFeatured: form.isFeatured,
            isActive: form.isActive,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', tripId);

        if (updateErr) throw updateErr;
      } else {
        // Create new trip (no destinationId required for now)
        const newId = crypto.randomUUID();
        const slug = form.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        const { error: insertErr } = await supabase.from('Trip').insert({
          id: newId,
          title: form.title,
          slug: `${slug}-${newId.slice(0, 6)}`,
          summary: form.summary,
          description: form.description,
          tripType: form.tripType,
          durationDays: form.durationDays,
          basePrice: form.basePrice,
          currency: form.currency,
          groupSizeMin: form.groupSizeMin,
          groupSizeMax: form.groupSizeMax,
          difficulty: form.difficulty,
          isFeatured: form.isFeatured,
          isActive: form.isActive,
          destinationId: 'default',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        if (insertErr) throw insertErr;
        currentTripId = newId;
      }

      // Delete removed images
      if (removedImageIds.length > 0) {
        await supabase.from('TripImage').delete().in('id', removedImageIds);
      }

      // Upload new images
      const totalNew = newImageFiles.length;
      for (let i = 0; i < totalNew; i++) {
        const { file, alt } = newImageFiles[i];
        const ext = file.name.split('.').pop();
        const path = `trips/${currentTripId}/${Date.now()}-${i}.${ext}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('trip-images')
          .upload(path, file, { upsert: true });

        if (uploadErr) {
          // If storage upload fails, try saving as a URL reference anyway
          console.warn('Storage upload failed, skipping image:', uploadErr.message);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('trip-images')
          .getPublicUrl(path);

        await supabase.from('TripImage').insert({
          id: crypto.randomUUID(),
          tripId: currentTripId,
          url: publicUrl,
          alt: alt || form.title,
          sortOrder: existingImages.length + i,
        });

        setUploadProgress(Math.round(((i + 1) / totalNew) * 100));
      }

      router.push('/admin/tours');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-start gap-2">
          <Icon name="ExclamationCircleIcon" size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider text-muted-foreground">
          Basic Information
        </h3>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Tour Title *
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="e.g. Maasai Mara Great Migration"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Short Summary
          </label>
          <input
            name="summary"
            value={form.summary}
            onChange={handleChange}
            placeholder="One-line description shown in listings"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Full Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="Detailed description of the tour experience…"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
          />
        </div>
      </div>

      {/* Tour Details */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider text-muted-foreground">
          Tour Details
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Tour Type *
            </label>
            <select
              name="tripType"
              value={form.tripType}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            >
              {TRIP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Difficulty
            </label>
            <select
              name="difficulty"
              value={form.difficulty}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Duration (days) *
            </label>
            <input
              type="number"
              name="durationDays"
              value={form.durationDays}
              onChange={handleChange}
              min={1}
              max={30}
              required
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Max Group Size
            </label>
            <input
              type="number"
              name="groupSizeMax"
              value={form.groupSizeMax}
              onChange={handleChange}
              min={1}
              max={100}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider text-muted-foreground">
          Pricing
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Base Price *
            </label>
            <input
              type="number"
              name="basePrice"
              value={form.basePrice}
              onChange={handleChange}
              min={0}
              required
              placeholder="e.g. 1200"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Currency
            </label>
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider text-muted-foreground">
          Tour Images
        </h3>

        {/* Existing images */}
        {existingImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {existingImages.map((img) => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden border border-border aspect-video bg-muted">
                <AppImage
                  src={img.url}
                  alt={img.alt}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <Icon name="XMarkIcon" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New image previews */}
        {newImageFiles.length > 0 && (
          <div className="space-y-3">
            {newImageFiles.map((img, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                  <AppImage src={img.preview} alt={img.alt} fill sizes="64px" className="object-cover" />
                </div>
                <input
                  type="text"
                  value={img.alt}
                  onChange={(e) => updateNewImageAlt(i, e.target.value)}
                  placeholder="Image description (alt text)"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-white text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors shrink-0"
                >
                  <Icon name="XMarkIcon" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <Icon name="CloudArrowUpIcon" size={18} />
          Click to upload images (JPG, PNG, WebP)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uploading images…</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Visibility */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-3">
        <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider text-muted-foreground">
          Visibility
        </h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => handleCheckbox('isActive')}
            className={`w-10 h-6 rounded-full transition-colors relative ${form.isActive ? 'bg-primary' : 'bg-muted'}`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                form.isActive ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Active</p>
            <p className="text-xs text-muted-foreground">Show this tour on the website</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => handleCheckbox('isFeatured')}
            className={`w-10 h-6 rounded-full transition-colors relative ${form.isFeatured ? 'bg-accent' : 'bg-muted'}`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                form.isFeatured ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Featured</p>
            <p className="text-xs text-muted-foreground">Highlight this tour on the homepage</p>
          </div>
        </label>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 sm:flex-none sm:px-8 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isEdit ? 'Saving…' : 'Creating…'}
            </>
          ) : (
            <>
              <Icon name={isEdit ? 'CheckIcon' : 'PlusIcon'} size={16} />
              {isEdit ? 'Save Changes' : 'Create Tour'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
