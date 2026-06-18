import { Issue } from './types';

/**
 * Shotgun Surgery Detector (Anti-Patterns Book reference)
 *
 * Detects when the SAME business-logic magic value is scattered across
 * multiple files. Deliberately EXCLUDED: Flutter/Dart imports, common
 * layout strings. Flagged: hard-coded URLs, auth tokens, magic numbers.
 */
export function detectShotgunSurgery(files: Map<string, string>): Issue[] {
  const issues: Issue[] = [];

  // Literal -> [{file, line}]
  const literalMap = new Map<string, Array<{ file: string; line: number }>>();

  const MIN_FILES = 3;

  // Strings to skip entirely
  const SKIP_PATTERNS = [
    /^package:/, // any pub/flutter import
    /^dart:/,    // dart SDK
    /^\//,       // single slash routes handled separately
    /^\.$/,      // dot
    /^\\$/,       // backslash
    /^null$/,
    /^true$/,
    /^false$/,
  ];

  // Very common Flutter widget / type names that appear legitimately everywhere
  const COMMON_WORDS = new Set([
    'context','builder','child','children','key','value','text',
    'color','style','padding','margin','width','height','size',
    'type','data','id','name','title','body','header','footer',
    'onTap','onPressed','onChanged','setState','initState','dispose',
    'scaffold','material','widget','state','build','return',
  ]);

  for (const [filePath, content] of files) {
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      // Skip import lines entirely
      const trimmed = line.trim();
      if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) { return; }
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) { return; }

      // --- String literals (double-quoted, at least 5 chars) ---
      const strMatches = line.match(/"([^"]{5,80})"/g) || [];
      for (const raw of strMatches) {
        const lit = raw.slice(1, -1); // strip quotes
        if (SKIP_PATTERNS.some(p => p.test(lit))) { continue; }
        if (COMMON_WORDS.has(lit.toLowerCase())) { continue; }

        // Must look like a real constant: URL, endpoint, token keyword, etc.
        const looksReal =
          lit.includes('://') ||               // URL
          /^\/[a-z]/.test(lit) ||              // API route like /users/
          /[A-Z_]{3,}/.test(lit) ||            // CONSTANT_CASE
          /Bearer|Authorization|api[_-]?key|secret|token|endpoint/i.test(lit) ||
          /\d{4,}/.test(lit);                  // embedded long number

        if (!looksReal) { continue; }

        const key = `"${lit}"`;
        if (!literalMap.has(key)) { literalMap.set(key, []); }
        const arr = literalMap.get(key)!;
        if (!arr.some(e => e.file === filePath)) {
          arr.push({ file: filePath, line: i });
        }
      }

      // --- Numeric literals >= 100 (real magic numbers) ---
      const numMatches = line.match(/(?<![.\w])([1-9]\d{2,})(?![.\w%])/g) || [];
      for (const num of numMatches) {
        const n = parseInt(num, 10);
        // Skip obvious HTTP status codes that are well-known (200, 201, 404 etc are OK once)
        // only flag if it seems like a business constant
        if (n === 200 || n === 201 || n === 204 || n === 400 || n === 401 ||
            n === 403 || n === 404 || n === 500) { continue; }
        const key = `#${num}`;
        if (!literalMap.has(key)) { literalMap.set(key, []); }
        const arr = literalMap.get(key)!;
        if (!arr.some(e => e.file === filePath)) {
          arr.push({ file: filePath, line: i });
        }
      }
    });
  }

  // Emit issues for literals spanning >= MIN_FILES
  const reported = new Set<string>();
  for (const [key, occurrences] of literalMap) {
    if (occurrences.length < MIN_FILES || reported.has(key)) { continue; }
    reported.add(key);
    for (const occ of occurrences) {
      issues.push({
        file: occ.file,
        line: occ.line,
        message: `Shotgun Surgery: Magic value ${key} is hard-coded in ${occurrences.length} files. Extract to a shared constants file to avoid scattered changes.`,
        severity: 'warning',
        antiPattern: 'shotgunSurgery'
      });
    }
  }

  return issues;
}
