// Served at /dashboard. Self-contained. Reads ?token= from its own URL and
// polls /api/summary every few seconds. No build step, no external assets.
export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GetRider · Break-It Dashboard</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Public+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{--green:#1FBF52;--green-d:#078930;--ink:#0C110E;--panel:#141B16;--panel2:#1B231D;--line:#28322A;--paper:#E9EFE9;--mute:#7E8B80;--red:#FF5A4D;--amber:#F5B301;--blue:#4CA5FF;--mono:"JetBrains Mono",ui-monospace,monospace;--disp:"Bricolage Grotesque",system-ui,sans-serif;--body:"Public Sans",system-ui,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--ink);color:var(--paper);font-family:var(--body);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased}
.wrap{max-width:1200px;margin:0 auto;padding:22px 22px 80px}
header{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-bottom:18px;border-bottom:2px solid var(--line);margin-bottom:24px}
.brand{display:flex;align-items:center;gap:11px}
.brand .pin{width:30px;height:30px}
.brand h1{font-family:var(--disp);font-weight:800;font-size:24px;letter-spacing:-.02em}
.brand .sub{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--green);display:block;margin-top:1px}
.tools{display:flex;gap:9px;align-items:center;flex-wrap:wrap}
.live{font-family:var(--mono);font-size:11px;letter-spacing:.05em;color:var(--mute);display:flex;align-items:center;gap:7px}
.live .dot{width:8px;height:8px;border-radius:50%;background:var(--green);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.btn{font-family:var(--mono);font-size:11px;font-weight:700;letter-spacing:.04em;padding:9px 13px;border-radius:8px;background:var(--panel);border:1px solid var(--line);color:var(--paper);text-decoration:none;display:inline-flex;align-items:center;gap:7px;cursor:pointer}
.btn:hover{border-color:var(--green)}
.btn svg{width:13px;height:13px}
.btn.g{background:var(--green);color:var(--ink);border-color:var(--green)}
.btn.danger{color:var(--red);border-color:rgba(255,90,77,.35)}
.btn.danger:hover{border-color:var(--red);background:rgba(255,90,77,.08)}

.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:26px}
.tile{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 18px}
.tile .lab{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);margin-bottom:8px}
.tile .big{font-family:var(--disp);font-weight:800;font-size:38px;line-height:1}
.tile.pass .big{color:var(--green)} .tile.fail .big{color:var(--red)} .tile.block .big{color:var(--amber)}
.sevbar{display:flex;gap:6px;margin-top:10px}
.sevbar span{font-family:var(--mono);font-size:11px;font-weight:700;padding:3px 8px;border-radius:5px;background:var(--panel2)}
.s1{color:var(--red)} .s2{color:var(--amber)} .s3{color:var(--green)} .s4{color:var(--mute)}

.cols{display:grid;grid-template-columns:1.35fr 1fr;gap:22px}
@media(max-width:900px){.cols{grid-template-columns:1fr}}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.card h2{font-family:var(--disp);font-weight:800;font-size:17px;padding:15px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between}
.card h2 .n{font-family:var(--mono);font-size:12px;color:var(--mute);font-weight:400}

/* failures list */
.fail-item{padding:13px 18px;border-bottom:1px solid var(--line)}
.fail-item:last-child{border-bottom:none}
.fail-top{display:flex;align-items:center;gap:9px;margin-bottom:4px;flex-wrap:wrap}
.sevtag{font-family:var(--mono);font-size:10px;font-weight:700;padding:3px 7px;border-radius:5px}
.sevtag.S1{color:var(--red);background:rgba(255,90,77,.14)}
.sevtag.S2{color:var(--amber);background:rgba(245,179,1,.14)}
.sevtag.S3{color:var(--green);background:rgba(31,191,82,.14)}
.sevtag.S4{color:var(--mute);background:var(--panel2)}
.sevtag.none{color:var(--mute);background:var(--panel2)}
.fail-id{font-family:var(--mono);font-size:11px;color:var(--mute)}
.fail-test{font-weight:600;font-size:14px;flex:1;min-width:180px}
.fail-rec{font-size:10px;font-family:var(--mono);color:var(--blue);display:flex;align-items:center;gap:4px}
.fail-meta{font-family:var(--mono);font-size:11px;color:var(--mute)}
.fail-note{font-size:13px;color:#C4CEC5;margin-top:5px;padding:8px 10px;background:var(--panel2);border-radius:7px;line-height:1.45}

/* tester table */
table{width:100%;border-collapse:collapse;font-size:13px}
th{font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);text-align:left;padding:11px 12px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--panel)}
td{padding:11px 12px;border-bottom:1px solid var(--line)}
tr:last-child td{border-bottom:none}
.tester-name{font-weight:600}
.tester-sub{font-family:var(--mono);font-size:10px;color:var(--mute)}
.mini{display:inline-flex;gap:7px;font-family:var(--mono);font-size:11px}
.mini .p{color:var(--green)} .mini .f{color:var(--red)} .mini .b{color:var(--amber)}
.prog{width:74px;height:6px;border-radius:4px;background:var(--panel2);overflow:hidden;display:inline-block;vertical-align:middle;margin-right:8px}
.prog i{display:block;height:100%;background:var(--green)}
.stale{color:var(--mute)}
.empty{padding:50px 20px;text-align:center;color:var(--mute)}
.empty .disp{font-family:var(--disp);font-weight:800;font-size:22px;color:var(--paper);margin-bottom:8px}
.lb-row{display:flex;align-items:center;gap:14px;padding:11px 18px;border-bottom:1px solid var(--line)}
.lb-row:last-child{border-bottom:none}
.lb-rank{font-family:var(--disp);font-weight:800;font-size:20px;width:34px;text-align:center;color:var(--mute);flex-shrink:0}
.lb-row.top1 .lb-rank{color:#F5C518} .lb-row.top2 .lb-rank{color:#C0C6CE} .lb-row.top3 .lb-rank{color:#CD7F32}
.lb-name{flex:1;min-width:0}
.lb-name b{font-weight:700;font-size:14px}
.lb-name span{font-family:var(--mono);font-size:10px;color:var(--mute);display:block}
.lb-break{display:flex;gap:8px;font-family:var(--mono);font-size:10px;color:var(--mute);flex-shrink:0}
.lb-break i{font-style:normal}
.lb-break .b1{color:var(--red)} .lb-break .b2{color:var(--amber)} .lb-break .b3{color:var(--green)} .lb-break .b4{color:var(--mute)}
.lb-score{font-family:var(--disp);font-weight:800;font-size:24px;color:var(--green);min-width:54px;text-align:right;flex-shrink:0}
.tbl-score{font-family:var(--mono);font-weight:700;color:var(--green)}
/* clickable rows */
.lb-row{cursor:pointer;transition:background .12s}
.lb-row:hover{background:rgba(255,255,255,.03)}
#testerTbl tbody tr{cursor:pointer;transition:background .12s}
#testerTbl tbody tr:hover{background:rgba(255,255,255,.03)}
/* detail drawer */
.drawer-scrim{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);display:none}
.drawer-scrim.on{display:block}
.drawer{position:fixed;top:0;right:0;height:100vh;width:min(560px,92vw);background:var(--panel);border-left:1px solid var(--line);box-shadow:-20px 0 60px rgba(0,0,0,.4);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .26s ease}
.drawer-scrim.on .drawer{transform:translateX(0)}
.drawer-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:22px 22px 16px;border-bottom:1px solid var(--line)}
.drawer-head h2{font-family:var(--disp);font-weight:800;font-size:22px;letter-spacing:-.01em}
.drawer-x{width:34px;height:34px;border-radius:9px;background:var(--panel2);border:1px solid var(--line);color:var(--mute);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
.drawer-x:hover{color:var(--paper)}
.drawer-score{padding:14px 22px;border-bottom:1px solid var(--line);font-family:var(--mono);font-size:12px;color:var(--mute);display:flex;gap:16px;flex-wrap:wrap}
.drawer-score b{font-family:var(--disp);font-size:20px;color:var(--green)}
.drawer-body{flex:1;overflow-y:auto;padding:8px 0}
.dr-item{padding:13px 22px;border-bottom:1px solid var(--line)}
.dr-top{display:flex;align-items:center;gap:9px;margin-bottom:4px;flex-wrap:wrap}
.dr-vtag{font-family:var(--mono);font-size:9.5px;font-weight:700;letter-spacing:.05em;padding:3px 7px;border-radius:5px}
.dr-vtag.fail{color:var(--red);background:rgba(255,90,77,.14)}
.dr-vtag.block{color:var(--amber);background:rgba(245,179,1,.14)}
.dr-vtag.pass{color:var(--green);background:rgba(31,191,82,.12)}
.dr-id{font-family:var(--mono);font-size:10px;color:var(--mute)}
.dr-grp{font-family:var(--mono);font-size:9.5px;color:var(--mute);margin-left:auto}
.dr-test{font-weight:600;font-size:13.5px;margin-bottom:3px;line-height:1.4}
.dr-pass{font-size:11.5px;color:var(--mute);line-height:1.45;margin-bottom:5px}
.dr-pass b{color:var(--green)}
.dr-note{font-size:12.5px;color:#C4CEC5;background:var(--panel2);border-radius:7px;padding:8px 10px;line-height:1.45;margin-top:5px}
.dr-rec{font-family:var(--mono);font-size:9.5px;color:var(--blue)}
.groupbars{padding:6px 0}.gb{display:flex;align-items:center;gap:10px;padding:8px 18px}
.gb .gname{flex:1;font-size:13px}
.gb .gcount{font-family:var(--mono);font-size:11px;color:var(--mute)}
.gb .gfail{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--red);min-width:30px;text-align:right}
.err{background:rgba(255,90,77,.1);border:1px solid rgba(255,90,77,.3);color:var(--red);padding:12px 16px;border-radius:10px;font-family:var(--mono);font-size:12px;margin-bottom:20px;display:none}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="brand">
      <svg class="pin" viewBox="0 0 34 34"><path fill="#1FBF52" d="M17 1.5C10.1 1.5 4.5 7.1 4.5 14c0 9 12.5 19 12.5 19s12.5-10 12.5-19C29.5 7.1 23.9 1.5 17 1.5z"/><path fill="#fff" d="M23.4 13.2l-1-2.7c-.3-.8-1-1.3-1.9-1.3h-7c-.9 0-1.6.5-1.9 1.3l-1 2.7c-.6.2-1 .8-1 1.5v2.4c0 .4.2.7.6.8v1.1c0 .5.4.8.8.8s.8-.3.8-.8v-1h9.4v1c0 .5.4.8.8.8s.8-.3.8-.8v-1.1c.4-.1.6-.4.6-.8v-2.4c0-.7-.4-1.3-1-1.5zm-11.3.2l.7-2c.1-.3.4-.5.7-.5h6.6c.3 0 .6.2.7.5l.7 2H12.1zm.6 3.4c-.5 0-.9-.4-.9-.9s.4-.9.9-.9.9.4.9.9-.4.9-.9.9zm8.6 0c-.5 0-.9-.4-.9-.9s.4-.9.9-.9.9.4.9.9-.4.9-.9.9z"/></svg>
      <div><h1>Break-It Dashboard</h1><span class="sub">Branch Test Day · live</span></div>
    </div>
    <div class="tools">
      <span class="live"><span class="dot"></span><span id="liveT">connecting…</span></span>
      <a class="btn" id="csvBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>CSV</a>
      <a class="btn" id="jsonBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 1 2 2 2 2 0 0 1-2 2v5a2 2 0 0 1-2 2h-1"/></svg>JSON</a>
      <button class="btn danger" id="resetBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>Clear all</button>
    </div>
  </header>

  <div class="err" id="err"></div>

  <div class="tiles" id="tiles"></div>

  <div class="card" id="lbCard" style="margin-bottom:22px">
    <h2>Leaderboard <span class="n">weighted · S1×10 S2×5 S3×2 S4×1 · pass×1</span></h2>
    <div id="leaderboard"><div class="empty" style="padding:30px">No scores yet.</div></div>
  </div>

  <div class="cols">
    <div class="card">
      <h2>Failures &amp; blocks <span class="n" id="failN">0</span></h2>
      <div id="failList"><div class="empty"><div class="disp">Nothing broken yet</div>Results appear here the moment a tester logs a fail.</div></div>
    </div>
    <div>
      <div class="card" style="margin-bottom:22px">
        <h2>Testers <span class="n" id="testerN">0</span></h2>
        <div style="max-height:420px;overflow-y:auto"><table id="testerTbl"><thead><tr><th>Tester</th><th>Progress</th><th>P / F / B</th><th>Score</th><th>Last</th></tr></thead><tbody></tbody></table></div>
      </div>
      <div class="card">
        <h2>By area</h2>
        <div class="groupbars" id="groupBars"></div>
      </div>
    </div>
  </div>
</div>

<!-- per-tester detail drawer -->
<div class="drawer-scrim" id="drawerScrim">
  <div class="drawer" id="drawer">
    <div class="drawer-head">
      <div><h2 id="dName">Tester</h2><span id="dSub" class="tester-sub"></span></div>
      <button class="drawer-x" id="drawerX"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
    </div>
    <div class="drawer-score" id="dScore"></div>
    <div class="drawer-body" id="dBody"></div>
  </div>
</div>

<script>
const TOKEN = new URLSearchParams(location.search).get('token') || '';
const q = s => document.querySelector(s);
function fmtAgo(ts){ if(!ts) return '—'; const s=Math.floor((Date.now()-new Date(ts))/1000);
  if(s<60) return s+'s'; if(s<3600) return Math.floor(s/60)+'m'; return Math.floor(s/3600)+'h'; }
function esc(x){ return (x==null?'':String(x)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

q('#csvBtn').href = '/export.csv?token='+encodeURIComponent(TOKEN);
q('#jsonBtn').href = '/export.json?token='+encodeURIComponent(TOKEN);

q('#resetBtn').addEventListener('click', async () => {
  const n = q('#tiles') ? (document.querySelector('.tile .big') ? document.querySelector('.tile .big').textContent : '') : '';
  if(!confirm('Clear ALL results from the dashboard?\\n\\nThis wipes every tester\\'s results from the server and cannot be undone. Testers\\' own copies on their computers are not affected.\\n\\nUse this to reset before a fresh test run.')) return;
  if(!confirm('Last check — really delete everything on the server now?')) return;
  try{
    const r = await fetch('/admin/reset?token='+encodeURIComponent(TOKEN), {method:'POST'});
    if(r.status===401){ alert('Wrong token — reset not allowed.'); return; }
    if(!r.ok){ alert('Reset failed: server error '+r.status); return; }
    const j = await r.json();
    poll();
    alert('Cleared '+(j.cleared??0)+' result(s). Dashboard is reset.');
  }catch(e){ alert('Reset failed — could not reach the server.'); }
});

async function poll(){
  try{
    const r = await fetch('/api/summary?token='+encodeURIComponent(TOKEN));
    if(r.status===401){ showErr('Wrong or missing token in the URL. Add ?token=YOUR_TOKEN to the dashboard address.'); return; }
    if(!r.ok){ showErr('Server error '+r.status); return; }
    hideErr();
    render(await r.json());
    q('#liveT').textContent = 'live · updated '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
  }catch(e){ q('#liveT').textContent='reconnecting…'; }
}
function showErr(m){ const e=q('#err'); e.textContent=m; e.style.display='block'; }
function hideErr(){ q('#err').style.display='none'; }

function render(d){
  const t = {pass:0,fail:0,block:0};
  (d.totals||[]).forEach(x=>{ if(x.verdict==='pass')t.pass=x.n; if(x.verdict==='fail')t.fail=x.n; if(x.verdict==='block')t.block=x.n; });
  const logged = t.pass+t.fail+t.block;
  const sev = {}; (d.bySeverity||[]).forEach(x=>sev[x.severity]=x.n);
  q('#tiles').innerHTML = \`
    <div class="tile"><div class="lab">Results logged</div><div class="big">\${logged}</div></div>
    <div class="tile pass"><div class="lab">Passed</div><div class="big">\${t.pass}</div></div>
    <div class="tile fail"><div class="lab">Failed</div><div class="big">\${t.fail}</div>
      <div class="sevbar">
        <span class="s1">S1 \${sev.S1||0}</span><span class="s2">S2 \${sev.S2||0}</span>
        <span class="s3">S3 \${sev.S3||0}</span><span class="s4">S4 \${sev.S4||0}</span>
      </div></div>
    <div class="tile block"><div class="lab">Blocked</div><div class="big">\${t.block}</div></div>
    <div class="tile"><div class="lab">Active testers</div><div class="big">\${(d.byTester||[]).length}</div></div>\`;

  // failures
  const fails = d.failures||[];
  q('#failN').textContent = fails.length;
  if(fails.length===0){
    q('#failList').innerHTML='<div class="empty"><div class="disp">Nothing broken yet</div>Results appear here the moment a tester logs a fail.</div>';
  }else{
    q('#failList').innerHTML = fails.map(f=>{
      const sv = f.severity || 'none';
      const label = f.severity || '—';
      return \`<div class="fail-item">
        <div class="fail-top">
          <span class="sevtag \${sv}">\${label}</span>
          <span class="fail-id">\${esc(f.test_id)}</span>
          <span class="fail-test">\${esc(f.test_text)}</span>
          \${f.recording?'<span class="fail-rec">● REC</span>':''}
        </div>
        <div class="fail-meta">\${esc(f.tester_name)} · \${esc(f.tag)} · \${esc(f.device)} · \${fmtAgo(f.received_at)} ago</div>
        \${f.notes?\`<div class="fail-note">\${esc(f.notes)}</div>\`:''}
      </div>\`;
    }).join('');
  }

  // testers
  const testers = d.byTester||[];
  indexTesters(testers);
  q('#testerN').textContent = testers.length;
  const TOTAL = 96; // approx count of break-it tests; progress bar is indicative
  q('#testerTbl').querySelector('tbody').innerHTML = testers.map(u=>{
    const pct = Math.min(100, Math.round(u.logged/TOTAL*100));
    const stale = fmtAgo(u.last_seen);
    return \`<tr data-key="\${esc(u.tester_key)}">
      <td><div class="tester-name">\${esc(u.tester_name)}</div><div class="tester-sub">\${esc(u.tag)} · \${esc(u.role)} · \${esc(u.device)}\${u.wave?' · W'+esc(u.wave):''}</div></td>
      <td><span class="prog"><i style="width:\${pct}%"></i></span><span class="tester-sub">\${u.logged}</span></td>
      <td><span class="mini"><span class="p">\${u.pass}</span><span class="f">\${u.fail}</span><span class="b">\${u.blocked}</span></span></td>
      <td class="tbl-score">\${u.score||0}</td>
      <td class="\${stale.endsWith('h')?'stale':''}">\${stale}</td>
    </tr>\`;
  }).join('') || '<tr><td colspan="5" class="stale" style="padding:24px;text-align:center">No testers yet</td></tr>';

  // leaderboard — same data, already sorted by score DESC from the server
  const ranked = (d.byTester||[]).filter(u=>(u.score||0)>0);
  q('#leaderboard').innerHTML = ranked.length ? ranked.map((u,i)=>{
    const rank=i+1; const topCls = rank<=3 ? ' top'+rank : '';
    return \`<div class="lb-row\${topCls}" data-key="\${esc(u.tester_key)}">
      <span class="lb-rank">\${rank}</span>
      <div class="lb-name"><b>\${esc(u.tester_name)}</b><span>\${esc(u.tag)} · \${esc(u.device)}\${u.wave?' · W'+esc(u.wave):''}</span></div>
      <div class="lb-break"><i class="b1">\${u.fail} fails</i><i>·</i><i class="b3">\${u.pass} pass</i></div>
      <span class="lb-score">\${u.score}</span>
    </div>\`;
  }).join('') : '<div class="empty" style="padding:30px">No scores yet — results appear as testers log fails and passes.</div>';

  // group bars
  const groups = d.byGroup||[];
  q('#groupBars').innerHTML = groups.map(g=>\`
    <div class="gb"><span class="gname">\${esc(g.group_name)}</span>
      <span class="gcount">\${g.logged} logged</span>
      <span class="gfail">\${g.fail? g.fail+' ✗':''}</span></div>\`).join('') || '<div class="empty" style="padding:24px">No data yet</div>';
}

poll();
setInterval(poll, 4000);

// ---- per-tester drill-down ----
let TESTER_INDEX = {}; // tester_key -> summary row (updated each poll)
function indexTesters(list){ TESTER_INDEX = {}; (list||[]).forEach(u=>{ TESTER_INDEX[u.tester_key]=u; }); }

document.addEventListener('click', (e) => {
  const row = e.target.closest('[data-key]');
  if(!row) return;
  const key = row.getAttribute('data-key');
  if(key) openTester(key);
});
q('#drawerX').addEventListener('click', closeDrawer);
q('#drawerScrim').addEventListener('click', (e)=>{ if(e.target===q('#drawerScrim')) closeDrawer(); });
document.addEventListener('keydown',(e)=>{ if(e.key==='Escape') closeDrawer(); });

function closeDrawer(){ q('#drawerScrim').classList.remove('on'); }

async function openTester(key){
  const u = TESTER_INDEX[key];
  q('#dName').textContent = u ? u.tester_name : 'Tester';
  q('#dSub').textContent = u ? (u.tag+' · '+u.role+' · '+u.device+(u.wave?' · Wave '+u.wave:'')) : '';
  q('#dScore').innerHTML = u ? \`<span><b>\${u.score||0}</b> score</span><span>\${u.logged} logged</span><span style="color:var(--green)">\${u.pass} pass</span><span style="color:var(--red)">\${u.fail} fail</span><span style="color:var(--amber)">\${u.blocked} blocked</span>\` : '';
  q('#dBody').innerHTML = '<div class="empty" style="padding:40px">Loading…</div>';
  q('#drawerScrim').classList.add('on');
  try{
    const r = await fetch('/api/tester?token='+encodeURIComponent(TOKEN)+'&key='+encodeURIComponent(key));
    if(!r.ok){ q('#dBody').innerHTML='<div class="empty" style="padding:40px">Couldn\\'t load this tester.</div>'; return; }
    const rows = await r.json();
    renderTesterBody(rows);
  }catch(e){ q('#dBody').innerHTML='<div class="empty" style="padding:40px">Couldn\\'t load this tester.</div>'; }
}

function renderTesterBody(rows){
  if(!rows || !rows.length){ q('#dBody').innerHTML='<div class="empty" style="padding:40px">No results logged yet.</div>'; return; }
  q('#dBody').innerHTML = rows.map(r=>{
    const v = r.verdict;
    const vlabel = v==='fail' ? ('FAIL'+(r.severity?' · '+r.severity:'')) : v==='block' ? 'BLOCKED' : 'PASS';
    return \`<div class="dr-item">
      <div class="dr-top">
        <span class="dr-vtag \${v}">\${vlabel}</span>
        <span class="dr-id">\${esc(r.test_id)}</span>
        \${r.recording?'<span class="dr-rec">● REC</span>':''}
        <span class="dr-grp">\${esc(r.group_name)}</span>
      </div>
      <div class="dr-test">\${esc(r.test_text)}</div>
      \${r.pass_condition?\`<div class="dr-pass"><b>Pass if:</b> \${esc(r.pass_condition)}</div>\`:''}
      \${r.notes?\`<div class="dr-note">\${esc(r.notes)}</div>\`:''}
    </div>\`;
  }).join('');
}
</script>
</body>
</html>`;
