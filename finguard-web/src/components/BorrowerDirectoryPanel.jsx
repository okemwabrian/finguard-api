import { useEffect, useState } from 'react';
import { Mail, Phone, Search, Users } from 'lucide-react';
import api from '../api/axios';

export default function BorrowerDirectoryPanel() {
  const [borrowers, setBorrowers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/staff/borrowers')
      .then(({ data }) => setBorrowers(Array.isArray(data) ? data : []))
      .catch(() => setError('Could not load borrower contact details.'))
      .finally(() => setLoading(false));
  }, []);

  const query = search.trim().toLowerCase();
  const filteredBorrowers = borrowers.filter((borrower) =>
    [borrower.fullName, borrower.email, borrower.phone]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query))
  );

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-indigo-50 text-indigo-600 p-2.5"><Users className="w-5 h-5" aria-hidden="true" /></span>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Borrower contacts</h1>
            <p className="text-sm text-slate-500">Contact information for active borrower accounts.</p>
          </div>
        </div>
        <label className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search borrowers"
            aria-label="Search borrowers"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900"
          />
        </label>
      </header>

      {error && <p role="alert" className="m-5 rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</p>}
      {loading ? (
        <p className="p-6 text-sm text-slate-500">Loading borrower contacts…</p>
      ) : !error && filteredBorrowers.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">{borrowers.length ? 'No matching borrowers.' : 'No active borrower accounts found.'}</p>
      ) : !error ? (
        <div className="divide-y divide-slate-100">
          {filteredBorrowers.map((borrower) => (
            <article key={borrower.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 sm:px-6 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">{borrower.fullName}</h2>
                <span className="text-xs text-slate-500">{borrower.role}</span>
              </div>
              <div className="flex flex-col sm:items-end gap-1 text-sm">
                <a className="inline-flex items-center gap-2 text-indigo-700 hover:underline" href={`mailto:${borrower.email}`}>
                  <Mail className="w-4 h-4" aria-hidden="true" /> {borrower.email}
                </a>
                {borrower.phone && (
                  <a className="inline-flex items-center gap-2 text-slate-600 hover:underline" href={`tel:${borrower.phone}`}>
                    <Phone className="w-4 h-4" aria-hidden="true" /> {borrower.phone}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
