import { type FilterState } from './TimeTrendFilter';

// ─── Period label resolver ───────────────────────────────────────────────────
function periodLabel(filters: FilterState): string | null {
  const t = filters.trend;
  const s = filters.subPeriod;
  if (t === 'year') return s === 'yoy' ? 'YoY' : 'YTD';
  if (t === 'quarter') return s === 'qoq' ? 'QoQ' : 'QTD';
  if (t === 'month') return s === 'mom' ? 'MoM' : 'MTD';
  if (t === 'week') return s === 'wow' ? 'WoW' : 'WTD';
  if (t === 'custom') return 'Custom Range';
  return null;
}

// ─── Pill styling by category ────────────────────────────────────────────────
const PILL_STYLES = {
  period: {
    border: '1px solid #E2E8F0',
    background: '#F8FAFC',
    color: '#475569',
  },
  product: {
    border: '1px solid rgba(255,174,110,0.35)',
    background: 'rgba(255,174,110,0.06)',
    color: '#B45309',
  },
  process: {
    border: '1px solid rgba(143,221,223,0.4)',
    background: 'rgba(143,221,223,0.06)',
    color: '#0D9488',
  },
} as const;

type PillCategory = keyof typeof PILL_STYLES;

interface Pill {
  label: string;
  category: PillCategory;
}

function FilterPill({ label, category }: Pill) {
  const s = PILL_STYLES[category];
  return (
    <span
      style={{
        ...s,
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '8.5px',
        fontWeight: 600,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────
interface FilterTagPillsProps {
  filters: FilterState;
  /** If omitted, no "Baseline" pill is shown when nothing is active */
  showBaseline?: boolean;
}

export function FilterTagPills({ filters, showBaseline = false }: FilterTagPillsProps) {
  const pills: Pill[] = [];

  // Time period
  const period = periodLabel(filters);
  if (period) pills.push({ label: period, category: 'period' });

  // Product
  const prod = filters.product;
  if (prod && prod !== 'All Products' && prod !== 'Coldplate') {
    pills.push({ label: `Product: ${prod}`, category: 'product' });
  }

  // Process
  const proc = filters.process;
  if (proc && proc !== 'All Processes') {
    pills.push({ label: `Process: ${proc}`, category: 'process' });
  }

  // Machine
  const mach = filters.machine;
  if (mach && mach !== 'All Machines') {
    pills.push({ label: `Machine: ${mach}`, category: 'process' });
  }

  // Shift
  const shift = filters.shift;
  if (shift && shift !== 'All Shifts') {
    pills.push({ label: shift, category: 'period' });
  }

  // Line
  const line = filters.line;
  if (line && line !== 'All Lines') {
    pills.push({ label: line, category: 'period' });
  }

  if (pills.length === 0) {
    if (!showBaseline) return null;
    pills.push({ label: 'Baseline', category: 'period' });
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        marginTop: '6px',
      }}
    >
      {pills.map((p, i) => (
        <FilterPill key={i} label={p.label} category={p.category} />
      ))}
    </div>
  );
}
