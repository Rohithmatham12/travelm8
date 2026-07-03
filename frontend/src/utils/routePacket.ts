type BudgetCategory = 'fuel' | 'food' | 'lodging' | 'activities' | 'misc';
interface SpendEntry { category: BudgetCategory; amount: number; description?: string; date: string; }
interface BudgetData {
  estimatedBudget: number | null;
  spendEntries: SpendEntry[];
  totals: { total: number; byCategory: Record<BudgetCategory, number> };
}

export interface PacketData {
  title: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  routePlan?: any;         // has routeSummary, aiInsights, stopOptionSets
  finalItinerary?: any;   // has calendarEvents[]
  budget?: BudgetData;
}

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
function fmtMins(m: number) {
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ''}`.trim() : `${m}m`;
}
function fmtDate(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const CAT_EMOJI: Record<string, string> = { fuel: '⛽', food: '🍔', lodging: '🏨', activities: '🎡', misc: '📦' };

export function generatePacketHtml(data: PacketData): string {
  const { title, destination, startDate, endDate, travelers, routePlan, finalItinerary, budget } = data;
  const rs = routePlan?.routeSummary;
  const ai = routePlan?.aiInsights;
  const stops = routePlan?.stopOptionSets ?? [];
  const events = finalItinerary?.calendarEvents ?? [];

  const riskColor = (r: string) => r === 'high' ? '#991b1b' : r === 'medium' ? '#92400e' : '#065f46';
  const riskBg   = (r: string) => r === 'high' ? '#fee2e2' : r === 'medium' ? '#fef3c7' : '#d1fae5';

  const budgetSection = budget ? `
<h2>Budget</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
  <tr>
    <td style="padding:6px 0"><strong>Estimated</strong></td>
    <td style="text-align:right">${budget.estimatedBudget !== null ? fmt(budget.estimatedBudget) : '—'}</td>
  </tr>
  <tr>
    <td style="padding:6px 0"><strong>Spent</strong></td>
    <td style="text-align:right;font-weight:700;">${fmt(budget.totals.total)}</td>
  </tr>
  ${budget.estimatedBudget !== null ? `<tr>
    <td style="padding:6px 0"><strong>${budget.totals.total > budget.estimatedBudget ? 'Over by' : 'Remaining'}</strong></td>
    <td style="text-align:right;color:${budget.totals.total > budget.estimatedBudget ? '#dc2626' : '#16a34a'};font-weight:700;">${fmt(Math.abs(budget.estimatedBudget - budget.totals.total))}</td>
  </tr>` : ''}
</table>
${Object.entries(budget.totals.byCategory).filter(([, v]) => v > 0).map(([cat, val]) =>
  `<div style="display:flex;justify-content:space-between;font-size:0.85rem;padding:3px 0;">${CAT_EMOJI[cat] || ''} ${cat.charAt(0).toUpperCase() + cat.slice(1)}<span>${fmt(val as number)}</span></div>`
).join('')}
${budget.spendEntries.length > 0 ? `
<h3 style="font-size:0.9rem;margin-top:16px;margin-bottom:8px;">Expense Log</h3>
<table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
  <thead><tr style="border-bottom:1px solid #e5e7eb;">
    <th style="text-align:left;padding:4px 6px;">Date</th>
    <th style="text-align:left;padding:4px 6px;">Category</th>
    <th style="text-align:left;padding:4px 6px;">Description</th>
    <th style="text-align:right;padding:4px 6px;">Amount</th>
  </tr></thead>
  <tbody>
    ${budget.spendEntries.map(e => `<tr style="border-bottom:1px solid #f3f4f6;">
      <td style="padding:4px 6px;">${e.date}</td>
      <td style="padding:4px 6px;">${CAT_EMOJI[e.category] || ''} ${e.category}</td>
      <td style="padding:4px 6px;">${e.description || ''}</td>
      <td style="padding:4px 6px;text-align:right;">${fmt(e.amount)}</td>
    </tr>`).join('')}
  </tbody>
</table>` : ''}
` : '';

  const itinerarySection = events.length > 0 ? `
<h2>Itinerary</h2>
${events.map((ev: any) => `
<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #f3f4f6;">
  <div style="font-size:0.78rem;color:#888;white-space:nowrap;min-width:56px;">${ev.startTime || ''}</div>
  <div>
    <div style="font-weight:700;font-size:0.9rem;">${ev.title || ''}</div>
    ${ev.description ? `<div style="font-size:0.82rem;color:#555;margin-top:2px;">${ev.description}</div>` : ''}
    ${ev.location ? `<div style="font-size:0.78rem;color:#888;margin-top:2px;">📍 ${ev.location}</div>` : ''}
  </div>
</div>`).join('')}
` : '';

  const stopsSection = stops.length > 0 ? `
<h2>Planned Stops</h2>
${stops.map((set: any) => `
<h3 style="font-size:0.88rem;color:#555;margin:16px 0 6px;">${set.label} (${set.distanceRange?.from}–${set.distanceRange?.to} mi)</h3>
${[...(set.pois || []), ...(set.restaurants || []), ...(set.motels || [])].map((s: any) => `
<div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px 14px;margin:6px 0;">
  <div style="font-weight:700;font-size:0.9rem;">${s.name} <span style="font-weight:400;color:#888;font-size:0.8rem;">${s.category || ''}</span></div>
  <div style="font-size:0.82rem;color:#555;margin-top:3px;">${s.description || ''}</div>
  ${s.address ? `<div style="font-size:0.78rem;color:#888;margin-top:2px;">📍 ${s.address}</div>` : ''}
  ${s.openHours ? `<div style="font-size:0.78rem;color:#888;">🕒 ${s.openHours}</div>` : ''}
  ${s.rating ? `<div style="font-size:0.78rem;color:#888;">★ ${s.rating.toFixed(1)}</div>` : ''}
</div>`).join('')}
`).join('')}
` : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — TravelM8 Route Packet</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Georgia, serif; max-width: 760px; margin: 40px auto; color: #111; padding: 0 20px; line-height: 1.5; }
  h1 { font-size: 1.5rem; border-bottom: 3px solid #F59E0B; padding-bottom: 8px; margin-bottom: 4px; }
  h2 { font-size: 1.05rem; color: #333; margin-top: 28px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  h3 { font-size: 0.92rem; }
  .route-line { font-size: 0.88rem; color: #666; margin-bottom: 16px; }
  .meta { display: flex; flex-wrap: wrap; gap: 24px; margin: 12px 0 8px; }
  .meta-item strong { display: block; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: #999; margin-bottom: 2px; }
  .meta-item span { font-size: 1.15rem; font-weight: 700; }
  .risk { display: inline-block; padding: 3px 11px; border-radius: 20px; font-weight: 700; font-size: 0.8rem; }
  .ai-box { background: #fffdf7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin: 12px 0; }
  .alert { padding: 9px 12px; border-radius: 4px; margin: 7px 0; font-size: 0.88rem; }
  .fatigue { background: #fef3c7; border-left: 4px solid #F59E0B; }
  .late    { background: #fee2e2; border-left: 4px solid #EF4444; }
  .tip     { background: #ecfeff; border-left: 4px solid #22D3EE; }
  @media print { body { margin: 20px; } }
  .footer { margin-top: 48px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 0.72rem; color: #aaa; }
</style>
</head>
<body>
<h1>${title}</h1>
${rs ? `<div class="route-line">${rs.origin} → ${rs.majorCities?.join(' → ')} → ${rs.destination}</div>` : destination ? `<div class="route-line">Destination: ${destination}</div>` : ''}

<div class="meta">
  ${startDate ? `<div class="meta-item"><strong>Dates</strong><span>${fmtDate(startDate)}${endDate ? ` – ${fmtDate(endDate)}` : ''}</span></div>` : ''}
  ${travelers ? `<div class="meta-item"><strong>Travelers</strong><span>${travelers}</span></div>` : ''}
  ${rs ? `
  <div class="meta-item"><strong>Distance</strong><span>${rs.totalDistance} mi</span></div>
  <div class="meta-item"><strong>Drive Time</strong><span>${fmtMins(rs.estimatedDriveTime)}</span></div>
  <div class="meta-item"><strong>Stops</strong><span>${rs.suggestedStops}</span></div>` : ''}
  ${ai ? `<div class="meta-item"><strong>Risk</strong><span class="risk" style="background:${riskBg(ai.riskLevel)};color:${riskColor(ai.riskLevel)}">${ai.riskLevel.toUpperCase()}</span></div>` : ''}
</div>

${ai ? `
<div class="ai-box">
  <strong style="font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;color:#D97706;">AI Copilot</strong>
  <p style="margin:6px 0 8px;font-size:0.9rem;">${ai.tripSummary}</p>
  ${ai.fatigueWarning ? `<div class="alert fatigue">⚠️ ${ai.fatigueWarning}</div>` : ''}
  ${ai.lateArrivalNote ? `<div class="alert late">🌙 ${ai.lateArrivalNote}</div>` : ''}
  ${ai.topTip ? `<div class="alert tip">💡 ${ai.topTip}</div>` : ''}
</div>` : ''}

${itinerarySection}
${stopsSection}
${budgetSection}

<div class="footer">Generated by TravelM8 · Print or save as PDF for offline use</div>
</body>
</html>`;
}

export function downloadPacket(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
