import { Issue } from './types';

/**
 * Golden Hammer Detector (Anti-Patterns Book reference)
 *
 * "If all you have is a hammer, everything looks like a nail."
 * Detects when a single solution/widget/package is applied everywhere,
 * even in cases where a more appropriate tool exists.
 *
 * Flutter-specific signals:
 *  1. One third-party state management package appears in >= 60% of Dart files
 *     (Provider, GetX, Bloc, Riverpod, MobX, Cubit) — signals over-reliance
 *     on one pattern even for trivial state.
 *  2. `Container` widget used as wrapper in >= 70% of widget files when
 *     simpler alternatives (Padding, SizedBox, ColoredBox) would suffice.
 */
export function detectGoldenHammer(files: Map<string, string>): Issue[] {
  const issues: Issue[] = [];
  const totalFiles = files.size;
  if (totalFiles < 4) { return issues; }

  // Dart files that import flutter (UI files)
  const widgetFiles: string[] = [];
  for (const [fp, content] of files) {
    if (/package:flutter\/(material|widgets|cupertino)\.dart/.test(content)) {
      widgetFiles.push(fp);
    }
  }
  const totalWidgetFiles = widgetFiles.length;

  // --- 1. State management overuse ---
  const STATE_PKGS = [
    { name: 'GetX (get)', re: /import\s+['"]package:get\// },
    { name: 'Provider', re: /import\s+['"]package:provider\// },
    { name: 'flutter_bloc / Bloc', re: /import\s+['"]package:flutter_bloc\// },
    { name: 'Riverpod', re: /import\s+['"]package:(?:flutter_)?riverpod\// },
    { name: 'MobX', re: /import\s+['"]package:mobx\// },
    { name: 'GetIt', re: /import\s+['"]package:get_it\// },
  ];

  for (const pkg of STATE_PKGS) {
    const affected: Array<{ file: string; line: number }> = [];
    for (const [fp, content] of files) {
      const idx = content.split('\n').findIndex(l => pkg.re.test(l));
      if (idx !== -1) { affected.push({ file: fp, line: idx }); }
    }
    const ratio = affected.length / totalFiles;
    if (ratio >= 0.6 && affected.length >= 4) {
      for (const { file, line } of affected) {
        issues.push({
          file,
          line,
          message: `Golden Hammer: '${pkg.name}' imported in ${affected.length}/${totalFiles} files (${Math.round(ratio * 100)}%). Consider lighter state solutions (ValueNotifier, InheritedWidget) for simple cases.`,
          severity: 'info',
          antiPattern: 'goldenHammer'
        });
      }
      break; // report only the dominant one
    }
  }

  // --- 2. Container-as-hammer overuse ---
  if (totalWidgetFiles >= 4) {
    const containerFiles: Array<{ file: string; line: number }> = [];
    for (const fp of widgetFiles) {
      const content = files.get(fp) || '';
      const lines = content.split('\n');
      // Count Container( usages
      const containerCount = lines.filter(l => /\bContainer\s*\(/.test(l)).length;
      if (containerCount >= 3) {
        const firstLine = lines.findIndex(l => /\bContainer\s*\(/.test(l));
        containerFiles.push({ file: fp, line: firstLine });
      }
    }
    const ratio = containerFiles.length / totalWidgetFiles;
    if (ratio >= 0.7 && containerFiles.length >= 4) {
      for (const { file, line } of containerFiles) {
        issues.push({
          file,
          line,
          message: `Golden Hammer: 'Container' used as catch-all wrapper in ${containerFiles.length}/${totalWidgetFiles} widget files (${Math.round(ratio * 100)}%). Use Padding, SizedBox, or ColoredBox for single-purpose wrapping.`,
          severity: 'info',
          antiPattern: 'goldenHammer'
        });
      }
    }
  }

  return issues;
}
