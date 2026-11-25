import { useMemo, useState } from 'react';
import { Mail, Send } from 'lucide-react';
import api from '../api/axios';

const reminderBody = 'Hello {name},\n\nThis is a reminder that your payment is due. Amount due: KES {amount}. Due date: {dueDate}.\n\nPlease contact our team if you have already made this payment.';
const announcementBody = 'Hello {name},\n\n';

export default function BulkEmailPanel({ users }) {
  const borrowers = useMemo(
    () => users.filter((user) => user.active && ['USER', 'BORROWER'].includes(user.role)),
    [users]
  );
  const [recipientIds, setRecipientIds] = useState([]);
  const [paymentReminder, setPaymentReminder] = useState(true);
  const [subject, setSubject] = useState('Payment reminder from FinGuard');
  const [body, setBody] = useState(reminderBody);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  const selectAll = (checked) => {
    setRecipientIds(checked ? borrowers.map((borrower) => borrower.id) : []);
  };

  const toggleRecipient = (id, checked) => {
    setRecipientIds((current) => checked
      ? [...new Set([...current, id])]
      : current.filter((selectedId) => selectedId !== id));
  };

  const changeType = (isReminder) => {
    setPaymentReminder(isReminder);
    setSubject(isReminder ? 'Payment reminder from FinGuard' : 'An update from FinGuard');
    setBody(isReminder ? reminderBody : announcementBody);
  };

  const sendCampaign = async (event) => {
    event.preventDefault();
    setError('');
    setResult('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/api/admin/emails/send', {
        recipientIds,
        subject,
        body,
        paymentReminder,
      });
      setResult(data.message);
      if (data.failed) setError(`${data.failed} email(s) could not be delivered.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not send this email campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
      <header className="flex items-start gap-3">
        <span className="rounded-xl bg-indigo-50 text-indigo-600 p-2.5"><Mail className="w-5 h-5" aria-hidden="true" /></span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Personalized borrower emails</h2>
          <p className="text-xs text-slate-500 mt-1">Each recipient receives a separate email. Use <code>{'{name}'}</code>; payment reminders also support <code>{'{amount}'}</code> and <code>{'{dueDate}'}</code>.</p>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</p>}
      {result && <p role="status" className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">{result}</p>}

      <form onSubmit={sendCampaign} className="space-y-5">
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700 mb-2">Email type</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => changeType(true)} aria-pressed={paymentReminder}
              className={`rounded-lg px-3 py-2 text-sm font-semibold border ${paymentReminder ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
              Payment reminder
            </button>
            <button type="button" onClick={() => changeType(false)} aria-pressed={!paymentReminder}
              className={`rounded-lg px-3 py-2 text-sm font-semibold border ${!paymentReminder ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
              Custom announcement
            </button>
          </div>
          {paymentReminder && <p className="mt-2 text-xs text-slate-500">Only borrowers with due or overdue installments will receive a reminder; amounts are calculated from their unpaid installments.</p>}
        </fieldset>

        <fieldset>
          <div className="flex items-center justify-between gap-3 mb-2">
            <legend className="text-sm font-semibold text-slate-700">Recipients ({recipientIds.length} selected)</legend>
            <button type="button" onClick={() => selectAll(recipientIds.length !== borrowers.length)} disabled={!borrowers.length}
              className="text-xs font-semibold text-indigo-700 hover:underline disabled:opacity-50">
              {recipientIds.length === borrowers.length && borrowers.length ? 'Clear selection' : 'Select all active borrowers'}
            </button>
          </div>
          {borrowers.length ? (
            <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
              {borrowers.map((borrower) => (
                <label key={borrower.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={recipientIds.includes(borrower.id)} onChange={(event) => toggleRecipient(borrower.id, event.target.checked)}
                    className="h-4 w-4 accent-indigo-600" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-900">{borrower.fullName}</span>
                    <span className="block text-xs text-slate-500">{borrower.email}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : <p className="rounded-lg border border-slate-200 p-3 text-sm text-slate-500">No active borrower accounts are available.</p>}
        </fieldset>

        <label className="block">
          <span className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</span>
          <input value={subject} onChange={(event) => setSubject(event.target.value)} required maxLength={200}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900" />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-slate-700 mb-1.5">Message</span>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} required maxLength={5000} rows={6}
            className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900" />
        </label>

        <button type="submit" disabled={submitting || !recipientIds.length || !borrowers.length}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
          <Send className="w-4 h-4" aria-hidden="true" />
          {submitting ? 'Sending…' : `Send to ${recipientIds.length} selected`}
        </button>
      </form>
    </section>
  );
}
