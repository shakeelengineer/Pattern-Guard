import { Issue } from './types';

/**
 * Copy-Paste Programming Detector (Anti-Patterns Book reference)
 *
 * Detects duplicate code blocks of >= WINDOW lines that appear across files.
 * Higher thresholds are used to focus on real duplication, not trivial matches.
 */
export function detectCopyPaste(files: Map<string, string>): Issue[] {
  const issues: Issue[] = [];
  const blockMap = new Map<string, { file: string; line: number }>();
  const WINDOW = 8;       // increased from 5 → fewer false positives
  const MIN_LENGTH = 80;  // block hash must be this long (skips trivial blocks)

  for (const [filePath, content] of files) {
    const lines = content.split('\n');

    for (let i = 0; i <= lines.length - WINDOW; i++) {
      const window = lines.slice(i, i + WINDOW);

      // Skip blocks that are mostly imports / comments / blank lines
      const codeLines = window.filter(l => {
        const t = l.trim();
        return t.length > 0 &&
          !t.startsWith('import ') &&
          !t.startsWith('export ') &&
          !t.startsWith('//') &&
          !t.startsWith('*') &&
          !t.startsWith('/*') &&
          t !== '{' && t !== '}' && t !== '};';
      });
      if (codeLines.length < 5) { continue; } // need at least 5 real code lines

      const hash = codeLines.map(l => l.trim()).join('|');
      if (hash.length < MIN_LENGTH) { continue; }

      if (blockMap.has(hash)) {
        const original = blockMap.get(hash)!;
        // Avoid duplicate reports for the same original
        if (original.file !== filePath) {
          issues.push({
            file: filePath,
            line: i,
            message: `Copy-Paste Programming: Block (${WINDOW} lines) duplicated from ${original.file.split(/[\\/]/).pop()}:${original.line + 1}. Extract to a shared function/widget.`,
            severity: 'critical',
            antiPattern: 'copyPaste'
          });
        }
      } else {
        blockMap.set(hash, { file: filePath, line: i });
      }
    }
  }

  return issues;
}
