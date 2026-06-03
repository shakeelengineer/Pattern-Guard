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
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (PatternGuardPanel.currentPanel) {
      PatternGuardPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'patternGuard.dashboard',
      'Pattern Guard Dashboard',
      column || vscode.ViewColumn.One,
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
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
        }
        h1 { font-size: 1.5em; font-weight: 600; margin-bottom: 20px; }
        .card {
            background-color: var(--vscode-editorWidget-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .card:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .card h2 {
            margin: 0 0 8px 0;
            font-size: 1.2em;
        }
        .card p {
            margin: 0;
            opacity: 0.8;
        }
        .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            margin-top: 10px;
        }
        .status.active { background-color: var(--vscode-testing-iconPassed); color: white; }
        .status.pending { background-color: var(--vscode-testing-iconQueued); color: white; }
        
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1em;
            margin-bottom: 20px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <h1>Pattern Guard Dashboard</h1>
    <button onclick="scanProject()">Scan Project</button>
    
    <div class="card" onclick="alertNotImplemented('God Object')">
        <h2>God Object</h2>
        <p>Class with >20 methods OR >500 lines.</p>
        <span class="status pending">Coming Soon</span>
    </div>

    <div class="card" onclick="alertNotImplemented('Copy-Paste Programming', true)">
        <h2>Copy-Paste Programming</h2>
        <p>Duplicate code blocks ≥5 lines across files.</p>
        <span class="status active">Active</span>
    </div>

    <div class="card" onclick="alertNotImplemented('Spaghetti Code', true)">
        <h2>Spaghetti Code</h2>
        <p>Deeply nested code (>4 levels).</p>
        <span class="status active">Active</span>
    </div>

    <div class="card" onclick="alertNotImplemented('Shotgun Surgery')">
        <h2>Shotgun Surgery</h2>
        <p>Same constant/magic value in many files.</p>
        <span class="status pending">Coming Soon</span>
    </div>

    <div class="card" onclick="alertNotImplemented('Lava Flow')">
        <h2>Lava Flow</h2>
        <p>Commented-out code blocks, TODO/FIXME markers.</p>
        <span class="status pending">Coming Soon</span>
    </div>

    <div class="card" onclick="alertNotImplemented('Golden Hammer')">
        <h2>Golden Hammer</h2>
        <p>One library/pattern used in >80% of files.</p>
        <span class="status pending">Coming Soon</span>
    </div>

    <div class="card" onclick="alertNotImplemented('Uncertain Non-Functional Requirements', true)">
        <h2>Uncertain Non-Functional Requirements</h2>
        <p>Missing // doc comments on public classes/methods.</p>
        <span class="status active">Active</span>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function scanProject() {
            vscode.postMessage({ command: 'scan' });
        }

        function alertNotImplemented(patternName, isActive) {
            if (!isActive) {
                vscode.postMessage({ command: 'notImplemented', text: patternName });
            } else {
                vscode.postMessage({ command: 'scan' });
            }
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
