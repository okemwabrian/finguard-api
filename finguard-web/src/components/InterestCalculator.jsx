import { useState, useMemo } from 'react';
import { Calculator, Calendar, DollarSign, Percent, Clock, TrendingUp } from 'lucide-react';
import BorrowerNavbar from './BorrowerNavbar';

export default function InterestCalculator({ embedded = false }) {
  const [principal, setPrincipal] = useState(500000);
  const [annualRate, setAnnualRate] = useState(12);
  const [months, setMonths] = useState(12);
  const [daysElapsed, setDaysElapsed] = useState(30);

  const calc = useMemo(() => {
    const p = Math.max(0, Number(principal) || 0);
    const r = Math.max(0, Number(annualRate) || 0);
    const n = Math.max(1, Math.min(360, Number(months) || 1));
    const d = Math.max(1, Math.min(3650, Number(daysElapsed) || 1));

    const dailyRate = r / 100 / 365;
    const dailyInterest = p * dailyRate;
    const accruedForDays = dailyInterest * d;

    const monthlyRate = r / 100 / 12;
    let monthlyPayment = 0;
    if (monthlyRate === 0) {
      monthlyPayment = p / n;
    } else {
      const factor = Math.pow(1 + monthlyRate, n);
      monthlyPayment = (p * (monthlyRate * factor)) / (factor - 1);
    }

    const totalRepayment = monthlyPayment * n;
    const totalInterest = Math.max(0, totalRepayment - p);

    // Build amortization preview
    const schedule = [];
    let balance = p;
    for (let i = 1; i <= Math.min(n, 36); i++) {
      const interestComp = balance * monthlyRate;
      const principalComp = i === n ? balance : Math.min(balance, monthlyPayment - interestComp);
      const closing = Math.max(0, balance - principalComp);
      schedule.push({
        installment: i,
        opening: balance,
        payment: i === n ? principalComp + interestComp : monthlyPayment,
        principal: principalComp,
        interest: interestComp,
        closing,
      });
      balance = closing;
    }

    return {
      dailyInterest,
      accruedForDays,
      monthlyPayment,
      totalInterest,
      totalRepayment,
      schedule,
    };
  }, [principal, annualRate, months, daysElapsed]);

  const content = (
    <div className="space-y-6 pb-16 md:pb-0">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#1e1b4b] via-indigo-900 to-slate-900 text-white shadow-md">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
          <Calculator className="w-4 h-4" />
          <span>Repayment & Daily Accrual Planner</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">Repayment & Daily Interest Calculator</h2>
        <p className="text-slate-300 text-xs mt-1 max-w-2xl">
          Calculate exact daily interest accrual, monthly installments, and full reducing-balance amortization schedules before applying or underwriting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <h3 className="text-sm font-bold text-slate-900">Loan Parameters</h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-slate-700">Principal Amount (KES)</label>
                <span className="font-mono font-bold text-indigo-600">KES {Number(principal).toLocaleString()}</span>
              </div>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="100"
                  step="1000"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <input
                type="range"
                min="10000"
                max="5000000"
                step="10000"
                value={Math.min(5000000, Number(principal) || 0)}
                onChange={(e) => setPrincipal(e.target.value)}
                className="w-full mt-2 accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-slate-700">Annual Interest Rate (% p.a.)</label>
                <span className="font-mono font-bold text-indigo-600">{annualRate}%</span>
              </div>
              <div className="relative">
                <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-slate-700">Repayment Term (Months)</label>
                <span className="font-mono font-bold text-indigo-600">{months} mo</span>
              </div>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="flex justify-between mb-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Daily Interest Days</span>
                </label>
                <span className="font-mono font-bold text-amber-600">{daysElapsed} days</span>
              </div>
              <input
                type="number"
                min="1"
                max="3650"
                value={daysElapsed}
                onChange={(e) => setDaysElapsed(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-amber-500"
              />
              <input
                type="range"
                min="1"
                max="365"
                value={Math.min(365, Number(daysElapsed) || 1)}
                onChange={(e) => setDaysElapsed(e.target.value)}
                className="w-full mt-2 accent-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Summary KPIs + Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Daily Interest Accrual</div>
              <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
                KES {calc.dailyInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs font-normal text-slate-400"> / day</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                For <strong>{daysElapsed} days</strong>: <strong className="text-slate-900">KES {calc.accruedForDays.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Monthly Installment (EMI)</div>
              <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">
                KES {calc.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Over {months} monthly payments
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Total Interest Payable</div>
              <div className="text-xl font-bold font-mono text-rose-600 mt-1">
                KES {calc.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Total Repayment Amount</div>
              <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
                KES {calc.totalRepayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Amortization Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Amortization Breakdown {months > 36 ? '(First 36 Months)' : ''}</span>
              </h3>
              <span className="text-[11px] text-slate-400">Reducing balance</span>
            </div>

            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Payment</th>
                    <th className="py-2.5 px-4">Principal</th>
                    <th className="py-2.5 px-4">Interest</th>
                    <th className="py-2.5 px-4">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {calc.schedule.map((row) => (
                    <tr key={row.installment} className="hover:bg-slate-50/70">
                      <td className="py-2 px-4 font-semibold text-slate-700">{row.installment}</td>
                      <td className="py-2 px-4 font-bold text-slate-900">{row.payment.toFixed(2)}</td>
                      <td className="py-2 px-4 text-emerald-600">{row.principal.toFixed(2)}</td>
                      <td className="py-2 px-4 text-amber-600">{row.interest.toFixed(2)}</td>
                      <td className="py-2 px-4 text-slate-500">{row.closing.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <BorrowerNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:py-8">
        {content}
      </main>
    </div>
  );
}
