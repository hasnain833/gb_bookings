import { useEffect, useState } from 'react';
import { Flag, LoaderCircle, MessageSquareReply, Star } from 'lucide-react';
import { api, type Paginated } from '../../shared/api/api';
import { useReasonDialog } from '../../shared/components/ReasonDialog';
import type { Review } from '../../types';
import { ReviewCard } from '../reviews/ReviewParts';

const fieldClass = 'min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';

function ReplyForm({ review, onSaved, onCancel }: { review: Review; onSaved: (review: Review) => void; onCancel: () => void }) {
  const [text, setText] = useState(review.reply?.text ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { onSaved(await api.replyToReview(review.id, text.trim())); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'The reply could not be saved.'); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="space-y-2">
      <textarea required minLength={2} maxLength={2000} value={text} onChange={(event) => setText(event.target.value)} placeholder="Thank the guest and respond to their points. Replies are public."
        className="min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15" />
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <div className="flex gap-2">
        <button disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy && <LoaderCircle className="size-4 animate-spin" />}Publish reply</button>
        <button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button>
      </div>
    </form>
  );
}

/** Guest reviews of the partner's properties: reply publicly, or report one to GBBookings. */
export default function PartnerReviews({ properties }: { properties: Array<{ id: string; title: string }> }) {
  const [listingId, setListingId] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Review> | null>(null);
  const [error, setError] = useState('');
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const { askReason, dialog } = useReasonDialog();

  useEffect(() => { setPage(1); }, [listingId]);
  useEffect(() => {
    let active = true;
    setError('');
    api.getPartnerReviews({ listingId: listingId || undefined, page })
      .then((data) => active && setResult(data))
      .catch((reason: Error) => active && setError(reason.message));
    return () => { active = false; };
  }, [listingId, page]);

  const replace = (review: Review) => setResult((current) => current && { ...current, data: current.data.map((item) => item.id === review.id ? { ...item, ...review } : item) });
  const report = async (review: Review) => {
    const reason = (await askReason({ title: 'Report this review?', confirmLabel: 'Send report', noteLabel: 'What is wrong with it?', description: 'For abusive or fake reviews, reviews of the wrong property, or personal information. It stays public until GBBookings decides. Bad but honest reviews are not removed; reply to them instead.' }))?.trim();
    if (!reason) return;
    try { replace(await api.reportReview(review.id, reason)); }
    catch (reasonError) { setError(reasonError instanceof Error ? reasonError.message : 'The report could not be sent.'); }
  };

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="partner-reviews-heading">
      {dialog}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><Star className="size-5 text-[#006F3C]" /><h2 id="partner-reviews-heading" className="font-bold text-slate-900">Guest reviews</h2>{result && <span className="text-sm text-slate-500">{result.pagination.total} found</span>}</div>
        {properties.length > 1 && <label><span className="sr-only">Property</span><select value={listingId} onChange={(event) => setListingId(event.target.value)} className={fieldClass}>
          <option value="">All properties</option>
          {properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}
        </select></label>}
      </div>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {!result && !error && <div className="flex justify-center py-8"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading reviews" /></div>}
      {result?.data.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No reviews yet. Guests can review their stay after they check out.</p>}
      <div className="space-y-3">
        {result?.data.map((review) => (
          <ReviewCard key={review.id} review={review}
            header={<p className="text-xs font-semibold text-slate-500">{review.listingTitle}
              {review.status === 'hidden' && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">Hidden by GBBookings{review.hiddenReason ? `: ${review.hiddenReason}` : ''}</span>}
              {review.report && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">Reported, waiting for GBBookings</span>}</p>}
            actions={replyingId === review.id
              ? <ReplyForm review={review} onCancel={() => setReplyingId(null)} onSaved={(saved) => { replace(saved); setReplyingId(null); }} />
              : <div className="flex flex-wrap gap-2 pt-1">
                  <button type="button" onClick={() => setReplyingId(review.id)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><MessageSquareReply className="size-4" />{review.reply ? 'Edit reply' : 'Reply'}</button>
                  {!review.report && review.status !== 'hidden' && <button type="button" onClick={() => report(review)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"><Flag className="size-4" />Report</button>}
                </div>} />
        ))}
      </div>
      {result && result.pagination.pages > 1 && <nav aria-label="Review pages" className="flex items-center justify-end gap-3 text-sm"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="min-h-11 rounded-lg border border-slate-300 px-4 disabled:opacity-50">Previous</button><span>Page {page} of {result.pagination.pages}</span><button type="button" disabled={page >= result.pagination.pages} onClick={() => setPage(page + 1)} className="min-h-11 rounded-lg border border-slate-300 px-4 disabled:opacity-50">Next</button></nav>}
    </section>
  );
}
