import { Issue } from './types';

/**
 * God Object Detector
 * Flags any class that has:
 *  - More than 20 method declarations, OR
 *  - More than 500 lines in the file
 *
 * Dart heuristics:
 *  - Class declared via "class ClassName" / "abstract class"
 *  - Methods: lines that look like `returnType methodName(` inside the class
 */
export function detectGodObject(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split('\n');

  const METHOD_THRESHOLD = 20;
  const LINE_THRESHOLD = 500;

  // File-level: flag if file is >500 lines
  if (lines.length > LINE_THRESHOLD) {
    issues.push({
      file: filePath,
      line: 0,
      message: `God Object: File has ${lines.length} lines (>${LINE_THRESHOLD}). Consider splitting into smaller classes/widgets.`,
      severity: 'critical',
      antiPattern: 'godObject'
    });
  }

  // Class-level: count methods per class
  let insideClass = false;
  let classBraceDepth = 0;
  let classStartLine = 0;
  let className = '';
  let methodCount = 0;
  let depth = 0;

  lines.forEach((line, i) => {
    const openCount = (line.match(/{/g) || []).length;
    const closeCount = (line.match(/}/g) || []).length;

    // Detect class declaration
    const classMatch = line.match(/^\s*(abstract\s+)?class\s+(\w+)/);
    if (classMatch && !insideClass) {
      insideClass = true;
      classBraceDepth = depth + openCount - closeCount;
      classStartLine = i;
      className = classMatch[2];
      methodCount = 0;
    }

    if (insideClass) {
      // Count method declarations (e.g. `void foo(`, `String get bar`, `Future<X> fetchData(`)
      const methodMatch = line.match(/^\s+(?:@\w+\s+)*(?:static\s+)?(?:async\s+)?(?:[\w<>\[\]?]+\s+)+(\w+)\s*\(/);
      if (methodMatch && depth > classBraceDepth) {
        methodCount++;
      }
    }

    depth += openCount;
    depth -= closeCount;

    // Class ended
    if (insideClass && depth <= classBraceDepth && i > classStartLine) {
      if (methodCount > METHOD_THRESHOLD) {
        issues.push({
          file: filePath,
          line: classStartLine,
          message: `God Object: Class '${className}' has ${methodCount} methods (>${METHOD_THRESHOLD}). Break it into focused classes following SRP.`,
          severity: 'critical',
          antiPattern: 'godObject'
        });
      }
      insideClass = false;
      methodCount = 0;
    }
  });

  return issues;
}
