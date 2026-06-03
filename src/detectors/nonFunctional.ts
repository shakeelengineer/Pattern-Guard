import { Issue } from './types';

export function detectNonFunctional(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split('\n');

  lines.forEach((line, i) => {
    // Public class/method with no preceding doc comment
    if (/^(class|  \w+ \w+\()/.test(line)) {
      const prevLine = lines[i - 1] || '';
      if (!/\/\/\//.test(prevLine)) {
        issues.push({
          file: filePath,
          line: i,
          message: `Uncertain Non-Functional Req: Public declaration at line ${i + 1} has no doc comment. Document behavior/performance expectations.`,
          severity: 'warning'
        });
      }
    }
  });
  return issues;
}
