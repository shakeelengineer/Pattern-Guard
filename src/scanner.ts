import * as vscode from 'vscode';
import * as fs from 'fs';
import { Issue } from './detectors/types';
import { detectCopyPaste } from './detectors/copyPaste';
import { detectSpaghettiCode } from './detectors/spaghettiCode';
import { detectNonFunctional } from './detectors/nonFunctional';
import { detectGodObject } from './detectors/godObject';
import { detectShotgunSurgery } from './detectors/shotgunSurgery';
import { detectLavaFlow } from './detectors/lavaFlow';
import { detectGoldenHammer } from './detectors/goldenHammer';

/** Scan every .dart file in the workspace. */
export async function scanWorkspace(): Promise<{ issues: Issue[]; fileCount: number }> {
  const dartUris = await vscode.workspace.findFiles('**/*.dart', '**/build/**');
  const fileMap = new Map<string, string>();

  for (const uri of dartUris) {
    try {
      const content = fs.readFileSync(uri.fsPath, 'utf8');
      fileMap.set(uri.fsPath, content);
    } catch { /* skip unreadable files */ }
  }

  const allIssues: Issue[] = [];

  for (const [filePath, content] of fileMap) {
    allIssues.push(...detectSpaghettiCode(content, filePath));
    allIssues.push(...detectNonFunctional(content, filePath));
    allIssues.push(...detectGodObject(content, filePath));
    allIssues.push(...detectLavaFlow(content, filePath));
  }

  allIssues.push(...detectCopyPaste(fileMap));
  allIssues.push(...detectShotgunSurgery(fileMap));
  allIssues.push(...detectGoldenHammer(fileMap));

  return { issues: allIssues, fileCount: dartUris.length };
}

/**
 * Scan only a single .dart file.
 * Cross-file detectors (Copy-Paste, Shotgun Surgery, Golden Hammer) are
 * skipped because they require workspace context.
 */
export async function scanSingleFile(filePath: string): Promise<{ issues: Issue[]; fileCount: number }> {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return { issues: [], fileCount: 0 };
  }

  const issues: Issue[] = [
    ...detectSpaghettiCode(content, filePath),
    ...detectNonFunctional(content, filePath),
    ...detectGodObject(content, filePath),
    ...detectLavaFlow(content, filePath),
  ];

  return { issues, fileCount: 1 };
}
