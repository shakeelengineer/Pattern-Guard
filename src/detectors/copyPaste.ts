import { Issue } from './types';

// Simple block similarity: hash 5-line sliding windows
function hashBlock(lines: string[]): string {
  return lines.map(l => l.trim()).filter(l => l.length > 2).join('|');
}

export function detectCopyPaste(
  files: Map<string, string>
): Issue[] {
  const issues: Issue[] = [];
  const blockMap = new Map<string, { file: string; line: number }>();
  const WINDOW = 5;

  for (const [filePath, content] of files) {
    const lines = content.split('\n');
    for (let i = 0; i <= lines.length - WINDOW; i++) {
      const block = hashBlock(lines.slice(i, i + WINDOW));
      if (block.length < 30) { continue; } // skip trivial blocks
      if (blockMap.has(block)) {
        const original = blockMap.get(block)!;
        issues.push({
          file: filePath,
          line: i,
          message: `Copy-Paste: Block matches ${original.file}:${original.line + 1}. Extract to a shared function.`,
          severity: 'critical'
        });
      } else {
        blockMap.set(block, { file: filePath, line: i });
      }
    }
  }
  return issues;
}
