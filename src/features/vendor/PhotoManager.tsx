import { useState } from 'react';
import { ArrowLeft, ArrowRight, LoaderCircle, Star, X } from 'lucide-react';
import { api, type PhotoInput } from '../../shared/api/api';

/** A photo in the editor: existing ones are identified by url, fresh uploads also carry their mediaId. */
export type EditablePhoto = { url: string; mediaId?: string; caption?: string };

export const toPhotoInput = (photos: EditablePhoto[]): PhotoInput[] => photos.map((photo) => ({
  ...(photo.mediaId ? { mediaId: photo.mediaId } : { url: photo.url }),
  ...(photo.caption?.trim() ? { caption: photo.caption.trim() } : {}),
}));

const iconButton = 'flex size-11 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 disabled:opacity-30';

export default function PhotoManager({ photos, onChange, max, label, onUploadingChange }: {
  photos: EditablePhoto[]; onChange: (photos: EditablePhoto[]) => void; max: number; label: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const move = (from: number, to: number) => {
    const next = [...photos];
    const [photo] = next.splice(from, 1);
    next.splice(to, 0, photo);
    onChange(next);
  };
  const add = async (files: File[]) => {
    if (photos.length + files.length > max) { setError(`Choose at most ${max} photos.`); return; }
    setUploading(true); onUploadingChange?.(true); setError('');
    const added: EditablePhoto[] = [];
    try {
      for (const file of files) {
        const { data } = await api.uploadMedia('images', file);
        added.push({ url: data.url ?? URL.createObjectURL(file), mediaId: data.id });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'A photo could not be uploaded.');
    } finally {
      if (added.length) onChange([...photos, ...added]);
      setUploading(false); onUploadingChange?.(false);
    }
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold text-slate-600">{label} · first photo is the cover</legend>
      {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
      {photos.length > 0 && <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, index) => (
          <li key={`${photo.url}-${index}`} className="space-y-2 rounded-md border border-slate-200 bg-white p-2">
            <div className="relative">
              <img src={photo.url} alt={photo.caption || `Photo ${index + 1}`} className="aspect-[4/3] w-full rounded object-cover" />
              {index === 0 && <span className="absolute left-2 top-2 rounded bg-[#006F3C] px-2 py-0.5 text-[11px] font-bold text-white">Cover</span>}
            </div>
            <input aria-label={`Caption for photo ${index + 1}`} placeholder="Caption (optional)" maxLength={200} value={photo.caption ?? ''}
              onChange={(event) => onChange(photos.map((item, at) => at === index ? { ...item, caption: event.target.value } : item))}
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm" />
            <div className="flex gap-2">
              <button type="button" className={iconButton} disabled={index === 0} onClick={() => move(index, index - 1)} aria-label={`Move photo ${index + 1} earlier`}><ArrowLeft className="size-4" /></button>
              <button type="button" className={iconButton} disabled={index === photos.length - 1} onClick={() => move(index, index + 1)} aria-label={`Move photo ${index + 1} later`}><ArrowRight className="size-4" /></button>
              <button type="button" className={`${iconButton} w-auto gap-1 px-3 text-xs font-semibold`} disabled={index === 0} onClick={() => move(index, 0)}><Star className="size-4" />Make cover</button>
              <button type="button" className={`${iconButton} ml-auto`} onClick={() => onChange(photos.filter((_, at) => at !== index))} aria-label={`Remove photo ${index + 1}`}><X className="size-4" /></button>
            </div>
          </li>
        ))}
      </ol>}
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-[#006F3C]">
        {uploading ? <><LoaderCircle className="size-4 animate-spin" />Uploading…</> : `Add photos (${photos.length}/${max})`}
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={uploading || photos.length >= max}
          onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ''; if (files.length) void add(files); }} />
      </label>
    </fieldset>
  );
}
