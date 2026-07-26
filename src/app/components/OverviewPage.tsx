import { useState, useMemo } from 'react';
import { useFilter } from '../contexts/FilterContext';
import { getDashboardData } from '../data/dataStores';
import {
  PILLARS,
  STATIONS_LIST,
  MONTHLY_MACHINE_DEFECTS,
  resolveMachineOeeData,
  type ActivePillar
} from '../data/dataStores/oeeDataStore';
import { OeeSummaryCard } from './OeeSummaryCard';
import { CardLockHeader, lockedCardStyle } from './CardLockHeader';
import { usePageCardLocks, type CardFilterLock } from './useCardFilterLock';
import {
  BarChart,
  ComposedChart,
  AreaChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Cell,
  LabelList,
} from 'recharts';
import { type FilterState } from './TimeTrendFilter';
import {
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';

interface OverviewPageProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

// ── Design Tokens (Executive Editorial) ──────────────────────────────────────
const T = {
  pageBg:     '#F8FAFC',
  cardBg:     '#FFFFFF',
  cardBorder: '1px solid rgba(226,232,240,0.9)',
  cardShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)',
  numColor:   '#0F172A',
  labelColor: '#475569',
  mutedColor: '#94A3B8',
};

const QuadrantCard = ({
  pillarId, title, kpi, kpiColor, glowClass, borderActiveClass, subtitle, children, isSummary, onClick,
  isLocked, effectiveFilters, globalFilters, onToggleLock, onSync,
}: {
  pillarId: ActivePillar; title: string; kpi: string; kpiColor: string;
  glowClass: string; borderActiveClass: string; subtitle: string; children: React.ReactNode; isSummary?: boolean;
  onClick: () => void;
  isLocked: boolean; effectiveFilters: FilterState; globalFilters: FilterState;
  onToggleLock: () => void; onSync: () => void;
}) => {
  const [hovered, setHovered] = useState(false);

  const hoverBorderColor = 
    pillarId === 'AVAILABILITY' ? 'rgba(41, 54, 129, 0.5)' :
    pillarId === 'PERFORMANCE' ? 'rgba(217, 119, 6, 0.5)' :
    pillarId === 'QUALITY' ? 'rgba(245, 120, 139, 0.5)' :
    'rgba(93, 28, 106, 0.5)';

  const hoverBgColor = 
    pillarId === 'AVAILABILITY' ? 'rgba(41, 54, 129, 0.06)' :
    pillarId === 'PERFORMANCE' ? 'rgba(217, 119, 6, 0.06)' :
    pillarId === 'QUALITY' ? 'rgba(245, 120, 139, 0.06)' :
    'rgba(93, 28, 106, 0.06)';

  return (
    <div
      id={`quadrant-${pillarId}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl px-6 pt-5 pb-4 transition-all duration-300 cursor-pointer flex flex-col group justify-between"
      style={{
        border: hovered ? `1px solid ${hoverBorderColor}` : (isSummary ? '1px solid rgba(93, 28, 106, 0.45)' : '1px solid rgba(226, 232, 240, 0.9)'),
        boxShadow: isSummary 
          ? '0 20px 50px -12px rgba(93, 28, 106, 0.25), 0 4px 20px -2px rgba(93, 28, 106, 0.12), 0 0 15px 1px rgba(93, 28, 106, 0.08)' 
          : T.cardShadow,
        background: hovered 
          ? `radial-gradient(circle at center, ${hoverBgColor} 0%, #FFFFFF 80%)` 
          : '#FFFFFF',
        transform: hovered ? 'translateY(-4px)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: '16px',
        ...lockedCardStyle(isLocked),
      }}
    >
      <CardLockHeader
        eyebrow={subtitle}
        title={title}
        metric={
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black tabular-nums leading-none" style={{ color: kpiColor }}>{kpi}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200" />
          </div>
        }
        isLocked={isLocked}
        effectiveFilters={effectiveFilters}
        globalFilters={globalFilters}
        onToggleLock={onToggleLock}
        onSync={onSync}
      />

      <div className="flex-grow min-h-0 py-2">
        {children}
      </div>

      <div className="shrink-0 border-t border-slate-100/80 pt-2.5 mt-2 flex justify-between items-center text-[7.5px] font-black text-slate-300 group-hover:text-slate-500 uppercase tracking-widest transition-colors">
        <span>RCA Diagnostics</span>
        <span>CLICK TO DRILL ↗</span>
      </div>
    </div>
  );
};

const getOeeData = (f: FilterState) => {
  return getDashboardData('OEE', f.subPeriod || f.trend, f.product, f.process);
};

export function OverviewPage({ filters, onChange }: OverviewPageProps) {
  const { isVariantBActive, themeGradients, hoverSync, ticksAndBreach, sparklines, glassmorphic } = useFilter();
  const [activePillar, setActivePillar] = useState<ActivePillar>(null);
  const [selectedQualityMonth, setSelectedQualityMonth] = useState<string | null>(null);

  // Per-card local filter locks: [Q1, Q2, Q3, Q4]
  const [q1Lock, q2Lock, q3Lock, q4Lock] = usePageCardLocks(filters, 4);

  const globalData = useMemo(() => getOeeData(filters), [filters.trend, filters.subPeriod, filters.selectedDate, filters.product, filters.process]);
  const q1Data = useMemo(() => getOeeData(q1Lock.effectiveFilters), [q1Lock.effectiveFilters.trend, q1Lock.effectiveFilters.subPeriod, q1Lock.effectiveFilters.selectedDate, q1Lock.effectiveFilters.product, q1Lock.effectiveFilters.process]);
  const q2Data = useMemo(() => getOeeData(q2Lock.effectiveFilters), [q2Lock.effectiveFilters.trend, q2Lock.effectiveFilters.subPeriod, q2Lock.effectiveFilters.selectedDate, q2Lock.effectiveFilters.product, q2Lock.effectiveFilters.process]);
  const q3Data = useMemo(() => getOeeData(q3Lock.effectiveFilters), [q3Lock.effectiveFilters.trend, q3Lock.effectiveFilters.subPeriod, q3Lock.effectiveFilters.selectedDate, q3Lock.effectiveFilters.product, q3Lock.effectiveFilters.process]);
  const q4Data = useMemo(() => getOeeData(q4Lock.effectiveFilters), [q4Lock.effectiveFilters.trend, q4Lock.effectiveFilters.subPeriod, q4Lock.effectiveFilters.selectedDate, q4Lock.effectiveFilters.product, q4Lock.effectiveFilters.process]);

  // Expose global variables to remain compatible with Level 2 views and calculations
  const {
    tLabels: timeLabels,
    monthlyAvailability: monthlyAvailabilityData,
    monthlyPerformance: monthlyPerformanceData,
    monthlyQuality: monthlyQualityData,
    monthlyOee: monthlyOeeData,
    oeeVal: oeeValue,
    availVal: availValue,
    perfVal: perfValue,
    qualVal: qualValue,
    availTarget,
    perfTarget,
    qualTarget,
  } = globalData;

  const targets = { availTarget, perfTarget, qualTarget };

  // OEE concentric ring geometry
  const R_avail = 58, R_perf = 46, R_qual = 34;
  const C_avail = 2 * Math.PI * R_avail;
  const C_perf = 2 * Math.PI * R_perf;
  const C_qual = 2 * Math.PI * R_qual;

  const dashoffsetAvail = C_avail * (1 - availValue / 100);
  const dashoffsetPerf = C_perf * (1 - perfValue / 100);
  const dashoffsetQual = C_qual * (1 - qualValue / 100);

  const concentricFinalRate = 98.2, concentricFtrRate = 91.2;
  const R_final = 56, R_ftr = 44;
  const C_final = 2 * Math.PI * R_final;
  const C_ftr = 2 * Math.PI * R_ftr;
  const offsetFinal = C_final - (concentricFinalRate / 100) * C_final;
  const offsetFtr = C_ftr - (concentricFtrRate / 100) * C_ftr;

  const handleCardClick = (pillarId: ActivePillar, lock: CardFilterLock) => {
    if (lock.isLocked) {
      onChange(lock.effectiveFilters);
    }
    setActivePillar(pillarId);
  };

  const renderGradientDefs = () => (
    <defs>
      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#005CFF" stopOpacity={1} />
        <stop offset="100%" stopColor="#ADC9FA" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="oeeAvailGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0F2854" stopOpacity={1} />
        <stop offset="100%" stopColor="#1C4D8D" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="oeePerfGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
        <stop offset="100%" stopColor="#D97706" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="oeeQualGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E11D48" stopOpacity={1} />
        <stop offset="100%" stopColor="#FDA4AF" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
        <stop offset="100%" stopColor="#F87171" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
        <stop offset="100%" stopColor="#34D399" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
        <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="sunsetCoralGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F5788B" stopOpacity={1} />
        <stop offset="100%" stopColor="#FDA4AF" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="warmGoldGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFDA62" stopOpacity={1} />
        <stop offset="100%" stopColor="#FDE047" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="vibrantOrangeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FF6A1C" stopOpacity={1} />
        <stop offset="100%" stopColor="#F97316" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="peachAreaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFAE56" stopOpacity={0.25} />
        <stop offset="100%" stopColor="#FFAE56" stopOpacity={0.05} />
      </linearGradient>
    </defs>
  );



  const setupPmMonthlyData = useMemo(() => globalData.setupPmMonthlyData || [], [globalData]);

  const unplannedDowntimeTrendData = useMemo(() => globalData.unplannedDowntimeTrendData || [], [globalData]);

  const stationsList = STATIONS_LIST;

  const cycleTaktStationData = useMemo(() => globalData.cycleTaktStationData || [], [globalData]);

  const monthlyReworkData = useMemo(() => globalData.monthlyReworkData || [], [globalData]);

  const selectedMonthMachinePareto = useMemo(() =>
    selectedQualityMonth ? (MONTHLY_MACHINE_DEFECTS[selectedQualityMonth] || []) : [],
    [selectedQualityMonth]);

  const monthlyOutputPerManData = useMemo(() => globalData.monthlyOutputPerManData || [], [globalData]);

  const monthlyInHouseRejectionsData = useMemo(() => globalData.monthlyInHouseRejectionsData || [], [globalData]);

  // Dynamic Machine-Level Composed Bar-in-Bar OEE Data
  const machineData = useMemo(() => resolveMachineOeeData(filters), [filters.opSections, filters.shift, filters.plant, filters.trend]);

  const tooltipStyle = {
    background: '#1E293B', border: '1px solid #334155', borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.25)', fontSize: '10px', fontWeight: 600, color: '#F8FAFC',
  };

  const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
      const isSunday = label === '7' || label === '14' || label === '21' || label === '28';
      if (isSunday) {
        return (
          <div style={tooltipStyle} className="p-3">
            <p className="m-0 font-bold">Sunday | Factory Holiday (Plant Shutdown)</p>
          </div>
        );
      }
      return (
        <div style={tooltipStyle} className="p-3 flex flex-col gap-1">
          <p className="m-0 border-b border-slate-700 pb-1 mb-1 font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          {payload.map((item: any, idx: number) => {
            const formatted = formatter ? formatter(item.value, item.name, item, idx, payload) : [item.value, item.name];
            const val = Array.isArray(formatted) ? formatted[0] : formatted;
            const nm = Array.isArray(formatted) ? formatted[1] : item.name;
            return (
              <p key={idx} className="m-0 flex justify-between gap-4" style={{ color: item.color || item.fill }}>
                <span>{nm}:</span>
                <span>{typeof val === 'number' ? val.toLocaleString() : val}</span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const cardStyle = {
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



  // ── PHASE 2: LEFT PILLAR TAB ──────────────────────────────────────────────────
  const PillarTab = ({
    pillar, isActive, trendData, target
  }: {
    pillar: typeof PILLARS[number];
    isActive: boolean;
    trendData: { name: string; value: number }[];
    target: number;
  }) => {
    // Dynamic theme colors matching the level 0 page / active themes
    const getPillarColors = (id: string) => {
      switch (id) {
        case 'OEE':
          return {
            accent: '#5D1C6A',
            bgWash: 'rgba(93, 28, 106, 0.03)',
          };
        case 'AVAILABILITY':
          return {
            accent: '#CA5995', // Deep Rose
            bgWash: 'rgba(202, 89, 149, 0.03)',
          };
        case 'PERFORMANCE':
          return {
            accent: '#FFB090', // Soft Coral
            bgWash: 'rgba(255, 176, 144, 0.03)',
          };
        case 'QUALITY':
          return {
            accent: '#F5788B', // Coral Rose
            bgWash: 'rgba(245, 120, 139, 0.03)',
          };
        default:
          return {
            accent: '#6366F1',
            bgWash: 'rgba(99, 102, 241, 0.03)',
          };
      }
    };

    const colors = getPillarColors(pillar.id);
    const accentColor = colors.accent;
    const bgWash = colors.bgWash;

    const renderMicroChart = () => {
      switch (pillar.id) {
        case 'OEE':
          return (
            <AreaChart data={monthlyOeeData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <defs>
                <linearGradient id="sparkOeeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5D1C6A" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#5D1C6A" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#5D1C6A"
                strokeWidth={1.5}
                fill="url(#sparkOeeGrad)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          );
        case 'AVAILABILITY':
          return (
            <BarChart data={monthlyAvailabilityData} barCategoryGap="25%" margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              {renderGradientDefs()}
              <Bar dataKey="avg_avail" fill="url(#oeeAvailGrad)" isAnimationActive={false} radius={[1, 1, 0, 0]} maxBarSize={22} />
            </BarChart>
          );
        case 'PERFORMANCE':
          return (
            <BarChart data={monthlyPerformanceData} barCategoryGap="25%" margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              {renderGradientDefs()}
              <Bar dataKey="actualVolume" fill="url(#oeePerfGrad)" isAnimationActive={false} radius={[1, 1, 0, 0]} maxBarSize={22} />
            </BarChart>
          );
        case 'QUALITY':
          return (
            <BarChart data={monthlyQualityData} barCategoryGap="25%" margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              {renderGradientDefs()}
              <Bar dataKey="avg_fpy" fill="url(#oeeQualGrad)" isAnimationActive={false} radius={[1, 1, 0, 0]} maxBarSize={22} />
            </BarChart>
          );
        default:
          return null;
      }
    };

    return (
      <button
        id={`tab-${pillar.id}`}
        onClick={() => setActivePillar(pillar.id)}
        style={{
          background: isActive ? bgWash : '#FFFFFF',
          border: isActive ? `1px solid ${accentColor}44` : '1px solid rgba(226, 232, 240, 0.9)',
          borderLeft: isActive ? `3px solid ${accentColor}` : '1px solid rgba(226, 232, 240, 0.9)',
          borderRadius: '16px',
          padding: '16px',
          opacity: isActive ? 1 : 0.5,
          transition: 'all 0.2s ease',
        }}
        className="w-full text-left flex flex-col gap-3 relative overflow-hidden"
      >
        <div className="flex items-center justify-between w-full">
          <span
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: isActive ? accentColor : '#64748B' }}
          >
            {pillar.label}
          </span>
          <span
            className="font-black tabular-nums leading-none"
            style={{
              fontSize: isActive ? '20px' : '18px',
              color: isActive ? accentColor : '#334155',
            }}
          >
            {pillar.value}%
          </span>
        </div>

        {/* Micro-chart: 80px height, no axes/gridlines/legends/tooltips */}
        <div className="h-[80px] w-full pointer-events-none opacity-90 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            {renderMicroChart()!}
          </ResponsiveContainer>
        </div>
      </button>
    );
  };

  // ── RCA WORKSPACE: AVAILABILITY ───────────────────────────────────────────────
  const AvailabilityWorkspace = () => (
    <div className="flex flex-col gap-6 w-full pb-8">
      {/* KPI Banner */}
      <div className="flex items-center gap-6 bg-white rounded-xl border border-slate-200 px-6 py-4 shrink-0 shadow-sm" style={cardStyle}>
        <div>
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Selected</p>
          <p className="text-xs font-bold text-slate-700">Availability — Setup &amp; PM Timeline</p>
        </div>
        <div className="h-8 w-px bg-slate-200 mx-1" />
        <div className="text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Setup Overruns</p>
          <p className="text-base font-black text-emerald-600">92.5h</p>
        </div>
        <div className="text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">MTTR</p>
          <p className="text-base font-black text-rose-500">4.2h</p>
        </div>
        <div className="text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">MTBF</p>
          <p className="text-base font-black text-blue-600">72.8h</p>
        </div>
      </div>

      {/* Setup & PM Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm w-full" style={cardStyle}>
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h4 className="text-[10px] font-black text-emerald-600 tracking-widest uppercase">
            Setup &amp; Planned PM Durations
          </h4>
          <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
            Actual vs. Target Plan vs. Overruns — Jan–Dec
          </p>
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={setupPmMonthlyData} barCategoryGap="25%" margin={{ top: 15, right: 16, left: -20, bottom: 24 }}>
              {renderGradientDefs()}
              <defs>
                <linearGradient id="areaSetup" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00B574" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#00B574" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 800 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={50} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Target 50m', fill: '#EF4444', position: 'top', fontSize: 8, fontWeight: 'bold' }} />
              <Area type="monotone" dataKey="planned" name="Planned PM (m)" stroke="#00B574" strokeWidth={2} fill="url(#areaSetup)" dot={false} />
              <Bar dataKey="actual" name="Actual PM (m)" fill="url(#redGrad)" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Legend {...commonLegendProps} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Unplanned Downtime */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm w-full" style={cardStyle}>
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h4 className="text-[10px] font-black text-slate-700 tracking-widest uppercase">
            Unplanned Downtime Breakdown
          </h4>
          <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
            Monthly breakdown minutes (columns) vs MTTR / MTBF reliability splines
          </p>
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={unplannedDowntimeTrendData} barCategoryGap="25%" margin={{ top: 15, right: 16, left: -20, bottom: 24 }}>
              {renderGradientDefs()}
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 800 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine yAxisId="right" y={30} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Target MTTR 30m', fill: '#EF4444', position: 'top', fontSize: 8, fontWeight: 'bold' }} />
              <Bar yAxisId="left" dataKey="breakdown" name="Breakdown (m)" fill="url(#redGrad)" maxBarSize={22} />
              <Line yAxisId="right" type="monotone" dataKey="mttr" name="MTTR (m)" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="mtbf" name="MTBF (h)" stroke="#005CFF" strokeWidth={2.5} dot={{ r: 3 }} />
              <Legend {...commonLegendProps} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // ── RCA WORKSPACE: PERFORMANCE ────────────────────────────────────────────────
  const PerformanceWorkspace = () => (
    <div className="flex flex-col gap-6 w-full pb-8">
      {/* KPI Banner */}
      <div className="flex items-center gap-6 bg-white rounded-xl border border-slate-200 px-6 py-4 shrink-0 shadow-sm" style={cardStyle}>
        <div>
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Selected</p>
          <p className="text-xs font-bold text-slate-700">Performance — Station Cycle Time vs. Takt</p>
        </div>
        <div className="h-8 w-px bg-slate-200 mx-1" />
        <div className="text-center flex flex-col items-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Bottlenecks</p>
          <span className="mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
            3 Bottleneck Alerts (LW02 · PACK · VMC3)
          </span>
        </div>
      </div>

      {/* Station Cycle Time Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm w-full" style={cardStyle}>
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
          <div>
            <h4 className="text-[10px] font-black text-amber-600 tracking-widest uppercase">
              Station Cycle Time vs. Takt Threshold Limits
            </h4>
            <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
              Workstation averages relative to Takt ceiling — alerts highlighted in red
            </p>
          </div>
        </div>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cycleTaktStationData} barCategoryGap="25%" margin={{ top: 15, right: 16, left: -20, bottom: 24 }}>
              {renderGradientDefs()}
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 800 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} domain={[0, 60]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="setup" name="Human Loading" fill="#ADC9FA" stackId="s" maxBarSize={22} />
              <Bar dataKey="processing" name="Machine Process" stackId="s" maxBarSize={22}>
                {cycleTaktStationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.total > entry.limit ? 'url(#redGrad)' : 'url(#blueGrad)'} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="limit" name="Limit Threshold" stroke="#EF4444" strokeWidth={2} strokeDasharray="4 3" dot={false} />
              <Legend {...commonLegendProps} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Output Per Operator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm w-full" style={cardStyle}>
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
          <div>
            <h4 className="text-[10px] font-black text-amber-600 tracking-widest uppercase">
              Output Per Man Productivity
            </h4>
            <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
              Average parts produced per operator per shift vs. standard standard efficiency threshold
            </p>
          </div>
        </div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyOutputPerManData} barCategoryGap="25%" margin={{ top: 15, right: 16, left: -20, bottom: 24 }}>
              {renderGradientDefs()}
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 800 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} domain={[0, 600]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={400} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Target 400 pcs/op', fill: '#EF4444', position: 'top', fontSize: 8, fontWeight: 'bold' }} />
              <Bar dataKey="actual" name="Actual Productivity" fill="url(#blueGrad)" maxBarSize={22}>
                <LabelList dataKey="actual" position="top" style={{ fontSize: 8, fontWeight: 700, fill: '#475569' }} />
              </Bar>
              <Legend {...commonLegendProps} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // ── RCA WORKSPACE: QUALITY ────────────────────────────────────────────────────
  const QualityWorkspace = () => (
    <div className="flex flex-col gap-6 w-full pb-8">
      {/* KPI Banner */}
      <div className="flex items-center gap-6 bg-white rounded-xl border border-slate-200 px-6 py-4 shrink-0 shadow-sm" style={cardStyle}>
        <div>
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Selected</p>
          <p className="text-xs font-bold text-slate-700">Quality — Yield Lifecycle &amp; Rework Loops</p>
        </div>
        <div className="h-8 w-px bg-slate-200 mx-1" />
        <div className="text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Final Yield</p>
          <p className="text-base font-black text-orange-600">{concentricFinalRate}%</p>
        </div>
        <div className="text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">First Pass</p>
          <p className="text-base font-black text-amber-500">{concentricFtrRate}%</p>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Concentric rings panel */}
        <div className="rounded-2xl border p-6 shadow-sm flex flex-col justify-between w-[220px] shrink-0" style={{ ...cardStyle, background: '#FCF9F8' }}>
          <div className="border-b border-slate-100 pb-3 mb-3">
            <h4 className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#F5788B' }}>Yield Lifecycle</h4>
            <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">FTR vs Final Yield rings</p>
          </div>
          <div className="relative w-32 h-32 mx-auto my-3 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <defs>
                <linearGradient id="concentricCoral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EC6530" />
                  <stop offset="100%" stopColor="#F5788B" />
                </linearGradient>
                <linearGradient id="concentricAmethyst" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>
              </defs>
              <circle cx="64" cy="64" r={R_final} fill="transparent" stroke="#F1F5F9" strokeWidth="7" />
              <circle cx="64" cy="64" r={R_ftr} fill="transparent" stroke="#F1F5F9" strokeWidth="7" />
              <circle cx="64" cy="64" r={R_final} fill="transparent" stroke="url(#concentricCoral)" strokeWidth="7" strokeDasharray={C_final} strokeDashoffset={offsetFinal} strokeLinecap="round" />
              <circle cx="64" cy="64" r={R_ftr} fill="transparent" stroke="url(#concentricAmethyst)" strokeWidth="7" strokeDasharray={C_ftr} strokeDashoffset={offsetFtr} strokeLinecap="round" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-base font-black text-slate-800">{concentricFinalRate}%</span>
              <span className="text-[6px] text-slate-400 font-extrabold uppercase mt-0.5">Final Yield</span>
            </div>
          </div>
          <div className="text-[8px] font-bold text-slate-400 text-center uppercase tracking-wide border-t border-slate-100 pt-3 flex justify-between">
            <span>FPY: <span className="font-black" style={{ color: '#8B5CF6' }}>{concentricFtrRate}%</span></span>
            <span className="text-slate-300">Gap = loop waste</span>
          </div>
        </div>

        {/* Rework / Pareto panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex-1 flex flex-col" style={cardStyle}>
          {selectedQualityMonth ? (
            <>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                    {selectedQualityMonth} — Machine Defects Pareto
                  </h4>
                  <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
                    Ranking individual machine failure modes
                  </p>
                </div>
                <button
                  onClick={() => setSelectedQualityMonth(null)}
                  className="flex items-center gap-1 text-[8px] font-black text-rose-500 hover:text-rose-600 border border-rose-200 bg-rose-50 px-2.5 py-1 rounded"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Reset Month
                </button>
              </div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedMonthMachinePareto} barCategoryGap="25%" margin={{ top: 10, right: 0, left: -20, bottom: 24 }}>
                    {renderGradientDefs()}
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="machine" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 800 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="defects" name="Defects" fill="url(#vibrantOrangeGrad)" radius={[3, 3, 0, 0]} maxBarSize={22} />
                    <Legend {...commonLegendProps} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h4 className="text-[10px] font-black text-slate-700 tracking-widest uppercase">
                    Yield Loss Rework Loops
                  </h4>
                  <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
                    Planned runs vs rework cycles — Click bar to drill machine defects
                  </p>
                </div>
              </div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyReworkData}
                    barCategoryGap="25%"
                    margin={{ top: 15, right: 0, left: -20, bottom: 24 }}
                    onClick={(d) => { if (d?.activeLabel) setSelectedQualityMonth(d.activeLabel); }}
                  >
                    {renderGradientDefs()}
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 800 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={55} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Target 55', fill: '#EF4444', position: 'top', fontSize: 8, fontWeight: 'bold' }} />
                    <Bar dataKey="rework" name="Rework Count" fill="#EC6530" radius={[2, 2, 0, 0]} cursor="pointer" maxBarSize={22} />
                    <Bar dataKey="planned" name="Planned Runs" fill="#1C4D8D" radius={[2, 2, 0, 0]} cursor="pointer" maxBarSize={22} />
                    <Legend {...commonLegendProps} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>

      {/* In-House Rejections Stacked Column Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm w-full" style={cardStyle}>
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
          <div>
            <h4 className="text-[10px] font-black text-rose-500 tracking-widest uppercase">
              In-House Rejections Breakdown
            </h4>
            <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
              Monthly defect rejections count stacked by category (Burrs, Blow Holes, Gaps)
            </p>
          </div>
        </div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyInHouseRejectionsData} barCategoryGap="25%" margin={{ top: 15, right: 16, left: -20, bottom: 24 }}>
              {renderGradientDefs()}
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 800 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={20} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Warning Limit 20', fill: '#EF4444', position: 'top', fontSize: 8, fontWeight: 'bold' }} />
              <Bar dataKey="burrs" name="Burrs" fill="#EC6530" stackId="rejections" maxBarSize={22} />
              <Bar dataKey="blowHoles" name="Blow Holes" fill="#FFDA62" stackId="rejections" maxBarSize={22} />
              <Bar dataKey="gaps" name="Gaps" fill="#FFAE6E" stackId="rejections" maxBarSize={22} />
              <Legend {...commonLegendProps} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // ── RCA WORKSPACE: OEE ────────────────────────────────────────────────────────
  const OEEWorkspace = () => {
    return (
      <div className="flex flex-col gap-6 w-full pb-8">
        {/* Header */}
        <div className="flex items-center gap-6 bg-white rounded-xl border border-slate-200 px-6 py-4 shrink-0 shadow-sm" style={cardStyle}>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Overall OEE</p>
            <p className="text-xs font-bold text-slate-700">Availability · Performance · Quality composite</p>
          </div>
          <div className="h-8 w-px bg-slate-200 mx-1" />
          <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-full px-3 py-1 text-[11px] font-extrabold text-rose-500">
            <span>▼</span><span>-13.0% vs target</span>
          </div>
        </div>

        <div className="w-full">
          {/* Machine-Level Composed OEE Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between" style={{ ...cardStyle, paddingTop: '24px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: '16px' }}>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-[10px] font-black text-indigo-600 tracking-widest uppercase">
                Machine-Level Composed OEE
              </h4>
              <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
                Operational comparative analytics — Click a workstation below to audit details
              </p>
            </div>

            <div style={{ height: 340, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={machineData} barCategoryGap="25%" margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="corpAvailGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1C4D8D" stopOpacity={1} />
                      <stop offset="100%" stopColor="#4988C4" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="corpPerfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4988C4" stopOpacity={1} />
                      <stop offset="100%" stopColor="#BDE8F5" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="corpQualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#BDE8F5" stopOpacity={1} />
                      <stop offset="100%" stopColor="#F8FAFC" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="capacityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#94A3B8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" xAxisId={0} tick={{ fontSize: 7, fill: '#64748B', fontWeight: 800 }} axisLine={false} tickLine={false} />
                  <XAxis dataKey="name" xAxisId={1} hide />
                  <YAxis ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 8, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} domain={[0, 110]} />
                  <Tooltip content={<CustomTooltip formatter={(v: any, n: string) => [`${v}%`, n]} />} />

                  {/* Background capacity container column */}
                  <Bar xAxisId={1} dataKey="capacity" fill="url(#capacityGrad)" barSize={44} radius={[4, 4, 0, 0]} name="Operating Capacity" isAnimationActive={false} />

                  {/* Three grouped metric pillars — Availability, Performance, Quality */}
                  <Bar xAxisId={0} dataKey="uptime" name="Availability" fill="url(#corpAvailGrad)" maxBarSize={22} radius={[2, 2, 0, 0]} isAnimationActive={false}>
                    <LabelList dataKey="uptime" position="top" style={{ fontSize: 5, fill: '#64748B', fontWeight: 'bold' }} formatter={(v: number) => `${Math.round(v)}%`} />
                  </Bar>
                  <Bar xAxisId={0} dataKey="actualVolume" name="Performance" fill="url(#corpPerfGrad)" maxBarSize={22} radius={[2, 2, 0, 0]} isAnimationActive={false}>
                    <LabelList dataKey="actualVolume" position="top" style={{ fontSize: 5, fill: '#64748B', fontWeight: 'bold' }} formatter={(v: number) => `${Math.round(v)}%`} />
                  </Bar>
                  <Bar xAxisId={0} dataKey="yieldPass" name="Quality" fill="url(#corpQualGrad)" maxBarSize={22} radius={[2, 2, 0, 0]} isAnimationActive={false}>
                    <LabelList dataKey="yieldPass" position="top" style={{ fontSize: 5, fill: '#64748B', fontWeight: 'bold' }} formatter={(v: number) => `${Math.round(v)}%`} />
                  </Bar>

                  {/* Composite OEE spline trend line */}
                  <Line xAxisId={0} type="monotone" dataKey="overallOee" name="OEE Score" stroke="#0F2854" strokeWidth={2} dot={{ r: 3, fill: '#0F2854', stroke: 'white', strokeWidth: 1.5 }} activeDot={{ r: 5 }} isAnimationActive={false} />

                  {/* Target 80% reference line */}
                  <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Target 80%', fill: '#EF4444', position: 'insideTopRight', fontSize: 7, fontWeight: 'bold' }} />

                  <Legend {...commonLegendProps} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-[calc(100vh-130px)] bg-[#F8F9FA] overflow-hidden select-none flex flex-col">

      {/* Breadcrumb Header */}
      <div className={`
        shrink-0 overflow-hidden transition-all duration-300 ease-in-out
        ${activePillar !== null ? 'max-h-[60px] opacity-100' : 'max-h-0 opacity-0'}
      `}>
        <div className="flex justify-between items-center bg-white border-b border-slate-200 px-6 py-2.5">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <button onClick={() => { setActivePillar(null); setSelectedQualityMonth(null); }} className="hover:text-slate-700 uppercase transition-colors">
              OEE Overview
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600 font-extrabold uppercase">
              {PILLARS.find(p => p.id === activePillar)?.label}
            </span>
          </div>
          <button
            id="btn-back-to-grid"
            onClick={() => { setActivePillar(null); setSelectedQualityMonth(null); }}
            className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-grow min-h-0 relative">

        {/* PHASE 1: 2×2 GRID ──────────────────────────────────────────── */}
        <div className={`
          absolute inset-0 p-6 transition-all duration-300 ease-in-out
          ${activePillar === null
            ? 'opacity-100 pointer-events-auto translate-y-0'
            : 'opacity-0 pointer-events-none -translate-y-2'}
        `}>
          <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">

            {/* Q1: OEE Overview summary card with global variant B configuration */}
            <div className="h-full">
              <OeeSummaryCard
                isVariantB={isVariantBActive}
                hoverSync={hoverSync}
                ticksAndBreach={ticksAndBreach}
                sparklines={sparklines}
                glassmorphic={glassmorphic}
                themeGradients={themeGradients}
                onClick={() => handleCardClick('OEE', q1Lock)}
                oeeValue={q1Data.oeeVal}
                availValue={q1Data.availVal}
                perfValue={q1Data.perfVal}
                qualValue={q1Data.qualVal}
                isLocked={q1Lock.isLocked}
                effectiveFilters={q1Lock.effectiveFilters}
                globalFilters={filters}
                onToggleLock={q1Lock.toggle}
                onSync={q1Lock.unlock}
              />
            </div>

            {/* Q2: Availability Index */}
            <QuadrantCard
              pillarId="AVAILABILITY"
              title="Availability Index"
              kpi={`${q2Data.availVal}%`}
              kpiColor="#00B574"
              glowClass="shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)]"
              borderActiveClass="border-emerald-300"
              subtitle="Monthly uptime & downtime"
              onClick={() => handleCardClick('AVAILABILITY', q2Lock)}
              isLocked={q2Lock.isLocked}
              effectiveFilters={q2Lock.effectiveFilters}
              globalFilters={filters}
              onToggleLock={q2Lock.toggle}
              onSync={q2Lock.unlock}
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={q2Data.monthlyAvailability} barCategoryGap="25%" margin={{ top: 12, right: -5, left: -35, bottom: 5 }}>
                  {renderGradientDefs()}
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 6, fill: '#94A3B8', fontWeight: 800 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 6, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avg_avail" name="Availability" fill="url(#oeeAvailGrad)" radius={[3, 3, 0, 0]} maxBarSize={22} />
                  <ReferenceLine y={q2Data.availTarget} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: `Target ${q2Data.availTarget}%`, fill: '#EF4444', position: 'top', fontSize: 7, fontWeight: 'bold' }} />
                  <Legend {...commonLegendProps} />
                </ComposedChart>
              </ResponsiveContainer>
            </QuadrantCard>

            {/* Q3: Performance Index */}
            <QuadrantCard
              pillarId="PERFORMANCE"
              title="Performance Index"
              kpi={`${q3Data.perfVal}%`}
              kpiColor="#FFA000"
              glowClass="shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)]"
              borderActiveClass="border-amber-300"
              subtitle="Monthly actual vs target volume"
              onClick={() => handleCardClick('PERFORMANCE', q3Lock)}
              isLocked={q3Lock.isLocked}
              effectiveFilters={q3Lock.effectiveFilters}
              globalFilters={filters}
              onToggleLock={q3Lock.toggle}
              onSync={q3Lock.unlock}
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={q3Data.monthlyPerformance} barCategoryGap="25%" margin={{ top: 12, right: -5, left: -35, bottom: 5 }}>
                  {renderGradientDefs()}
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 6, fill: '#94A3B8', fontWeight: 800 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 6, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[0, 1800]} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 6, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar yAxisId="left" dataKey="actualVolume" name="Actual Volume" fill="url(#oeePerfGrad)" radius={[3, 3, 0, 0]} maxBarSize={22} />
                  <Line yAxisId="right" type="monotone" dataKey="avg_perf" stroke="#FFA000" strokeWidth={1.5} dot={false} />
                  <ReferenceLine yAxisId="right" y={q3Data.perfTarget} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: `Target ${q3Data.perfTarget}%`, fill: '#EF4444', position: 'top', fontSize: 7, fontWeight: 'bold' }} />
                  <Legend {...commonLegendProps} />
                </ComposedChart>
              </ResponsiveContainer>
            </QuadrantCard>

            {/* Q4: Quality Index */}
            <QuadrantCard
              pillarId="QUALITY"
              title="Quality Index"
              kpi={`${q4Data.qualVal}%`}
              kpiColor="#F5788B"
              glowClass="shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)]"
              borderActiveClass="border-rose-300"
              subtitle="Monthly yield pass rate & rework cycles"
              onClick={() => handleCardClick('QUALITY', q4Lock)}
              isLocked={q4Lock.isLocked}
              effectiveFilters={q4Lock.effectiveFilters}
              globalFilters={filters}
              onToggleLock={q4Lock.toggle}
              onSync={q4Lock.unlock}
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={q4Data.monthlyQuality} barCategoryGap="25%" margin={{ top: 12, right: -5, left: -35, bottom: 5 }}>
                  {renderGradientDefs()}
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 6, fill: '#94A3B8', fontWeight: 800 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 6, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[0, 110]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avg_fpy" name="Quality Pass Rate" fill="url(#oeeQualGrad)" radius={[3, 3, 0, 0]} maxBarSize={22} />
                  <ReferenceLine y={q4Data.qualTarget} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: `Target ${q4Data.qualTarget}%`, fill: '#EF4444', position: 'top', fontSize: 7, fontWeight: 'bold' }} />
                  <Legend {...commonLegendProps} />
                </ComposedChart>
              </ResponsiveContainer>
            </QuadrantCard>

          </div>
        </div>

        {/* PHASE 2: SPLIT-SCREEN RCA WORKSPACE (25% / 75%) ────────────────────────── */}
        <div className={`
          absolute inset-0 p-6 flex gap-5 transition-all duration-300 ease-in-out
          ${activePillar !== null
            ? 'opacity-100 pointer-events-auto translate-y-0'
            : 'opacity-0 pointer-events-none translate-y-2'}
        `}>
          {/* LEFT: Vertical Pillar Selector — 25% width */}
          <div className="w-[25%] shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 px-1 mb-1">Pillar Selector</p>

            <PillarTab
              pillar={PILLARS[0]}
              isActive={activePillar === 'OEE'}
              trendData={monthlyOeeData}
              target={80}
            />

            <PillarTab
              pillar={PILLARS[1]}
              isActive={activePillar === 'AVAILABILITY'}
              trendData={monthlyAvailabilityData.map(d => ({ name: d.name, value: d.avg_avail }))}
              target={85}
            />

            <PillarTab
              pillar={PILLARS[2]}
              isActive={activePillar === 'PERFORMANCE'}
              trendData={monthlyPerformanceData.map(d => ({ name: d.name, value: d.avg_perf }))}
              target={80}
            />

            <PillarTab
              pillar={PILLARS[3]}
              isActive={activePillar === 'QUALITY'}
              trendData={monthlyQualityData.map(d => ({ name: d.name, value: d.avg_fpy }))}
              target={99}
            />
          </div>

          {/* RIGHT: RCA Diagnostic Workspace — 75% width, vertically scrollable */}
          <div className="w-[75%] overflow-y-auto pl-2 pr-4">
            {activePillar === 'OEE' && <OEEWorkspace />}
            {activePillar === 'AVAILABILITY' && <AvailabilityWorkspace />}
            {activePillar === 'PERFORMANCE' && <PerformanceWorkspace />}
            {activePillar === 'QUALITY' && <QualityWorkspace />}
          </div>
        </div>

      </div>
    </div>
  );
}
