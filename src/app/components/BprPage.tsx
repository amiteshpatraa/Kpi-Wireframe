import { useState, useMemo } from 'react';
import {
  BarChart,
  LineChart,
  ComposedChart,
  AreaChart,
  ScatterChart,
  Scatter,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { type FilterState } from './TimeTrendFilter';
import {
  ArrowLeft,
  Warehouse,
  ArrowRight,
  ShieldCheck,
  Search,
  Forklift,
  CalendarCheck,
  ChevronRight,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { CardLockHeader, lockedCardStyle } from './CardLockHeader';
import { usePageCardLocks } from './useCardFilterLock';
import { cn } from './ui/utils';
import { getDashboardData } from '../data/dashboardDataStore';

interface BprPageProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

type PillarId = 'SUMMARY' | 'VOLATILITY' | 'ADHERENCE' | 'PENETRATION';

// ─── Design Tokens (Executive Editorial) ──────────────────────────────────────
const T = {
  pageBg:     '#F8FAFC',
  cardBg:     '#FFFFFF',
  cardBorder: '1px solid rgba(226,232,240,0.9)',
  cardShadow: '0 10px 30px -6px rgba(15,23,42,0.05), 0 4px 10px -4px rgba(15,23,42,0.04)',
  numColor:   '#0F172A',
  labelColor: '#475569',
  mutedColor: '#94A3B8',
  red:        '#EF4444',
  amber:      '#F59E0B',
  green:      '#10B981',
  blue:       '#3B82F6',
  indigo:     '#4F46E5',
  violet:     '#8B5CF6',
  tt: {
    background: '#0F172A',
    border: '1px solid rgba(226,232,240,0.2)',
    borderRadius: '10px',
    boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
    fontSize: '10px',
    fontWeight: 600,
    color: '#E0F2FE',
    padding: '8px 12px',
  },
};

// Concentric radial ring dimensions
const R_bpr_1 = 32;
const R_bpr_2 = 24;
const R_bpr_3 = 16;
const C_bpr_1 = 2 * Math.PI * R_bpr_1;
const C_bpr_2 = 2 * Math.PI * R_bpr_2;
const C_bpr_3 = 2 * Math.PI * R_bpr_3;

// ── DYNAMIC BPR CONFIGURATION ENGINE (REUSABLE FOR ALL SNAPSHOT STATES) ───────
function getBprData(filters: FilterState) {
  return getDashboardData('BPR', filters.subPeriod || filters.trend, filters.product, filters.process);
}

function isMtdWtd(eff: FilterState) {
  const p = (eff.subPeriod || eff.trend || '').toLowerCase();
  return p === 'mtd' || p === 'mom' || p === 'wtd' || p === 'wow' || p === 'month' || p === 'week';
}

export function BprPage({ filters, onChange }: BprPageProps) {
  const [activePillar, setActivePillar] = useState<PillarId | null>(null);
  // Per-card local filter locks: [SUMMARY, VOLATILITY, ADHERENCE, PENETRATION]
  const [q1Lock, q2Lock, q3Lock, q4Lock] = usePageCardLocks(filters, 4);
  const [selectedBufferZone, setSelectedBufferZone] = useState<string | null>(null);

  const renderGradientDefs = () => (
    <defs>
      <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#EF4444" stopOpacity={1} />
        <stop offset="100%" stopColor="#991B1B" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#F59E0B" stopOpacity={1} />
        <stop offset="100%" stopColor="#D97706" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#10B981" stopOpacity={1} />
        <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#3B82F6" stopOpacity={1} />
        <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#8B5CF6" stopOpacity={0.85} />
        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.1} />
      </linearGradient>
    </defs>
  );

  // Compute quadrant states for landing page render based on respective lock snapshots
  const q1Data = getBprData(q1Lock.effectiveFilters);
  const q2Data = getBprData(q2Lock.effectiveFilters);
  const q3Data = getBprData(q3Lock.effectiveFilters);
  const q4Data = getBprData(q4Lock.effectiveFilters);

  // Compute active data for right column workspace based on current active tab's effective filters
  const activeData = useMemo(() => {
    const cardLock = 
      activePillar === 'SUMMARY' ? q1Lock :
      activePillar === 'VOLATILITY' ? q2Lock :
      activePillar === 'ADHERENCE' ? q3Lock :
      q4Lock;
    return getBprData(cardLock ? cardLock.effectiveFilters : filters);
  }, [activePillar, q1Lock.effectiveFilters, q2Lock.effectiveFilters, q3Lock.effectiveFilters, q4Lock.effectiveFilters, filters]);

  const q2PromisedActualData = useMemo(() => {
    const basePromised: Record<string, number> = {
      'Krupp Steel Forge': 6,
      'Acme Castings': 8,
      'SealTech Components': 5,
    };
    return q2Data.vendorDelayData.map((d: any) => {
      const promised = basePromised[d.vendor] || 5;
      const actual = +(promised + d.delayDays).toFixed(1);
      return {
        supplier: d.vendor,
        promised,
        actual,
      };
    });
  }, [q2Data.vendorDelayData]);

  const activePromisedActualData = useMemo(() => {
    const basePromised: Record<string, number> = {
      'Krupp Steel Forge': 6,
      'Acme Castings': 8,
      'SealTech Components': 5,
    };
    return activeData.vendorDelayData.map((d: any) => {
      const promised = basePromised[d.vendor] || 5;
      const actual = +(promised + d.delayDays).toFixed(1);
      return {
        supplier: d.vendor,
        promised,
        actual,
      };
    });
  }, [activeData.vendorDelayData]);

  const q3AdherenceDataWithVolume = useMemo(() => {
    return q3Data.scheduleAdherenceData.map((d: any, i: number) => {
      const baseOrders = 200 + (Math.sin(i) * 100) + (Math.cos(i * 2) * 50);
      const ordersDispatched = Math.round(baseOrders);
      return {
        ...d,
        ordersDispatched,
      };
    });
  }, [q3Data.scheduleAdherenceData]);

  const activeAdherenceDataWithVolume = useMemo(() => {
    return activeData.scheduleAdherenceData.map((d: any, i: number) => {
      const baseOrders = 200 + (Math.sin(i) * 100) + (Math.cos(i * 2) * 50);
      const ordersDispatched = Math.round(baseOrders);
      return {
        ...d,
        ordersDispatched,
      };
    });
  }, [activeData.scheduleAdherenceData]);

  const filteredReplenishmentLedger = useMemo(() => {
    if (!selectedBufferZone) return activeData.replenishmentLedger;
    return activeData.replenishmentLedger.filter(
      (item: any) => item.zone === selectedBufferZone
    );
  }, [activeData.replenishmentLedger, selectedBufferZone]);

  const cardStyle = {
    background: T.cardBg,
    border: T.cardBorder,
    boxShadow: T.cardShadow,
    borderRadius: '16px',
  };

  const centeredLegendStyle = {
    paddingTop: '20px',
    fontSize: '9px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: '#475569',
  };

  const PILLARS = useMemo(() => [
    { id: 'SUMMARY' as const, label: 'BPR Summary', value: `${q1Data.penetrationIndex.toFixed(1)}% Index` },
    { id: 'VOLATILITY' as const, label: 'Demand Volatility', value: '18% Avg Cv' },
    { id: 'ADHERENCE' as const, label: 'Schedule Adherence', value: `${q3Data.supplierAdherence.toFixed(1)}% Adh` },
    { id: 'PENETRATION' as const, label: 'Buffer Penetration', value: `${q4Data.shortageDistribution.find(s => s.name.includes('Critical'))?.count || 0} Crit Parts` },
  ], [q1Data, q3Data, q4Data]);

  const drillLabel =
    activePillar === 'VOLATILITY'  ? 'Volatility & Lead-Time Analysis' :
    activePillar === 'ADHERENCE'   ? 'Schedule Adherence Diagnostics' :
    activePillar === 'PENETRATION' ? 'Buffer Penetration & Flow Control' :
    'Summary Dashboard';

  // Helper to resolve pillar value inside sidebar tabs dynamically
  const getTabValue = (id: string, tData: any) => {
    switch (id) {
      case 'SUMMARY': return `${tData.penetrationIndex.toFixed(1)}% Index`;
      case 'VOLATILITY': return `18% Avg Cv`;
      case 'ADHERENCE': return `${tData.supplierAdherence.toFixed(1)}% Adh`;
      case 'PENETRATION': return `${tData.shortageDistribution.find((s: any) => s.name.includes('Critical'))?.count || 0} Crit Parts`;
      default: return '';
    }
  };

  // ── SELECTOR CARD COMPONENT (LEFT COLUMN) ──────────────────────────────────
  interface PillarTabProps {
    pillar: typeof PILLARS[number];
    isActive: boolean;
  }

  const PillarTab = ({ pillar, isActive }: PillarTabProps) => {
    const cardLock = 
      pillar.id === 'SUMMARY' ? q1Lock :
      pillar.id === 'VOLATILITY' ? q2Lock :
      pillar.id === 'ADHERENCE' ? q3Lock :
      q4Lock;

    const tabData = getBprData(cardLock.effectiveFilters);

    // Build dynamic filter tags to show inside the tab
    const filterTags = [];
    const eff = cardLock.effectiveFilters;

    let periodText = 'Jan-Jul';
    if (eff.trend === 'year' && eff.subPeriod === 'yoy') periodText = '2011-2026';
    else if (eff.trend === 'quarter') periodText = 'QTD';
    else if (eff.trend === 'month') periodText = 'MTD';
    else if (eff.trend === 'week') periodText = 'WTD';
    filterTags.push({ text: periodText, type: 'gray' });

    if (eff.product && eff.product !== 'All') {
      filterTags.push({ text: eff.product, type: 'peach' });
    }
    if (eff.process && eff.process !== 'All' && eff.process !== 'All Processes') {
      filterTags.push({ text: eff.process, type: 'mint' });
    }

    return (
      <button
        onClick={() => setActivePillar(pillar.id)}
        style={{
          background: isActive ? 'rgba(217, 119, 6, 0.03)' : '#FFFFFF',
          border: cardLock.isLocked 
            ? '1.5px solid rgba(217, 119, 6, 0.65)' 
            : isActive 
            ? '1px solid rgba(217, 119, 6, 0.2)' 
            : '1px solid rgba(226, 232, 240, 0.9)',
          borderLeft: isActive ? '3.5px solid #D97706' : cardLock.isLocked ? '1.5px solid rgba(217, 119, 6, 0.65)' : '1px solid rgba(226, 232, 240, 0.9)',
          borderRadius: '16px',
          padding: '16px',
          opacity: isActive ? 1 : 0.5,
          transition: 'all 0.2s ease',
          boxShadow: cardLock.isLocked 
            ? '0 0 10px rgba(217, 119, 6, 0.15), 0 2px 4px rgba(0,0,0,0.02)' 
            : '0 1px 2px rgba(0,0,0,0.02)',
        }}
        className="w-full text-left flex flex-col justify-between min-h-[160px] shadow-sm relative group cursor-pointer"
      >
        <div className="flex justify-between items-start w-full">
          <div className="min-w-0 flex-grow">
            <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">
              {pillar.id === 'SUMMARY' ? 'Overview' : 'Pillar'}
            </span>
            <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-tight mt-0.5 truncate">
              {pillar.label}
            </h4>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 pl-1">
            <span className="text-[10px] font-black text-slate-700 tabular-nums">
              {getTabValue(pillar.id, tabData)}
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                cardLock.toggle();
              }}
              title={cardLock.isLocked ? "Unlock filters" : "Lock/Pin filters"}
              className={cn(
                "p-1 rounded cursor-pointer border hover:bg-slate-100/60 transition-colors",
                cardLock.isLocked 
                  ? "text-amber-600 bg-amber-50 border-amber-200" 
                  : "text-slate-300 border-transparent"
              )}
            >
              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                {cardLock.isLocked ? (
                  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                ) : (
                  <path d="M14 4v5.07L14.78 10h-5.56L10 9.07V4h4m2-2H8v2h1v5l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2V4h1V2z" />
                )}
              </svg>
            </span>
          </div>
        </div>

        {/* Dynamic Filter Tag Row */}
        <div className="flex flex-wrap gap-1 mt-1.5 mb-2 w-full">
          {filterTags.map((tag, idx) => (
            <span
              key={idx}
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[6.5px] font-black uppercase tracking-wider",
                tag.type === 'gray' && "bg-slate-100 text-slate-600 border border-slate-200/50",
                tag.type === 'peach' && "bg-[#FFF4E5] text-[#D97706] border border-[#FFE4C4]",
                tag.type === 'mint' && "bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]"
              )}
            >
              {tag.text}
            </span>
          ))}
        </div>

        {/* Compact Micro-Clones of the Parent L0 Charts */}
        <div className="w-full h-[50px] my-1 overflow-hidden flex flex-col justify-center">
          {pillar.id === 'SUMMARY' && (
            <div className="relative w-[46px] h-[46px] mx-auto shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="23" cy="23" r="16" fill="transparent" stroke="#F1F5F9" strokeWidth="2" />
                <circle cx="23" cy="23" r="11" fill="transparent" stroke="#F1F5F9" strokeWidth="2" />
                <circle cx="23" cy="23" r="6" fill="transparent" stroke="#F1F5F9" strokeWidth="2" />
                <circle cx="23" cy="23" r="16" fill="transparent" stroke={tabData.isWarning ? T.red : T.amber} strokeWidth="2" strokeDasharray={2 * Math.PI * 16} strokeDashoffset={2 * Math.PI * 16 * (1 - tabData.turnsPct / 100)} strokeLinecap="round" />
                <circle cx="23" cy="23" r="11" fill="transparent" stroke={T.green} strokeWidth="2" strokeDasharray={2 * Math.PI * 11} strokeDashoffset={2 * Math.PI * 11 * (1 - tabData.coverPct / 100)} strokeLinecap="round" />
                <circle cx="23" cy="23" r="6" fill="transparent" stroke={T.blue} strokeWidth="2" strokeDasharray={2 * Math.PI * 6} strokeDashoffset={2 * Math.PI * 6 * (1 - tabData.wipPct / 100)} strokeLinecap="round" />
              </svg>
            </div>
          )}
          {pillar.id === 'VOLATILITY' && (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 2, right: 2, left: -40, bottom: 2 }}>
                <XAxis dataKey="volatility" type="number" hide />
                <YAxis dataKey="leadTime" type="number" hide />
                <Scatter data={tabData.partLevelVolatilityScatter}>
                  {tabData.partLevelVolatilityScatter.map((entry, index) => (
                    <Cell key={index} fill={entry.health === 'high' ? T.red : entry.health === 'med' ? T.amber : T.green} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
          {pillar.id === 'ADHERENCE' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tabData.scheduleAdherenceData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <XAxis dataKey="name" hide />
                <YAxis hide domain={[50, 100]} />
                <Line type="monotone" dataKey="supplier" stroke="#3B82F6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="demand" stroke="#10B981" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {pillar.id === 'PENETRATION' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tabData.donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={14}
                  outerRadius={22}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {tabData.donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Lock footer toggle text */}
        <div className="flex items-center justify-between text-[7.5px] font-black text-slate-400 w-full uppercase mt-2 pt-1.5 border-t border-slate-100/60">
          {cardLock.isLocked ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                cardLock.unlock();
              }}
              className="text-amber-600 hover:text-amber-700 transition-colors font-black flex items-center gap-0.5 cursor-pointer"
            >
              *Isolated | Click to Sync
            </span>
          ) : (
            <span>Target Metric</span>
          )}
          <span>Details →</span>
        </div>
      </button>
    );
  };

  // ── WORKSPACE COMPONENTS (RIGHT COLUMN) ────────────────────────────────────
  const SummaryWorkspace = () => (
    <div className="flex flex-col gap-6 w-full pb-8">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-4 gap-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm" style={cardStyle}>
        {[
          { label: 'Penetration Index', value: `${activeData.penetrationIndex}%`, sub: 'Safe: 14 Days Cover',  mom: '▼ -2.1%', color: activeData.isWarning ? T.red : T.green,   icon: Warehouse    },
          { label: 'Raw Coverage',      value: `${activeData.rawCoverage} Days`, sub: `Target: ${activeData.targetCoverage}d`,  mom: '▲ +0.5d', color: T.amber,   icon: Forklift     },
          { label: 'Supplier Adherence', value: `${activeData.supplierAdherence}%`, sub: 'Target: 95.0%',        mom: '▲ +1.4%', color: activeData.isWarning ? T.red : T.amber,   icon: CalendarCheck},
          { label: 'Demand Adherence',   value: `${activeData.demandAdherence}%`, sub: 'Target: 98.0%',        mom: '▲ +0.8%', color: T.green,   icon: CalendarCheck},
        ].map(({ label, value, sub, mom, color, icon: Icon }) => (
          <div key={label} className="flex items-between justify-between border-r border-slate-100 last:border-0 pr-4">
            <div>
              <span className="text-[8.5px] font-black uppercase tracking-wider block" style={{ color }}>{label}</span>
              <p className="text-lg font-black text-slate-800 mt-0.5">{value}</p>
              <span className="text-[8px] font-bold uppercase text-slate-400">{sub} · {mom}</span>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg shrink-0">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Buffer Penetration 100% Stacked Column Chart */}
      <div style={{ ...cardStyle, padding: '24px' }} className="flex flex-col">
        <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '12px' }}>
          <h4 style={{ color: activeData.isWarning ? T.red : T.amber, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Buffer Penetration &amp; Flow Control Trend
          </h4>
          <p style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }} className="mt-0.5">
            100% Stacked Column Trend Chart (RAG ZONES) — {activeData.label}
          </p>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activeData.bufferPenetrationStackedData} margin={{ top: 15, right: 24, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.mutedColor, fontWeight: 800 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: T.mutedColor }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={T.tt} formatter={(value: number) => [`${value}%`]} />
              <Bar dataKey="critical" name="Critical Stockout" stackId="a" fill="#EF4444" />
              <Bar dataKey="warning" name="Warning/Reorder" stackId="a" fill="#F59E0B" />
              <Bar dataKey="optimal" name="Optimal/Safe" stackId="a" fill="#10B981" />
              <Bar dataKey="overstock" name="Overstock" stackId="a" fill="#3B82F6" radius={[3, 3, 0, 0]} />
              <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={6} wrapperStyle={centeredLegendStyle} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const VolatilityWorkspace = () => {
    // Generate supplier ledger data mapped from delays
    const supplierLedgerData = activeData.vendorDelayData.map((d: any, idx: number) => ({
      vendor: d.vendor,
      partId: ['2002254-00-E06', '2002254-00-E08', '2002254-00-E10', '2002254-00-E12'][idx % 4],
      delayDays: d.delayDays,
      station: idx % 2 === 0 ? 'LW-1' : 'OP50-01'
    }));

    return (
      <div className="flex flex-col gap-6 w-full pb-8">
        {/* Row 1: Replenishment Order Backlog Aging Chart */}
        <div style={{ ...cardStyle, padding: '24px' }} className="flex flex-col">
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px', marginBottom: '16px' }}>
            <h4 style={{ color: T.numColor, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Replenishment Order Backlog Aging
            </h4>
            <p style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }} className="mt-0.5">
              Outstanding supplier purchase orders categorized by delay age — BPR Backlog
            </p>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeData.replenishmentBacklogData} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="yellowBacklog" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFDA62" stopOpacity={1} />
                    <stop offset="100%" stopColor="#E5B210" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="orangeBacklog" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFAE6E" stopOpacity={1} />
                    <stop offset="100%" stopColor="#D97706" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="crimsonBacklog" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
                    <stop offset="100%" stopColor="#991B1B" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="supplier" tick={{ fontSize: 8, fill: '#64748B', fontWeight: 800 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} ticks={[0, 10, 20, 30, 40]} domain={[0, 40]} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={T.tt} />
                <Bar dataKey="minorDelay" name="0-3 Days Overdue" stackId="a" fill="url(#yellowBacklog)" maxBarSize={24} />
                <Bar dataKey="moderateDelay" name="4-7 Days Overdue" stackId="a" fill="url(#orangeBacklog)" maxBarSize={24} />
                <Bar dataKey="criticalDelay" name="8+ Days Overdue (Critical)" stackId="a" fill="url(#crimsonBacklog)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={6} wrapperStyle={centeredLegendStyle} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Supplier Delivery Ledger Table */}
        <div style={cardStyle} className="p-6 flex flex-col gap-4">
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
            <h4 style={{ color: T.numColor, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Supplier Delivery Ledger Table
            </h4>
            <p style={{ color: T.mutedColor, fontSize: '8px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }} className="mt-0.5">
              Detailed ledger of supplier delivery shipments, active status, and delays
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Part ID</th>
                  <th className="p-3">Shipment Date</th>
                  <th className="p-3">Delay Status</th>
                  <th className="p-3">Urgency</th>
                </tr>
              </thead>
              <tbody>
                {supplierLedgerData.map((item, idx) => {
                  const isLw1 = filters.process === 'LW1' || item.station === 'LW1';
                  return (
                    <tr key={idx} className={cn(
                      "border-b border-slate-100 last:border-0 hover:bg-slate-50/60",
                      isLw1 ? "bg-red-50/20" : ""
                    )}>
                      <td className="p-3 font-bold text-slate-700">{item.vendor}</td>
                      <td className="p-3 text-slate-600 font-mono">
                        {item.partId}
                        {isLw1 && (
                          <span className="ml-2 px-1 py-0.2 bg-red-100 text-red-700 text-[6.5px] rounded font-black">LW1</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500">2026-07-06</td>
                      <td className={cn(
                        "p-3 font-black",
                        isLw1 ? "text-red-600" : "text-amber-500"
                      )}>
                        {item.delayDays.toFixed(1)} days late
                      </td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide",
                          isLw1 ? "bg-red-100 text-red-700" : "bg-amber-50 text-amber-600"
                        )}>
                          {isLw1 ? 'Critical Delays' : 'Warning'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const AdherenceWorkspace = () => {
    const carriers = [
      { carrier: 'DHL Express YD', route: 'Chakan -> Munchen', delay: '1.2 days', status: 'In Transit', urgency: 'warning' },
      { carrier: 'FedEx Priority', route: 'Pimpri -> Detroit', delay: '0.4 days', status: 'On Schedule', urgency: 'normal' },
      { carrier: 'BlueDart Logistics', route: 'Chennai Hub -> Pune', delay: '2.5 days', status: 'Customs Hold', urgency: 'critical' },
      { carrier: 'TCI Freight', route: 'Delhi -> Chakan', delay: '1.8 days', status: 'In Transit', urgency: 'warning' }
    ];

    return (
      <div className="flex flex-col gap-6 w-full pb-8">
        {/* Row 1: Supplier vs. Demand Adherence Splines with markers */}
        <div style={{ ...cardStyle, padding: '24px' }} className="flex flex-col">
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px', marginBottom: '16px' }}>
            <h4 style={{ color: T.numColor, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Supplier vs Demand Schedule Adherence
            </h4>
            <p style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }} className="mt-0.5">
              Accuracy rate curves compared over timeline — {activeData.label}
            </p>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={activeAdherenceDataWithVolume} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#64748B', fontWeight: 800 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} domain={[50, 100]} />
                <Tooltip contentStyle={T.tt} />
                <Bar yAxisId="left" dataKey="ordersDispatched" name="Total Orders Dispatched" fill="#4988C4" radius={[3, 3, 0, 0]} maxBarSize={30} />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="supplier" 
                  name="Supplier Adherence"
                  stroke="#8FDDDF" 
                  strokeWidth={2.5} 
                  dot={{ r: 3.5, stroke: "#8FDDDF", strokeWidth: 1, fill: "#FFFFFF" }} 
                  activeDot={{ r: 5 }} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="demand" 
                  name="Demand Adherence"
                  stroke="#FFAE6E" 
                  strokeWidth={2.5} 
                  dot={{ r: 3.5, stroke: "#FFAE6E", strokeWidth: 1, fill: "#FFFFFF" }} 
                  activeDot={{ r: 5 }} 
                />
                <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={6} wrapperStyle={centeredLegendStyle} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Carrier Delay Log */}
        <div style={cardStyle} className="p-6 flex flex-col gap-4">
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
            <h4 style={{ color: T.numColor, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Carrier Delay Log
            </h4>
            <p style={{ color: T.mutedColor, fontSize: '8px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }} className="mt-0.5">
              Active carrier transit monitoring and delay log
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Carrier</th>
                  <th className="p-3">Route Segment</th>
                  <th className="p-3">Delay Duration</th>
                  <th className="p-3">Shipment Status</th>
                </tr>
              </thead>
              <tbody>
                {carriers.map((c, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-700">{c.carrier}</td>
                    <td className="p-3 text-slate-500 font-medium">{c.route}</td>
                    <td className={`p-3 font-black ${c.urgency === 'critical' ? 'text-red-500' : c.urgency === 'warning' ? 'text-amber-500' : 'text-emerald-500'}`}>{c.delay}</td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide",
                        c.urgency === 'critical' && "bg-red-50 text-red-600 border border-red-100",
                        c.urgency === 'warning' && "bg-amber-50 text-amber-600 border border-amber-100",
                        c.urgency === 'normal' && "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      )}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const PenetrationWorkspace = () => {
    const isShort = isMtdWtd(q4Lock.effectiveFilters);

    return (
      <div className="flex flex-col gap-6 w-full pb-8">
        {/* Row 1: Dynamically Swapped Chart */}
        <div style={{ ...cardStyle, padding: '24px' }} className="flex flex-col">
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px', marginBottom: '16px' }}>
            <h4 style={{ color: T.numColor, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {isShort ? "Buffer Penetration & Shortage Risk Donut" : "Buffer Penetration 100% Stacked Column Trend"}
            </h4>
            <p style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }} className="mt-0.5">
              {isShort 
                ? "Interactive segmented donut showing real-time buffer zone distribution — Click a slice to filter the ledger"
                : `Monthly 100% Stacked Column Chart (RAG ZONES) — ${activeData.label}`}
            </p>
          </div>
          
          {isShort ? (
            <div className="relative flex items-center justify-center" style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeData.donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(data) => {
                      if (data && data.payload) {
                        setSelectedBufferZone((prev) => 
                          prev === data.payload.zone ? null : data.payload.zone
                        );
                      }
                    }}
                  >
                    {activeData.donutData.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        cursor="pointer" 
                        stroke={selectedBufferZone === entry.zone ? '#0F172A' : 'none'}
                        strokeWidth={selectedBufferZone === entry.zone ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={T.tt} formatter={(value) => [`${value}%`]} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={6} wrapperStyle={centeredLegendStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center pointer-events-none" style={{ top: 'calc(50% - 24px)' }}>
                <span className="text-xl font-black text-slate-800">{activeData.penetrationIndex.toFixed(1)}%</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Compliant</span>
              </div>
            </div>
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeData.bufferPenetrationStackedData} margin={{ top: 15, right: 24, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.mutedColor, fontWeight: 800 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8, fill: T.mutedColor }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={T.tt} formatter={(value: number) => [`${value}%`]} />
                  <Bar dataKey="critical" name="Critical Stockout" stackId="a" fill="#EF4444" />
                  <Bar dataKey="warning" name="Warning/Reorder" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="optimal" name="Optimal/Safe" stackId="a" fill="#10B981" />
                  <Bar dataKey="overstock" name="Overstock" stackId="a" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={6} wrapperStyle={centeredLegendStyle} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Row 2: Inventory & Replenishment Table (only visible for MTD/WTD views) */}
        {isShort && (
          <div style={cardStyle} className="p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h4 style={{ color: T.numColor, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Active Inventory &amp; Replenishment Ledger
                </h4>
                <p style={{ color: T.mutedColor, fontSize: '8px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }} className="mt-0.5">
                  Current inventory levels, coverage status, and stock buffer zones
                </p>
              </div>
              {selectedBufferZone && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                  <span>Filter: {selectedBufferZone}</span>
                  <button 
                    onClick={() => setSelectedBufferZone(null)}
                    className="hover:text-amber-950 transition-colors font-extrabold focus:outline-none"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Part ID</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Current Stock</th>
                    <th className="p-3">Cover Days</th>
                    <th className="p-3">Buffer Zone</th>
                    <th className="p-3">Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReplenishmentLedger.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400 font-bold uppercase text-[10px]">
                        No parts in this buffer zone
                      </td>
                    </tr>
                  ) : (
                    filteredReplenishmentLedger.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                        <td className="p-3 text-slate-700 font-mono font-bold">{item.part}</td>
                        <td className="p-3 text-slate-600 font-medium">{item.desc}</td>
                        <td className="p-3 text-slate-800 font-black">{item.stock}</td>
                        <td className="p-3 text-slate-600 font-medium">{item.cover}</td>
                        <td className="p-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide",
                            item.zone === 'critical' && "bg-red-50 text-red-600 border border-red-100",
                            item.zone === 'warning' && "bg-amber-50 text-amber-600 border border-amber-100",
                            item.zone === 'optimal' && "bg-emerald-50 text-emerald-600 border border-emerald-100",
                            item.zone === 'overstock' && "bg-blue-50 text-blue-600 border border-blue-100"
                          )}>
                            {item.zone}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 font-medium">{item.action}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── RENDER BPR DASHBOARD LANDING PAGE (DEFAULT VIEW) ───────────────────────
  if (activePillar === null) {
    const isLW1Select = filters.process === 'LW1';

    return (
      <div className="w-full h-[calc(100vh-130px)] bg-[#F8F9FA] overflow-y-auto select-none p-6">
        <div className="w-full max-w-[1200px] mx-auto space-y-6">
          {/* Page Header */}
          <div className="border-b border-slate-200 pb-3 flex justify-between items-end">
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight uppercase">
                BPR — Buffer Penetration &amp; Flow Control
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                Executive Supply Chain DDMRP Control Center
                {q1Data.label !== 'All SKUs' && (
                  <span style={{ color: T.amber, marginLeft: '6px', fontWeight: 800 }}>
                    · {q1Data.label}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* 2x2 Balanced Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Quadrant 1: BPR Summary Index Card with Premium Golden-Yellow Glow */}
            <div
              onClick={() => { if (q1Lock.isLocked) onChange(q1Lock.effectiveFilters); setActivePillar('SUMMARY'); }}
              className="bg-white rounded-2xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              style={{
                boxShadow: q1Data.isWarning
                  ? '0 20px 40px -10px rgba(245, 158, 11, 0.35), 0 4px 20px rgba(245, 158, 11, 0.2), 0 0 0 1.5px rgba(239, 68, 68, 0.45)'
                  : '0 20px 40px -10px rgba(245, 158, 11, 0.35), 0 4px 20px rgba(245, 158, 11, 0.2), 0 0 0 1.5px rgba(245, 158, 11, 0.45)',
                border: q1Data.isWarning
                  ? '1px solid rgba(239, 68, 68, 0.45)'
                  : '1px solid rgba(245, 158, 11, 0.45)',
                ...lockedCardStyle(q1Lock.isLocked),
              }}
            >
              <CardLockHeader
                title="BPR Summary"
                eyebrow="Executive DDMRP Overview"
                metric={<span className="text-xs font-black text-slate-700">{q1Data.penetrationIndex.toFixed(1)}% Index</span>}
                isLocked={q1Lock.isLocked}
                effectiveFilters={q1Lock.effectiveFilters}
                globalFilters={filters}
                onToggleLock={q1Lock.toggle}
                onSync={q1Lock.unlock}
              />

              {/* Rings & Info Side-by-Side */}
              <div className="flex items-center justify-around py-4">
                {/* Concentric rings */}
                <div className="relative w-[110px] h-[110px] shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="55" cy="55" r={R_bpr_1} fill="transparent" stroke="#F1F5F9" strokeWidth="5" />
                    <circle cx="55" cy="55" r={R_bpr_2} fill="transparent" stroke="#F1F5F9" strokeWidth="5" />
                    <circle cx="55" cy="55" r={R_bpr_3} fill="transparent" stroke="#F1F5F9" strokeWidth="5" />
                    <circle cx="55" cy="55" r={R_bpr_1} fill="transparent" stroke={q1Data.isWarning ? T.red : T.amber} strokeWidth="5" strokeDasharray={C_bpr_1} strokeDashoffset={q1Data.dashoffsetAvail} strokeLinecap="round" />
                    <circle cx="55" cy="55" r={R_bpr_2} fill="transparent" stroke={T.green} strokeWidth="5" strokeDasharray={C_bpr_2} strokeDashoffset={q1Data.dashoffsetPerf} strokeLinecap="round" />
                    <circle cx="55" cy="55" r={R_bpr_3} fill="transparent" stroke={T.blue} strokeWidth="5" strokeDasharray={C_bpr_3} strokeDashoffset={q1Data.dashoffsetQual} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-black text-slate-800" style={{ color: q1Data.isWarning ? T.red : 'inherit' }}>{q1Data.penetrationIndex.toFixed(1)}%</span>
                    <span className="text-[6px] text-slate-400 font-bold uppercase tracking-wider">Index</span>
                  </div>
                </div>

                {/* Vertical detail ledger */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: q1Data.isWarning ? T.red : T.amber }} />
                    <div>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase leading-none">Avg Buffer Penetration</p>
                      <p className="text-xs font-black text-slate-700 mt-0.5">{q1Data.penetrationIndex.toFixed(1)}% <span className="text-[8px] text-slate-400 font-normal">/ 95% target</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: T.green }} />
                    <div>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase leading-none">Supplier Adherence</p>
                      <p className="text-xs font-black text-slate-700 mt-0.5">{q1Data.supplierAdherence.toFixed(1)}% <span className="text-[8px] text-slate-400 font-normal">/ 95% target</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: T.blue }} />
                    <div>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase leading-none">Demand Adherence</p>
                      <p className="text-xs font-black text-slate-700 mt-0.5">{q1Data.demandAdherence.toFixed(1)}% <span className="text-[8px] text-slate-400 font-normal">/ 98% target</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bars with warning pulse for shortfall */}
              <div className="w-full space-y-3 mt-2">
                <style>{`
                  @keyframes warning-pulse {
                    0%, 100% { opacity: 0.15; }
                    50% { opacity: 0.45; }
                  }
                  .animate-warning-pulse {
                    animation: warning-pulse 1.8s infinite ease-in-out;
                  }
                `}</style>
                {[
                  { label: 'Penetration Index', val: q1Data.penetrationIndex, max: 100, color: q1Data.isWarning ? T.red : T.amber, target: 95 },
                  { label: 'Supplier Adherence', val: q1Data.supplierAdherence, max: 100, color: T.green, target: 95 },
                  { label: 'Demand Adherence', val: q1Data.demandAdherence, max: 100, color: T.blue, target: 98 }
                ].map(({ label, val, max, color, target }) => {
                  const pct = Math.min((val / max) * 100, 100);
                  const targetPct = (target / max) * 100;
                  const isShortfall = val < target;
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                        <span>{label}</span>
                        <span className="font-extrabold" style={{ color }}>{val.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                        {isShortfall && (
                          <div
                            className="absolute top-0 bottom-0 bg-red-400 animate-warning-pulse"
                            style={{ left: `${pct}%`, width: `${targetPct - pct}%` }}
                          />
                        )}
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                        <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10" style={{ left: `${targetPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase mt-4 pt-2 border-t border-slate-100">
                <span>RCA Diagnostics</span>
                <span className="text-amber-600">Open Workspace ↗</span>
              </div>
            </div>

            {/* Quadrant 2: SKU Lead-Time vs. Volatility Scatter or Grouped Columns */}
            <div
              onClick={() => { if (q2Lock.isLocked) onChange(q2Lock.effectiveFilters); setActivePillar('VOLATILITY'); }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-amber-400 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              style={{ ...cardStyle, ...lockedCardStyle(q2Lock.isLocked) }}
            >
              <CardLockHeader
                title={isMtdWtd(q2Lock.effectiveFilters) ? "Promised vs Actual Lead-Time" : "Demand Volatility vs Lead-Time"}
                eyebrow={isMtdWtd(q2Lock.effectiveFilters) ? "Supplier Performance Matrix" : "SKU Portfolio Scatter Matrix"}
                metric={<span className="text-xs font-black text-slate-700">{isMtdWtd(q2Lock.effectiveFilters) ? "Supplier Performance" : "18% Avg Cv"}</span>}
                isLocked={q2Lock.isLocked}
                effectiveFilters={q2Lock.effectiveFilters}
                globalFilters={filters}
                onToggleLock={q2Lock.toggle}
                onSync={q2Lock.unlock}
              />
              <div className="h-[180px] w-full mt-4">
                {isMtdWtd(q2Lock.effectiveFilters) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={q2PromisedActualData} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="supplier" tick={{ fontSize: 8, fill: '#64748B', fontWeight: 800 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 8, fill: '#64748B' }} unit="d" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={T.tt} />
                      <Bar dataKey="promised" name="Promised LT" fill="#4988C4" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="actual" name="Actual LT" fill="#FFAE6E" radius={[3, 3, 0, 0]} />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={6} wrapperStyle={centeredLegendStyle} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="volatility" name="Volatility (Cv)" unit="%" tick={{ fontSize: 8, fill: '#64748B', fontWeight: 800 }} type="number" axisLine={false} tickLine={false} />
                      <YAxis dataKey="leadTime" name="Lead Time" unit="d" tick={{ fontSize: 8, fill: '#64748B' }} type="number" axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={T.tt} />
                      <ReferenceArea x1={20} y1={10} fill="#F59E0B" fillOpacity={0.1} stroke="#F59E0B" strokeDasharray="3 3" />
                      <ReferenceLine x={20} stroke="#94A3B8" strokeDasharray="3 3" />
                      <ReferenceLine y={10} stroke="#94A3B8" strokeDasharray="3 3" />
                      <Scatter name="SKUs" data={q2Data.partLevelVolatilityScatter}>
                        {q2Data.partLevelVolatilityScatter.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.health === 'high' ? T.red : entry.health === 'med' ? T.amber : T.green} />
                        ))}
                      </Scatter>
                      <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={6} wrapperStyle={centeredLegendStyle} />
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase mt-4 pt-2 border-t border-slate-100">
                <span>RCA Diagnostics</span>
                <span className="text-amber-600">Open Workspace ↗</span>
              </div>
            </div>

            {/* Quadrant 3: Schedule Adherence (Double Spline curve) */}
            <div
              onClick={() => { if (q3Lock.isLocked) onChange(q3Lock.effectiveFilters); setActivePillar('ADHERENCE'); }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-amber-400 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              style={{ ...cardStyle, ...lockedCardStyle(q3Lock.isLocked) }}
            >
              <CardLockHeader
                title="Schedule Adherence"
                eyebrow="Supplier vs Demand Accuracy"
                metric={<span className="text-xs font-black text-slate-700">{q3Data.supplierAdherence.toFixed(1)}% Adh</span>}
                isLocked={q3Lock.isLocked}
                effectiveFilters={q3Lock.effectiveFilters}
                globalFilters={filters}
                onToggleLock={q3Lock.toggle}
                onSync={q3Lock.unlock}
              />
              <div className="h-[180px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={q3AdherenceDataWithVolume} margin={{ top: 10, right: -5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#64748B', fontWeight: 800 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} domain={[50, 100]} />
                    <Tooltip contentStyle={T.tt} />
                    <Bar yAxisId="left" dataKey="ordersDispatched" name="Total Orders" fill="#4988C4" radius={[3, 3, 0, 0]} maxBarSize={20} />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="supplier" 
                      name="Supplier Adherence"
                      stroke="#8FDDDF" 
                      strokeWidth={2} 
                      dot={false}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="demand"   
                      name="Demand Adherence"
                      stroke="#FFAE6E" 
                      strokeWidth={2} 
                      dot={false}
                    />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={6} wrapperStyle={centeredLegendStyle} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase mt-4 pt-2 border-t border-slate-100">
                <span>RCA Diagnostics</span>
                <span className="text-amber-600">Open Workspace ↗</span>
              </div>
            </div>

            {/* Quadrant 4: Penetration & Shortage Donut Risk or Stacked Column Chart */}
            <div
              onClick={() => { if (q4Lock.isLocked) onChange(q4Lock.effectiveFilters); setActivePillar('PENETRATION'); }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-amber-400 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              style={{ ...cardStyle, ...lockedCardStyle(q4Lock.isLocked) }}
            >
              <CardLockHeader
                title={isMtdWtd(q4Lock.effectiveFilters) ? "Penetration & Shortage Risk" : "Buffer Penetration Health"}
                eyebrow={isMtdWtd(q4Lock.effectiveFilters) ? "Interactive Segmented Donut" : "Monthly 100% Stacked Health"}
                metric={<span className="text-xs font-black text-slate-700">{isMtdWtd(q4Lock.effectiveFilters) ? `${q4Data.shortageDistribution.find(s => s.name.includes('Critical'))?.count || 0} Crit Parts` : "YTD Trend"}</span>}
                isLocked={q4Lock.isLocked}
                effectiveFilters={q4Lock.effectiveFilters}
                globalFilters={filters}
                onToggleLock={q4Lock.toggle}
                onSync={q4Lock.unlock}
              />
              <div className="mt-4 flex-grow flex flex-col justify-center">
                {isMtdWtd(q4Lock.effectiveFilters) ? (
                  <div className="relative flex-grow flex items-center justify-center" style={{ minHeight: '180px' }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={q4Data.donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                          onClick={(data) => {
                            if (data && data.payload) {
                              setSelectedBufferZone(data.payload.zone);
                              setActivePillar('PENETRATION');
                            }
                          }}
                        >
                          {q4Data.donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} cursor="pointer" />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={T.tt} formatter={(value) => [`${value}%`]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-base font-black text-slate-800">{q4Data.penetrationIndex.toFixed(1)}%</span>
                      <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">Compliant</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={q4Data.bufferPenetrationStackedData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.mutedColor, fontWeight: 800 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 8, fill: T.mutedColor }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={T.tt} formatter={(value: number) => [`${value}%`]} />
                        <Bar dataKey="critical" name="Critical Stockout" stackId="a" fill="#EF4444" />
                        <Bar dataKey="warning" name="Warning/Reorder" stackId="a" fill="#F59E0B" />
                        <Bar dataKey="optimal" name="Optimal/Safe" stackId="a" fill="#10B981" />
                        <Bar dataKey="overstock" name="Overstock" stackId="a" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                        <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={6} wrapperStyle={centeredLegendStyle} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase mt-4 pt-2 border-t border-slate-100">
                <span>RCA Diagnostics</span>
                <span className="text-amber-600">Open Workspace ↗</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER DRILLDOWN WORKSPACE VIEW (SPLIT SCREEN 25% / 75%) ───────────────────
  return (
    <div className="w-full h-[calc(100vh-130px)] bg-[#F8F9FA] overflow-hidden select-none flex flex-col">

      {/* Breadcrumb Header */}
      <div className={`
        shrink-0 overflow-hidden transition-all duration-300 ease-in-out
        ${activePillar !== null ? 'max-h-[60px] opacity-100' : 'max-h-0 opacity-0'}
      `}>
        <div className="flex justify-between items-center bg-white border-b border-slate-200 px-6 py-2.5">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <button onClick={() => setActivePillar(null)} className="hover:text-slate-700 uppercase transition-colors">
              BPR Overview
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-amber-600 font-extrabold uppercase animate-pulse">
              {drillLabel}
            </span>
          </div>
          <button
            onClick={() => setActivePillar(null)}
            className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </div>
      </div>

      {/* Content wrapper */}
      <div className="flex-grow min-h-0 relative">
        <div className={`
          absolute inset-0 p-6 flex gap-5 transition-all duration-300 ease-in-out
          ${activePillar !== null
            ? 'opacity-100 pointer-events-auto translate-y-0'
            : 'opacity-0 pointer-events-none translate-y-2'}
        `}>
          {/* LEFT COLUMN: Pillar Tab Selector (25% width) */}
          <div className="w-[25%] shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 px-1 mb-1">Pillar Selector</p>
            {PILLARS.map((p) => (
              <PillarTab key={p.id} pillar={p} isActive={activePillar === p.id} />
            ))}
          </div>

          {/* RIGHT COLUMN: Diagnostic Workspaces (75% width) */}
          <div className="w-[75%] overflow-y-auto px-1 pl-2 pr-4">
            {activePillar === 'SUMMARY'     && <SummaryWorkspace />}
            {activePillar === 'VOLATILITY'  && <VolatilityWorkspace />}
            {activePillar === 'ADHERENCE'   && <AdherenceWorkspace />}
            {activePillar === 'PENETRATION' && <PenetrationWorkspace />}
          </div>
        </div>
      </div>
    </div>
  );
}
