import * as vscode from 'vscode';
import { scanWorkspace, scanSingleFile } from './scanner';
import { PatternGuardViewProvider } from './webview/panel';

let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
  diagnosticCollection = vscode.languages.createDiagnosticCollection('patternGuard');
  context.subscriptions.push(diagnosticCollection);

  // ── Register the sidebar WebviewViewProvider ───────────────────────────────
  // This is the KEY fix: registerWebviewViewProvider keeps the panel alive
  // across folder changes because it lives in the Activity Bar sidebar.
  const provider = new PatternGuardViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      PatternGuardViewProvider.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // ── Wire message handler ───────────────────────────────────────────────────
  PatternGuardViewProvider.onMessage = (message) => {
    switch (message.command) {
      case 'scan':
        vscode.commands.executeCommand('patternGuard.scan');
        break;
      case 'scanFile':
        vscode.commands.executeCommand('patternGuard.scanFile');
        break;
      case 'openFile': {
        const uri = vscode.Uri.file(message.file);
        vscode.workspace.openTextDocument(uri).then(doc => {
          vscode.window.showTextDocument(doc, vscode.ViewColumn.One).then(editor => {
            const line = Math.max(0, (message.line as number) || 0);
            const range = new vscode.Range(line, 0, line, 9999);
            editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
            editor.selection = new vscode.Selection(line, 0, line, 0);
          });
        }, err => {
          vscode.window.showErrorMessage(`Pattern Guard: Cannot open file — ${err.message}`);
        });
        break;
      }
    }
  };

  // ── Scan whole workspace ───────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('patternGuard.scan', async () => {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Pattern Guard: Scanning workspace…',
          cancellable: false,
        },
        async () => {
          diagnosticCollection.clear();
          const { issues, fileCount } = await scanWorkspace();
          applyDiagnostics(issues);
          vscode.window.showInformationMessage(
            `Pattern Guard: Found ${issues.length} issue${issues.length !== 1 ? 's' : ''} across ${fileCount} file${fileCount !== 1 ? 's' : ''}.`
          );
          const inst = PatternGuardViewProvider.instance;
          if (inst) { inst.sendScanResults(issues, fileCount, 'workspace'); }
        }
      );
    })
  );

  // ── Scan active file ───────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('patternGuard.scanFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !editor.document.fileName.endsWith('.dart')) {
        vscode.window.showWarningMessage('Pattern Guard: Please open a .dart file first.');
        return;
      }
      const filePath = editor.document.fileName;
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Pattern Guard: Scanning ${filePath.split(/[/\\]/).pop()}…`,
          cancellable: false,
        },
        async () => {
          diagnosticCollection.clear();
          const { issues, fileCount } = await scanSingleFile(filePath);
          applyDiagnostics(issues);
          vscode.window.showInformationMessage(
            `Pattern Guard: Found ${issues.length} issue${issues.length !== 1 ? 's' : ''} in active file.`
          );
          const inst = PatternGuardViewProvider.instance;
          if (inst) { inst.sendScanResults(issues, fileCount, 'file'); }
        }
      );
    })
  );

  // ── Show panel (reveal the sidebar view) ──────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('patternGuard.showPanel', () => {
      vscode.commands.executeCommand('patternGuard.dashboard.focus');
    })
  );

  // ── Auto-scan on .dart save ────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(doc => {
      if (doc.fileName.endsWith('.dart')) {
        vscode.commands.executeCommand('patternGuard.scan');
      }
    })
  );
}

function applyDiagnostics(issues: any[]) {
  const diagMap = new Map<string, vscode.Diagnostic[]>();
  for (const issue of issues) {
    const range = new vscode.Range(issue.line, 0, issue.line, 999);
    const severity =
      issue.severity === 'critical' ? vscode.DiagnosticSeverity.Error
      : issue.severity === 'warning' ? vscode.DiagnosticSeverity.Warning
      : vscode.DiagnosticSeverity.Information;
    const diag = new vscode.Diagnostic(range, issue.message, severity);
    diag.source = 'Pattern Guard';
    if (!diagMap.has(issue.file)) { diagMap.set(issue.file, []); }
    diagMap.get(issue.file)!.push(diag);
  }
  for (const [fp, diags] of diagMap) {
    diagnosticCollection.set(vscode.Uri.file(fp), diags);
  }
}

export function deactivate() {
  diagnosticCollection.dispose();
}
