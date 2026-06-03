import { Issue } from './types';

export function detectSpaghettiCode(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split('\n');
  let depth = 0;
  
  lines.forEach((line, i) => {
    depth += (line.match(/{/g) || []).length;
    depth -= (line.match(/}/g) || []).length;
    if (depth > 4) {
      issues.push({
        file: filePath,
        line: i,
        message: `Spaghetti Code: Nesting depth ${depth} at line ${i + 1}. Consider extracting methods.`,
        severity: 'warning'
      });
    }
  });
  return issues;
}
