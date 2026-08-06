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
      <svg class="pin" viewBox="0 0 24 34"><path fill="#1FBF52" d="M12 1C6 1 1 6 1 12c0 8 11 21 11 21s11-13 11-21C23 6 18 1 12 1z"/><path fill="#fff" d="M6 14l1-3c.2-.5.6-.8 1.1-.8h7.8c.5 0 .9.3 1.1.8l1 3v3c0 .3-.2.5-.5.5h-.6c-.3 0-.5-.2-.5-.5v-.6H7.6v.6c0 .3-.2.5-.5.5h-.6c-.3 0-.5-.2-.5-.5v-3zm2 1.4a.9.9 0 100-1.8.9.9 0 000 1.8zm8 0a.9.9 0 100-1.8.9.9 0 000 1.8z"/></svg>
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
  q('#testerN').textContent = testers.length;
  const TOTAL = 96; // approx count of break-it tests; progress bar is indicative
  q('#testerTbl').querySelector('tbody').innerHTML = testers.map(u=>{
    const pct = Math.min(100, Math.round(u.logged/TOTAL*100));
    const stale = fmtAgo(u.last_seen);
    return \`<tr>
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
    return \`<div class="lb-row\${topCls}">
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
</script>
</body>
</html>`;
