import { useState, useMemo } from 'react';
import {
  ComposedChart,
  BarChart,
  AreaChart,
  ScatterChart,
  Scatter,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  LabelList,
} from 'recharts';
import { type FilterState } from './TimeTrendFilter';
import { getDashboardData } from '../data/dataStores';
import {
  ArrowLeft,
  Truck,
  Layers,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Compass,
  Cpu,
} from 'lucide-react';
import { CardLockHeader, lockedCardStyle } from './CardLockHeader';
import { usePageCardLocks } from './useCardFilterLock';
import { PILLARS, DELAY_BREAKDOWN, type ActiveOtifPillar } from '../data/dataStores/otifDataStore';

interface OtifPageProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

type OtifView = 'SUMMARY_CARD' | 'SPLIT_SCREEN';
type PillarId = 'DISPATCH' | 'PRODUCTION' | 'READINESS';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  // Surfaces
  pageBg:   '#F8FAFC',
  cardBg:   '#FFFFFF',
  cardBorder: '1px solid rgba(226,232,240,0.9)',
  cardShadow: '0 10px 30px -6px rgba(15,23,42,0.05), 0 4px 10px -4px rgba(15,23,42,0.04)',
  // Typography
  numColor: '#0F172A',
  labelColor: '#475569',
  mutedColor: '#94A3B8',
  // Accent palette
  cyan:    '#0284C7',
  indigo:  '#4F46E5',
  emerald: '#059669',
  amber:   '#D97706',
  rose:    '#E11D48',
  // Chart tooltip
  tt: {
    background: '#0F172A',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: '10px',
    boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
    fontSize: '10px',
    fontWeight: 600,
    color: '#E0F2FE',
    padding: '8px 12px',
  },
};

// ─── Translucent icon pill helper ────────────────────────────────────────────
function IconPill({ icon: Icon, color, bg }: { icon: React.ElementType; color: string; bg: string }) {
  return (
    <div className="p-2 rounded-xl shrink-0" style={{ background: bg }}>
      <Icon className="w-4 h-4" style={{ color, strokeWidth: 1.6 }} />
    </div>
  );
}

// ─── Gradient SVG defs ────────────────────────────────────────────────────────
function GradDefs() {
  return (
    <defs>
      <linearGradient id="gPlannedGrey" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#CBD5E1" stopOpacity={1} />
        <stop offset="100%" stopColor="#94A3B8" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="gPlannedBlue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4988C4" stopOpacity={1} />
        <stop offset="100%" stopColor="#1C4D8D" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="gFabricated" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8FDDDF" stopOpacity={1} />
        <stop offset="100%" stopColor="#5BBEBF" stopOpacity={0.8} />
      </linearGradient>
      {/* Premium Sunset Coral, Apricot & Mint Palette */}
      <linearGradient id="gSeries1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#EC6530" />
        <stop offset="100%" stopColor="#FFAE6E" />
      </linearGradient>
      <linearGradient id="gSeries2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFAE6E" />
        <stop offset="100%" stopColor="#FFE3E3" />
      </linearGradient>
      <linearGradient id="gSeries3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8FDDDF" />
        <stop offset="100%" stopColor="#FFFFFF" />
      </linearGradient>
      <linearGradient id="gRawArea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8FDDDF" stopOpacity={0.4} />
        <stop offset="100%" stopColor="#8FDDDF" stopOpacity={0.0} />
      </linearGradient>
      <linearGradient id="gWipArea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFAE6E" stopOpacity={0.25} />
        <stop offset="100%" stopColor="#FFAE6E" stopOpacity={0.0} />
      </linearGradient>
      <linearGradient id="gCyanTealBar" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#06B6D4" stopOpacity={1} />
        <stop offset="100%" stopColor="#0891B2" stopOpacity={1} />
      </linearGradient>
    </defs>
  );
}

// Concentric Radial Progress Ring Component for Quadrant 1
function ConcentricRadialRing({ otifValue }: { otifValue: number }) {
  const r1 = 54;
  const c1 = 2 * Math.PI * r1;
  const offset1 = c1 * (1 - Math.min(100, otifValue) / 100);

  const r2 = 46;
  const c2 = 2 * Math.PI * r2;
  const offset2 = c2 * (1 - 0.964);

  const r3 = 38;
  const c3 = 2 * Math.PI * r3;
  const offset3 = c3 * (1 - 0.918);

  return (
    <div className="relative flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40 shrink-0 select-none">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        {/* Background track circles */}
        <circle cx="60" cy="60" r={r1} fill="transparent" stroke="#FFE3E3" strokeOpacity={0.5} strokeWidth="4" />
        <circle cx="60" cy="60" r={r2} fill="transparent" stroke="#FFE3E3" strokeOpacity={0.5} strokeWidth="4" />
        <circle cx="60" cy="60" r={r3} fill="transparent" stroke="#FFE3E3" strokeOpacity={0.5} strokeWidth="4" />

        {/* Progress circles */}
        <circle
          cx="60"
          cy="60"
          r={r1}
          fill="transparent"
          stroke="#EC6530"
          strokeWidth="4"
          strokeDasharray={c1}
          strokeDashoffset={offset1}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <circle
          cx="60"
          cy="60"
          r={r2}
          fill="transparent"
          stroke="#FFAE6E"
          strokeWidth="4"
          strokeDasharray={c2}
          strokeDashoffset={offset2}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <circle
          cx="60"
          cy="60"
          r={r3}
          fill="transparent"
          stroke="#8FDDDF"
          strokeWidth="4"
          strokeDasharray={c3}
          strokeDashoffset={offset3}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span style={{ color: T.numColor, fontSize: '15px', fontWeight: 800, lineHeight: 1 }}>{otifValue}%</span>
        <span style={{ color: T.mutedColor, fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '3px' }}>OTIF INDEX</span>
      </div>
    </div>
  );
}

export function OtifPage({ filters, onChange }: OtifPageProps) {
  const [hoveredBar, setHoveredBar] = useState<{ chartId: string; index: number } | null>(null);
  const [currentView, setCurrentView] = useState<OtifView>('SUMMARY_CARD');
  const [activePillar, setActivePillar] = useState<PillarId>('DISPATCH');
  const [q2Hovered, setQ2Hovered] = useState(false);
  const [q3Hovered, setQ3Hovered] = useState(false);
  const [q4Hovered, setQ4Hovered] = useState(false);
  // Per-card local filter locks: [Q1, Q2, Q3, Q4]
  const [q1Lock, q2Lock, q3Lock, q4Lock] = usePageCardLocks(filters, 4);

  const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
      const isSunday = label === '7' || label === '14' || label === '21' || label === '28';
      if (isSunday) {
        return (
          <div style={T.tt}>
            <p className="m-0 font-bold">Sunday | Factory Holiday (Plant Shutdown)</p>
          </div>
        );
      }
      return (
        <div style={T.tt} className="flex flex-col gap-1">
          <p className="m-0 border-b border-slate-700 pb-1 mb-1 font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          {payload.map((item: any, idx: number) => {
            const formatted = formatter ? formatter(item.value, item.name, item, idx, payload) : [item.value, item.name];
            const val = Array.isArray(formatted) ? formatted[0] : formatted;
            const nm = Array.isArray(formatted) ? formatted[1] : item.name;
            return (
              <p key={idx} className="m-0 flex justify-between gap-4" style={{ color: item.color || item.fill }}>
                <span>{nm || item.name}:</span>
                <span>{typeof val === 'number' ? val.toLocaleString() : val}</span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const q1Otif = useMemo(() => {
    return getDashboardData('OTIF', q1Lock.effectiveFilters.subPeriod || q1Lock.effectiveFilters.trend, q1Lock.effectiveFilters.product, q1Lock.effectiveFilters.process);
  }, [q1Lock.effectiveFilters.trend, q1Lock.effectiveFilters.subPeriod, q1Lock.effectiveFilters.selectedDate, q1Lock.effectiveFilters.product, q1Lock.effectiveFilters.process]);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // ── Level 1 data ──────────────────────────────────────────────────────────
  const timeLabels = useMemo(() => {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const currentMonthIdx = filters.selectedDate ? filters.selectedDate.getMonth() : 6; // default to July (6)
    
    const trend = filters.trend;
    const sub = filters.subPeriod;

    if (trend === 'year') {
      // YTD: Fiscal YTD starting from April
      return ['Apr', 'May', 'Jun', 'Jul'];
    }

    if (trend === 'quarter') {
      if (sub === 'qoq') {
        // QoQ: last quarters side-by-side
        return ['Q1 25', 'Q2 25', 'Q3 25', 'Q4 25', 'Q1 26', 'Q2 26'];
      }
      // QTD: running quarter cycle months (e.g. Apr, May, Jun, Jul if active is Jul)
      const startOfQuarter = Math.floor(currentMonthIdx / 3) * 3;
      const startIdx = currentMonthIdx % 3 === 0 ? Math.max(0, startOfQuarter - 3) : startOfQuarter;
      const qtdMonths = [];
      for (let m = startIdx; m <= currentMonthIdx; m++) {
        qtdMonths.push(monthNames[m]);
      }
      return qtdMonths;
    }

    if (trend === 'month') {
      // MTD: daily tick marks 1 to 31
      return Array.from({ length: 31 }, (_, i) => String(i + 1));
    }

    if (trend === 'week') {
      // WTD: standard 5-day operational week
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    }

    // Default/custom range
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  }, [filters.trend, filters.subPeriod, filters.selectedDate]);

  const seed = useMemo(() => filters.shift.length + filters.line.length + (filters.trend.length * 10), [filters]);

  const otifSummaryData = q1Otif.otifSummaryData || [];
  const dispatchAdherenceData = q1Otif.dispatchAdherenceData || [];
  const productionPlanActualData = q1Otif.productionPlanActualData || [];
  const materialReadinessData = q1Otif.materialReadinessData || [];
  const delayBreakdownData = q1Otif.delayBreakdownData || DELAY_BREAKDOWN;
  const weeklyProdDetails = q1Otif.weeklyProdDetails || [];

  const chart1Data = useMemo(() => {
    if (filters.trend === 'year' || filters.trend === 'quarter') {
      const carriers = ['North Route', 'South Route', 'West Route', 'East Route', 'Central Route'];
      return carriers.map((name, i) => {
        const planned = 24 + (i * 6);
        const actual = planned + (seed % 3 - 1) * 3 + (i % 2 === 0 ? 2 : -2);
        const ota = 92 + (seed % 5) - i * 1.5;
        return { name, plannedTransit: planned, actualTransit: actual, ota: Number(ota.toFixed(1)) };
      });
    } else {
      return timeLabels.map((name, i) => {
        const planned = 12 + Math.round(Math.sin(i) * 3);
        const actual = planned + (seed % 3 - 1) * 2 + (i % 2 === 0 ? 1.5 : -1.5);
        const ota = 90 + Math.round(Math.cos(i + seed) * 8);
        return { name, plannedTransit: planned, actualTransit: actual, ota: Number(Math.min(100, ota).toFixed(1)) };
      });
    }
  }, [filters.trend, timeLabels, seed]);

  const chart2Data = useMemo(() => {
    return timeLabels.map((name, i) => {
      const planned = 1000 + (seed * 10) + Math.round(Math.cos(i + seed) * 150);
      const actual = planned + (seed % 4 - 2) * 50 + Math.round(Math.sin(i * 1.5 + seed) * 100);
      const wip = 400 + (seed * 5) + Math.round(Math.sin(i + seed) * 80);
      const adherence = 90 + Math.round(Math.sin(i * 2 + seed) * 8);
      return {
        name,
        planned: Math.max(100, planned),
        actual: Math.max(100, actual),
        wip: Math.max(50, wip),
        adherence: Math.min(100, Math.max(50, adherence))
      };
    });
  }, [timeLabels, seed]);

  // ── Level 2 data ──────────────────────────────────────────────────────────
  const supplyChainStageData = q1Otif.supplyChainStageData || [
    { stage: 'Order Entry', hours: 4.2 },
    { stage: 'Production',  hours: 18.5 },
    { stage: 'Packaging',   hours: 3.1 },
    { stage: 'Loading',     hours: 2.4 },
    { stage: 'Transit',     hours: 14.8 }
  ];

  const dispatchDelayLog = [
    { route: 'North Region – Express',  carrier: 'FreightLine Inc',  shift: 'Shift B', lagDays: 2.4 },
    { route: 'South Region – Standard', carrier: 'CarrierLink Co',   shift: 'Shift A', lagDays: 1.1 },
    { route: 'Export – Air Freight',    carrier: 'AirSpeed Cargo',   shift: 'Shift C', lagDays: 3.8 },
    { route: 'West Region – Bulk',      carrier: 'TransGroup Bulk',  shift: 'Shift A', lagDays: 0.5 },
  ];

  const weeklyOutputData = useMemo(() => {
    return q1Otif.weeklyOutputData || [
      { name: 'W1', planned: 240, actual: 220 },
      { name: 'W2', planned: 240, actual: 260 },
      { name: 'W3', planned: 240, actual: 180 }, // Deficit
      { name: 'W4', planned: 240, actual: 250 },
      { name: 'W5', planned: 240, actual: 230 },
      { name: 'W6', planned: 240, actual: 245 },
      { name: 'W7', planned: 240, actual: 190 }, // Deficit
      { name: 'W8', planned: 240, actual: 240 }
    ];
  }, [q1Otif.weeklyOutputData]);

  const prodStats = useMemo(() => {
    const variances = weeklyOutputData.map((d: any) => {
      const diff = d.actual - d.planned;
      return (diff / d.planned) * 100;
    });
    const onPlan = variances.filter((v: number) => Math.abs(v) <= 5).length;
    const overThreshold = variances.filter((v: number) => Math.abs(v) > 5).length;
    const maxVar = Math.max(...variances.map(Math.abs));
    const avgVar = variances.reduce((s: number, v: number) => s + Math.abs(v), 0) / (variances.length || 1);
    return { onPlan, overThreshold, maxVar, avgVar };
  }, [weeklyOutputData]);

  const wipStationScatter = [
    { station: 10, wip: 420 },
    { station: 20, wip: 680 },
    { station: 30, wip: 310 },
    { station: 40, wip: 810 },
    { station: 50, wip: 190 },
  ];

  const rawMaterialLedger = [
    { partNo: 'PART-339', desc: 'Cap Screws',        eta: 'Tomorrow',  stockDays: 1.2, alert: true  },
    { partNo: 'PART-882', desc: 'Engine Gaskets',    eta: 'In 3 Days', stockDays: 3.0, alert: false },
    { partNo: 'PART-102', desc: 'Dowel Pins',        eta: 'Overdue',   stockDays: 0.0, alert: true  },
    { partNo: 'PART-654', desc: 'Manifold Brackets', eta: 'In 7 Days', stockDays: 5.5, alert: false },
  ];

  // ── Stacked grouped column chart data ─────────────────────────────────────
  const stageStackedData = [
    { stage: 'Order',   q1: 3.8, q2: 4.1, q3: 4.0, q4: 4.3 },
    { stage: 'Prod',    q1:17.2, q2:18.6, q3:17.9, q4:19.1 },
    { stage: 'Pack',    q1: 5.6, q2: 6.2, q3: 5.9, q4: 6.5 },
    { stage: 'Load',    q1: 2.8, q2: 3.1, q3: 2.9, q4: 3.4 },
    { stage: 'Transit', q1:26.5, q2:28.3, q3:27.1, q4:29.8 },
  ];
  const prodCategoryStack = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    week: `W${i + 1}`,
    machined:   Math.round(90  + Math.sin(i * 1.1) * 20),
    assembled:  Math.round(110 + Math.cos(i * 0.9) * 15),
    fabricated: Math.round(70  + Math.sin(i * 1.4) * 18),
  })), []);
  const wipCategoryStack = [
    { station: 'ST-10', machining: 180, assembly: 140, finishing: 100 },
    { station: 'ST-20', machining: 310, assembly: 220, finishing: 150 },
    { station: 'ST-30', machining: 120, assembly:  90, finishing: 100 },
    { station: 'ST-40', machining: 390, assembly: 280, finishing: 140 },
    { station: 'ST-50', machining:  80, assembly:  60, finishing:  50 },
  ];

  // ─── Card wrapper style ──────────────────────────────────────────────────
  const card = {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(226,232,240,0.7)',
    boxShadow: '0 10px 30px -6px rgba(15,23,42,0.05), 0 4px 10px -4px rgba(15,23,42,0.04)',
    borderRadius: '16px',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  };

  const commonLegendProps = {
    verticalAlign: 'bottom' as const,
    align: 'center' as const,
    iconType: 'circle' as const,
    iconSize: 6,
    wrapperStyle: { 
      paddingTop: '20px', 
      fontSize: '9px', 
      fontWeight: 600, 
      textTransform: 'uppercase' as const, 
      letterSpacing: '0.08em',
      color: '#475569' 
    }
  };

  return (
    <div className="w-full h-[calc(100vh-130px)] overflow-y-auto select-none p-8 flex flex-col gap-5"
      style={{ background: T.pageBg, fontFamily: '"Plus Jakarta Sans","Inter",sans-serif' }}>

      {/* ── BREADCRUMB & HEADER ──────────────────────────────────────────────────── */}
      {currentView === 'SUMMARY_CARD' ? (
        <div className="shrink-0 flex items-center justify-between">
          <div>
            <h2 style={{ color: T.numColor, fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>
              OTIF — On-Time In Full Delivery Portal
            </h2>
            <p className="mt-1" style={{ color: T.mutedColor, fontSize: '11px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Customer order fulfilment velocity &amp; schedule precision
            </p>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center shrink-0 px-1 py-3"
          style={{ borderBottom: `1px solid rgba(226,232,240,0.7)` }}>
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase" style={{ color: T.mutedColor }}>
            <span className="cursor-pointer hover:text-slate-700 transition-colors"
              onClick={() => setCurrentView('SUMMARY_CARD')}>OTIF Overview</span>
            <span style={{ color: T.mutedColor }}>›</span>
            <span className="text-slate-400">Three Pillars</span>
            <span style={{ color: T.mutedColor }}>›</span>
            <span style={{ color: '#EC6530' }} className="font-bold">
              {activePillar === 'DISPATCH' ? 'Dispatch Adherence' :
               activePillar === 'PRODUCTION' ? 'Production Adherence' :
               'Material & WIP Readiness'}
            </span>
          </div>
          <button onClick={() => setCurrentView('SUMMARY_CARD')}
            className="flex items-center gap-1.5 transition-all duration-200 hover:-translate-x-0.5"
            style={{ color: T.labelColor, fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em' }}>
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Back to OTIF Summary
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          LEVEL 0 — SUMMARY 2x2 BALANCED GRID
      ════════════════════════════════════════════════════════════════════ */}
      {currentView === 'SUMMARY_CARD' && (
        <div className="flex-grow grid grid-cols-2 gap-6 w-full max-w-7xl mx-auto py-1">

          {/* Quadrant 1 (Top-Left): OTIF Summary Index Card */}
          <div
            onClick={() => {
              if (q1Lock.isLocked) onChange(q1Lock.effectiveFilters);
              setCurrentView('SPLIT_SCREEN');
              setActivePillar('DISPATCH');
            }}
            className="hover:scale-[1.005] transition-all duration-300 flex flex-col justify-between"
            style={{
              ...card,
              padding: '24px',
              boxShadow: '0 12px 40px -10px rgba(236, 101, 48, 0.22), 0 1px 15px rgba(236, 101, 48, 0.12)',
              border: '1px solid rgba(236, 101, 48, 0.45)',
              cursor: 'pointer',
              ...lockedCardStyle(q1Lock.isLocked),
            }}
          >
            <CardLockHeader
              eyebrow="Overall OTIF summary"
              title="OTIF Index & Volume"
              metric={
                <div className="text-right">
                  <span style={{ color: '#EC6530', fontSize: '18px', fontWeight: 700 }}>{q1Otif.otifVal}%</span>
                  <span className="block text-[8px] text-slate-400 font-semibold uppercase">Average</span>
                </div>
              }
              isLocked={q1Lock.isLocked}
              effectiveFilters={q1Lock.effectiveFilters}
              globalFilters={filters}
              onToggleLock={q1Lock.toggle}
              onSync={q1Lock.unlock}
            />

            <div className="flex items-center gap-6 my-auto">
              <ConcentricRadialRing otifValue={q1Otif.otifVal} />
              <div className="flex-grow flex flex-col gap-2.5">
                {[
                  { label: 'Scheduled', value: '100%', target: '100%', color: '#FFE3E3' },
                  { label: 'On-Time Adh.', value: `${q1Otif.adherenceVal}%`, target: '95%', color: '#8FDDDF' },
                  { label: 'In-Full Adh.', value: '96.4%', target: '95%', color: '#FFAE6E' },
                  { label: 'OTIF Received', value: `${q1Otif.otifVal}%`, target: '98%', color: '#EC6530' },
                ].map((m) => (
                  <div key={m.label} className="flex flex-col">
                    <div className="flex justify-between items-baseline text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                        {m.label}
                      </span>
                      <span>{m.value} <span className="text-slate-400 font-medium">/ {m.target}</span></span>
                    </div>
                    <div className="w-full bg-[#FFE3E3]/5 h-1.5 rounded-full overflow-hidden mt-1" style={{ border: '1px solid rgba(226,232,240,0.9)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: m.value, backgroundColor: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-1 text-[8.5px] font-bold text-slate-400 uppercase tracking-wide">
              <span>Primary KPI Card</span>
              <span className="text-amber-600 flex items-center gap-1">Analyze Diagnostics <ArrowRight className="w-3 h-3" /></span>
            </div>
          </div>

          {/* Quadrant 2 (Top-Right): Dispatch Adherence Horizontal Stacked Bar */}
          <div
            onClick={() => {
              if (q2Lock.isLocked) onChange(q2Lock.effectiveFilters);
              setCurrentView('SPLIT_SCREEN');
              setActivePillar('DISPATCH');
            }}
            className="transition-all duration-300 flex flex-col justify-between"
            onMouseEnter={() => setQ2Hovered(true)}
            onMouseLeave={() => setQ2Hovered(false)}
            style={{ ...card, padding: '24px', cursor: 'pointer', transform: q2Hovered ? 'translateY(-4px)' : 'none', border: q2Hovered ? '1px solid rgba(236,101,48,0.45)' : card.border, background: q2Hovered ? 'radial-gradient(circle at center, rgba(236,101,48,0.05) 0%, rgba(255,255,255,0.92) 80%)' : card.background, boxShadow: q2Hovered ? '0 20px 48px -12px rgba(236,101,48,0.22), 0 4px 16px -4px rgba(236,101,48,0.12)' : card.boxShadow, ...lockedCardStyle(q2Lock.isLocked) }}
          >
            <CardLockHeader
              eyebrow="Pillar 1"
              title="Dispatch Adherence (Horizontal Stacked)"
              metric={
                <div className="text-right">
                  <span style={{ color: '#EC6530', fontSize: '18px', fontWeight: 700 }}>91.8%</span>
                  <span className="block text-[8px] text-slate-400 font-semibold uppercase">vs 95% Target</span>
                </div>
              }
              isLocked={q2Lock.isLocked}
              effectiveFilters={q2Lock.effectiveFilters}
              globalFilters={filters}
              onToggleLock={q2Lock.toggle}
              onSync={q2Lock.unlock}
            />

            <div className="flex-grow" style={{ minHeight: '160px', padding: '24px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dispatchAdherenceData} layout="vertical" barCategoryGap="20%" margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 8, fill: T.mutedColor }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: T.mutedColor, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="onTime"
                    name="On-Time"
                    stackId="a"
                    fill="url(#gSeries1)"
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    maxBarSize={20}
                  >
                    {dispatchAdherenceData.map((entry: any, index: number) => {
                      const isActive = hoveredBar?.chartId === 'dispatch_adherence' && hoveredBar?.index === index;
                      const isAnyActive = hoveredBar?.chartId === 'dispatch_adherence';
                      const opacity = isAnyActive ? (isActive ? 1 : 0.5) : 1;
                      return (
                        <Cell
                          key={`cell-ontime-${index}`}
                          fill="url(#gSeries1)"
                          opacity={opacity}
                          onMouseEnter={() => setHoveredBar({ chartId: 'dispatch_adherence', index })}
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{
                            transform: isActive ? 'scaleX(1.05)' : 'scaleX(1)',
                            transformOrigin: 'left center',
                            filter: isActive ? 'drop-shadow(0 0 6px #F5788B)' : 'none',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                        />
                      );
                    })}
                    <LabelList
                      dataKey="onTime"
                      position="right"
                      formatter={(v: number) => v > 0 ? `${Math.round(v)}%` : ''}
                      fontSize={8}
                      fontWeight={700}
                      fill="#475569"
                    />
                  </Bar>
                  <Bar
                    dataKey="delayed"
                    name="Delayed"
                    stackId="a"
                    fill="url(#gSeries2)"
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={20}
                  >
                    {dispatchAdherenceData.map((entry: any, index: number) => {
                      const isActive = hoveredBar?.chartId === 'dispatch_adherence' && hoveredBar?.index === index;
                      const isAnyActive = hoveredBar?.chartId === 'dispatch_adherence';
                      const opacity = isAnyActive ? (isActive ? 1 : 0.5) : 1;
                      return (
                        <Cell
                          key={`cell-delayed-${index}`}
                          fill="url(#gSeries2)"
                          opacity={opacity}
                          onMouseEnter={() => setHoveredBar({ chartId: 'dispatch_adherence', index })}
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{
                            transform: isActive ? 'scaleX(1.05)' : 'scaleX(1)',
                            transformOrigin: 'left center',
                            filter: isActive ? 'drop-shadow(0 0 6px #F5788B)' : 'none',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                        />
                      );
                    })}
                    <LabelList
                      dataKey="delayed"
                      position="right"
                      formatter={(v: number) => v > 0 ? `${Math.round(v)}%` : ''}
                      fontSize={8}
                      fontWeight={700}
                      fill="#475569"
                    />
                  </Bar>
                  <Legend {...commonLegendProps} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quadrant 3 (Bottom-Left): Production Adherence */}
          <div
            onClick={() => {
              if (q3Lock.isLocked) onChange(q3Lock.effectiveFilters);
              setCurrentView('SPLIT_SCREEN');
              setActivePillar('PRODUCTION');
            }}
            className="transition-all duration-300 flex flex-col justify-between"
            onMouseEnter={() => setQ3Hovered(true)}
            onMouseLeave={() => setQ3Hovered(false)}
            style={{ ...card, padding: '24px', cursor: 'pointer', transform: q3Hovered ? 'translateY(-4px)' : 'none', border: q3Hovered ? '1px solid rgba(236,101,48,0.45)' : card.border, background: q3Hovered ? 'radial-gradient(circle at center, rgba(236,101,48,0.05) 0%, rgba(255,255,255,0.92) 80%)' : card.background, boxShadow: q3Hovered ? '0 20px 48px -12px rgba(236,101,48,0.22), 0 4px 16px -4px rgba(236,101,48,0.12)' : card.boxShadow, ...lockedCardStyle(q3Lock.isLocked) }}
          >
            <CardLockHeader
              eyebrow="Pillar 2"
              title="Production Adherence"
              metric={
                <div className="text-right">
                  <span style={{ color: '#EC6530', fontSize: '18px', fontWeight: 700 }}>96.4%</span>
                  <span className="block text-[8px] text-slate-400 font-semibold uppercase">Plan vs. Actual</span>
                </div>
              }
              isLocked={q3Lock.isLocked}
              effectiveFilters={q3Lock.effectiveFilters}
              globalFilters={filters}
              onToggleLock={q3Lock.toggle}
              onSync={q3Lock.unlock}
            />

            <div className="flex-grow" style={{ minHeight: '160px', padding: '24px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={productionPlanActualData} barCategoryGap="20%" margin={{ top: 15, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.mutedColor, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 8, fill: T.mutedColor }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 8, fill: T.mutedColor }} axisLine={false} tickLine={false} domain={[50, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine yAxisId="right" y={95} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Target SLA', position: 'insideTopRight', fill: '#EF4444', fontSize: 8 }} />
                  <Bar
                    yAxisId="left"
                    dataKey="plan"
                    name="Planned Output"
                    fill="url(#gPlannedGrey)"
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={20}
                  >
                    {productionPlanActualData.map((entry: any, index: number) => {
                      const isActive = hoveredBar?.chartId === 'production_adherence' && hoveredBar?.index === index;
                      const isAnyActive = hoveredBar?.chartId === 'production_adherence';
                      const opacity = isAnyActive ? (isActive ? 1 : 0.5) : 1;
                      return (
                        <Cell
                          key={`cell-plan-${index}`}
                          fill="url(#gPlannedGrey)"
                          opacity={opacity}
                          onMouseEnter={() => setHoveredBar({ chartId: 'production_adherence', index })}
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{
                            transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
                            transformOrigin: 'bottom center',
                            filter: isActive ? 'drop-shadow(0 0 6px #F5788B)' : 'none',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                        />
                      );
                    })}
                    <LabelList
                      dataKey="plan"
                      position="top"
                      formatter={(v: number) => Math.round(v).toLocaleString()}
                      fontSize={8}
                      fontWeight={700}
                      fill="#475569"
                    />
                  </Bar>
                  <Bar
                    yAxisId="left"
                    dataKey="actual"
                    name="Actual Output"
                    fill="url(#gSeries1)"
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={20}
                  >
                    {productionPlanActualData.map((entry: any, index: number) => {
                      const isActive = hoveredBar?.chartId === 'production_adherence' && hoveredBar?.index === index;
                      const isAnyActive = hoveredBar?.chartId === 'production_adherence';
                      const opacity = isAnyActive ? (isActive ? 1 : 0.5) : 1;
                      return (
                        <Cell
                          key={`cell-actual-${index}`}
                          fill="url(#gSeries1)"
                          opacity={opacity}
                          onMouseEnter={() => setHoveredBar({ chartId: 'production_adherence', index })}
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{
                            transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
                            transformOrigin: 'bottom center',
                            filter: isActive ? 'drop-shadow(0 0 6px #F5788B)' : 'none',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                        />
                      );
                    })}
                    <LabelList
                      dataKey="actual"
                      position="top"
                      formatter={(v: number) => Math.round(v).toLocaleString()}
                      fontSize={8}
                      fontWeight={700}
                      fill="#475569"
                    />
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="adherence" name="Schedule Adherence %" stroke="#EC6530" strokeWidth={2} dot={{ r: 4, fill: '#EC6530', strokeWidth: 0 }} label={{ position: 'top', fill: '#EC6530', fontSize: 8, fontWeight: 600, formatter: (v) => `${v}%` }} />
                  <Legend {...commonLegendProps} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quadrant 4 (Bottom-Right): Material & WIP Readiness stacked area */}
          <div
            onClick={() => {
              if (q4Lock.isLocked) onChange(q4Lock.effectiveFilters);
              setCurrentView('SPLIT_SCREEN');
              setActivePillar('READINESS');
            }}
            className="transition-all duration-300 flex flex-col justify-between"
            onMouseEnter={() => setQ4Hovered(true)}
            onMouseLeave={() => setQ4Hovered(false)}
            style={{ ...card, padding: '24px', cursor: 'pointer', transform: q4Hovered ? 'translateY(-4px)' : 'none', border: q4Hovered ? '1px solid rgba(255,174,110,0.5)' : card.border, background: q4Hovered ? 'radial-gradient(circle at center, rgba(255,174,110,0.06) 0%, rgba(255,255,255,0.92) 80%)' : card.background, boxShadow: q4Hovered ? '0 20px 48px -12px rgba(255,174,110,0.25), 0 4px 16px -4px rgba(255,174,110,0.14)' : card.boxShadow, ...lockedCardStyle(q4Lock.isLocked) }}
          >
            <CardLockHeader
              eyebrow="Pillar 3"
              title="Material & WIP Readiness"
              metric={
                <div className="text-right">
                  <span style={{ color: '#FFAE6E', fontSize: '18px', fontWeight: 700 }}>88.5%</span>
                  <span className="block text-[8px] text-slate-400 font-semibold uppercase">Coverage Profile</span>
                </div>
              }
              isLocked={q4Lock.isLocked}
              effectiveFilters={q4Lock.effectiveFilters}
              globalFilters={filters}
              onToggleLock={q4Lock.toggle}
              onSync={q4Lock.unlock}
            />

            <div className="flex-grow" style={{ minHeight: '160px', padding: '24px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={materialReadinessData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.mutedColor, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8, fill: T.mutedColor }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={500} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Safety Corridor', position: 'insideTopLeft', fill: '#EF4444', fontSize: 8 }} />
                  <Area type="monotone" dataKey="raw" name="Raw Material" stackId="1" stroke="#8FDDDF" fill="url(#gRawArea)" fillOpacity={1} />
                  <Area type="monotone" dataKey="wip" name="WIP Buffer" stackId="1" stroke="#FFAE6E" fill="url(#gWipArea)" fillOpacity={1} />
                  <Legend {...commonLegendProps} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          LEVEL 1 — 25% / 75% SPLIT-SCREEN VIEW
      ════════════════════════════════════════════════════════════════════ */}
      {currentView === 'SPLIT_SCREEN' && (
        <div className="flex-grow flex gap-6 max-w-7xl mx-auto w-full h-[calc(100vh-175px)] overflow-hidden">
          
          {/* LEFT COLUMN: Pillar Selector (25% Width) */}
          <div className="w-[25%] flex flex-col gap-4 overflow-y-auto pr-1 select-none">
            {[
              { id: 'DISPATCH' as PillarId, name: '1. Dispatch Adherence', val: '91.8%', icon: Compass, color: '#EC6530', bg: 'rgba(236, 101, 48, 0.08)' },
              { id: 'PRODUCTION' as PillarId, name: '2. Production Adherence', val: '96.4%', icon: Cpu, color: '#EC6530', bg: 'rgba(236, 101, 48, 0.08)' },
              { id: 'READINESS' as PillarId, name: '3. Material & WIP Readiness', val: '88.5%', icon: Layers, color: '#FFAE6E', bg: 'rgba(255, 174, 110, 0.08)' }
            ].map((cardItem) => {
              const isActive = activePillar === cardItem.id;
              return (
                <div
                  key={cardItem.id}
                  onClick={() => setActivePillar(cardItem.id)}
                  style={{
                    background: isActive ? 'rgba(236, 101, 48, 0.03)' : T.cardBg,
                    border: isActive ? '1px solid rgba(236, 101, 48, 0.2)' : T.cardBorder,
                    borderLeft: isActive ? '3px solid #EC6530' : T.cardBorder,
                    borderRadius: '16px',
                    padding: '16px',
                    opacity: isActive ? 1 : 0.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(236, 101, 48, 0.05)' : T.cardShadow
                  }}
                  className="group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <IconPill icon={cardItem.icon} color={cardItem.color} bg={cardItem.bg} />
                      <span style={{ color: T.labelColor, fontSize: '9px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                        {cardItem.name}
                      </span>
                    </div>
                    <span style={{ color: T.numColor, fontSize: '14px', fontWeight: 700 }}>{cardItem.val}</span>
                  </div>

                  {/* Miniature scaled-down clone charts without axes/labels */}
                  {cardItem.id === 'DISPATCH' && (
                    <div style={{ height: '60px' }} className="mt-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dispatchAdherenceData} barCategoryGap="20%" margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <Bar
                            dataKey="onTime"
                            stackId="a"
                            fill="url(#gSeries1)"
                            isAnimationActive={true}
                            animationDuration={1200}
                            animationEasing="ease-out"
                            maxBarSize={20}
                          >
                            {dispatchAdherenceData.map((entry: any, index: number) => {
                              const isActive = hoveredBar?.chartId === 'mini_dispatch' && hoveredBar?.index === index;
                              const isAnyActive = hoveredBar?.chartId === 'mini_dispatch';
                              const opacity = isAnyActive ? (isActive ? 1 : 0.5) : 1;
                              return (
                                <Cell
                                  key={`cell-mini-ontime-${index}`}
                                  fill="url(#gSeries1)"
                                  opacity={opacity}
                                  onMouseEnter={() => setHoveredBar({ chartId: 'mini_dispatch', index })}
                                  onMouseLeave={() => setHoveredBar(null)}
                                  style={{
                                    transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
                                    transformOrigin: 'bottom center',
                                    filter: isActive ? 'drop-shadow(0 0 6px #F5788B)' : 'none',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                  }}
                                />
                              );
                            })}
                            <LabelList
                              dataKey="onTime"
                              position="top"
                              formatter={(v: number) => v > 0 ? `${Math.round(v)}%` : ''}
                              fontSize={7.5}
                              fontWeight={700}
                              fill="#475569"
                            />
                          </Bar>
                          <Bar
                            dataKey="delayed"
                            stackId="a"
                            fill="url(#gSeries2)"
                            isAnimationActive={true}
                            animationDuration={1200}
                            animationEasing="ease-out"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={20}
                          >
                            {dispatchAdherenceData.map((entry: any, index: number) => {
                              const isActive = hoveredBar?.chartId === 'mini_dispatch' && hoveredBar?.index === index;
                              const isAnyActive = hoveredBar?.chartId === 'mini_dispatch';
                              const opacity = isAnyActive ? (isActive ? 1 : 0.5) : 1;
                              return (
                                <Cell
                                  key={`cell-mini-delayed-${index}`}
                                  fill="url(#gSeries2)"
                                  opacity={opacity}
                                  onMouseEnter={() => setHoveredBar({ chartId: 'mini_dispatch', index })}
                                  onMouseLeave={() => setHoveredBar(null)}
                                  style={{
                                    transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
                                    transformOrigin: 'bottom center',
                                    filter: isActive ? 'drop-shadow(0 0 6px #F5788B)' : 'none',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                  }}
                                />
                              );
                            })}
                            <LabelList
                              dataKey="delayed"
                              position="top"
                              formatter={(v: number) => v > 0 ? `${Math.round(v)}%` : ''}
                              fontSize={7.5}
                              fontWeight={700}
                              fill="#475569"
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {cardItem.id === 'PRODUCTION' && (
                    <div style={{ height: '60px' }} className="mt-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={productionPlanActualData} barCategoryGap="20%" margin={{ top: 2, right: 2, left: 2, bottom: 2 }} barGap={2}>
                          <Bar
                            dataKey="plan"
                            fill="url(#gSeries2)"
                            isAnimationActive={true}
                            animationDuration={1200}
                            animationEasing="ease-out"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={20}
                          >
                            {productionPlanActualData.map((entry: any, index: number) => {
                              const isActive = hoveredBar?.chartId === 'mini_production' && hoveredBar?.index === index;
                              const isAnyActive = hoveredBar?.chartId === 'mini_production';
                              const opacity = isAnyActive ? (isActive ? 1 : 0.5) : 1;
                              return (
                                <Cell
                                  key={`cell-mini-plan-${index}`}
                                  fill="url(#gSeries2)"
                                  opacity={opacity}
                                  onMouseEnter={() => setHoveredBar({ chartId: 'mini_production', index })}
                                  onMouseLeave={() => setHoveredBar(null)}
                                  style={{
                                    transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
                                    transformOrigin: 'bottom center',
                                    filter: isActive ? 'drop-shadow(0 0 6px #F5788B)' : 'none',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                  }}
                                />
                              );
                            })}
                            <LabelList
                              dataKey="plan"
                              position="top"
                              formatter={(v: number) => Math.round(v).toLocaleString()}
                              fontSize={7.5}
                              fontWeight={700}
                              fill="#475569"
                            />
                          </Bar>
                          <Bar
                            dataKey="actual"
                            fill="url(#gSeries1)"
                            isAnimationActive={true}
                            animationDuration={1200}
                            animationEasing="ease-out"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={20}
                          >
                            {productionPlanActualData.map((entry: any, index: number) => {
                              const isActive = hoveredBar?.chartId === 'mini_production' && hoveredBar?.index === index;
                              const isAnyActive = hoveredBar?.chartId === 'mini_production';
                              const opacity = isAnyActive ? (isActive ? 1 : 0.5) : 1;
                              return (
                                <Cell
                                  key={`cell-mini-actual-${index}`}
                                  fill="url(#gSeries1)"
                                  opacity={opacity}
                                  onMouseEnter={() => setHoveredBar({ chartId: 'mini_production', index })}
                                  onMouseLeave={() => setHoveredBar(null)}
                                  style={{
                                    transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
                                    transformOrigin: 'bottom center',
                                    filter: isActive ? 'drop-shadow(0 0 6px #F5788B)' : 'none',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                  }}
                                />
                              );
                            })}
                            <LabelList
                              dataKey="actual"
                              position="top"
                              formatter={(v: number) => Math.round(v).toLocaleString()}
                              fontSize={7.5}
                              fontWeight={700}
                              fill="#475569"
                            />
                          </Bar>
                          <Line type="monotone" dataKey="adherence" stroke="#FFAE6E" strokeWidth={1} dot={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {cardItem.id === 'READINESS' && (
                    <div style={{ height: '60px' }} className="mt-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={materialReadinessData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <Area type="monotone" dataKey="raw" stackId="1" stroke="#8FDDDF" fill="url(#gRawArea)" fillOpacity={1} dot={false} />
                          <Area type="monotone" dataKey="wip" stackId="1" stroke="#FFAE6E" fill="url(#gWipArea)" fillOpacity={1} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: Detailed Workspaces (75% Width) */}
          <div className="w-[75%] overflow-y-auto flex flex-col gap-6 pl-2 pr-4">

            {/* A. Dispatch Adherence Workspace */}
            {(activePillar === 'DISPATCH') && (
              <>
                {/* Row 1: Transit Velocity & SLA Corridor */}
                <div style={{ ...card, borderRadius: '20px', padding: '24px' }} className="flex flex-col">
                  <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px', marginBottom: '16px' }}>
                    <h4 style={{ color: '#0F2854', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Transit Velocity &amp; SLA Corridor
                    </h4>
                    <p className="mt-1" style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Transit corridor efficiency vs. Carrier SLA compliance
                    </p>
                  </div>
                  <div style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chart1Data} barCategoryGap="20%" margin={{ top: 15, right: 5, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.mutedColor, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" label={{ value: 'Hours', angle: -90, position: 'insideLeft', offset: 10, fontSize: 8, fill: T.mutedColor }} tick={{ fontSize: 8, fill: T.mutedColor }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'OTA %', angle: 90, position: 'insideRight', offset: 10, fontSize: 8, fill: T.mutedColor }} tick={{ fontSize: 8, fill: T.mutedColor }} axisLine={false} tickLine={false} domain={[50, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine yAxisId="right" y={95} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'SLA Target: 95%', position: 'insideTopRight', fill: '#EF4444', fontSize: 8 }} />
                        <Bar
                          yAxisId="left"
                          dataKey="plannedTransit"
                          name="Planned Transit Time"
                          fill="url(#gSeries2)"
                          isAnimationActive={true}
                          animationDuration={1200}
                          animationEasing="ease-out"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={30}
                        >
                          {chart1Data.map((entry: any, index: number) => {
                            const isActive = hoveredBar?.chartId === 'transit_time' && hoveredBar?.index === index;
                            const isAnyActive = hoveredBar?.chartId === 'transit_time';
                            const opacity = isAnyActive ? (isActive ? 1 : 0.5) : 1;
                            return (
                              <Cell
                                key={`cell-planned-transit-${index}`}
                                fill="url(#gSeries2)"
                                opacity={opacity}
                                onMouseEnter={() => setHoveredBar({ chartId: 'transit_time', index })}
                                onMouseLeave={() => setHoveredBar(null)}
                                style={{
                                  transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
                                  transformOrigin: 'bottom center',
                                  filter: isActive ? 'drop-shadow(0 0 6px #F5788B)' : 'none',
                                  transition: 'all 0.2s ease',
                                  cursor: 'pointer'
                                }}
                              />
                            );
                          })}
                          <LabelList
                            dataKey="plannedTransit"
                            position="top"
                            formatter={(v: number) => `${v}d`}
                            fontSize={8}
                            fontWeight={700}
                            fill="#475569"
                          />
                        </Bar>
                        <Bar
                          yAxisId="left"
                          dataKey="actualTransit"
                          name="Actual Transit Time"
                          fill="url(#gSeries1)"
                          isAnimationActive={true}
                          animationDuration={1200}
                          animationEasing="ease-out"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        >
                          {chart1Data.map((entry: any, index: number) => {
                            const isActive = hoveredBar?.chartId === 'transit_time' && hoveredBar?.index === index;
                            const isAnyActive = hoveredBar?.chartId === 'transit_time';
                            const opacity = isAnyActive ? (isActive ? 1 : 0.5) : 1;
                            return (
                              <Cell
                                key={`cell-actual-transit-${index}`}
                                fill="url(#gSeries1)"
                                opacity={opacity}
                                onMouseEnter={() => setHoveredBar({ chartId: 'transit_time', index })}
                                onMouseLeave={() => setHoveredBar(null)}
                                style={{
                                  transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
                                  transformOrigin: 'bottom center',
                                  filter: isActive ? 'drop-shadow(0 0 6px #F5788B)' : 'none',
                                  transition: 'all 0.2s ease',
                                  cursor: 'pointer'
                                }}
                              />
                            );
                          })}
                          <LabelList
                            dataKey="actualTransit"
                            position="top"
                            formatter={(v: number) => `${v}d`}
                            fontSize={8}
                            fontWeight={700}
                            fill="#475569"
                          />
                        </Bar>
                        <Line yAxisId="right" type="monotone" dataKey="ota" name="OTA %" stroke="#EC6530" strokeWidth={2} dot={{ r: 4, fill: '#EC6530', strokeWidth: 0 }} label={{ position: 'top', fill: '#EC6530', fontSize: 8, fontWeight: 600, formatter: (v) => `${v}%` }} />
                        <Legend {...commonLegendProps} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Row 2: Fulfillment Stage Delay Breakdown (NEW donut/pie chart) */}
                <div style={{ ...card, borderRadius: '20px', padding: '24px' }} className="flex flex-col">
                  <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px', marginBottom: '16px' }}>
                    <h4 style={{ color: '#0F2854', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Fulfillment Stage Delay Breakdown
                    </h4>
                    <p className="mt-1" style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Proportion of delays caused by internal and external stage dependencies
                    </p>
                  </div>
                  <div style={{ height: '280px', display: 'flex', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={delayBreakdownData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {delayBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend {...commonLegendProps} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* B. Production Adherence Workspace */}
            {(activePillar === 'PRODUCTION') && (
              <>
                {/* Row 1: Weekly Production Adjacent Stacked Chart (NEW) */}
                <div style={{ ...card, borderRadius: '20px', padding: '24px' }}>
                  <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px', marginBottom: '16px' }}>
                    <h4 style={{ color: '#0F2854', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Weekly Production Planned vs Actual adjacent stack
                    </h4>
                    <p className="mt-1" style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Adjacent column stacked comparison overlaid with work-center efficiencies
                    </p>
                  </div>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={weeklyProdDetails} barCategoryGap="20%" margin={{ top: 10, right: 18, left: -22, bottom: 5 }} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.mutedColor, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fontSize: 8, fill: T.mutedColor }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 8, fill: T.mutedColor }} axisLine={false} tickLine={false} domain={[50, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        
                        {/* Planned stack */}
                        <Bar
                          yAxisId="left"
                          dataKey="pMachined"
                          name="Planned Machined"
                          stackId="plan"
                          fill="url(#gPlannedBlue)"
                          isAnimationActive={true}
                          animationDuration={1200}
                          animationEasing="ease-out"
                          maxBarSize={20}
                        >
                          {weeklyProdDetails.map((entry: any, index: number) => {
                            const isActive = hoveredBar?.chartId === 'weekly_prod' && hoveredBar?.index === index;
                            const isAnyActive = hoveredBar?.chartId === 'weekly_prod';
                            const opacity = isAnyActive ? (isActive ? 1 : 0.5) : 1;
                            return (
                              <Cell
                                key={`cell-pmachined-${index}`}
                                fill="url(#gPlannedBlue)"
                                opacity={opacity}
                                onMouseEnter={() => setHoveredBar({ chartId: 'weekly_prod', index })}
                                onMouseLeave={() => setHoveredBar(null)}
                                style={{
                                  transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
                                  transformOrigin: 'bottom center',
                                  filter: isActive ? 'drop-shadow(0 0 6px #F5788B)' : 'none',
                                  transition: 'all 0.2s ease',
                                  cursor: 'pointer'
                                }}
                              />
                            );
                          })}
                          <LabelList
                            dataKey="pMachined"
                            position="top"
                            formatter={(v: number) => v > 0 ? Math.round(v).toLocaleString() : ''}
                            fontSize={8}
                            fontWeight={700}
                            fill="#475569"
                          />
                        </Bar>
                        <Bar
                          yAxisId="left"
                          dataKey="pAssembled"
                          name="Planned Assembled"
                          stackId="plan"
                          fill="url(#gSeries2)"
                          isAnimationActive={true}
                          animationDuration={1200}
                          animationEasing="ease-out"
                          maxBarSize={20}
                        >
                          {weeklyProdDetails.map((entry: any, index: number) => {
                            const isActive = hoveredBar?.chartId === 'weekly_prod' && hoveredBar?.index === index;
                            const isAnyActive = hoveredBar?.chartId === 'weekly_prod';
                            const opacity = isAnyActive ? (isActive ? 1 : 0.5) : 1;
                            return (
                              <Cell
                                key={`cell-passembled-${index}`}
                                fill="url(#gSeries2)"
                                opacity={opacity}
                                onMouseEnter={() => setHoveredBar({ chartId: 'weekly_prod', index })}
                                onMouseLeave={() => setHoveredBar(null)}
                                style={{
                                  transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
                                  transformOrigin: 'bottom center',
                                  filter: isActive ? 'drop-shadow(0 0 6px #F5788B)' : 'none',
                                  transition: 'all 0.2s ease',
                                  cursor: 'pointer'
                                }}
                              />
                            );
                          })}
                          <LabelList
                            dataKey="pAssembled"
                            position="top"
                            formatter={(v: number) => v > 0 ? Math.round(v).toLocaleString() : ''}
                            fontSize={8}
                            fontWeight={700}
                            fill="#475569"
                          />
                        </Bar>
                        <Bar
                          yAxisId="left"
                          dataKey="pFabricated"
                          name="Planned Fabricated"
                          stackId="plan"
                          fill="url(#gFabricated)"
                          isAnimationActive={true}
                          animationDuration={1200}
                          animationEasing="ease-out"
                          maxBarSize={20}
                        >
                          {weeklyProdDetails.map((entry: any, index: number) => {
                            const isActive = hoveredBar?.chartId === 'weekly_prod' && hoveredBar?.index === index;
                            const isAnyActive = hoveredBar?.chartId === 'weekly_prod';
                            const opacity = isAnyActive ? (isActive ? 1 : 0.5) : 1;
                            return (
                              <Cell
                                key={`cell-pfabricated-${index}`}
                                fill="url(#gFabricated)"
                                opacity={opacity}
                                onMouseEnter={() => setHoveredBar({ chartId: 'weekly_prod', index })}
                                onMouseLeave={() => setHoveredBar(null)}
                                style={{
                                  transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
                                  transformOrigin: 'bottom center',
                                  filter: isActive ? 'drop-shadow(0 0 6px #F5788B)' : 'none',
                                  transition: 'all 0.2s ease',
                                  cursor: 'pointer'
                                }}
                              />
                            );
                          })}
                          <LabelList
                            dataKey="pFabricated"
                            position="top"
                            formatter={(v: number) => v > 0 ? Math.round(v).toLocaleString() : ''}
                            fontSize={8}
                            fontWeight={700}
                            fill="#475569"
                          />
                        </Bar>

                        {/* Actual stack */}
                        <Bar
                          yAxisId="left"
                          dataKey="aMachined"
                          name="Actual Machined"
                          stackId="actual"
                          fill="url(#gSeries1)"
                          isAnimationActive={true}
                          animationDuration={1200}
                          animationEasing="ease-out"
                          maxBarSize={20}
                        >
                          {weeklyProdDetails.map((entry: any, index: number) => {
                            const isActive = hoveredBar?.chartId === 'weekly_prod' && hoveredBar?.index === index;
                            const isAnyActive = hoveredBar?.chartId === 'weekly_prod';
                            const opacity = isAnyActive ? (isActive ? 1 : 0.5) : 1;
                            return (
                              <Cell
                                key={`cell-amachined-${index}`}
                                fill="url(#gSeries1)"
                                opacity={opacity}
                                onMouseEnter={() => setHoveredBar({ chartId: 'weekly_prod', index })}
                                onMouseLeave={() => setHoveredBar(null)}
                                style={{
                                  transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
                                  transformOrigin: 'bottom center',
                                  filter: isActive ? 'drop-shadow(0 0 6px #F5788B)' : 'none',
                                  transition: 'all 0.2s ease',
                                  cursor: 'pointer'
                                }}
                              />
                            );
                          })}
                          <LabelList
                            dataKey="aMachined"
                            position="top"
                            formatter={(v: number) => v > 0 ? Math.round(v).toLocaleString() : ''}
                            fontSize={8}
                            fontWeight={700}
                            fill="#475569"
                          />
                        </Bar>
                        <Bar
                          yAxisId="left"
                          dataKey="aAssembled"
                          name="Actual Assembled"
                          stackId="actual"
                          fill="url(#gSeries2)"
                          isAnimationActive={true}
                          animationDuration={1200}
                          animationEasing="ease-out"
                          maxBarSize={20}
                        >
                          {weeklyProdDetails.map((entry: any, index: number) => {
                            const isActive = hoveredBar?.chartId === 'weekly_prod' && hoveredBar?.index === index;
                            const isAnyActive = hoveredBar?.chartId === 'weekly_prod';
                            const opacity = isAnyActive ? (isActive ? 1 : 0.5) : 1;
                            return (
                              <Cell
                                key={`cell-aassembled-${index}`}
                                fill="url(#gSeries2)"
                                opacity={opacity}
                                onMouseEnter={() => setHoveredBar({ chartId: 'weekly_prod', index })}
                                onMouseLeave={() => setHoveredBar(null)}
                                style={{
                                  transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
                                  transformOrigin: 'bottom center',
                                  filter: isActive ? 'drop-shadow(0 0 6px #F5788B)' : 'none',
                                  transition: 'all 0.2s ease',
                                  cursor: 'pointer'
                                }}
                              />
                            );
                          })}
                          <LabelList
                            dataKey="aAssembled"
                            position="top"
                            formatter={(v: number) => v > 0 ? Math.round(v).toLocaleString() : ''}
                            fontSize={8}
                            fontWeight={700}
                            fill="#475569"
                          />
                        </Bar>
                        <Bar
                          yAxisId="left"
                          dataKey="aFabricated"
                          name="Actual Fabricated"
                          stackId="actual"
                          fill="url(#gFabricated)"
                          isAnimationActive={true}
                          animationDuration={1200}
                          animationEasing="ease-out"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={20}
                        >
                          {weeklyProdDetails.map((entry: any, index: number) => {
                            const isActive = hoveredBar?.chartId === 'weekly_prod' && hoveredBar?.index === index;
                            const isAnyActive = hoveredBar?.chartId === 'weekly_prod';
                            const opacity = isAnyActive ? (isActive ? 1 : 0.5) : 1;
                            return (
                              <Cell
                                key={`cell-afabricated-${index}`}
                                fill="url(#gFabricated)"
                                opacity={opacity}
                                onMouseEnter={() => setHoveredBar({ chartId: 'weekly_prod', index })}
                                onMouseLeave={() => setHoveredBar(null)}
                                style={{
                                  transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
                                  transformOrigin: 'bottom center',
                                  filter: isActive ? 'drop-shadow(0 0 6px #F5788B)' : 'none',
                                  transition: 'all 0.2s ease',
                                  cursor: 'pointer'
                                }}
                              />
                            );
                          })}
                          <LabelList
                            dataKey="aFabricated"
                            position="top"
                            formatter={(v: number) => v > 0 ? Math.round(v).toLocaleString() : ''}
                            fontSize={8}
                            fontWeight={700}
                            fill="#475569"
                          />
                        </Bar>

                        {/* Efficiencies */}
                        <Line yAxisId="right" type="monotone" dataKey="eff1" name="Machining Efficiency %" stroke="#EC6530" strokeWidth={2} dot={{ r: 3 }} />
                        <Line yAxisId="right" type="monotone" dataKey="eff2" name="Assembly Efficiency %" stroke="#0F2854" strokeWidth={2} dot={{ r: 3 }} />
                        
                        <Legend {...commonLegendProps} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Row 2: Production Category Breakdown */}
                <div style={{ ...card, borderRadius: '20px', padding: '24px' }}>
                  <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px', marginBottom: '16px' }}>
                    <h4 style={{ color: '#0F2854', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Production Category Breakdown</h4>
                    <p className="mt-1" style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Weekly components breakdown</p>
                  </div>
                  <div style={{ height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={prodCategoryStack} barCategoryGap="20%" margin={{ top: 2, right: 8, left: -22, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                        <XAxis dataKey="week" tick={{ fontSize: 7, fill: T.mutedColor, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 7, fill: T.mutedColor }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="machined"   name="Machined"   stackId="cat" fill="#EC6530" maxBarSize={22} />
                        <Bar dataKey="assembled"  name="Assembled"  stackId="cat" fill="#FFAE6E" maxBarSize={22} />
                        <Bar dataKey="fabricated" name="Fabricated" stackId="cat" fill="#8FDDDF" radius={[2,2,0,0]} maxBarSize={22} />
                        <Legend {...commonLegendProps} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* C. Material & WIP Readiness Workspace */}
            {(activePillar === 'READINESS') && (
              <>
                {/* Row 1: WIP Accumulation by Station */}
                <div style={{ ...card, borderRadius: '20px', padding: '24px' }} className="flex flex-col">
                  <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px', marginBottom: '16px' }}>
                    <h4 style={{ color: '#0F2854', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      WIP Accumulation by Station
                    </h4>
                    <p className="mt-1" style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Scatter plot highlighting bottleneck accumulation points
                    </p>
                  </div>
                  <div className="flex-grow" style={{ minHeight: '240px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" />
                        <XAxis dataKey="station" name="Station" type="number" tick={{ fontSize: 8, fill: T.mutedColor }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="wip"     name="WIP"     type="number" tick={{ fontSize: 8, fill: T.mutedColor }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                        <Scatter name="WIP Levels" data={wipStationScatter} fill="#8FDDDF" />
                        <ReferenceLine y={600} stroke="#EF4444" strokeDasharray="4 2" strokeWidth={1.5}
                          label={{ value: 'Max Buffer Corridor', fill: '#EF4444', fontSize: 7, position: 'right' }} />
                        <Legend {...commonLegendProps} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Row 2: Safety Stock Ledger */}
                <div style={{ ...card, borderRadius: '20px', padding: '24px' }} className="flex flex-col gap-4">
                  <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
                    <h4 style={{ color: '#0F2854', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Raw Material Coverage Ledger
                    </h4>
                    <p className="mt-1" style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Upcoming part arrivals &amp; alerts
                    </p>
                  </div>
                  <div className="flex-grow overflow-hidden rounded-xl" style={{ border: '1px solid #F1F5F9' }}>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #F1F5F9' }}>
                          {['Part No','Description','Stock','Alert'].map(h => (
                            <th key={h} className={h === 'Stock' ? 'text-right' : ''}
                              style={{ padding: '8px 10px', color: T.mutedColor, fontSize: '8px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rawMaterialLedger.map((r, i) => (
                          <tr key={i} style={{ borderBottom: i < rawMaterialLedger.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                            className="hover:bg-slate-50/60 transition-colors">
                            <td style={{ padding: '8px 10px', color: T.numColor, fontSize: '10px', fontWeight: 700 }}>{r.partNo}</td>
                            <td style={{ padding: '8px 10px', color: T.labelColor, fontSize: '10px' }}>{r.desc}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '10px', fontWeight: 700,
                              color: r.stockDays <= 1 ? T.rose : r.stockDays <= 3 ? T.amber : T.emerald }}>
                              {r.stockDays.toFixed(1)}d
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              {r.alert
                                ? <span className="flex items-center gap-0.5" style={{ color: T.rose, fontSize: '8px', fontWeight: 700, textTransform: 'uppercase' }}>
                                    <AlertTriangle className="w-2.5 h-2.5" strokeWidth={2} /> Critical
                                  </span>
                                : <span className="flex items-center gap-0.5" style={{ color: T.emerald, fontSize: '8px', fontWeight: 700, textTransform: 'uppercase' }}>
                                    <CheckCircle className="w-2.5 h-2.5" strokeWidth={2} /> OK
                                  </span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

          </div>

        </div>
      )}

    </div>
  );
}