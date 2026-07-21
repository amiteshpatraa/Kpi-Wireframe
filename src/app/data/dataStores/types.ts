export type PageId = 'OEE' | 'COPQ' | 'BPR' | 'OTIF' | 'INVENTORY' | 'TRACEABILITY';
export type PeriodId = 'YTD' | 'YoY' | 'QTD' | 'MTD' | 'WTD';
export type ProductId = 'ALL' | 'MATRIX' | 'BANANA' | 'KIWI';

export interface Coordinate {
  x: number;
  y: number;
}

export const pages: PageId[] = ['OEE', 'COPQ', 'BPR', 'OTIF', 'INVENTORY', 'TRACEABILITY'];
export const products: ProductId[] = ['ALL', 'MATRIX', 'BANANA', 'KIWI'];
export const periods: PeriodId[] = ['YTD', 'YoY', 'QTD', 'MTD', 'WTD'];
export const processes = [
  'ALL', 'VMC1', 'PACK', 'UC1', 'SF01', 'LW1', 'CL1', 'LW2', 'LW3', 'BRZ', 
  'SB10', 'RSHP', 'ALT10', 'OP10', 'OP20', 'SLGL', 'OP30', 'OP40', 'OP50', 'UC2', 'EOL'
];

export const T = {
  red: '#EF4444',
  amber: '#F59E0B',
  green: '#10B981',
  blue: '#3B82F6',
  rose: '#EC4899',
  purple: '#8B5CF6'
};

export function getTimeLabels(period: PeriodId): string[] {
  if (period === 'YoY') {
    return Array.from({ length: 16 }, (_, i) => String(2011 + i));
  }
  if (period === 'QTD') {
    return ['Apr', 'May', 'Jun', 'Jul'];
  }
  if (period === 'MTD') {
    return Array.from({ length: 31 }, (_, i) => String(i + 1));
  }
  if (period === 'WTD') {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  }
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
}
