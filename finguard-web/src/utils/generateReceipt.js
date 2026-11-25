export function generateLoanReceipt(loan) {
  const receiptDate = new Date().toLocaleString();
  const amountFormatted = Number(loan.requestedAmount || 0).toLocaleString();
  const incomeFormatted = Number(loan.monthlyIncome || 0).toLocaleString();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>FinGuard Receipt - Loan #${loan.id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; padding: 32px; }
          .receipt { max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15,23,42,0.06); }
          .topbar { height: 6px; background: linear-gradient(90deg, #2563eb, #f43f5e, #f59e0b); }
          .header { padding: 28px 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
          .brand { font-size: 20px; font-weight: 800; color: #0f172a; }
          .sub { font-size: 12px; color: #64748b; margin-top: 2px; }
          .badge { padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
          .body { padding: 28px 32px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .field label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; }
          .field span { display: block; font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 4px; }
          .ai-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
          .ai-title { font-size: 12px; font-weight: 700; color: #b45309; margin-bottom: 6px; }
          .ai-text { font-size: 13px; color: #334155; line-height: 1.5; }
          .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
          @media print { body { background: #fff; padding: 0; } .receipt { box-shadow: none; border: 1px solid #cbd5e1; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="topbar"></div>
          <div class="header">
            <div>
              <div class="brand">FinGuard</div>
              <div class="sub">Official Loan Application & Underwriting Receipt</div>
            </div>
            <div class="badge">${loan.status}</div>
          </div>
          <div class="body">
            <div class="grid">
              <div class="field"><label>Reference Number</label><span>FG-${String(loan.id).padStart(6, '0')}</span></div>
              <div class="field"><label>Generated On</label><span>${receiptDate}</span></div>
              <div class="field"><label>Borrower Name</label><span>${loan.borrowerName}</span></div>
              <div class="field"><label>National ID</label><span>${loan.borrowerNationalId}</span></div>
              <div class="field"><label>Requested Amount</label><span>KES ${amountFormatted}</span></div>
              <div class="field"><label>Repayment Term</label><span>${loan.repaymentMonths} Months</span></div>
              <div class="field"><label>Declared Monthly Income</label><span>KES ${incomeFormatted}</span></div>
              <div class="field"><label>Loan Purpose</label><span>${loan.purpose}</span></div>
            </div>

            <div class="ai-box">
              <div class="ai-title">FinGuard Risk Grade: ${loan.aiRiskLevel || 'N/A'} (${loan.aiRiskScore ?? '—'}/100)</div>
              <div class="ai-text">${loan.aiRecommendation || 'Pending AI evaluation.'}</div>
            </div>

            ${loan.reviewerNotes ? `
              <div class="field">
                <label>Underwriting Decision Notes (${loan.reviewedByEmail || 'Credit Analyst'})</label>
                <span>${loan.reviewerNotes}</span>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <span>System-generated receipt • Tamper-evident audit logged</span>
            <span>FinGuard Financial Services</span>
          </div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `;

  const win = window.open('', '_blank', 'width=800,height=900');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
