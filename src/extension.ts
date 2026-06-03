import * as vscode from 'vscode';
import { scanWorkspace } from './scanner';
import { PatternGuardPanel } from './webview/panel';

let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
  diagnosticCollection = vscode.languages.createDiagnosticCollection('patternGuard');
  context.subscriptions.push(diagnosticCollection);

  // Register show panel command
  const showPanelCmd = vscode.commands.registerCommand('patternGuard.showPanel', () => {
    PatternGuardPanel.createOrShow(context.extensionUri);
  });
  context.subscriptions.push(showPanelCmd);

  // Register scan command
  const scanCmd = vscode.commands.registerCommand('patternGuard.scan', async () => {
    vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'Pattern Guard: Scanning...', cancellable: false },
      async () => {
        diagnosticCollection.clear();
        const issues = await scanWorkspace();

        // Group diagnostics by file
        const diagMap = new Map<string, vscode.Diagnostic[]>();
        for (const issue of issues) {
          const uri = vscode.Uri.file(issue.file);
          const range = new vscode.Range(issue.line, 0, issue.line, 100);
          const severity = issue.severity === 'critical'
            ? vscode.DiagnosticSeverity.Error
            : issue.severity === 'warning'
            ? vscode.DiagnosticSeverity.Warning
            : vscode.DiagnosticSeverity.Information;
          const diag = new vscode.Diagnostic(range, issue.message, severity);
          diag.source = 'Pattern Guard';
          if (!diagMap.has(issue.file)) { diagMap.set(issue.file, []); }
          diagMap.get(issue.file)!.push(diag);
        }

        for (const [filePath, diags] of diagMap) {
          diagnosticCollection.set(vscode.Uri.file(filePath), diags);
        }

        vscode.window.showInformationMessage(
          `Pattern Guard: Found ${issues.length} issues in ${diagMap.size} files.`
        );
      }
    );
  });
  context.subscriptions.push(scanCmd);

  // Auto-scan on save
  vscode.workspace.onDidSaveTextDocument(doc => {
    if (doc.fileName.endsWith('.dart')) {
      vscode.commands.executeCommand('patternGuard.scan');
    }
  });
}

export function deactivate() {
  diagnosticCollection.dispose();
}
