// Flight Deck — generates the animated SVGs for the njp-coder profile README.
// No dependencies. Runs daily in .github/workflows/flight-deck.yml.
//   node scripts/build.mjs            (uses GITHUB_TOKEN if set, else unauthenticated)
import { writeFileSync } from 'node:fs';

const USER = 'njp-coder';
const SKIP = new Set([USER, 'docs']);          // repos that aren't "flights"
const ROWS = 6;

const C = {
  bg: '#0b0b0c', panel: '#121214', cell: '#19191c', line: '#2a2a2e',
  amber: '#FF914D', amberDim: '#FF914D66', ink: '#F3EFE8', mute: '#8b8780',
};
const MONO = "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
const esc = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

// ---------- data ----------
async function getRepos() {
  const headers = { 'User-Agent': USER, Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/users/${USER}/repos?sort=pushed&per_page=50`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  return (await res.json()).filter((r) => !r.fork && !r.archived && !SKIP.has(r.name));
}

const DAY = 864e5;
const daysAgo = (iso) => Math.floor((Date.now() - new Date(iso)) / DAY);
function status(d) {
  if (d <= 7) return { text: 'IN FLIGHT', live: true };
  if (d <= 30) return { text: 'CRUISING', live: false };
  return { text: 'LANDED', live: false };
}

// ---------- HUD header ----------
function hud({ builds, lastFlight, shipSpeed }) {
  const W = 840, H = 300, cx = 650, cy = 150, R = 118;
  const ladder = [-20, -10, 10, 20].map((p) => {
    const y = cy - p * 3.2, w = Math.abs(p) === 10 ? 70 : 46;
    const dash = p < 0 ? 'stroke-dasharray="6 5"' : '';
    return `<line x1="${cx - w}" y1="${y}" x2="${cx - 18}" y2="${y}" ${dash}/><line x1="${cx + 18}" y1="${y}" x2="${cx + w}" y2="${y}" ${dash}/>
      <text x="${cx - w - 6}" y="${y + 4}" text-anchor="end">${Math.abs(p)}</text><text x="${cx + w + 6}" y="${y + 4}">${Math.abs(p)}</text>`;
  }).join('');
  const bankTicks = [-45, -30, -20, -10, 0, 10, 20, 30, 45].map((a) => {
    const r1 = R - 2, r2 = a % 30 === 0 ? R - 14 : R - 9, t = (a - 90) * Math.PI / 180;
    return `<line x1="${cx + r1 * Math.cos(t)}" y1="${cy + r1 * Math.sin(t)}" x2="${cx + r2 * Math.cos(t)}" y2="${cy + r2 * Math.sin(t)}"/>`;
  }).join('');
  // heading tape: repeat labels so a translateX loop is seamless
  const hdg = ['N', '030', '060', 'E', '120', '150', 'S', '210', '240', 'W', '300', '330'];
  const tape = [...hdg, ...hdg].map((h, i) => `<text x="${i * 40}" y="0" text-anchor="middle">${h}</text><line x1="${i * 40 + 20}" y1="-14" x2="${i * 40 + 20}" y2="-10"/>`).join('');
  const typed = '> building AI systems that work in the real world';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="NJPX flight deck: Nagajyothi Prakash, aeronautical engineer turned CTO">
<style>
  text{font-family:${MONO};fill:${C.ink}}
  .hud line,.hud path,.hud circle{stroke:${C.amber};fill:none;stroke-width:1.4}
  .hud text{fill:${C.amber};font-size:10px}
  .k{font-size:11px;letter-spacing:3px;fill:${C.amber}}
  .name{font-size:34px;font-weight:700;letter-spacing:-0.5px}
  .sub{font-size:13px;fill:${C.mute}}
  .typed{font-size:14px;fill:${C.ink}}
  .stat{font-size:11px;fill:${C.mute};letter-spacing:1px}
  .stat tspan.v{fill:${C.amber}}
  .horizon{animation:bank 9s ease-in-out infinite;transform-origin:${cx}px ${cy}px}
  @keyframes bank{0%,100%{transform:rotate(-6deg) translateY(4px)}50%{transform:rotate(5deg) translateY(-6px)}}
  .tape{animation:hdg 14s linear infinite}
  @keyframes hdg{to{transform:translateX(-480px)}}
  .type{animation:type 3.2s steps(${typed.length}) .6s both}
  @keyframes type{from{transform:scaleX(0)}to{transform:scaleX(1)}}
  .type{transform-box:fill-box;transform-origin:left center}
  .caret{animation:blink 1s steps(1) infinite}
  @keyframes blink{50%{opacity:0}}
  .wing{animation:flut .09s linear infinite alternate;transform-box:fill-box;transform-origin:center}
  @keyframes flut{to{transform:scaleY(.35)}}
  .scan{animation:scan 6s linear infinite}
  @keyframes scan{from{transform:translateY(-20px)}to{transform:translateY(${H}px)}}
</style>
<defs>
  <clipPath id="ball"><circle cx="${cx}" cy="${cy}" r="${R - 16}"/></clipPath>
  <clipPath id="tapeClip"><rect x="${cx - 100}" y="8" width="200" height="22"/></clipPath>
  <clipPath id="typeClip"><rect class="type" x="40" y="168" width="${typed.length * 8.45 + 4}" height="24"/></clipPath>
  <pattern id="lines" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#ffffff" opacity=".018"/></pattern>
  <linearGradient id="glow" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${C.amber}" stop-opacity="0"/><stop offset="1" stop-color="${C.amber}" stop-opacity=".07"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" rx="18" fill="${C.bg}"/>
<rect width="${W}" height="${H}" rx="18" fill="url(#lines)"/>
<rect class="scan" x="0" y="0" width="${W}" height="20" fill="url(#glow)"/>

<!-- left: identity -->
<text x="40" y="62" class="k">CALLSIGN // NJPX</text>
<text x="40" y="112" class="name">Nagajyothi Prakash</text>
<text x="40" y="142" class="sub">aeronautical engineer → technical architect → CTO</text>
<g clip-path="url(#typeClip)"><text x="40" y="186" class="typed">${esc(typed)}</text></g>
<rect class="caret" x="${40 + typed.length * 8.45 + 2}" y="173" width="8" height="16" fill="${C.amber}"/>
<line x1="40" y1="222" x2="470" y2="222" stroke="${C.line}"/>
<text x="40" y="250" class="stat">BUILDS LOGGED <tspan class="v">${builds}</tspan>   ·   LAST FLIGHT <tspan class="v">${lastFlight}</tspan>   ·   ACTIVE THIS MONTH <tspan class="v">${shipSpeed}</tspan></text>

<!-- right: attitude indicator -->
<g class="hud">
  <g clip-path="url(#tapeClip)"><g transform="translate(${cx - 100} 26)"><g class="tape">${tape}</g></g></g>
  <path d="M${cx} 34 l-5 7 h10 z" fill="${C.amber}"/>
  <circle cx="${cx}" cy="${cy}" r="${R}" stroke-opacity=".35"/>
  ${bankTicks}
  <g clip-path="url(#ball)"><g class="horizon">
    <rect x="${cx - 200}" y="${cy}" width="400" height="200" fill="${C.amber}" fill-opacity=".09" stroke="none"/>
    <line x1="${cx - 200}" y1="${cy}" x2="${cx + 200}" y2="${cy}" stroke-width="2"/>
    ${ladder}
  </g></g>
  <path d="M${cx - 62} ${cy} h40 l10 12 l10 -12 l10 12 l10 -12 h40" stroke-width="2.4" stroke="${C.ink}"/>
  <circle cx="${cx}" cy="${cy}" r="3" fill="${C.ink}" stroke="none"/>
  <text x="${cx}" y="${cy + R + 22}" text-anchor="middle" style="letter-spacing:3px">ALT ▸ CTO</text>
</g>

<!-- signature: a dragonfly crosses the deck -->
<g opacity=".95">
  <g><g transform="scale(1.5)">
    <path d="M-14 0 h30" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="17" cy="0" r="3.4" fill="${C.ink}"/>
    <ellipse class="wing" cx="4" cy="-8" rx="4" ry="9" fill="${C.amber}" fill-opacity=".55" transform="rotate(-20 4 -8)"/>
    <ellipse class="wing" cx="4" cy="8" rx="4" ry="9" fill="${C.amber}" fill-opacity=".55" transform="rotate(20 4 8)"/>
    <ellipse class="wing" cx="-3" cy="-8" rx="3.4" ry="8" fill="${C.amber}" fill-opacity=".4" transform="rotate(25 -3 -8)"/>
    <ellipse class="wing" cx="-3" cy="8" rx="3.4" ry="8" fill="${C.amber}" fill-opacity=".4" transform="rotate(-25 -3 8)"/></g>
    <animateMotion dur="16s" repeatCount="indefinite" rotate="auto" keyPoints="0;0;1" keyTimes="0;.45;1" calcMode="linear"
      path="M-40 236 C 160 150, 300 300, 470 200 S 700 40, 900 90"/>
  </g>
</g>
</svg>`;
}

// ---------- departures board ----------
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
let seed = 7;
const rnd = () => GLYPHS[(seed = (seed * 9301 + 49297) % 233280) % GLYPHS.length];

function flapRow(str, x, y, n, delay, cls = '') {
  const cw = 17, ch = 26;
  let out = '';
  for (let i = 0; i < n; i++) {
    const c = (str[i] || ' ').toUpperCase(), cxp = x + i * (cw + 2), d = (delay + i * 0.045).toFixed(2);
    out += `<rect x="${cxp}" y="${y}" width="${cw}" height="${ch}" rx="2.5" fill="${C.cell}"/>`;
    if (c !== ' ') {
      out += `<text x="${cxp + cw / 2}" y="${y + 18.5}" class="f s" style="animation-delay:${d}s">${rnd()}</text>`;
      out += `<text x="${cxp + cw / 2}" y="${y + 18.5}" class="f s" style="animation-delay:${(+d + 0.09).toFixed(2)}s">${rnd()}</text>`;
      out += `<text x="${cxp + cw / 2}" y="${y + 18.5}" class="f fin ${cls}" style="animation-delay:${(+d + 0.18).toFixed(2)}s">${esc(c)}</text>`;
    }
    out += `<line x1="${cxp}" y1="${y + ch / 2}" x2="${cxp + cw}" y2="${y + ch / 2}" stroke="${C.bg}" stroke-width="1.2"/>`;
  }
  return out;
}

function board(repos) {
  const W = 840, top = 92, rowH = 40, H = top + ROWS * rowH + 64;
  const cols = { date: 34, flight: 150, dest: 262, status: 640 };
  const rows = repos.slice(0, ROWS).map((r, i) => {
    const y = top + i * rowH, d = daysAgo(r.pushed_at), st = status(d);
    const date = new Date(r.pushed_at).toUTCString().slice(5, 11).replace(' ', '').toUpperCase(); // 06OCT
    const flight = `NJ${String(101 + i * 7).padStart(3, '0')}`;
    const dest = r.name.replace(/[-_]/g, ' ').slice(0, 19);
    const base = 0.3 + i * 0.22;
    return flapRow(date, cols.date, y, 5, base)
      + flapRow(flight, cols.flight, y, 5, base + 0.1)
      + flapRow(dest, cols.dest, y, 19, base + 0.15)
      + `<text x="${cols.status}" y="${y + 18}" class="st ${st.live ? 'live' : ''}" style="animation-delay:${(base + 1.4).toFixed(2)}s">${st.live ? '● ' : ''}${st.text}</text>`;
  }).join('');

  const ticker = repos.filter((r) => r.description).slice(0, ROWS)
    .map((r) => `NOW BOARDING ▸ ${r.name.toUpperCase()} — ${r.description}`).join('      ✦      ');
  const tw = Math.max(1200, ticker.length * 7.2);
  const stamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).toUpperCase();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Departures board of recent NJPX builds">
<style>
  text{font-family:${MONO};fill:${C.ink}}
  .k{font-size:11px;letter-spacing:3px;fill:${C.mute}}
  .title{font-size:22px;font-weight:700;letter-spacing:6px;fill:${C.amber}}
  .f{font-size:16px;font-weight:700;text-anchor:middle;opacity:0}
  .s{animation:flash .09s linear both;fill:${C.mute}}
  .fin{animation:land .14s ease-out both}
  @keyframes flash{0%{opacity:0}1%,99%{opacity:1}100%{opacity:0}}
  @keyframes land{0%{opacity:0;transform:scaleY(.2)}1%{opacity:1;transform:scaleY(.2)}100%{opacity:1;transform:scaleY(1)}}
  .fin{transform-box:fill-box;transform-origin:center}
  .st{font-size:13px;font-weight:700;letter-spacing:2px;fill:${C.mute};opacity:0;animation:show .3s both}
  .st.live{fill:${C.amber};animation:show .3s both,pulse 1.6s ease-in-out 3s infinite}
  @keyframes show{to{opacity:1}}
  @keyframes pulse{50%{opacity:.35}}
  .tick{font-size:12px;fill:${C.mute};letter-spacing:1px;animation:roll ${Math.round(tw / 45)}s linear infinite}
  @keyframes roll{from{transform:translateX(${W}px)}to{transform:translateX(-${tw}px)}}
</style>
<defs><clipPath id="tk"><rect x="0" y="${H - 46}" width="${W}" height="40"/></clipPath></defs>
<rect width="${W}" height="${H}" rx="18" fill="${C.bg}"/>
<path d="M36 30 l14 5 l9 -9 l4 1 l-6 11 l12 4 l4 -4 l3 1 l-3 7 l-1 6 l-3 -1 l1 -5 l-12 -3 l-9 9 l-4 -1 l6 -11 l-14 -5 z" fill="${C.amber}" transform="translate(-2 2) scale(.9)"/>
<text x="74" y="48" class="title">DEPARTURES</text>
<text x="${W - 34}" y="46" class="k" text-anchor="end">UPDATED ${esc(stamp)} IST</text>
<text x="${34}" y="80" class="k">DATE</text><text x="150" y="80" class="k">FLIGHT</text><text x="262" y="80" class="k">BUILD</text><text x="640" y="80" class="k">STATUS</text>
<line x1="34" y1="86" x2="${W - 34}" y2="86" stroke="${C.line}"/>
${rows}
<line x1="0" y1="${H - 46}" x2="${W}" y2="${H - 46}" stroke="${C.line}"/>
<g clip-path="url(#tk)"><text x="0" y="${H - 21}" class="tick">${esc(ticker)}</text></g>
</svg>`;
}

// ---------- main ----------
const repos = await getRepos();
const recent = repos.filter((r) => daysAgo(r.pushed_at) <= 30).length;
const last = daysAgo(repos[0].pushed_at);
writeFileSync(new URL('../assets/hud.svg', import.meta.url), hud({
  builds: repos.length,
  lastFlight: last === 0 ? 'TODAY' : `${last}D AGO`,
  shipSpeed: recent,
}));
writeFileSync(new URL('../assets/departures.svg', import.meta.url), board(repos));
console.log(`flight deck: ${repos.length} builds, ${recent} in last 30d`);
