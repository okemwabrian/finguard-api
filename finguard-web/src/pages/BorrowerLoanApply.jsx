import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  CreditCard,
  Phone,
  DollarSign,
  Calendar,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileCheck,
  X,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BorrowerNavbar from '../components/BorrowerNavbar';
import api from '../api/axios';
import { extractApiError } from '../utils/extractErrorMessage';

const STEPS = [
  { id: 1, name: 'Personal Details' },
  { id: 2, name: 'Financials & Loan' },
  { id: 3, name: 'KYC Documents' },
  { id: 4, name: 'Review & Submit' },
];

export default function BorrowerLoanApply() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Personal Details (auto-filled from user profile)
  const [borrowerName, setBorrowerName] = useState(user?.fullName || '');
  const [borrowerNationalId, setBorrowerNationalId] = useState(user?.nationalId || '');
  const [borrowerPhone, setBorrowerPhone] = useState(user?.phone || '');

  useEffect(() => {
    const syncProfile = async () => {
      try {
        const { data } = await api.get('/api/users/me');
        if (data.fullName) setBorrowerName((prev) => prev || data.fullName);
        if (data.nationalId) setBorrowerNationalId((prev) => prev || data.nationalId);
        if (data.phone) setBorrowerPhone((prev) => prev || data.phone);
      } catch {
        // Ignore if offline
      }
    };
    syncProfile();
  }, []);

  // Step 2: Financial Details
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [existingMonthlyDebt, setExistingMonthlyDebt] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [repaymentMonths, setRepaymentMonths] = useState(12);
  const [purpose, setPurpose] = useState('');

  // Step 3: KYC Documents Staging
  const [files, setFiles] = useState([]); // array of { file, docType }

  // Step 4: Terms
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Calculations
  const incomeNum = Number(monthlyIncome) || 0;
  const debtNum = Number(existingMonthlyDebt) || 0;
  const dti = incomeNum > 0 ? (debtNum / incomeNum) * 100 : 0;

  const handleFileChange = (e, docType) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFiles((prev) => [
        ...prev.filter((f) => f.docType !== docType),
        { file: selected, docType },
      ]);
    }
  };

  const handleRemoveFile = (docType) => {
    setFiles((prev) => prev.filter((f) => f.docType !== docType));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Submit loan application
      const loanPayload = {
        borrowerName,
        borrowerNationalId,
        monthlyIncome: incomeNum,
        existingMonthlyDebt: debtNum,
        requestedAmount: Number(requestedAmount),
        repaymentMonths: Number(repaymentMonths),
        purpose: purpose.trim() || 'Working capital / personal financing',
      };

      const { data: loan } = await api.post('/api/borrower/loans', loanPayload);

      // 2. Upload any staged documents
      if (files.length > 0 && loan?.id) {
        for (const f of files) {
          const formData = new FormData();
          formData.append('file', f.file);
          formData.append('docType', f.docType);
          try {
            await api.post(`/api/loans/${loan.id}/documents`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch (uploadErr) {
            console.error(`Failed to upload ${f.docType}:`, uploadErr);
          }
        }
      }

      navigate(`/portal/loans/${loan.id}`);
    } catch (err) {
      setError(extractApiError(err, 'Failed to submit loan application. Please check your inputs.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <BorrowerNavbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:py-8">
        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      currentStep > step.id
                        ? 'bg-emerald-600 text-white'
                        : currentStep === step.id
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center ${
                      currentStep === step.id ? 'text-indigo-600 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-full mx-2 transition ${
                      currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Personal Details */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Personal & Identity Details</h2>
                <p className="text-xs text-slate-500">Provide official identity information matching your government ID</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Email (Auto-filled)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      placeholder="e.g. John Doe Kamau"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">National ID / Passport Number</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={borrowerNationalId}
                      onChange={(e) => setBorrowerNationalId(e.target.value)}
                      placeholder="e.g. 12345678"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      value={borrowerPhone}
                      onChange={(e) => setBorrowerPhone(e.target.value)}
                      placeholder="e.g. +254 712 345 678"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!borrowerName || !borrowerNationalId}
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition"
                >
                  <span>Continue to Financials</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Financials & Loan */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Financial Profile & Requested Facility</h2>
                <p className="text-xs text-slate-500">Provide verified gross earnings and debt commitments</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Gross Income (KES)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      placeholder="e.g. 150000"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Existing Monthly Debt (KES)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="number"
                      required
                      min="0"
                      value={existingMonthlyDebt}
                      onChange={(e) => setExistingMonthlyDebt(e.target.value)}
                      placeholder="e.g. 30000"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Loan Amount (KES)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="number"
                      required
                      min="1000"
                      value={requestedAmount}
                      onChange={(e) => setRequestedAmount(e.target.value)}
                      placeholder="e.g. 500000"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Repayment Term</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <select
                      value={repaymentMonths}
                      onChange={(e) => setRepaymentMonths(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                    >
                      <option value="6">6 Months</option>
                      <option value="12">12 Months (1 Year)</option>
                      <option value="24">24 Months (2 Years)</option>
                      <option value="36">36 Months (3 Years)</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Purpose</label>
                  <input
                    type="text"
                    required
                    maxLength={500}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Business inventory expansion, home renovation, education..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Debt-to-Income (DTI) Live Meter */}
              {incomeNum > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">Estimated Debt-to-Income (DTI) Ratio</span>
                    <span
                      className={`font-bold ${
                        dti <= 35 ? 'text-emerald-600' : dti <= 45 ? 'text-amber-600' : 'text-rose-600'
                      }`}
                    >
                      {dti.toFixed(1)}% {dti <= 35 ? '(Optimal)' : dti <= 45 ? '(Moderate)' : '(High Risk)'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        dti <= 35 ? 'bg-emerald-500' : dti <= 45 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, dti)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    FinGuard evaluates applications with DTI below 35% with preferential interest rates.
                  </p>
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={!monthlyIncome || !requestedAmount}
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition"
                >
                  <span>Continue to KYC Upload</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: KYC Documents */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Upload KYC & Proof Documents</h2>
                <p className="text-xs text-slate-500">Attach supporting PDF or Image files (max 10MB each) for accelerated credit review</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { type: 'NATIONAL_ID', label: 'Government National ID / Passport', req: true },
                  { type: 'PAYSLIP', label: 'Most Recent Payslip (3 Months)', req: true },
                  { type: 'BANK_STATEMENT', label: 'Bank Statement (Certified)', req: false },
                  { type: 'TAX_RETURN', label: 'Tax Return (KRA P9 / Tax Filing)', req: false },
                ].map((doc) => {
                  const attached = files.find((f) => f.docType === doc.type);
                  return (
                    <div
                      key={doc.type}
                      className={`p-4 rounded-xl border border-dashed transition ${
                        attached
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : 'border-slate-300 hover:border-indigo-400 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{doc.label}</div>
                          <div className="text-[11px] text-slate-500">
                            {doc.req ? 'Required for approval' : 'Optional supplementary'}
                          </div>
                        </div>
                        {attached ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(doc.type)}
                            className="text-slate-400 hover:text-rose-500 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <UploadCloud className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      {attached ? (
                        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700">
                          <FileCheck className="w-4 h-4 shrink-0" />
                          <span className="truncate">{attached.file.name}</span>
                        </div>
                      ) : (
                        <label className="mt-3 block text-center py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer transition">
                          <span>Select Document</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={(e) => handleFileChange(e, doc.type)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
                >
                  <span>Review Application</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Review & Submit Loan Application</h2>
                <p className="text-xs text-slate-500">Confirm your details before submitting for automated underwriting review</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">Borrower:</span>
                    <span className="ml-1 font-semibold text-slate-900">{borrowerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">National ID:</span>
                    <span className="ml-1 font-semibold text-slate-900">{borrowerNationalId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Monthly Income:</span>
                    <span className="ml-1 font-semibold text-slate-900">KES {incomeNum.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Existing Debt:</span>
                    <span className="ml-1 font-semibold text-slate-900">KES {debtNum.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Requested Amount:</span>
                    <span className="ml-1 font-bold text-indigo-700">KES {Number(requestedAmount).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Repayment Period:</span>
                    <span className="ml-1 font-semibold text-slate-900">{repaymentMonths} Months</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Uploaded Documents:</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {files.length === 0 ? (
                      <span className="text-slate-400 italic">No KYC documents attached (can be uploaded later)</span>
                    ) : (
                      files.map((f) => (
                        <span
                          key={f.docType}
                          className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-medium text-[11px]"
                        >
                          {f.docType}: {f.file.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Automated Credit Assessment Notice */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900">
                  <span className="font-bold">Instant Credit Assessment:</span> Upon submission, FinGuard will evaluate your financial ratios and assign an objective 0–100 risk score and tier.
                </div>
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  I certify that all provided financial and identity information is truthful and accurate, and authorize FinGuard to evaluate my application under banking credit standards.
                </span>
              </label>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={!agreeTerms || loading}
                  onClick={handleSubmit}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Submitting Application...' : 'Submit Application'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
