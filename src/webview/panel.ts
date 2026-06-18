import * as vscode from 'vscode';
import { Issue } from '../detectors/types';

/**
 * PatternGuardViewProvider
 *
 * Implements WebviewViewProvider so the dashboard lives in the Activity Bar
 * sidebar (view id = patternGuard.dashboard). This persists across folder
 * changes and new-window events — the sidebar is never disposed when the
 * user opens a different folder.
 */
export class PatternGuardViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'patternGuard.dashboard';

  /** The live view once resolveWebviewView has been called. */
  private _view?: vscode.WebviewView;

  /** Disposables scoped to the current webview view lifetime. */
  private _disposables: vscode.Disposable[] = [];

  /** Callback wired by extension.ts to handle messages from the webview. */
  public static onMessage: ((msg: any) => void) | undefined;

  /** Singleton instance so extension.ts can call sendScanResults. */
  public static instance: PatternGuardViewProvider | undefined;

  constructor(private readonly _extensionUri: vscode.Uri) {
    PatternGuardViewProvider.instance = this;
  }

  /** Called by VS Code when the sidebar panel becomes visible. */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtml();

    // Track the disposable so the listener is cleaned up if the view is disposed
    this._disposables.push(
      webviewView.webview.onDidReceiveMessage(msg => {
        if (PatternGuardViewProvider.onMessage) {
          PatternGuardViewProvider.onMessage(msg);
        }
      })
    );

    // Clean up disposables when the view itself is disposed
    webviewView.onDidDispose(() => {
      while (this._disposables.length) {
        const d = this._disposables.pop();
        if (d) { d.dispose(); }
      }
      this._view = undefined;
    }, null, this._disposables);
  }

  /** Push scan results into the webview. */
  public sendScanResults(issues: Issue[], fileCount: number, mode: 'workspace' | 'file') {
    if (this._view) {
      this._view.webview.postMessage({ command: 'updateData', issues, fileCount, mode });
    }
  }

  /** Reveal the sidebar panel (bring it into focus). */
  public reveal() {
    if (this._view) {
      this._view.show(true);
    }
  }

  // ── HTML ──────────────────────────────────────────────────────────────────

  private _getHtml(): string {
    return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pattern Guard</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap');
:root{--bg:#F8FAFC;--panel:#fff;--txt:#0F172A;--muted:#64748B;--border:#E2E8F0;--primary:#3B82F6;
--cb:#FEF2F2;--ct:#DC2626;--wb:#FFF7ED;--wt:#EA580C;--ib:#F0FDF4;--it:#16A34A;--hover:#F1F5F9}
body.vscode-dark{--bg:#0F172A;--panel:#1E293B;--txt:#F8FAFC;--muted:#94A3B8;--border:#334155;--hover:#334155;
--cb:#451A1A;--ct:#FCA5A5;--wb:#4A2B12;--wt:#FDBA74;--ib:#143323;--it:#86EFAC}
body.vscode-high-contrast{--bg:#000;--panel:#1a1a1a;--txt:#fff;--muted:#aaa;--border:#555;--hover:#222;
--cb:#3a0000;--ct:#ff6b6b;--wb:#3a2000;--wt:#ffd580;--ib:#003a00;--it:#6bff6b}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--txt);height:100vh;display:flex;flex-direction:column;overflow:hidden}
/* ── header ── */
.hdr{display:flex;flex-direction:column;gap:8px;padding:12px;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--panel)}
.logo{display:flex;align-items:center;gap:8px}
.lbox{width:28px;height:28px;background:#E0F2FE;border:2px solid var(--primary);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--primary);flex-shrink:0}
.lbox svg{width:14px;height:14px}
.ltxt h1{font-size:.88rem;font-weight:700;line-height:1.2}
.ltxt p{font-size:.65rem;color:var(--muted)}
.btn-row{display:flex;gap:6px}
.btn{flex:1;background:linear-gradient(135deg,#06B6D4,#2563EB);color:#fff;border:none;padding:7px 10px;font-weight:600;font-size:.75rem;cursor:pointer;border-radius:7px;transition:filter .15s,transform .1s;white-space:nowrap}
.btn:hover{filter:brightness(1.12);transform:translateY(-1px)}
.btn:active{transform:translateY(0)}
.btn.sec{background:var(--hover);color:var(--txt);border:1px solid var(--border)}
.btn.sec:hover{filter:brightness(.95)}
.stats{display:flex;gap:12px}
.stat .sl{font-size:.58rem;text-transform:uppercase;color:var(--muted);font-weight:600;letter-spacing:.05em}
.stat .sv{font-size:1rem;font-weight:700}
.banner{font-size:.68rem;font-weight:600;padding:3px 10px;border-radius:4px;background:var(--ib);color:var(--it);display:none;width:fit-content}
/* ── body split ── */
.body{display:flex;flex:1;overflow:hidden}
/* ── sidebar card list ── */
.sb{width:100%;display:flex;flex-direction:column;overflow:hidden}
/* When viewer is open, sidebar shrinks */
.layout-split .sb{width:260px;flex-shrink:0;border-right:1px solid var(--border)}
.sb-hdr{padding:8px 12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;background:var(--panel)}
.sb-hdr h2{font-size:.76rem;font-weight:600}
.sb-hdr span{font-size:.64rem;color:var(--muted)}
.cards{overflow-y:auto;flex:1}
.card{padding:10px 12px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s;position:relative}
.card:hover{background:var(--hover)}
.card.active{border-left:3px solid var(--primary);background:var(--hover)}
.cr{display:flex;align-items:flex-start;gap:8px}
.ci{width:30px;height:30px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ci svg{width:14px;height:14px}
.sc .ci{background:var(--cb);color:var(--ct)}
.sw .ci{background:var(--wb);color:var(--wt)}
.si .ci{background:var(--ib);color:var(--it)}
.ct2{flex:1;min-width:0}
.ctt{font-size:.78rem;font-weight:600;display:flex;align-items:center;justify-content:space-between;gap:4px}
.cds{font-size:.65rem;color:var(--muted);margin-top:2px;line-height:1.4}
.bdg{font-size:.58rem;font-weight:700;padding:2px 6px;border-radius:3px;text-transform:uppercase;flex-shrink:0}
.sc .bdg{background:var(--cb);color:var(--ct)}
.sw .bdg{background:var(--wb);color:var(--wt)}
.si .bdg{background:var(--ib);color:var(--it)}
.cpill{font-size:.6rem;font-weight:700;margin-top:4px;display:inline-block;padding:1px 7px;border-radius:9999px;background:var(--primary);color:#fff}
.cpill.z{background:var(--border);color:var(--muted)}
/* ── viewer panel ── */
.vw{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg);display:none}
.layout-split .vw{display:flex}
.vhdr{padding:8px 14px;border-bottom:1px solid var(--border);background:var(--panel);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;gap:8px}
.vpath{font-family:'Fira Code',monospace;font-size:.74rem;display:flex;align-items:center;gap:5px;min-width:0;flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.vpath::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--primary);display:inline-block;flex-shrink:0}
.vflag{background:var(--cb);color:var(--ct);font-size:.66rem;font-weight:600;padding:2px 8px;border-radius:9999px;flex-shrink:0}
.vclose{background:none;border:none;color:var(--muted);cursor:pointer;font-size:1rem;flex-shrink:0;padding:2px 6px;border-radius:4px}
.vclose:hover{background:var(--hover);color:var(--txt)}
.vbody{padding:10px 0;overflow-y:auto;flex:1;font-family:'Fira Code',monospace;font-size:.74rem;line-height:1.6}
.iblk{margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--border)}
.imeta{padding:0 14px;margin-bottom:4px;display:flex;align-items:center;gap:6px;cursor:pointer}
.imeta:hover .ifn{text-decoration:underline}
.ifn{font-weight:700;font-size:.76rem;color:var(--primary)}
.iln{font-size:.66rem;color:var(--muted)}
.iopen{font-size:.62rem;color:var(--primary);margin-left:auto;opacity:.7}
.imsg{font-size:.66rem;color:var(--muted);padding:2px 14px 4px;line-height:1.45;font-family:'Inter',sans-serif}
.cl{display:flex;padding:3px 14px;position:relative;cursor:pointer}
.cl:hover{background:var(--hover)}
.lno{width:32px;color:var(--muted);text-align:right;padding-right:10px;user-select:none;opacity:.5;flex-shrink:0}
.lt{flex:1;white-space:pre-wrap;word-break:break-all}
.hc{background:var(--cb)}.hc::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--ct)}
.hw{background:var(--wb)}.hw::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--wt)}
.hi{background:var(--ib)}.hi::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--it)}
.pill{position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#fff;font-family:'Inter',sans-serif;font-size:.58rem;font-weight:700;padding:2px 6px;border-radius:9999px}
.pc{background:var(--ct)}.pw{background:var(--wt)}.pi{background:var(--it)}
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--muted);text-align:center;gap:10px;padding:20px}
.empty svg{width:44px;height:44px;opacity:.3}
.empty p{font-size:.85rem;line-height:1.5}
</style>
</head><body>
<div class="hdr">
  <div class="logo">
    <div class="lbox"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></div>
    <div class="ltxt"><h1>Pattern Guard</h1><p>Dart / Flutter anti-pattern scanner</p></div>
  </div>
  <div class="btn-row">
    <button class="btn" id="btnWS" onclick="scan('workspace')">&#9654; Analyze Project</button>
    <button class="btn sec" id="btnFile" onclick="scan('file')" title="Analyze active .dart file only">&#128196; File</button>
  </div>
  <span class="banner" id="modeBanner">File mode — cross-file checks skipped</span>
  <div class="stats">
    <div class="stat"><div class="sl">Files</div><div class="sv" id="sFiles">0</div></div>
    <div class="stat"><div class="sl">Issues</div><div class="sv" id="sIssues" style="color:var(--wt)">0</div></div>
    <div class="stat"><div class="sl">Grade</div><div class="sv" id="sGrade" style="color:var(--it)">—</div></div>
  </div>
</div>
<div class="body" id="mainBody">
  <div class="sb" id="sidebar">
    <div class="sb-hdr"><h2>7 Anti-Patterns</h2><span>click to inspect</span></div>
    <div class="cards" id="cardList">

      <div class="card active sc" id="card-copyPaste" onclick="sel('copyPaste')">
        <div class="cr"><div class="ci"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg></div>
        <div class="ct2"><div class="ctt">Copy-Paste Programming<span class="bdg">Critical</span></div><div class="cds">Duplicate code blocks &ge;8 lines.</div><span class="cpill z" id="cnt-copyPaste">0 issues</span></div></div>
      </div>

      <div class="card sw" id="card-spaghettiCode" onclick="sel('spaghettiCode')">
        <div class="cr"><div class="ci"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>
        <div class="ct2"><div class="ctt">Spaghetti Code<span class="bdg">Warning</span></div><div class="cds">Nesting depth &gt;4 levels.</div><span class="cpill z" id="cnt-spaghettiCode">0 issues</span></div></div>
      </div>

      <div class="card sw" id="card-nonFunctional" onclick="sel('nonFunctional')">
        <div class="cr"><div class="ci"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>
        <div class="ct2"><div class="ctt">Non-Functional Reqs<span class="bdg">Warning</span></div><div class="cds">Public declarations missing doc comments.</div><span class="cpill z" id="cnt-nonFunctional">0 issues</span></div></div>
      </div>

      <div class="card sc" id="card-godObject" onclick="sel('godObject')">
        <div class="cr"><div class="ci"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg></div>
        <div class="ct2"><div class="ctt">God Object<span class="bdg">Critical</span></div><div class="cds">Class &gt;20 methods or file &gt;500 lines.</div><span class="cpill z" id="cnt-godObject">0 issues</span></div></div>
      </div>

      <div class="card sw" id="card-shotgunSurgery" onclick="sel('shotgunSurgery')">
        <div class="cr"><div class="ci"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></div>
        <div class="ct2"><div class="ctt">Shotgun Surgery<span class="bdg">Warning</span></div><div class="cds">Same magic value hard-coded in 3+ files.</div><span class="cpill z" id="cnt-shotgunSurgery">0 issues</span></div></div>
      </div>

      <div class="card si" id="card-lavaFlow" onclick="sel('lavaFlow')">
        <div class="cr"><div class="ci"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg></div>
        <div class="ct2"><div class="ctt">Lava Flow<span class="bdg">Info</span></div><div class="cds">TODO markers &amp; commented-out code blocks.</div><span class="cpill z" id="cnt-lavaFlow">0 issues</span></div></div>
      </div>

      <div class="card si" id="card-goldenHammer" onclick="sel('goldenHammer')">
        <div class="cr"><div class="ci"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg></div>
        <div class="ct2"><div class="ctt">Golden Hammer<span class="bdg">Info</span></div><div class="cds">One package/widget used in &gt;60% of files.</div><span class="cpill z" id="cnt-goldenHammer">0 issues</span></div></div>
      </div>

    </div>
  </div>
  <div class="vw" id="viewer">
    <div class="vhdr">
      <div class="vpath" id="vTitle">Results</div>
      <div class="vflag" id="vFlag">0 issues</div>
      <button class="vclose" id="vCloseBtn" onclick="closeViewer()" title="Back to list">&#10005;</button>
    </div>
    <div class="vbody" id="vBody"></div>
  </div>
</div>
<script>
const vsc = acquireVsCodeApi();
let allIssues = [];
let active = 'copyPaste';
let viewerOpen = false;
const PTNS = ['copyPaste','spaghettiCode','nonFunctional','godObject','shotgunSurgery','lavaFlow','goldenHammer'];
const NAMES = {
  copyPaste:'Copy-Paste Programming',
  spaghettiCode:'Spaghetti Code',
  nonFunctional:'Non-Functional Requirements',
  godObject:'God Object',
  shotgunSurgery:'Shotgun Surgery',
  lavaFlow:'Lava Flow',
  goldenHammer:'Golden Hammer'
};
const CROSS = new Set(['copyPaste','shotgunSurgery','goldenHammer']);

function scan(mode) {
  vsc.postMessage({ command: mode === 'file' ? 'scanFile' : 'scan' });
  // Show scanning state inside viewer if open, else show inline
  if (viewerOpen) {
    document.getElementById('vBody').innerHTML = '<div class="empty"><p>Scanning\u2026</p></div>';
  }
}

function sel(p) {
  active = p;
  PTNS.forEach(x => document.getElementById('card-' + x).classList.toggle('active', x === p));
  openViewer();
  renderViewer();
}

function openViewer() {
  viewerOpen = true;
  document.getElementById('mainBody').classList.add('layout-split');
  document.getElementById('viewer').style.display = 'flex';
}

function closeViewer() {
  viewerOpen = false;
  document.getElementById('mainBody').classList.remove('layout-split');
  document.getElementById('viewer').style.display = 'none';
}

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}

// ── Event delegation: all "open file" clicks bubble up to vBody ─────────────
// Using data-* attributes avoids the quote-collision bug that breaks onclick=""
document.addEventListener('click', function(e) {
  const el = e.target.closest('[data-open]');
  if (!el) { return; }
  const file = el.getAttribute('data-file');
  const line = parseInt(el.getAttribute('data-line') || '0', 10);
  if (file) {
    vsc.postMessage({ command: 'openFile', file: file, line: line });
  }
});

function renderViewer() {
  const list = allIssues.filter(i => i.antiPattern === active);
  document.getElementById('vTitle').textContent = NAMES[active] || active;
  document.getElementById('vFlag').textContent = list.length + ' issue' + (list.length !== 1 ? 's' : '');
  const body = document.getElementById('vBody');

  if (list.length === 0) {
    const skipped = CROSS.has(active) && document.getElementById('modeBanner').style.display !== 'none';
    body.innerHTML =
      '<div class="empty">' +
      '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
      '<p>' + (skipped
        ? 'Skipped in file mode.<br>Run <strong>Analyze Project</strong> for cross-file checks.'
        : 'No issues found \u2014 clean!') + '</p>' +
      '</div>';
    return;
  }

  let html = '';
  list.forEach(issue => {
    const s = issue.severity;
    const hc = s==='critical'?'hc':s==='warning'?'hw':'hi';
    const pc = s==='critical'?'pc':s==='warning'?'pw':'pi';
    // Build filename for display: normalize both \\ and \ separators
    const fn = (issue.file || '').replace(/\\\\/g,'/').split('/').pop() || issue.file;
    // Encode the file path safely as a data attribute — no quote issues
    const encodedFile = (issue.file || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    html +=
      '<div class="iblk">' +
        '<div class="imeta" data-open="1" data-file="' + encodedFile + '" data-line="' + issue.line + '">' +
          '<span class="ifn">' + esc(fn) + '</span>' +
          '<span class="iln">Line ' + (issue.line + 1) + '</span>' +
          '<span class="iopen">&#8599; open</span>' +
        '</div>' +
        '<div class="imsg">' + esc(issue.message) + '</div>' +
        '<div class="cl ' + hc + '" data-open="1" data-file="' + encodedFile + '" data-line="' + issue.line + '">' +
          '<div class="lno">' + (issue.line + 1) + '</div>' +
          '<div class="lt">' + esc(issue.message.length > 90 ? issue.message.substring(0,90)+'…' : issue.message) + '</div>' +
          '<div class="pill ' + pc + '">' + s.toUpperCase() + '</div>' +
        '</div>' +
      '</div>';
  });
  body.innerHTML = html;
}

window.addEventListener('message', ev => {
  const msg = ev.data;
  if (msg.command !== 'updateData') { return; }
  allIssues = msg.issues || [];
  const fc = msg.fileCount || 0;
  const mode = msg.mode;

  // Mode banner
  const banner = document.getElementById('modeBanner');
  banner.style.display = mode === 'file' ? 'inline-block' : 'none';

  document.getElementById('sFiles').textContent = fc;
  document.getElementById('sIssues').textContent = allIssues.length;

  // Weighted grade: critical=3, warning=2, info=1, normalized per file
  const crit = allIssues.filter(i=>i.severity==='critical').length;
  const warn = allIssues.filter(i=>i.severity==='warning').length;
  const info = allIssues.filter(i=>i.severity==='info').length;
  const score = fc > 0 ? (crit*3 + warn*2 + info*1) / fc : 0;
  let grade='A', gc='var(--it)';
  if (score>2)  { grade='B'; gc='var(--wt)'; }
  if (score>6)  { grade='C'; gc='var(--wt)'; }
  if (score>12) { grade='D'; gc='var(--ct)'; }
  if (score>20) { grade='F'; gc='var(--ct)'; }
  const ge = document.getElementById('sGrade');
  ge.textContent = grade; ge.style.color = gc;

  // Update per-card issue counts
  PTNS.forEach(p => {
    const n = allIssues.filter(i=>i.antiPattern===p).length;
    const el = document.getElementById('cnt-' + p);
    if (el) {
      el.textContent = n + ' issue' + (n!==1?'s':'');
      el.classList.toggle('z', n===0);
    }
  });

  // Re-render viewer if it's open
  if (viewerOpen) { renderViewer(); }
});
</script>
</body></html>`;
  }
}
