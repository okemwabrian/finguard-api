import { useEffect, useState } from 'react';
import { Eye, Save, Sparkles } from 'lucide-react';
import api from '../api/axios';

const initialConfig = {
  heroModel: 'VAULT_3D',
  heroBadge: 'Intelligent Credit & Digital Lending',
  heroTitle: 'Modern Lending, Built on Trust',
  heroSubtitle: 'Apply for personal or business financing in minutes. FinGuard pairs real-time credit risk scoring with transparent disbursement tracking, daily interest clarity, and instant digital receipts.',
};

const models = [
  { value: 'VAULT_3D', label: 'Vault — secure lending' },
  { value: 'ANALYTICS_ORBIT', label: 'Analytics orbit' },
  { value: 'CARD_STACK_3D', label: 'Floating card stack' },
];

export default function SiteSettingsPanel() {
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/api/public/site-config')
      .then(({ data }) => {
        setConfig((current) => ({ ...current, ...data }));
        setLoaded(true);
      })
      .catch(() => setError('Could not load landing page settings.'))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (event) => {
    setConfig((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const saveConfig = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.put('/api/admin/site-config', config);
      setConfig((current) => ({ ...current, ...data }));
      setSuccess('Landing page settings saved.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save landing page settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
      <header className="flex items-start gap-3 mb-6">
        <span className="rounded-xl bg-indigo-50 text-indigo-600 p-2.5">
          <Sparkles className="w-5 h-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Landing page appearance</h1>
          <p className="text-sm text-slate-500 mt-1">Choose the animated 3-D showcase and edit the public hero content.</p>
        </div>
      </header>

      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</p>}
      {success && <p role="status" className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">{success}</p>}

      <form onSubmit={saveConfig} className="space-y-5">
        <label className="block">
          <span className="block text-sm font-semibold text-slate-700 mb-1.5">Animated showcase</span>
          <select
            name="heroModel"
            value={config.heroModel}
            onChange={updateField}
            disabled={loading}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            {models.map((model) => <option key={model.value} value={model.value}>{model.label}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="block text-sm font-semibold text-slate-700 mb-1.5">Hero badge</span>
          <input
            name="heroBadge"
            value={config.heroBadge}
            onChange={updateField}
            maxLength={120}
            required
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-semibold text-slate-700 mb-1.5">Headline</span>
          <input
            name="heroTitle"
            value={config.heroTitle}
            onChange={updateField}
            maxLength={180}
            required
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-semibold text-slate-700 mb-1.5">Description</span>
          <textarea
            name="heroSubtitle"
            value={config.heroSubtitle}
            onChange={updateField}
            maxLength={500}
            rows={4}
            required
            className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
          />
        </label>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Eye className="w-4 h-4" aria-hidden="true" /> Preview public page
          </a>
          <button
            type="submit"
            disabled={loading || saving || !loaded}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" aria-hidden="true" /> {saving ? 'Saving...' : 'Save appearance'}
          </button>
        </div>
      </form>
    </section>
  );
}
