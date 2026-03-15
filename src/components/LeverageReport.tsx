'use client';

import { Lever, FulcrumStatus } from '@/lib/types';
import { detectSequenceViolations } from '@/lib/store';

const statusLabels: Record<FulcrumStatus, string> = {
  verified: 'VERIFIED',
  assumed: 'ASSUMED',
  at_risk: 'AT RISK',
  absent: 'ABSENT',
};

const statusSymbols: Record<FulcrumStatus, string> = {
  verified: '\u2713',
  assumed: '\u25CB',
  at_risk: '\u26A0',
  absent: '\u2717',
};

function fulcrumHealthScore(levers: Lever[], type: 'material' | 'epistemic' | 'relational'): number {
  if (levers.length === 0) return 0;
  const weights: Record<FulcrumStatus, number> = { verified: 100, assumed: 60, at_risk: 25, absent: 0 };
  const total = levers.reduce((sum, l) => sum + weights[l.fulcrums[type].status], 0);
  return Math.round(total / levers.length);
}

export function generateLeverageReport(levers: Lever[]) {
  const totalAlerts = levers.reduce((sum, l) => sum + detectSequenceViolations(l).length, 0);
  const avgLeverage = levers.length > 0
    ? Math.round(levers.reduce((sum, l) => sum + l.effectiveLeverage, 0) / levers.length)
    : 0;
  const topLever = levers.length > 0
    ? [...levers].sort((a, b) => b.effectiveLeverage - a.effectiveLeverage)[0]
    : null;

  const matHealth = fulcrumHealthScore(levers, 'material');
  const epiHealth = fulcrumHealthScore(levers, 'epistemic');
  const relHealth = fulcrumHealthScore(levers, 'relational');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const leverRows = levers.map((l) => {
    const violations = detectSequenceViolations(l);
    return `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #2a2a35;font-weight:500;">${l.name}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #2a2a35;color:#888;font-size:11px;">${l.category}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #2a2a35;text-align:center;font-family:monospace;color:#8b5cf6;">${l.properties.r}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #2a2a35;text-align:center;font-family:monospace;color:#06b6d4;">${l.properties.l}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #2a2a35;text-align:center;font-family:monospace;color:#ec4899;">${l.properties.q}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #2a2a35;text-align:right;font-family:monospace;font-weight:bold;color:#c4a35a;">${l.effectiveLeverage}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #2a2a35;text-align:center;font-size:11px;">
          <span style="color:${l.fulcrums.material.status === 'verified' ? '#22c55e' : l.fulcrums.material.status === 'assumed' ? '#f59e0b' : l.fulcrums.material.status === 'at_risk' ? '#ef4444' : '#555'};">${statusSymbols[l.fulcrums.material.status]}</span>
          <span style="color:${l.fulcrums.epistemic.status === 'verified' ? '#22c55e' : l.fulcrums.epistemic.status === 'assumed' ? '#f59e0b' : l.fulcrums.epistemic.status === 'at_risk' ? '#ef4444' : '#555'};">${statusSymbols[l.fulcrums.epistemic.status]}</span>
          <span style="color:${l.fulcrums.relational.status === 'verified' ? '#22c55e' : l.fulcrums.relational.status === 'assumed' ? '#f59e0b' : l.fulcrums.relational.status === 'at_risk' ? '#ef4444' : '#555'};">${statusSymbols[l.fulcrums.relational.status]}</span>
        </td>
        <td style="padding:6px 10px;border-bottom:1px solid #2a2a35;text-align:center;color:${violations.length > 0 ? '#ef4444' : '#22c55e'};font-size:11px;">${violations.length > 0 ? violations.length + ' alert(s)' : 'OK'}</td>
      </tr>`;
  }).join('');

  const leverDetails = levers.map((l) => `
    <div style="margin-bottom:16px;padding:12px;background:#12121a;border:1px solid #2a2a35;border-radius:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-weight:600;font-size:13px;">${l.name}</span>
        <span style="font-family:monospace;color:#c4a35a;font-weight:bold;">${l.effectiveLeverage}</span>
      </div>
      <p style="color:#888;font-size:11px;margin:0 0 8px;">${l.description || 'No description'}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:10px;">
        <div style="padding:6px;background:rgba(29,158,117,0.1);border-radius:4px;">
          <div style="color:#1D9E75;font-weight:600;">Material: ${statusLabels[l.fulcrums.material.status]}</div>
          <div style="color:#888;margin-top:2px;">${l.fulcrums.material.evidence || 'No evidence'}</div>
        </div>
        <div style="padding:6px;background:rgba(55,138,221,0.1);border-radius:4px;">
          <div style="color:#378ADD;font-weight:600;">Epistemic: ${statusLabels[l.fulcrums.epistemic.status]}</div>
          <div style="color:#888;margin-top:2px;">${l.fulcrums.epistemic.evidence || 'No evidence'}</div>
        </div>
        <div style="padding:6px;background:rgba(216,90,48,0.1);border-radius:4px;">
          <div style="color:#D85A30;font-weight:600;">Relational: ${statusLabels[l.fulcrums.relational.status]}</div>
          <div style="color:#888;margin-top:2px;">${l.fulcrums.relational.evidence || 'No evidence'}</div>
        </div>
      </div>
    </div>
  `).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Leverage Report — LeverageOS</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DM Sans', sans-serif; background: #0a0a0f; color: #e8e4df; padding: 32px; }
    @media print {
      body { padding: 16px; background: #0a0a0f; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:20px;">
    <button onclick="window.print()" style="padding:8px 20px;background:#c4a35a;color:#0a0a0f;border:none;border-radius:6px;font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;font-size:13px;">
      Print / Save as PDF
    </button>
    <span style="color:#888;font-size:12px;margin-left:12px;">Use "Save as PDF" in the print dialog for a PDF file.</span>
  </div>

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid #c4a35a33;padding-bottom:16px;margin-bottom:24px;">
    <div>
      <h1 style="font-family:'Cormorant Garamond',serif;font-size:28px;color:#c4a35a;letter-spacing:1px;">LeverageOS</h1>
      <p style="font-size:11px;color:#888;font-family:'JetBrains Mono',monospace;">R × L × Q — Leverage Report</p>
    </div>
    <div style="text-align:right;">
      <p style="font-size:11px;color:#888;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p style="font-size:10px;color:#555;font-family:'JetBrains Mono',monospace;">The Invisible Fulcrum — Garcia Bach & Hypatia, 2026</p>
    </div>
  </div>

  <!-- Summary Stats -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:12px;margin-bottom:24px;">
    <div style="background:#12121a;border:1px solid #2a2a35;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:bold;color:#c4a35a;">${levers.length}</div>
      <div style="font-size:10px;color:#888;">Active Levers</div>
    </div>
    <div style="background:#12121a;border:1px solid #2a2a35;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:bold;color:#e8e4df;">${avgLeverage}</div>
      <div style="font-size:10px;color:#888;">Avg R×L×Q</div>
    </div>
    <div style="background:#12121a;border:1px solid #1D9E7533;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:bold;color:#1D9E75;">${matHealth}%</div>
      <div style="font-size:10px;color:#888;">Material</div>
    </div>
    <div style="background:#12121a;border:1px solid #378ADD33;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:bold;color:#378ADD;">${epiHealth}%</div>
      <div style="font-size:10px;color:#888;">Epistemic</div>
    </div>
    <div style="background:#12121a;border:1px solid #D85A3033;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:bold;color:#D85A30;">${relHealth}%</div>
      <div style="font-size:10px;color:#888;">Relational</div>
    </div>
  </div>

  ${totalAlerts > 0 ? `
  <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:10px 14px;margin-bottom:24px;font-size:12px;color:#ef4444;">
    ⚠ ${totalAlerts} sequence violation(s) detected across ${levers.filter(l => detectSequenceViolations(l).length > 0).length} lever(s). Review the Sequence Analyzer.
  </div>` : ''}

  ${topLever ? `
  <div style="background:rgba(196,163,90,0.05);border:1px solid rgba(196,163,90,0.2);border-radius:8px;padding:10px 14px;margin-bottom:24px;font-size:12px;color:#c4a35a;">
    Top lever: <strong>${topLever.name}</strong> with R×L×Q of ${topLever.effectiveLeverage}
  </div>` : ''}

  <!-- Lever Portfolio Table -->
  <h2 style="font-family:'Cormorant Garamond',serif;font-size:18px;margin-bottom:12px;">Lever Portfolio</h2>
  <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px;">
    <thead>
      <tr style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:1px;">
        <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #2a2a35;">Name</th>
        <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #2a2a35;">Cat</th>
        <th style="text-align:center;padding:6px 10px;border-bottom:2px solid #2a2a35;">R</th>
        <th style="text-align:center;padding:6px 10px;border-bottom:2px solid #2a2a35;">L</th>
        <th style="text-align:center;padding:6px 10px;border-bottom:2px solid #2a2a35;">Q</th>
        <th style="text-align:right;padding:6px 10px;border-bottom:2px solid #2a2a35;">R×L×Q</th>
        <th style="text-align:center;padding:6px 10px;border-bottom:2px solid #2a2a35;">M E R</th>
        <th style="text-align:center;padding:6px 10px;border-bottom:2px solid #2a2a35;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${leverRows}
    </tbody>
  </table>

  <!-- Lever Details -->
  <h2 style="font-family:'Cormorant Garamond',serif;font-size:18px;margin-bottom:12px;">Fulcrum Detail</h2>
  ${leverDetails}

  <!-- Footer -->
  <div style="margin-top:24px;padding-top:12px;border-top:1px solid #2a2a3555;display:flex;justify-content:space-between;font-size:9px;color:#555;">
    <span>Generated by LeverageOS — thefulcrumproject.org</span>
    <span>Formula: Effective Leverage = Rigidity × Length × Quality of Material</span>
  </div>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}
