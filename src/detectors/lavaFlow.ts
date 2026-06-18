import { Issue } from './types';

/**
 * Lava Flow Detector (Anti-Patterns Book reference)
 *
 * "Lava Flow" = dead/fossilised code that has hardened in place and
 * nobody dares remove it because they don't know if it's still needed.
 *
 * Dart signals detected:
 *  1. TODO / FIXME / HACK / XXX / TEMP / BUG markers in comments
 *  2. Blocks of ≥3 consecutive commented-out Dart code lines
 *     (lines starting with // that contain code-like tokens)
 */
export function detectLavaFlow(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split('\n');

  // --- 1. Stale marker comments ---
  const MARKER_RE = /\/\/\s*(TODO|FIXME|HACK|XXX|TEMP|BUG|DEPRECATED|REMOVE|OLD)\b/i;

  lines.forEach((line, i) => {
    if (MARKER_RE.test(line)) {
      const marker = (line.match(MARKER_RE) || [])[1]?.toUpperCase() || 'TODO';
      issues.push({
        file: filePath,
        line: i,
        message: `Lava Flow: Stale '${marker}' marker at line ${i + 1}: "${line.trim().slice(0, 80)}". Resolve or delete dead code.`,
        severity: 'info',
        antiPattern: 'lavaFlow'
      });
    }
  });

  // --- 2. Consecutive commented-out Dart code blocks ---
  // A line is "commented code" if it starts with // and contains
  // at least one code token: (, ), ;, =, {, }, =>, ., ?, !, widget names
  const COMMENTED_CODE_RE = /^\s*\/\/(?!\/)\s*.{3,}[({);=>.?!].*$/;
  // Exclude pure prose: only letters/spaces/punctuation with no code chars
  const PROSE_RE = /^\s*\/\/\s*[A-Za-z][a-z ,.'!?-]{10,}[.!?]?\s*$/;

  let runStart = -1;
  let runCount = 0;

  const flush = (endIdx: number) => {
    if (runCount >= 3) {
      issues.push({
        file: filePath,
        line: runStart,
        message: `Lava Flow: ${runCount} consecutive commented-out code lines at line ${runStart + 1}. Remove or restore this dead code.`,
        severity: 'warning',
        antiPattern: 'lavaFlow'
      });
    }
    runStart = -1;
    runCount = 0;
  };

  lines.forEach((line, i) => {
    const isCommentedCode = COMMENTED_CODE_RE.test(line) && !PROSE_RE.test(line);
    if (isCommentedCode) {
      if (runStart === -1) { runStart = i; }
      runCount++;
    } else {
      flush(i);
    }
  });
  flush(lines.length);

  return issues;
}
