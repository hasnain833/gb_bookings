import { useEffect, useState, type ReactNode } from 'react';
import { LoaderCircle, MessageSquareReply, Star, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { api } from '../../shared/api/api';
import type { Booking, Review, ReviewCategory } from '../../types';
import { formatDateForDisplay } from '../../shared/utils/date';

export const CATEGORY_LABELS: Record<ReviewCategory, string> = { staff: 'Staff', cleanliness: 'Cleanliness', comfort: 'Comfort', value: 'Value for money', location: 'Location', wifi: 'WiFi' };
const CATEGORIES = Object.keys(CATEGORY_LABELS) as ReviewCategory[];
/** Words for an average score, like Booking.com's "Very good". */
export const scoreWord = (score: number) => score >= 4.5 ? 'Exceptional' : score >= 4 ? 'Very good' : score >= 3.5 ? 'Good' : score >= 3 ? 'Pleasant' : 'Needs work';
const month = (value?: string) => value ? new Date(`${value}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';

export function Stars({ value, size = 'size-4' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((index) => <Star key={index} className={`${size} ${index <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />)}
    </span>
  );
}

/** Overall rating plus one bar per category. */
export function RatingSummary({ rating, count, scores }: { rating: number; count: number; scores?: Partial<Record<ReviewCategory, number>> }) {
  return (
    <div className="grid gap-5 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="flex items-center gap-3">
        <span className="flex size-14 items-center justify-center rounded-xl bg-[#006F3C] text-xl font-bold text-white">{rating.toFixed(1)}</span>
        <div><p className="font-semibold text-slate-900">{scoreWord(rating)}</p><p className="text-xs text-slate-500">{count} verified review{count === 1 ? '' : 's'}</p></div>
      </div>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {CATEGORIES.filter((key) => scores?.[key]).map((key) => (
          <div key={key}>
            <div className="flex justify-between text-xs"><dt className="text-slate-600">{CATEGORY_LABELS[key]}</dt><dd className="font-semibold text-slate-900">{scores![key]!.toFixed(1)}</dd></div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100" aria-hidden="true"><div className="h-full rounded-full bg-[#006F3C]" style={{ width: `${(scores![key]! / 5) * 100}%` }} /></div>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** One review with the property's reply; `actions` holds partner/admin buttons. */
export function ReviewCard({ review, actions, header }: { review: Review; actions?: ReactNode; header?: ReactNode }) {
  return (
    <article className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-4">
      {header}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{review.authorName} <span className="font-normal text-slate-500">· stayed {month(review.stayMonth)}{review.roomName ? ` · ${review.roomName}` : ''}</span></p>
        <span className="flex items-center gap-2"><Stars value={review.overall} /><span className="text-sm font-semibold">{review.overall}/5</span></span>
      </div>
      {review.liked && <p className="flex gap-2 text-sm leading-relaxed text-slate-700"><ThumbsUp className="mt-0.5 size-4 shrink-0 text-emerald-600" />{review.liked}</p>}
      {review.disliked && <p className="flex gap-2 text-sm leading-relaxed text-slate-700"><ThumbsDown className="mt-0.5 size-4 shrink-0 text-slate-400" />{review.disliked}</p>}
      {review.reply && <div className="ml-6 rounded-lg bg-slate-50 p-3 text-sm"><p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"><MessageSquareReply className="size-3.5" />Reply from the property · {formatDateForDisplay(review.reply.at)}</p><p className="mt-1 text-slate-700">{review.reply.text}</p></div>}
      {actions}
    </article>
  );
}

function StarInput({ label, value, onChange, optional = false }: { label: string; value?: number; onChange: (value: number | undefined) => void; optional?: boolean }) {
  return (
    <fieldset className="flex flex-wrap items-center justify-between gap-2">
      <legend className="sr-only">{label}</legend>
      <span aria-hidden="true" className="text-sm font-medium text-slate-700">{label}{optional && <span className="font-normal text-slate-400"> (if used)</span>}</span>
      <span className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((score) => (
          <button key={score} type="button" aria-label={`${label}: ${score} out of 5`} aria-pressed={value === score} onClick={() => onChange(value === score && optional ? undefined : score)} className="flex size-11 items-center justify-center rounded-lg hover:bg-amber-50">
            <Star className={`size-6 ${value && score <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
          </button>
        ))}
      </span>
    </fieldset>
  );
}

/** Guest form for a finished stay; the server checks the booking may be reviewed. */
export function ReviewDialog({ booking, onClose, onSaved }: { booking: Booking; onClose: () => void; onSaved: (review: Review) => void }) {
  const [overall, setOverall] = useState<number>();
  const [scores, setScores] = useState<Partial<Record<ReviewCategory, number>>>({});
  const [liked, setLiked] = useState('');
  const [disliked, setDisliked] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const missing = !overall || CATEGORIES.some((key) => key !== 'wifi' && !scores[key]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (missing) { setError('Rate the stay overall and each category (WiFi is optional).'); return; }
    setBusy(true); setError('');
    try { onSaved(await api.createReview(booking.id, { overall: overall!, scores, liked: liked.trim() || undefined, disliked: disliked.trim() || undefined })); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Your review could not be saved.'); }
    finally { setBusy(false); }
  };
  const textClass = 'mt-1.5 min-h-20 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="review-dialog-title">
      <form onSubmit={submit} className="max-h-[92dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div><h2 id="review-dialog-title" className="text-lg font-bold text-slate-950">Review your stay</h2><p className="text-sm text-slate-500">{booking.listingTitle} · {formatDateForDisplay(booking.startDate)} – {formatDateForDisplay(booking.endDate)}</p></div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="size-5" /></button>
        </div>
        <div className="rounded-xl bg-slate-50 p-3"><StarInput label="Overall" value={overall} onChange={setOverall} /></div>
        <div className="divide-y divide-slate-100">
          {CATEGORIES.map((key) => <StarInput key={key} label={CATEGORY_LABELS[key]} optional={key === 'wifi'} value={scores[key]} onChange={(value) => setScores({ ...scores, [key]: value })} />)}
        </div>
        <label className="block text-sm font-semibold text-slate-800">What did you like? <span className="font-normal text-slate-500">(optional)</span><textarea maxLength={2000} value={liked} onChange={(event) => setLiked(event.target.value)} className={textClass} /></label>
        <label className="block text-sm font-semibold text-slate-800">What could be better? <span className="font-normal text-slate-500">(optional)</span><textarea maxLength={2000} value={disliked} onChange={(event) => setDisliked(event.target.value)} className={textClass} /></label>
        <p className="text-xs text-slate-500">Your first name and last initial are shown with your review. Reviews are public and cannot be edited after posting.</p>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button>
          <button disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#006F3C] px-5 text-sm font-semibold text-white hover:bg-[#005c32] disabled:opacity-50">{busy && <LoaderCircle className="size-4 animate-spin" />}Post review</button>
        </div>
      </form>
    </div>
  );
}

/** Public reviews on the property page: summary, then newest first with "Show more". */
export function ListingReviews({ listingId, rating, count, scores }: { listingId: string; rating: number; count: number; scores?: Partial<Record<ReviewCategory, number>> }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(count > 0);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!count) return undefined;
    let active = true;
    setLoading(true);
    api.getListingReviews(listingId, page)
      .then((result) => { if (!active) return; setReviews((items) => page === 1 ? result.data : [...items, ...result.data]); setPages(result.pagination.pages); })
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [listingId, page, count]);
  if (!count) return <p className="text-sm text-slate-500">No reviews yet. Guests can review a stay after they check out.</p>;
  return (
    <div className="space-y-3">
      <RatingSummary rating={rating} count={count} scores={scores} />
      {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {loading && <LoaderCircle className="mx-auto size-5 animate-spin text-[#006F3C]" aria-label="Loading reviews" />}
      {!loading && page < pages && <button type="button" onClick={() => setPage(page + 1)} className="min-h-11 w-full rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50">Show more reviews</button>}
    </div>
  );
}
