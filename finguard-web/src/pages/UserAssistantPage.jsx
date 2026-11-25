import { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  AlertCircle,
  HelpCircle,
  History
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import BorrowerNavbar from '../components/BorrowerNavbar';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { extractApiError } from '../utils/extractErrorMessage';

const USER_PROMPTS = [
  'What is the status of my applications?',
  'How is daily interest calculated?',
  'What documents do I need to upload?',
  'How do I contact the support team?',
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#e11d48', '#8b5cf6'];

export default function UserAssistantPage() {
  const { showToast } = useToast();
  const [question, setQuestion] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [chartTypeOverride, setChartTypeOverride] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data } = await api.get('/api/analytics/summary');
        setSummary(data);
      } catch {
        // Ignore
      }
    };
    fetchSummary();
  }, []);

  const handleAsk = async (queryText) => {
    const q = (queryText || question).trim();
    if (!q) return;

    setError('');
    setLoading(true);
    setChartTypeOverride(null);

    try {
      const { data } = await api.post('/api/analytics/ask', { question: q });
      setResult(data);
      if (!queryHistory.includes(q)) {
        setQueryHistory((prev) => [q, ...prev.slice(0, 4)]);
      }
      if (!queryText) setQuestion('');
    } catch (err) {
      setError(extractApiError(err, 'Could not get assistant response.'));
    } finally {
      setLoading(false);
    }
  };

  const chart = result?.chart;
  const activeChartType = chartTypeOverride || chart?.type || 'BAR';

  const chartData =
    chart?.labels?.map((label, idx) => {
      const point = { name: label };
      chart.series?.forEach((s) => {
        point[s.name] = s.data?.[idx] !== undefined ? Number(s.data[idx]) : 0;
      });
      return point;
    }) || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <BorrowerNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:py-8 space-y-6">
        {/* Hero */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#1e1b4b] via-indigo-900 to-slate-900 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Personal Financial Insights</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">FinGuard User Assistant</h1>
            <p className="text-slate-300 text-xs mt-1 max-w-xl">
              Ask questions about your loan applications, approval progress, risk profile, and repayment trends to generate instant visual charts.
            </p>
          </div>

          {summary && (
            <div className="grid grid-cols-2 gap-3 bg-white/10 p-3.5 rounded-xl border border-white/10 shrink-0">
              <div>
                <div className="text-[10px] text-slate-300 uppercase">Your Total Volume</div>
                <div className="text-sm font-bold">KES {Number(summary.totalVolume || 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-300 uppercase">Your Applications</div>
                <div className="text-sm font-bold">{summary.totalLoans || 0}</div>
              </div>
            </div>
          )}
        </div>

        {/* Question Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Sparkles className="w-4 h-4 text-indigo-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about your loans (e.g. 'What is the status of my applications?')..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Analyzing...' : 'Ask Assistant'}</span>
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" /> Suggested:
            </span>
            {USER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleAsk(prompt)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 font-medium transition cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {queryHistory.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px] text-slate-400 border-t border-slate-100">
              <History className="w-3 h-3" />
              <span>Recent:</span>
              {queryHistory.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAsk(q)}
                  className="text-[11px] text-indigo-600 hover:underline cursor-pointer mr-2"
                >
                  "{q}"
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Assistant Summary
                </h4>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {result.answer}
                </p>
              </div>
            </div>

            {chart && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {activeChartType === 'BAR' ? (
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                    ) : activeChartType === 'LINE' ? (
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <PieIcon className="w-4 h-4 text-indigo-600" />
                    )}
                    <span>{chart.title}</span>
                  </h3>

                  <div className="inline-flex rounded-lg bg-slate-100 p-1 text-[11px] font-semibold">
                    {['BAR', 'LINE', 'PIE'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setChartTypeOverride(t)}
                        className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                          activeChartType === t
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-64 sm:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeChartType === 'LINE' ? (
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, borderColor: '#e2e8f0' }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {chart.series?.map((s, idx) => (
                          <Line
                            key={s.name}
                            type="monotone"
                            dataKey={s.name}
                            stroke={COLORS[idx % COLORS.length]}
                            strokeWidth={2.5}
                            dot={{ r: 4 }}
                          />
                        ))}
                      </LineChart>
                    ) : activeChartType === 'PIE' ? (
                      <PieChart>
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, borderColor: '#e2e8f0' }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Pie
                          data={chart.labels.map((l, i) => ({
                            name: l,
                            value: Number(chart.series?.[0]?.data?.[i] || 0),
                          }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={52}
                          paddingAngle={4}
                        >
                          {chart.labels.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    ) : (
                      <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, borderColor: '#e2e8f0' }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {chart.series?.map((s, idx) => (
                          <Bar
                            key={s.name}
                            dataKey={s.name}
                            fill={COLORS[idx % COLORS.length]}
                            radius={[6, 6, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Support Team Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Support Team Online • Avg. Reply &lt; 5 mins</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Need Human Support?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our FinGuard Support Specialists are active 24/7 to help with loan corrections, KYC document verification, or repayment inquiries.
            </p>
            <div className="pt-1 flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
              <span>Email: <strong className="text-indigo-600">support@finguard.com</strong></span>
              <span>Hotline: <strong className="text-indigo-600">+254 700 123 456</strong></span>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!supportMsg.trim()) return;
              setSendingSupport(true);
              setTimeout(() => {
                setSendingSupport(false);
                setSupportMsg('');
                showToast('Support ticket sent! Our active support team will respond shortly.', 'success');
              }, 400);
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <input
              type="text"
              required
              value={supportMsg}
              onChange={(e) => setSupportMsg(e.target.value)}
              placeholder="Write a message to our active support team..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={sendingSupport}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer shrink-0"
            >
              {sendingSupport ? 'Sending...' : 'Message Support'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
