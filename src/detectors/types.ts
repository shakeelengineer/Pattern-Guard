export type AntiPatternType =
  | 'copyPaste'
  | 'spaghettiCode'
  | 'nonFunctional'
  | 'godObject'
  | 'shotgunSurgery'
  | 'lavaFlow'
  | 'goldenHammer';

export interface Issue {
  file: string;
  line: number;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  antiPattern: AntiPatternType;
}
