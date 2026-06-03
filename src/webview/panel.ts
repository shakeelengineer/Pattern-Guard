import * as vscode from 'vscode';

export class PatternGuardPanel {
  public static currentPanel: PatternGuardPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getHtmlForWebview();
    
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'scan':
            vscode.commands.executeCommand('patternGuard.scan');
            return;
          case 'notImplemented':
            vscode.window.showInformationMessage(`The pattern '${message.text}' will be workable soon, but Uncertain Non-Functional Requirements, Spaghetti Code, and Copy-Paste Programming are fully working.`);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    // Force split screen (open beside current editor)
    const column = vscode.ViewColumn.Beside;

    if (PatternGuardPanel.currentPanel) {
      PatternGuardPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'patternGuard.dashboard',
      'Pattern Guard Dashboard',
      column,
      {
        enableScripts: true,
      }
    );

    PatternGuardPanel.currentPanel = new PatternGuardPanel(panel, extensionUri);
  }

  private _getHtmlForWebview() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pattern Guard</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap');
        
        :root {
            --bg-body: #F8FAFC;
            --bg-panel: #FFFFFF;
            --text-main: #0F172A;
            --text-muted: #64748B;
            --border-color: #E2E8F0;
            --primary: #3B82F6;
            --critical-bg: #FEF2F2;
            --critical-text: #DC2626;
            --warning-bg: #FFF7ED;
            --warning-text: #EA580C;
            --info-bg: #F0FDF4;
            --info-text: #16A34A;
            --card-hover: #F1F5F9;
        }

        /* Support VS Code Dark Mode */
        body.vscode-dark {
            --bg-body: #0F172A;
            --bg-panel: #1E293B;
            --text-main: #F8FAFC;
            --text-muted: #94A3B8;
            --border-color: #334155;
            --card-hover: #334155;
            --critical-bg: #451A1A;
            --critical-text: #FCA5A5;
            --warning-bg: #4A2B12;
            --warning-text: #FDBA74;
            --info-bg: #143323;
            --info-text: #86EFAC;
        }

        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 24px;
            background-color: var(--bg-body);
            color: var(--text-main);
            height: 100vh;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
        }

        /* Container */
        .app-container {
            background-color: var(--bg-panel);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow: hidden;
        }

        /* Header */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 24px;
            border-bottom: 1px solid var(--border-color);
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .logo-icon {
            width: 32px;
            height: 32px;
            background-color: #E0F2FE;
            border: 2px solid var(--primary);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .logo-icon svg {
            width: 20px;
            height: 20px;
            color: var(--primary);
        }

        .header-titles h1 {
            font-size: 1.1rem;
            font-weight: 700;
            margin: 0;
            line-height: 1.2;
        }
        
        .header-titles p {
            font-size: 0.8rem;
            color: var(--text-muted);
            margin: 0;
        }

        .header-center {
            flex: 1;
            display: flex;
            justify-content: center;
            padding: 0 20px;
        }

        .analyze-btn {
            background: linear-gradient(to right, #06B6D4, #2563EB);
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 9999px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
            transition: transform 0.1s, box-shadow 0.1s;
        }

        .analyze-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3);
        }

        .header-right {
            display: flex;
            gap: 20px;
        }

        .stat-block {
            text-align: right;
        }

        .stat-label {
            font-size: 0.65rem;
            text-transform: uppercase;
            color: var(--text-muted);
            font-weight: 600;
            letter-spacing: 0.05em;
        }

        .stat-value {
            font-size: 1.2rem;
            font-weight: 700;
        }

        /* Layout Split */
        .main-content {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        /* Sidebar */
        .sidebar {
            width: 320px;
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }

        .sidebar-header {
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
            position: sticky;
            top: 0;
            background-color: var(--bg-panel);
            z-index: 10;
        }

        .sidebar-header h2 {
            font-size: 0.9rem;
            font-weight: 600;
            margin: 0;
        }

        .sidebar-header span {
            font-size: 0.75rem;
            color: var(--text-muted);
        }

        /* Cards */
        .card {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-color);
            cursor: pointer;
            transition: background-color 0.2s;
            position: relative;
        }

        .card:hover {
            background-color: var(--card-hover);
        }

        .card.active {
            border-left: 4px solid var(--primary);
            background-color: var(--card-hover);
        }

        .card-header {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 12px;
        }

        .card-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .severity-critical .card-icon { background-color: var(--critical-bg); color: var(--critical-text); }
        .severity-warning .card-icon { background-color: var(--warning-bg); color: var(--warning-text); }
        .severity-info .card-icon { background-color: var(--info-bg); color: var(--info-text); }

        .card-title-group {
            flex: 1;
        }

        .card-title {
            font-size: 0.95rem;
            font-weight: 600;
            margin: 0 0 4px 0;
            line-height: 1.3;
        }

        .card-desc {
            font-size: 0.75rem;
            color: var(--text-muted);
            margin: 0;
            line-height: 1.4;
        }

        .card-badge {
            font-size: 0.65rem;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
        }
        
        .severity-critical .card-badge { background-color: var(--critical-bg); color: var(--critical-text); }
        .severity-warning .card-badge { background-color: var(--warning-bg); color: var(--warning-text); }
        .severity-info .card-badge { background-color: var(--info-bg); color: var(--info-text); }

        .progress-bar-bg {
            height: 4px;
            background-color: var(--border-color);
            border-radius: 2px;
            overflow: hidden;
            margin-top: 8px;
        }

        .progress-bar-fill {
            height: 100%;
            border-radius: 2px;
        }
        
        .severity-critical .progress-bar-fill { background-color: var(--critical-text); width: 85%; }
        .severity-warning .progress-bar-fill { background-color: var(--warning-text); width: 60%; }
        .severity-info .progress-bar-fill { background-color: var(--info-text); width: 30%; }

        /* Code Viewer */
        .code-viewer {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background-color: var(--bg-body);
        }

        .code-header {
            padding: 12px 24px;
            border-bottom: 1px solid var(--border-color);
            background-color: var(--bg-panel);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .file-path {
            font-family: 'Fira Code', monospace;
            font-size: 0.85rem;
            color: var(--text-main);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .file-path::before {
            content: '';
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--primary);
        }

        .flag-badge {
            background-color: var(--critical-bg);
            color: var(--critical-text);
            font-size: 0.75rem;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 9999px;
        }

        .code-content {
            padding: 20px 0;
            overflow-y: auto;
            flex: 1;
            font-family: 'Fira Code', monospace;
            font-size: 0.85rem;
            line-height: 1.6;
        }

        .code-line {
            display: flex;
            padding: 0 24px;
            position: relative;
        }
        
        .code-line:hover {
            background-color: var(--card-hover);
        }

        .line-number {
            width: 40px;
            color: var(--text-muted);
            text-align: right;
            padding-right: 16px;
            user-select: none;
            opacity: 0.5;
        }

        .line-text {
            white-space: pre;
            flex: 1;
        }

        /* Highlighted Code Line */
        .code-line.highlighted {
            background-color: var(--critical-bg);
        }

        .code-line.highlighted::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background-color: var(--critical-text);
        }

        .floating-capsule {
            position: absolute;
            right: 24px;
            top: 50%;
            transform: translateY(-50%);
            background-color: var(--critical-text);
            color: white;
            font-family: 'Inter', sans-serif;
            font-size: 0.7rem;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 9999px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Syntax highlighting simple */
        .kw { color: #C678DD; }
        .func { color: #61AFEF; }
        .str { color: #98C379; }
        .var { color: #E5C07B; }
        
        body.vscode-light .kw { color: #A626A4; }
        body.vscode-light .func { color: #4078F2; }
        body.vscode-light .str { color: #50A14F; }
        body.vscode-light .var { color: #986801; }
    </style>
</head>
<body>
    <div class="app-container">
        <!-- Header -->
        <div class="header">
            <div class="header-left">
                <div class="logo-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                </div>
                <div class="header-titles">
                    <h1>Pattern Guard</h1>
                    <p>Anti-pattern scanner</p>
                </div>
            </div>
            
            <div class="header-center">
                <button class="analyze-btn" onclick="scanProject()">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Analyze Project
                </button>
            </div>
            
            <div class="header-right">
                <div class="stat-block">
                    <div class="stat-label">Files</div>
                    <div class="stat-value">247</div>
                </div>
                <div class="stat-block">
                    <div class="stat-label">Issues</div>
                    <div class="stat-value" style="color: var(--warning-text)">10</div>
                </div>
                <div class="stat-block">
                    <div class="stat-label">Grade</div>
                    <div class="stat-value" style="color: var(--critical-text)">C</div>
                </div>
            </div>
        </div>

        <!-- Layout Split -->
        <div class="main-content">
            <!-- Sidebar -->
            <div class="sidebar">
                <div class="sidebar-header">
                    <h2>Threat Level &middot; 7 Patterns</h2>
                    <span>click to inspect</span>
                </div>
                
                <!-- Card: Copy-Paste -->
                <div class="card active severity-critical" onclick="selectCard(this); alertNotImplemented('Copy-Paste Programming', true)">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </div>
                        <div class="card-title-group">
                            <h3 class="card-title">Copy-Paste Programming</h3>
                            <p class="card-desc">Duplicate code blocks &ge;5 lines across files.</p>
                        </div>
                        <span class="card-badge">Critical</span>
                    </div>
                    <div class="progress-bar-bg"><div class="progress-bar-fill"></div></div>
                </div>

                <!-- Card: Spaghetti Code -->
                <div class="card severity-warning" onclick="selectCard(this); alertNotImplemented('Spaghetti Code', true)">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <div class="card-title-group">
                            <h3 class="card-title">Spaghetti Code</h3>
                            <p class="card-desc">Deeply nested code (>4 levels).</p>
                        </div>
                        <span class="card-badge">Warning</span>
                    </div>
                    <div class="progress-bar-bg"><div class="progress-bar-fill"></div></div>
                </div>
                
                <!-- Card: Uncertain Non-Functional -->
                <div class="card severity-warning" onclick="selectCard(this); alertNotImplemented('Uncertain Non-Functional Requirements', true)">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <div class="card-title-group">
                            <h3 class="card-title">Non-Functional Reqs</h3>
                            <p class="card-desc">Missing // doc comments on public declarations.</p>
                        </div>
                        <span class="card-badge">Warning</span>
                    </div>
                    <div class="progress-bar-bg"><div class="progress-bar-fill"></div></div>
                </div>

                <!-- Card: God Object -->
                <div class="card severity-critical" onclick="selectCard(this); alertNotImplemented('God Object', false)">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        </div>
                        <div class="card-title-group">
                            <h3 class="card-title">God Object</h3>
                            <p class="card-desc">Class with >20 methods OR >500 lines.</p>
                        </div>
                        <span class="card-badge">Coming Soon</span>
                    </div>
                    <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: 10%"></div></div>
                </div>
                
                <!-- Card: Shotgun Surgery -->
                <div class="card severity-warning" onclick="selectCard(this); alertNotImplemented('Shotgun Surgery', false)">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </div>
                        <div class="card-title-group">
                            <h3 class="card-title">Shotgun Surgery</h3>
                            <p class="card-desc">Same constant/magic value in many files.</p>
                        </div>
                        <span class="card-badge">Coming Soon</span>
                    </div>
                    <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: 10%"></div></div>
                </div>
                
                <!-- Card: Lava Flow -->
                <div class="card severity-info" onclick="selectCard(this); alertNotImplemented('Lava Flow', false)">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                        </div>
                        <div class="card-title-group">
                            <h3 class="card-title">Lava Flow</h3>
                            <p class="card-desc">Commented-out code blocks, TODO markers.</p>
                        </div>
                        <span class="card-badge">Coming Soon</span>
                    </div>
                    <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: 10%"></div></div>
                </div>
                
                <!-- Card: Golden Hammer -->
                <div class="card severity-info" onclick="selectCard(this); alertNotImplemented('Golden Hammer', false)">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                        </div>
                        <div class="card-title-group">
                            <h3 class="card-title">Golden Hammer</h3>
                            <p class="card-desc">One library/pattern used in >80% of files.</p>
                        </div>
                        <span class="card-badge">Coming Soon</span>
                    </div>
                    <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: 10%"></div></div>
                </div>

            </div>

            <!-- Code Viewer -->
            <div class="code-viewer">
                <div class="code-header">
                    <div class="file-path">lib/services/user_service.dart &middot; dart</div>
                    <div class="flag-badge">5 flagged lines</div>
                </div>
                <div class="code-content" id="code-content">
                    <div class="code-line"><div class="line-number">12</div><div class="line-text">  <span class="kw">Future</span>&lt;<span class="var">void</span>&gt; <span class="func">fetchUserData</span>() <span class="kw">async</span> {</div></div>
                    <div class="code-line"><div class="line-number">13</div><div class="line-text">    <span class="kw">try</span> {</div></div>
                    <div class="code-line"><div class="line-number">14</div><div class="line-text">      <span class="kw">final</span> response = <span class="kw">await</span> http.get(Uri.parse(<span class="str">'https://api.example.com/users'</span>));</div></div>
                    <div class="code-line highlighted">
                        <div class="line-number">15</div>
                        <div class="line-text">      <span class="kw">if</span> (response.statusCode == <span class="var">200</span>) {</div>
                        <div class="floating-capsule">90% match with admin_service.dart</div>
                    </div>
                    <div class="code-line highlighted"><div class="line-number">16</div><div class="line-text">        <span class="kw">var</span> data = jsonDecode(response.body);</div></div>
                    <div class="code-line highlighted"><div class="line-number">17</div><div class="line-text">        <span class="kw">for</span> (<span class="kw">var</span> item <span class="kw">in</span> data) {</div></div>
                    <div class="code-line highlighted"><div class="line-number">18</div><div class="line-text">          users.add(User.fromJson(item));</div></div>
                    <div class="code-line highlighted"><div class="line-number">19</div><div class="line-text">        }</div></div>
                    <div class="code-line"><div class="line-number">20</div><div class="line-text">      }</div></div>
                    <div class="code-line"><div class="line-number">21</div><div class="line-text">    } <span class="kw">catch</span> (e) {</div></div>
                    <div class="code-line"><div class="line-number">22</div><div class="line-text">      print(<span class="str">'Error fetching data'</span>);</div></div>
                    <div class="code-line"><div class="line-number">23</div><div class="line-text">    }</div></div>
                    <div class="code-line"><div class="line-number">24</div><div class="line-text">  }</div></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function scanProject() {
            vscode.postMessage({ command: 'scan' });
            
            // Visual feedback for button click
            const btn = document.querySelector('.analyze-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Scanning...';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 1000);
        }

        function alertNotImplemented(patternName, isActive) {
            if (!isActive) {
                vscode.postMessage({ command: 'notImplemented', text: patternName });
            } else {
                vscode.postMessage({ command: 'scan' });
            }
        }
        
        function selectCard(element) {
            document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
            element.classList.add('active');
        }
    </script>
</body>
</html>`;
  }

  public dispose() {
    PatternGuardPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
