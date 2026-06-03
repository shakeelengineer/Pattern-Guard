export interface Issue {
  file: string;
  line: number;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}
