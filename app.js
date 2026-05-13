/**
 * UMDNS Smart Search - Core Logic
 * Handles data loading, smart ranking, and UI interactions.
 */

// --- Constants & Configuration ---

const STOPWORDS = new Set("a an and or of for to with without the unit units device devices machine machines equipment set sets system systems medical hospital portable mobile digital manual electric electrical adult paediatric pediatric infant neonatal new room bay ed emergency".split(" "));

const ALIASES = {
  alarm: ["alarms", "warning", "alert", "bell", "buzzer", "indicator"],
  bell: ["alarm", "alarms", "alert", "buzzer", "warning"],
  buzzer: ["alarm", "alarms", "alert", "bell", "warning"],
  alert: ["alarm", "alarms", "warning", "indicator"],
  bp: ["blood pressure", "sphygmomanometer", "cuff", "nibp"],
  nibp: ["blood pressure", "sphygmomanometer", "cuff"],
  spo2: ["pulse oximeter", "oximeter", "oxygen saturation"],
  sats: ["pulse oximeter", "oximeter", "oxygen saturation"],
  ecg: ["ekg", "electrocardiograph", "cardiac monitor", "heart monitor"],
  ekg: ["ecg", "electrocardiograph", "cardiac monitor", "heart monitor"],
  defib: ["defibrillator", "defibrillator monitor", "cardiac resuscitation"],
  aed: ["defibrillator", "automated external defibrillator"],
  monitor: ["physiologic monitoring", "vital signs", "cardiac monitor", "patient monitor"],
  vital: ["physiologic monitoring", "patient monitor", "heart rate", "respiration", "temperature"],
  ventilator: ["ventilation", "respirator", "breathing support", "pulmonary"],
  respirator: ["ventilator", "ventilation", "breathing support", "pulmonary"],
  ambu: ["manual resuscitator", "resuscitator", "bag valve mask", "bvm"],
  bvm: ["manual resuscitator", "resuscitator", "bag valve mask"],
  suction: ["aspirator", "vacuum", "suction regulator"],
  vacuum: ["suction", "aspirator"],
  oxygen: ["o2", "oxygen administration", "oxygen concentrator", "oxygen analyzer", "oxygen regulator"],
  o2: ["oxygen", "oxygen administration"],
  nebuliser: ["nebulizer", "aerosol"],
  nebulizer: ["nebuliser", "aerosol"],
  drip: ["infusion", "intravenous", "iv"],
  iv: ["intravenous", "infusion", "catheter", "cannula"],
  syringe: ["injector", "infusion pump"],
  pump: ["infusion", "syringe pump", "enteral feeding pump"],
  laryngoscope: ["airway", "intubation", "laryngoscopy"],
  intubation: ["laryngoscope", "airway", "endotracheal"],
  stretcher: ["trolley", "gurney", "mobile stretcher", "patient transport"],
  gurney: ["stretcher", "trolley", "patient transport"],
  trolley: ["cart", "stretcher", "patient transport"],
  cart: ["trolley", "resuscitation cart", "medication cart"],
  wheelchair: ["chair", "patient transport", "mobility"],
  autoclave: ["steam sterilizer", "sterilizing unit", "sterilization"],
  sterilizer: ["sterilising", "sterilizing", "autoclave", "steam"],
  fridge: ["refrigerator", "cold storage"],
  freezer: ["refrigerator", "cold storage"],
  ultrasound: ["sonography", "scanner", "ultrasonic"],
  usg: ["ultrasound", "sonography", "ultrasonic"],
  xray: ["radiographic", "radiology", "x ray"],
  ct: ["computed tomography", "scanner"],
  glucose: ["blood glucose", "analyzer", "monitor"],
  glucometer: ["blood glucose", "analyzer", "monitor"],
  thermometer: ["temperature", "probe"],
  temperature: ["thermometer", "probe", "monitor"],
  cabinet: ["storage", "medicine cabinet", "instrument cabinet"],
  light: ["lamp", "examination light", "surgical light"],
  lamp: ["light", "examination light", "surgical light"],
  bed: ["patient bed", "electric bed", "hospital bed"],
  mattress: ["bed", "pressure pad"]
};

const CATEGORY_HINTS = [
  { q: ["airway", "intubation", "laryngoscope", "ventilator", "respirator", "oxygen", "ambu", "bvm", "nebulizer", "nebuliser", "suction", "mask", "cpap"], t: ["airway", "laryngoscope", "ventilation", "resuscitator", "pulmonary", "oxygen", "nebulizer", "aspirator", "suction", "mask", "continuous positive airway"], boost: 18, name: "airway/breathing" },
  { q: ["ecg", "ekg", "cardiac", "heart", "defib", "aed", "monitor", "vital", "bp", "nibp", "spo2", "oximeter"], t: ["electrocardiograph", "ecg", "cardiac", "defibrillator", "monitor", "heart", "oximeter", "sphygmomanometer", "physiologic"], boost: 20, name: "cardiac/monitoring" },
  { q: ["infusion", "syringe", "pump", "drip", "iv", "intravenous", "injector", "cannula", "catheter"], t: ["infusion", "syringe", "pump", "intravenous", "injector", "cannula", "catheter", "administration set"], boost: 18, name: "infusion/injection" },
  { q: ["bed", "stretcher", "trolley", "gurney", "cart", "wheelchair", "chair", "table", "mattress"], t: ["bed", "stretcher", "cart", "chair", "wheelchair", "mattress", "support"], boost: 12, name: "transport/furniture" },
  { q: ["xray", "radiology", "radiographic", "ultrasound", "usg", "scanner", "ct", "mri", "scope", "endoscope"], t: ["radiographic", "scanner", "computed tomography", "ultrasound", "ultrasonic", "scope", "endoscope"], boost: 16, name: "imaging/diagnostic" },
  { q: ["sterile", "sterilizer", "steriliser", "autoclave", "disinfect", "washer", "cleaner"], t: ["sterilizing", "sterilization", "disinfector", "washer", "cleaner", "germicide"], boost: 16, name: "sterile/cleaning" },
  { q: ["cabinet", "rack", "storage", "fridge", "refrigerator", "freezer", "medicine", "instrument"], t: ["cabinet", "rack", "refrigerator", "medicine", "instrument", "storage"], boost: 10, name: "storage/general" }
];

// --- State ---

let DB = [];
let currentIndex = -1;

// --- Elements ---

const qEl = document.getElementById('q');
const resultsEl = document.getElementById('results');
const statusEl = document.getElementById('status');
const toastEl = document.getElementById('toast');

// --- Utilities ---

function normalize(s) {
  return String(s || '').toLowerCase()
    .replaceAll('x-ray', 'xray')
    .replaceAll('x ray', 'xray')
    .replaceAll('e.c.g', 'ecg')
    .replaceAll('e.k.g', 'ekg')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stem(tok) {
  tok = normalize(tok);
  if (tok.length > 4 && tok.endsWith('ies')) return tok.slice(0, -3) + 'y';
  if (tok.length > 5 && tok.endsWith('ing')) return tok.slice(0, -3);
  if (tok.length > 4 && tok.endsWith('es')) return tok.slice(0, -2);
  if (tok.length > 3 && tok.endsWith('s')) return tok.slice(0, -1);
  return tok;
}

function tokens(s) {
  return normalize(s).split(' ').filter(x => x && !STOPWORDS.has(x));
}

function expandQuery(q) {
  const base = normalize(q);
  const parts = [base];
  for (const tok of base.split(' ')) {
    if (ALIASES[tok]) parts.push(...ALIASES[tok]);
  }
  return normalize(parts.join(' '));
}

function ratio(a, b) {
  if (!a || !b) return 0;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - (dp[m][n] / Math.max(m, n));
}

function parseCSV(text) {
  const rows = [];
  let i = 0, row = [], val = '', quote = false;
  while (i < text.length) {
    const c = text[i];
    if (quote) {
      if (c === '"' && text[i + 1] === '"') { val += '"'; i++; }
      else if (c === '"') quote = false;
      else val += c;
    } else {
      if (c === '"') quote = true;
      else if (c === ',') { row.push(val); val = ''; }
      else if (c === '\n') { row.push(val); rows.push(row); row = []; val = ''; }
      else if (c !== '\r') val += c;
    }
    i++;
  }
  if (val || row.length) { row.push(val); rows.push(row); }
  return rows;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// --- Search Engine ---

function calculateScore(q, item) {
  const qn = normalize(q);
  const qe = expandQuery(q);
  const qt = new Set(tokens(qe));
  const raw = new Set(tokens(q));
  const qst = new Set([...qt].map(stem));

  let score = 0, reasons = [];

  if (qn && item.norm.includes(qn)) { score += 45; reasons.push('Direct phrase'); }
  if (item.norm && qe.includes(item.norm)) { score += 45; reasons.push('Term phrase'); }

  const overlap = [...qst].filter(x => item.stems.has(x));
  if (overlap.length) {
    score += 18 * overlap.length + Math.min(12, 18 * overlap.length / Math.max(qst.size, 1));
    reasons.push('Keywords: ' + overlap.slice(0, 4).join(', '));
  }

  let aliasHit = 0;
  for (const r of raw) {
    for (const a of (ALIASES[r] || [])) {
      if (item.norm.includes(normalize(a))) { aliasHit++; break; }
    }
  }
  if (aliasHit) { score += 14 * aliasHit; reasons.push('Related matches'); }

  for (const cat of CATEGORY_HINTS) {
    if (cat.q.some(x => qe.includes(x)) && cat.t.some(x => item.norm.includes(x))) {
      score += cat.boost;
      reasons.push(cat.name);
    }
  }

  if (qn.length >= 3) {
    const fr = ratio(qn, item.norm);
    if (fr > 0.55) { score += fr * 18; reasons.push('Fuzzy phrase'); }
    else {
      let best = 0;
      for (const a of qst) {
        for (const b of item.stems) {
          best = Math.max(best, ratio(a, b));
        }
      }
      if (best > 0.78) { score += best * 12; reasons.push('Fuzzy word'); }
    }
  }

  return { score, reasons: [...new Set(reasons)].slice(0, 3).join('; ') };
}

function renderResults(ranked, q) {
  if (!ranked.length) {
    resultsEl.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <h3>No strong match found</h3>
        <p>Try a broader term such as "monitor", "oxygen", or "pump".</p>
      </div>`;
    return;
  }

  resultsEl.innerHTML = ranked.map((r, i) => `
    <div class="result-card" data-code="${r.code}" data-term="${escapeHtml(r.term)}" data-index="${i}" onclick="copyToClipboard('${r.code}', '${escapeHtml(r.term).replace(/'/g, "\\'")}')">
      <div class="result-info">
        <span class="result-code-tag">${r.code}</span>
        <div class="result-term">${escapeHtml(r.term)}</div>
        <div class="result-reason">${escapeHtml(r.reasons || 'Ranked match')}</div>
      </div>
      <div class="result-score-circle">${Math.round(r.score)}</div>
    </div>
  `).join('');
}

function search() {
  const q = qEl.value.trim();
  currentIndex = -1;

  if (!q) {
    resultsEl.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <h3>Ready to search</h3>
        <p>Start typing medical equipment terms above to see results.</p>
      </div>`;
    statusEl.textContent = `${DB.length.toLocaleString()} UMDNS terms loaded`;
    return;
  }

  const qst = new Set(tokens(expandQuery(q)).map(stem));
  let candidates = DB.filter(x => [...qst].some(t => x.search.includes(' ' + t + ' ') || x.norm.includes(t)));
  if (candidates.length < 50) candidates = DB;

  const ranked = candidates
    .map(x => ({ ...x, ...calculateScore(q, x) }))
    .filter(x => x.score > 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  statusEl.textContent = `${ranked.length} result${ranked.length === 1 ? '' : 's'} for "${q}"`;
  renderResults(ranked, q);
}

// --- Interaction Helpers ---

function copyToClipboard(code, term) {
  const text = term ? `${code}\t${term}` : code;
  navigator.clipboard.writeText(text).then(() => {
    toastEl.textContent = term ? `Code & Term copied to clipboard!` : `Code ${code} copied to clipboard!`;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2500);
  });
}

// --- Initialization & Events ---

let raf = 0;
qEl.addEventListener('input', () => {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(search);
});

document.getElementById('clearBtn').onclick = () => {
  qEl.value = '';
  qEl.focus();
  search();
};

// Keyboard Navigation
qEl.addEventListener('keydown', (e) => {
  const cards = document.querySelectorAll('.result-card');
  if (!cards.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    currentIndex = Math.min(currentIndex + 1, cards.length - 1);
    updateSelection(cards);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    currentIndex = Math.max(currentIndex - 1, 0);
    updateSelection(cards);
  } else if (e.key === 'Enter' && currentIndex >= 0) {
    e.preventDefault();
    const code = cards[currentIndex].getAttribute('data-code');
    const term = cards[currentIndex].getAttribute('data-term');
    copyToClipboard(code, term);
  }
});

function updateSelection(cards) {
  cards.forEach((c, i) => {
    if (i === currentIndex) {
      c.style.borderColor = 'var(--accent)';
      c.style.boxShadow = 'var(--card-shadow)';
      c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      c.style.borderColor = 'var(--border)';
      c.style.boxShadow = 'none';
    }
  });
}

// Data Fetching
fetch('umdns_codes.csv')
  .then(r => r.text())
  .then(text => {
    const rows = parseCSV(text).slice(1);
    DB = rows.map(r => {
      const code = (r[0] || '').trim();
      const term = (r[1] || '').trim();
      const norm = normalize(term);
      const toks = new Set(tokens(term));
      const stems = new Set([...toks].map(stem));
      return {
        code,
        term,
        norm,
        tokens: toks,
        stems,
        search: ' ' + norm + ' ' + [...stems].join(' ') + ' '
      };
    }).filter(x => x.code && x.term);
    
    statusEl.textContent = `${DB.length.toLocaleString()} UMDNS terms loaded`;
    search(); // Run initial search if query is pre-filled
  })
  .catch(err => {
    console.error(err);
    statusEl.textContent = 'Error loading database';
    resultsEl.innerHTML = '<div class="empty-state"><h3>Database load failed</h3><p>Could not load umdns_codes.csv. Please ensure it exists in the root directory.</p></div>';
  });
