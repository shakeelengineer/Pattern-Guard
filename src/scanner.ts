import * as vscode from 'vscode';
import * as fs from 'fs';
import { Issue } from './detectors/types';
import { detectCopyPaste } from './detectors/copyPaste';
import { detectSpaghettiCode } from './detectors/spaghettiCode';
import { detectNonFunctional } from './detectors/nonFunctional';

export async function scanWorkspace(): Promise<Issue[]> {
  const dartFiles = await vscode.workspace.findFiles('**/*.dart', '**/build/**');
  const fileMap = new Map<string, string>();
  
  for (const uri of dartFiles) {
    const content = fs.readFileSync(uri.fsPath, 'utf8');
    fileMap.set(uri.fsPath, content);
  }

  const allIssues: Issue[] = [];

  // Per-file detectors
  for (const [filePath, content] of fileMap) {
    allIssues.push(...detectSpaghettiCode(content, filePath));
    allIssues.push(...detectNonFunctional(content, filePath));
  }

  // Cross-file detectors
  allIssues.push(...detectCopyPaste(fileMap));

  return allIssues;
}
