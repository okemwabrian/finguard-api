import { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  AlertCircle,
  HelpCircle,
  History,
  Clock
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
import api from '../api/axios';

const SUGGESTED_PROMPTS = [
  'What is our delinquency rate?',
  'Show origination volume trend by month',
  'Breakdown by credit risk tier',
  'What is the status breakdown of pending vs approved loans?',
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPanel() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [queryHistory, setQueryHistory] = useState([
    'What is our delinquency rate?',
    'Breakdown by credit risk tier',
  ]);
  const [summary, setSummary] = useState(null);

  const fetchSummary = async () => {
    try {
      const { data } = await api.get('/api/analytics/summary');
      setSummary(data);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchSummary();
    // Run an initial query
    handleAsk('Breakdown by credit risk tier');
  }, []);

  const handleAsk = async (queryText) => {
    const q = (queryText || question).trim();
    if (!q) return;

    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/api/analytics/ask', { question: q });
      setResult(data);
      if (!queryHistory.includes(q)) {
        setQueryHistory((prev) => [q, ...prev.slice(0, 4)]);
      }
      setQuestion('');
    } catch (err) {
      const errCode = err.response?.data?.errorCode;
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to query AI Assistant';
      setError(errCode ? `[${errCode}] ${errMsg}` : errMsg);
    } finally {
      setLoading(false);
    }
  };

  const chart = result?.chart;

  // Format Recharts data from chart specification
  const formattedChartData = () => {
    if (!chart || !chart.labels) return [];
    return chart.labels.map((label, idx) => {
      const point = { name: label };
      if (chart.series) {
        chart.series.forEach((s) => {
          point[s.name] = s.data?.[idx] !== undefined ? s.data[idx] : 0;
        });
      }
      return point;
    });
  };

  const chartData = formattedChartData();

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Generative Portfolio Intelligence</span>
          </div>
          <h2 className="text-2xl font-bold">FinGuard AI Portfolio Assistant</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-xl">
            Ask natural language questions about your loan portfolio, delinquency rates, origination trends, and credit risk distributions. Powered by Google Gemini with deterministic banking safeguards.
          </p>
        </div>

        {summary && (
          <div className="grid grid-cols-2 gap-3 text-right bg-white/10 p-3 rounded-xl border border-white/10 shrink-0">
            <div>
              <div className="text-[10px] text-slate-300 uppercase">Total Portfolio</div>
              <div className="text-sm font-bold">KES {Number(summary.totalVolume || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-300 uppercase">Total Facilities</div>
              <div className="text-sm font-bold">{summary.totalLoans} loans</div>
            </div>
          </div>
        )}
      </div>

      {/* Query Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Sparkles className="w-4 h-4 text-indigo-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything (e.g. 'What is our delinquency rate?', 'Show monthly origination trend')..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Analyzing...' : 'Ask AI'}</span>
          </button>
        </form>

        {/* Suggested Prompt Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Suggested:
          </span>
          {SUGGESTED_PROMPTS.map((prompt) => (
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

        {/* Query History */}
        {queryHistory.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400 border-t border-slate-100">
            <History className="w-3 h-3" />
            <span>Recent queries:</span>
            {queryHistory.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAsk(q)}
                className="text-[10px] text-indigo-600 hover:underline cursor-pointer mr-2"
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

      {/* Result Display: Answer & Chart */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          {/* Executive Answer Card */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                AI Executive Analysis
              </h4>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {result.answer}
              </p>
            </div>
          </div>

          {/* Interactive Chart */}
          {chart && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  {chart.type === 'BAR' ? (
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                  ) : chart.type === 'LINE' ? (
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <PieIcon className="w-4 h-4 text-indigo-600" />
                  )}
                  <span>{chart.title}</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Type: {chart.type}
                </span>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  {chart.type === 'LINE' ? (
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }} />
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
                  ) : chart.type === 'PIE' ? (
                    <PieChart>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Pie
                        data={
                          chart.labels.map((l, i) => ({
                            name: l,
                            value: chart.series?.[0]?.data?.[i] || 0,
                          }))
                        }
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        innerRadius={50}
                        paddingAngle={4}
                      >
                        {chart.labels.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }} />
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
    </div>
  );
}
