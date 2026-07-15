import { useState, useMemo } from 'react';
import {
  BarChart,
  ComposedChart,
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
} from 'recharts';
import { getDashboardData } from '../data/dashboardDataStore';
import { type FilterState } from './TimeTrendFilter';
import {
  ArrowLeft,
  ArrowRight,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  ClipboardCheck,
  Pin,
  PinOff,
} from 'lucide-react';
import { CardLockHeader, lockedCardStyle } from './CardLockHeader';
import { usePageCardLocks } from './useCardFilterLock';

interface CopqPageProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

type CopqView = 'SUMMARY_CARD' | 'SPLIT_SCREEN';
type PillarId = 'SUMMARY' | 'INTERNAL' | 'EXTERNAL' | 'PREVENTION';

const T = {
  pageBg:     '#F8FAFC',
  cardBg:     '#FFFFFF',
  cardBorder: '1px solid rgba(226,232,240,0.9)',
  cardShadow: '0 10px 30px -6px rgba(15,23,42,0.05), 0 4px 10px -4px rgba(15,23,42,0.04)',
  numColor:   '#0F172A',
  labelColor: '#475569',
  mutedColor: '#94A3B8',
  rose:       '#E11D48',
  amber:      '#D97706',
  emerald:    '#059669',
  velvetPurple: '#5D1C6A',
  tt: {
    background: '#0F172A',
    border: '1px solid rgba(225,29,72,0.25)',
    borderRadius: '10px',
    boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
    fontSize: '10px',
    fontWeight: 600,
    color: '#E0F2FE',
    padding: '8px 12px',
  },
};

function IconPill({ icon: Icon, color, bg }: { icon: React.ElementType; color: string; bg: string }) {
  return (
    <div className="p-2 rounded-xl shrink-0" style={{ background: bg }}>
      <Icon className="w-4 h-4" style={{ color, strokeWidth: 1.6 }} />
    </div>
  );
}

function ConcentricRadialRing({ fpyValue, ytdLoss, size = 150 }: { fpyValue: number; ytdLoss: number; size?: number }) {
  const scaleFactor = size / 150;
  const r1 = 40; const c1 = 2 * Math.PI * r1; const offset1 = c1 * (1 - fpyValue / 100);
  const r2 = 30; const c2 = 2 * Math.PI * r2; const offset2 = c2 * (1 - 0.985);
  const r3 = 20; const c3 = 2 * Math.PI * r3; const offset3 = c3 * (1 - 0.90);
  
  const formatLossInline = (v: number) => {
    if (v === 0) return '₹0';
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`;
    return `₹${(v / 100000).toFixed(1)} L`;
  };

  const lossLabel = formatLossInline(ytdLoss);
  return (
    <div className="relative flex items-center justify-center shrink-0 select-none" style={{ width: `${size}px`, height: `${size}px` }}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r1} fill="transparent" stroke="#F1F5F9" strokeWidth="5.5" />
        <circle cx="50" cy="50" r={r2} fill="transparent" stroke="#F1F5F9" strokeWidth="5.5" />
        <circle cx="50" cy="50" r={r3} fill="transparent" stroke="#F1F5F9" strokeWidth="5.5" />
        <circle cx="50" cy="50" r={r1} fill="transparent" stroke="#EF4444" strokeWidth="5.5" strokeDasharray={c1} strokeDashoffset={offset1} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        <circle cx="50" cy="50" r={r2} fill="transparent" stroke="#10B981" strokeWidth="5.5" strokeDasharray={c2} strokeDashoffset={offset2} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        <circle cx="50" cy="50" r={r3} fill="transparent" stroke="#F59E0B" strokeWidth="5.5" strokeDasharray={c3} strokeDashoffset={offset3} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span style={{ color: '#0F172A', fontSize: `${16 * scaleFactor}px`, fontWeight: 800 }}>{lossLabel}</span>
        {size > 80 && (
          <span style={{ color: '#94A3B8', fontSize: `${7.5 * scaleFactor}px`, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>COPQ LOSS</span>
        )}
      </div>
    </div>
  );
}

function ShieldCheck({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// ── DATA AND LABEL RESOLVERS FOR SPECIFIC FILTER STATES ──────────────────────
function getCopqProfile(filters: FilterState) {
  return getDashboardData('COPQ', filters.subPeriod || filters.trend, filters.product, filters.process, filters.shift);
}

function getTimeLabels(filters: FilterState) {
  const trend = filters.trend;
  const sub   = filters.subPeriod;
  if (trend === 'year' && sub === 'yoy') return Array.from({ length: 16 }, (_, i) => String(2011 + i));
  if (trend === 'quarter') return ['Apr', 'May', 'Jun', 'Jul'];
  if (trend === 'month')   return Array.from({ length: 31 }, (_, i) => String(i + 1));
  if (trend === 'week')    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
}

function getInternalFailureData(filters: FilterState, copqProfile: any) {
  const data = copqProfile.internalFailureData || [];
  return data.map((d: any) => ({
    name: d.name,
    totalLoss: d.totalLoss,
    copqLoss: d.totalLoss
  }));
}

function getDefectTaxonomyPareto(filters: FilterState) {
  const profile = getCopqProfile(filters);
  return (profile.defectTaxonomyPareto || []).map((d: any) => ({
    type: d.category,
    count: d.count,
    carryingCost: d.cost
  }));
}

function getDefectTaxonomyGrid(filters: FilterState) {
  const profile = getCopqProfile(filters);
  return (profile.defectTaxonomyGrid || []).map((d: any) => ({
    machine: d.name,
    station: d.id,
    type: d.category,
    count: d.occurred
  }));
}

function getExternalFailureBulletData(filters: FilterState, copqProfile: any) {
  const data = copqProfile.externalFailureBulletData || [];
  return data.map((d: any) => ({
    name: d.name,
    actual: d.actual,
    target: d.target,
    lagDays: 30
  }));
}

function getPreventionAppraisalData(filters: FilterState) {
  const profile = getCopqProfile(filters);
  const data = profile.preventionAppraisalData || [];
  return data.map((d: any, idx: number) => ({
    name: d.name,
    planned: 20,
    completed: d.prevention || Math.round(18 + Math.sin(idx * 1.5) * 2),
    cpk: +(1.25 + Math.cos(idx) * 0.12).toFixed(2),
  }));
}

function getSupplierQualityMatrix(filters: FilterState) {
  const profile = getCopqProfile(filters);
  return (profile.supplierQualityMatrix || []).map((d: any) => ({
    vendor: d.supplier,
    material: d.supplier.includes('Steel') ? 'Steel Rods' : 'Valves',
    rejectionRate: d.partsDefective / 100,
    ppm: d.ppm
  }));
}

function getSummaryTrendData(filters: FilterState) {
  const profile = getCopqProfile(filters);
  const data = profile.summaryTrendData || [];
  return data.map((d: any) => ({
    name: d.name,
    'Internal Failure': d.internal,
    'External Failure': d.external,
    'Prevention & Appraisal': d.prevention
  }));
}

export function CopqPage({ filters, onChange }: CopqPageProps) {
  const [currentView, setCurrentView] = useState<CopqView>('SUMMARY_CARD');
  const [activePillar, setActivePillar] = useState<PillarId>('SUMMARY');
  
  // Per-card local filter locks: [Q1, Q2, Q3, Q4]
  const [q1Lock, q2Lock, q3Lock, q4Lock] = usePageCardLocks(filters, 4);

  const renderGradientDefs = () => (
    <defs>
      <linearGradient id="crimsonGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#EF4444" stopOpacity={1} /><stop offset="100%" stopColor="#991B1B" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} /><stop offset="100%" stopColor="#D97706" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity={1} /><stop offset="100%" stopColor="#064E3B" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="amethystGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
        <stop offset="100%" stopColor="#6D28D9" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="gCrimsonBar" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#EF4444" /><stop offset="100%" stopColor="#991B1B" />
      </linearGradient>
      <linearGradient id="velvetGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
        <stop offset="100%" stopColor="#5D1C6A" stopOpacity={0.9} />
      </linearGradient>
    </defs>
  );

  const formatLoss = (v: number) => {
    if (v === 0) return '₹0';
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
    return `₹${(v / 100000).toFixed(1)} L`;
  };

  const card = { background: T.cardBg, border: T.cardBorder, boxShadow: T.cardShadow, borderRadius: '16px' };

  const commonLegendProps = {
    verticalAlign: 'bottom' as const,
    align: 'center' as const,
    iconType: 'circle' as const,
    iconSize: 6,
    wrapperStyle: { paddingTop: '20px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#475569' }
  };

  const renderShiftBars = (cardFilters: FilterState) => {
    return <Bar dataKey="totalLoss" name="COPQ Loss" fill="#7C3AED" radius={[3, 3, 0, 0]} maxBarSize={16} />;
  };

  // ── CONSTANTS FOR TABLES ──────────────────────────────────────────────────
  const warrantyClaimsTable = [
    { id: 'REC-091', batch: 'BAT-2891 (Valves)',  cost: 320000, action: 'Recall & Replace' },
    { id: 'REC-052', batch: 'BAT-1102 (Seals)',   cost: 210000, action: 'Containment sort' },
    { id: 'REC-070', batch: 'BAT-3490 (Casting)', cost: 90000, action: 'Component quarantine' },
  ];

  // Resolve profiles for active locks
  const q1Profile = getCopqProfile(q1Lock.effectiveFilters);
  const q2Profile = getCopqProfile(q2Lock.effectiveFilters);
  const q3Profile = getCopqProfile(q3Lock.effectiveFilters);
  const q4Profile = getCopqProfile(q4Lock.effectiveFilters);

  const q2Data = getInternalFailureData(q2Lock.effectiveFilters, q2Profile);
  const q3Data = getExternalFailureBulletData(q3Lock.effectiveFilters, q3Profile);
  const q4Data = getPreventionAppraisalData(q4Lock.effectiveFilters);

  return (
    <div className="w-full h-[calc(100vh-130px)] overflow-y-auto select-none p-8 flex flex-col gap-5"
      style={{ background: T.pageBg, fontFamily: '"Plus Jakarta Sans","Inter",sans-serif' }}>

      {currentView === 'SUMMARY_CARD' ? (
        <div className="shrink-0 flex items-center justify-between">
          <div>
            <h2 style={{ color: T.numColor, fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>COPQ — Cost of Poor Quality &amp; Risk Portal</h2>
            <p className="mt-1" style={{ color: T.mutedColor, fontSize: '11px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Financial loss capture &amp; quality compliance matrix
              {getCopqProfile(filters).label !== 'All Products' && (
                <span style={{ color: T.rose, marginLeft: '6px', fontWeight: 700 }}>· {getCopqProfile(filters).label}</span>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center shrink-0 px-1 py-3" style={{ borderBottom: '1px solid rgba(226,232,240,0.7)' }}>
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase" style={{ color: T.mutedColor }}>
            <span className="cursor-pointer hover:text-slate-700 transition-colors" onClick={() => setCurrentView('SUMMARY_CARD')}>COPQ Overview</span>
            <span>›</span><span className="text-slate-400">Pillars</span><span>›</span>
            <span style={{ color: T.velvetPurple }} className="font-bold">
              {activePillar === 'SUMMARY' ? 'COPQ Summary Index' : activePillar === 'INTERNAL' ? 'Internal Failure Index' : activePillar === 'EXTERNAL' ? 'External Failure Index' : 'Prevention & Appraisal'}
            </span>
          </div>
          <button onClick={() => setCurrentView('SUMMARY_CARD')} className="flex items-center gap-1.5 transition-all duration-200 hover:-translate-x-0.5" style={{ color: T.labelColor, fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em' }}>
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />Back to COPQ Summary
          </button>
        </div>
      )}

      {currentView === 'SUMMARY_CARD' && (
        <div className="flex-grow grid grid-cols-2 gap-6 w-full max-w-7xl mx-auto py-1">

          {/* Q1: COPQ Summary Index with Premium Velvet Glow */}
          <div onClick={() => { if (q1Lock.isLocked) onChange(q1Lock.effectiveFilters); setCurrentView('SPLIT_SCREEN'); setActivePillar('SUMMARY'); }}
            className="hover:scale-[1.005] transition-all duration-300 flex flex-col justify-between"
            style={{
              ...card,
              padding: '24px',
              boxShadow: '0 20px 50px -12px rgba(93, 28, 106, 0.25), 0 4px 20px -2px rgba(93, 28, 106, 0.12), 0 0 15px 1px rgba(93, 28, 106, 0.08)',
              border: '1px solid rgba(93, 28, 106, 0.45)',
              cursor: 'pointer',
              ...lockedCardStyle(q1Lock.isLocked)
            }}>
            <CardLockHeader
              eyebrow="Overall COPQ Loss summary"
              title="COPQ Index & Losses"
              isLocked={q1Lock.isLocked}
              effectiveFilters={q1Lock.effectiveFilters}
              globalFilters={filters}
              onToggleLock={q1Lock.toggle}
              onSync={q1Lock.unlock}
            />
            <div className="flex items-center gap-6 my-auto">
              <ConcentricRadialRing fpyValue={q1Profile.fpy} ytdLoss={q1Profile.ytdLoss} size={150} />
              <div className="flex-grow flex flex-col gap-2.5">
                {[
                  { label: 'COPQ YTD Loss',    value: formatLoss(q1Profile.ytdLoss), target: `${formatLoss(q1Profile.monthlyWarningLimit * 12)} Max`, color: '#EF4444', pct: Math.min(100, (q1Profile.ytdLoss / (q1Profile.monthlyWarningLimit * 12)) * 100) },
                  { label: 'First Pass Yield', value: `${q1Profile.fpy}%`, target: '97.0%', color: '#10B981', pct: q1Profile.fpy },
                  { label: 'Audit Pass Rate',  value: '98.5%', target: '98.0%', color: '#10B981', pct: 98.5 },
                  { label: 'Supplier Defect',  value: `${q1Profile.supplierPpm.toLocaleString()} PPM`, target: '200 PPM', color: '#E11D48', pct: Math.min(100, (q1Profile.supplierPpm / 3000) * 100) },
                ].map((m) => (
                  <div key={m.label} className="flex flex-col">
                    <div className="flex justify-between items-baseline text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />{m.label}</span>
                      <span>{m.value} <span className="text-slate-400 font-medium">/ {m.target}</span></span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-1 text-[8.5px] font-bold text-slate-400 uppercase tracking-wide">
              <span>Primary Cost Indicators</span>
              <span className="text-purple-700 flex items-center gap-1">Analyze Diagnostics <ArrowRight className="w-3 h-3" /></span>
            </div>
          </div>

          {/* Q2: Internal Failure Index (Grouped-Stacked Shift Bars) */}
          <div onClick={() => { if (q2Lock.isLocked) onChange(q2Lock.effectiveFilters); setCurrentView('SPLIT_SCREEN'); setActivePillar('INTERNAL'); }}
            className="hover:scale-[1.005] hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
            style={{ ...card, padding: '24px', cursor: 'pointer', ...lockedCardStyle(q2Lock.isLocked) }}>
            <CardLockHeader
              eyebrow="Pillar 1"
              title="Internal Failure Index"
              metric={
                <div className="text-right">
                  <span style={{ color: T.rose, fontSize: '18px', fontWeight: 700 }}>{q2Profile.fpy}% FPY</span>
                  <span className="block text-[8px] text-slate-400 font-semibold uppercase">Shift Waste Split</span>
                </div>
              }
              isLocked={q2Lock.isLocked}
              effectiveFilters={q2Lock.effectiveFilters}
              globalFilters={filters}
              onToggleLock={q2Lock.toggle}
              onSync={q2Lock.unlock}
            />
            <div className="flex-grow" style={{ minHeight: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={q2Data} margin={{ top: 5, right: 0, left: -38, bottom: 5 }}>
                  {renderGradientDefs()}
                  <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 7, fill: T.mutedColor, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 7, fill: T.mutedColor }} axisLine={false} tickLine={false} tickFormatter={(value) => value === 0 ? '₹0' : `₹${Math.round(value / 100000)} L`} />
                  <Tooltip contentStyle={T.tt} formatter={(v: number) => [formatLoss(v), '']} />
                  {renderShiftBars(q2Lock.effectiveFilters)}
                  <Legend {...commonLegendProps} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Q3: External Failure Index */}
          <div onClick={() => { if (q3Lock.isLocked) onChange(q3Lock.effectiveFilters); setCurrentView('SPLIT_SCREEN'); setActivePillar('EXTERNAL'); }}
            className="hover:scale-[1.005] hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
            style={{ ...card, padding: '24px', cursor: 'pointer', ...lockedCardStyle(q3Lock.isLocked) }}>
            <CardLockHeader
              eyebrow="Pillar 2"
              title="External Failure Index"
              metric={
                <div className="text-right">
                  <span style={{ color: T.amber, fontSize: '18px', fontWeight: 700 }}>{formatLoss(q3Profile.monthlyWarningLimit)} limit</span>
                  <span className="block text-[8px] text-slate-400 font-semibold uppercase">Monthly Warning Line</span>
                </div>
              }
              isLocked={q3Lock.isLocked}
              effectiveFilters={q3Lock.effectiveFilters}
              globalFilters={filters}
              onToggleLock={q3Lock.toggle}
              onSync={q3Lock.unlock}
            />
            <div className="flex-grow overflow-y-auto pr-1 py-3 space-y-2 select-none" style={{ maxHeight: '160px' }}>
              {q3Data.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span style={{ color: T.mutedColor, fontSize: '8px', fontWeight: 600, width: '22px', flexShrink: 0 }}>{d.name}</span>
                  <div className="flex-grow rounded-full h-2 relative overflow-hidden" style={{ background: '#F1F5F9' }}>
                    <div className="absolute top-0 bottom-0 w-px z-10" style={{ left: `${(d.target / (d.target * 1.4)) * 100}%`, background: '#F43F5E' }} />
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (d.actual / (d.target * 1.4)) * 100)}%`, background: d.actual >= d.target ? 'linear-gradient(90deg,#EF4444,#B91C1C)' : 'linear-gradient(90deg,#F59E0B,#D97706)' }} />
                  </div>
                  <span style={{ color: d.actual >= d.target ? T.rose : T.amber, fontSize: '8.5px', fontWeight: 700, width: '40px', textAlign: 'right', flexShrink: 0 }}>
                    {formatLoss(d.actual)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[8.5px] font-bold uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F59E0B' }} /> Normal</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#EF4444' }} /> Over Limit</span>
              </div>
              <span className="text-red-500 flex items-center gap-1">Claims Root Cause <ArrowRight className="w-3 h-3" /></span>
            </div>
          </div>

          {/* Q4: Prevention & Appraisal Index */}
          <div onClick={() => { if (q4Lock.isLocked) onChange(q4Lock.effectiveFilters); setCurrentView('SPLIT_SCREEN'); setActivePillar('PREVENTION'); }}
            className="hover:scale-[1.005] hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
            style={{ ...card, padding: '24px', cursor: 'pointer', ...lockedCardStyle(q4Lock.isLocked) }}>
            <CardLockHeader
              eyebrow="Pillar 3"
              title="Prevention & Appraisal"
              metric={
                <div className="text-right">
                  <span style={{ color: T.emerald, fontSize: '18px', fontWeight: 700 }}>1.33 Cpk</span>
                  <span className="block text-[8px] text-slate-400 font-semibold uppercase">Audit Completeness</span>
                </div>
              }
              isLocked={q4Lock.isLocked}
              effectiveFilters={q4Lock.effectiveFilters}
              globalFilters={filters}
              onToggleLock={q4Lock.toggle}
              onSync={q4Lock.unlock}
            />
            <div className="flex-grow" style={{ minHeight: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={q4Data} margin={{ top: 5, right: -10, left: -38, bottom: 5 }}>
                  {renderGradientDefs()}
                  <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 7, fill: T.mutedColor, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 7, fill: T.mutedColor }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 7, fill: T.mutedColor }} axisLine={false} tickLine={false} domain={[1.0, 1.6]} />
                  <Area yAxisId="left" type="monotone" dataKey="planned" name="Planned Audits" stroke="none" fill="#E2E8F0" fillOpacity={0.4} />
                  <Area yAxisId="left" type="monotone" dataKey="completed" name="Completed Audits" stroke="none" fill="url(#tealGrad)" fillOpacity={0.4} />
                  <Line yAxisId="right" type="monotone" dataKey="cpk" name="Avg Cpk" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} />
                  <Legend {...commonLegendProps} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {currentView === 'SPLIT_SCREEN' && (
        <div className="flex-grow flex gap-6 max-w-7xl mx-auto w-full h-[calc(100vh-175px)] overflow-hidden">

          {/* LEFT COLUMN: Pillar Selector State Pegging (25%) */}
          <div className="w-[25%] flex flex-col gap-4 overflow-y-auto pr-1 select-none">
            {([
              { id: 'SUMMARY' as PillarId, name: 'COPQ Summary Index', val: formatLoss(q1Profile.ytdLoss), icon: ShieldCheck, color: T.velvetPurple, bg: 'rgba(93, 28, 106, 0.08)', lock: q1Lock },
              { id: 'INTERNAL' as PillarId, name: '1. Internal Failure Index', val: `${q2Profile.fpy}% FPY`, icon: Trash2, color: T.rose, bg: 'rgba(225,29,72,0.08)', lock: q2Lock },
              { id: 'EXTERNAL' as PillarId, name: '2. External Failure Index', val: formatLoss(q3Profile.monthlyWarningLimit), icon: ShieldAlert, color: T.amber, bg: 'rgba(217,119,6,0.08)', lock: q3Lock },
              { id: 'PREVENTION' as PillarId, name: '3. Prevention & Appraisal', val: '1.33 Cpk', icon: ClipboardCheck, color: T.emerald, bg: 'rgba(5,150,105,0.08)', lock: q4Lock }
            ] as const).map((cardItem) => {
              const isActive = activePillar === cardItem.id;
              const cardLock = cardItem.lock;
              const isLocked = cardLock.isLocked;
              const effFilters = cardLock.effectiveFilters;
              const effProfile = getCopqProfile(effFilters);

              const cardInternalData = getInternalFailureData(effFilters, effProfile);
              const cardExternalData = getExternalFailureBulletData(effFilters, effProfile);
              const cardPreventionData = getPreventionAppraisalData(effFilters);

              return (
                <div key={cardItem.id} onClick={() => setActivePillar(cardItem.id)}
                  style={{
                    background: isActive ? 'rgba(93, 28, 106, 0.03)' : '#FFFFFF',
                    border: isActive ? '1px solid rgba(93, 28, 106, 0.2)' : '1px solid rgba(226,232,240,0.9)',
                    borderLeft: isActive ? '3px solid #5D1C6A' : '1px solid rgba(226,232,240,0.9)',
                    borderRadius: '16px',
                    padding: '16.5px',
                    opacity: isActive ? 1 : 0.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(93, 28, 106, 0.05)' : '0 10px 30px -6px rgba(15, 23, 42, 0.05)',
                    ...lockedCardStyle(isLocked)
                  }}
                  className="relative group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <IconPill icon={cardItem.icon} color={cardItem.color} bg={cardItem.bg} />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 block">{cardItem.name}</span>
                        <div onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '2px', marginTop: '2px' }}>
                            {effFilters.trend && (
                              <span className="text-[7.5px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                                {effFilters.subPeriod ? effFilters.subPeriod.toUpperCase() : effFilters.trend.toUpperCase()}
                              </span>
                            )}
                            {effFilters.product && effFilters.product !== 'All Products' && (
                              <span className="text-[7.5px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200">
                                {effFilters.product}
                              </span>
                            )}
                            {effFilters.process && effFilters.process !== 'All Processes' && (
                              <span className="text-[7.5px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-teal-50 text-teal-600 border border-teal-200">
                                {effFilters.process}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-800 text-xs font-black">
                        {cardItem.id === 'SUMMARY' ? formatLoss(effProfile.ytdLoss) : cardItem.id === 'INTERNAL' ? `${effProfile.fpy}% FPY` : cardItem.id === 'EXTERNAL' ? formatLoss(effProfile.monthlyWarningLimit) : '1.33 Cpk'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cardLock.toggle();
                        }}
                        className="p-1 rounded-lg border bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-center transition-colors"
                        style={{
                          borderColor: isLocked ? 'rgba(245,158,11,0.4)' : 'rgba(226,232,240,0.8)',
                          color: isLocked ? '#D97706' : '#94A3B8',
                        }}
                      >
                        {isLocked ? <Pin className="w-2.5 h-2.5" /> : <PinOff className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Micro-Charts inside selector cards */}
                  {cardItem.id === 'SUMMARY' && (
                    <div className="flex justify-center mt-3" style={{ height: '55px' }}>
                      <ConcentricRadialRing fpyValue={effProfile.fpy} ytdLoss={effProfile.ytdLoss} size={55} />
                    </div>
                  )}
                  {cardItem.id === 'INTERNAL' && (
                    <div style={{ height: '35px' }} className="mt-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cardInternalData.slice(0, 5)} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          {renderShiftBars(effFilters)}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {cardItem.id === 'EXTERNAL' && (
                    <div className="flex flex-col gap-1 mt-3">
                      {cardExternalData.slice(0, 4).map((d) => (
                        <div key={d.name} className="flex items-center gap-1">
                          <span className="text-[6.5px] text-slate-400 font-bold w-4 uppercase">{d.name}</span>
                          <div className="flex-grow bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (d.actual / (d.target * 1.4)) * 100)}%`, background: d.actual >= d.target ? '#EF4444' : '#F59E0B' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {cardItem.id === 'PREVENTION' && (
                    <div style={{ height: '35px' }} className="mt-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={cardPreventionData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <Area type="monotone" dataKey="planned" fill="#E2E8F0" stroke="none" fillOpacity={0.3} />
                          <Area type="monotone" dataKey="completed" fill="#10B981" stroke="none" fillOpacity={0.3} />
                          <Line type="monotone" dataKey="cpk" stroke="#10B981" strokeWidth={1} dot={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Isolated bottom text */}
                  {isLocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cardLock.unlock();
                      }}
                      className="text-[8.5px] font-bold text-amber-600 hover:text-amber-700 transition-colors uppercase tracking-wider mt-2.5 block cursor-pointer"
                    >
                      *Isolated | Click to Sync
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: Diagnostic Workspace (75%) */}
          <div className="w-[75%] overflow-y-auto flex flex-col gap-6 pl-2 pr-4">

            {/* activePillar === 'SUMMARY' Workspace */}
            {activePillar === 'SUMMARY' && (
              <div className="flex flex-col gap-6 py-1 w-full animate-in fade-in duration-200">
                <div style={{ ...card, padding: '24px' }}>
                  <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
                    <div>
                      <h4 style={{ color: T.velvetPurple, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>COPQ Losses &amp; Efficiency Index</h4>
                      <p className="mt-1" style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Consolidated view — {q1Profile.label}</p>
                    </div>
                    {q1Lock.isLocked && (
                      <span className="text-[8px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Isolated state</span>
                    )}
                  </div>
                  <div className="flex items-center gap-12 py-3 justify-center">
                    <ConcentricRadialRing fpyValue={q1Profile.fpy} ytdLoss={q1Profile.ytdLoss} size={160} />
                    <div className="flex-grow max-w-md flex flex-col gap-3">
                      {[
                        { label: 'YTD Losses (Total COPQ)', value: formatLoss(q1Profile.ytdLoss), limit: formatLoss(q1Profile.monthlyWarningLimit * 12), pct: Math.min(100, (q1Profile.ytdLoss / (q1Profile.monthlyWarningLimit * 12)) * 100), color: '#EF4444' },
                        { label: 'First Pass Yield (FPY)', value: `${q1Profile.fpy}%`, limit: '97.0%', pct: q1Profile.fpy, color: '#10B981' },
                        { label: 'Supplier Defect Level', value: `${q1Profile.supplierPpm.toLocaleString()} PPM`, limit: '200 PPM', pct: Math.min(100, (q1Profile.supplierPpm / 3000) * 100), color: '#F59E0B' },
                      ].map((bar) => (
                        <div key={bar.label} className="flex flex-col">
                          <div className="flex justify-between items-baseline text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            <span>{bar.label}</span>
                            <span>{bar.value} <span className="text-slate-400 font-medium">/ Limit: {bar.limit}</span></span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${bar.pct}%`, backgroundColor: bar.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ ...card, padding: '24px' }}>
                  <div className="border-b border-slate-100 pb-4 mb-4">
                    <h4 style={{ color: T.velvetPurple, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Consolidated COPQ Cost Trends</h4>
                    <p className="mt-1" style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Time-series distribution across internal, external &amp; prevention</p>
                  </div>
                  <div style={{ height: '240px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getSummaryTrendData(q1Lock.effectiveFilters)} margin={{ top: 5, right: 30, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 7, fill: T.mutedColor, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 7, fill: T.mutedColor }} axisLine={false} tickLine={false} tickFormatter={(v) => v === 0 ? '₹0' : `₹${Math.round(v / 100000)} L`} />
                        <Tooltip contentStyle={T.tt} formatter={(v: number) => [formatLoss(v), '']} />
                        <Bar dataKey="Internal Failure" fill="#8B5CF6" stackId="losses" maxBarSize={16} />
                        <Bar dataKey="External Failure" fill="#F59E0B" stackId="losses" maxBarSize={16} />
                        <Bar dataKey="Prevention & Appraisal" fill="#10B981" stackId="losses" maxBarSize={16} />
                        <Legend {...commonLegendProps} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* activePillar === 'INTERNAL' Workspace */}
            {activePillar === 'INTERNAL' && (
              <div className="flex flex-col gap-6 py-1 w-full animate-in fade-in duration-200">
                <div style={{ ...card, padding: '24px' }}>
                  <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
                    <div>
                      <h4 style={{ color: T.rose, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Waste &amp; Scrap Rework</h4>
                      <p className="mt-1" style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>COPQ Loss trend — {q2Profile.label}</p>
                    </div>
                    {q2Lock.isLocked && (
                      <span className="text-[8px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Isolated state</span>
                    )}
                  </div>
                  <div style={{ height: '240px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={q2Data} margin={{ top: 5, right: 30, left: -10, bottom: 5 }}>
                        {renderGradientDefs()}
                        <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 7, fill: T.mutedColor, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 7, fill: T.mutedColor }} axisLine={false} tickLine={false} tickFormatter={(v) => v === 0 ? '₹0' : `₹${Math.round(v / 100000)} L`} />
                        <Tooltip contentStyle={T.tt} formatter={(v: number) => [formatLoss(v), '']} />
                        <ReferenceLine y={q2Profile.monthlyWarningLimit / 3} stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1.5}
                          label={{ value: `Limit ${formatLoss(q2Profile.monthlyWarningLimit / 3)}`, position: 'right', fontSize: 8, fill: '#EF4444', fontWeight: 700 }} />
                        {renderShiftBars(q2Lock.effectiveFilters)}
                        <Legend {...commonLegendProps} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ ...card, padding: '24px' }} className="flex flex-col">
                  <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px', marginBottom: '16px' }}>
                    <h4 style={{ color: T.rose, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Defect Taxonomy Pareto</h4>
                    <p className="mt-1" style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Defect counts vs carrying financial cost</p>
                  </div>
                  <div style={{ height: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={getDefectTaxonomyPareto(q2Lock.effectiveFilters)} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                        <XAxis dataKey="type" tick={{ fontSize: 8, fill: T.mutedColor, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" name="Count" tick={{ fontSize: 8, fill: T.mutedColor }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" name="Carrying Cost" tick={{ fontSize: 8, fill: T.mutedColor }} axisLine={false} tickLine={false} tickFormatter={(v) => formatLoss(v)} />
                        <Tooltip contentStyle={T.tt} formatter={(value: any, name: string) => name === 'Carrying Cost' ? [formatLoss(value), name] : [value, name]} />
                        <Bar yAxisId="left" dataKey="count" name="Defect Count" fill="url(#gCrimsonBar)" maxBarSize={16} radius={[3, 3, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="carryingCost" name="Carrying Cost" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        <Legend {...commonLegendProps} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ ...card, padding: '24px' }} className="flex flex-col gap-4">
                  <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
                    <h4 style={{ color: T.numColor, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Machine &amp; Station Defect Matrix</h4>
                    <p className="mt-1" style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Detailed failure mode source attribution</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #F1F5F9' }}>
                          {['Machine ID','Station','Defect Mode','Count'].map(h => (
                            <th key={h} className={h === 'Count' ? 'text-right' : ''} style={{ padding: '8px 10px', color: T.mutedColor, fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {getDefectTaxonomyGrid(q2Lock.effectiveFilters).map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: idx < getDefectTaxonomyGrid(q2Lock.effectiveFilters).length - 1 ? '1px solid #F8FAFC' : 'none' }} className="hover:bg-slate-50/60 transition-colors">
                            <td style={{ padding: '8px 10px', color: T.numColor, fontSize: '10.5px', fontWeight: 700 }}>{item.machine}</td>
                            <td style={{ padding: '8px 10px', color: T.labelColor, fontSize: '10.5px' }}>{item.station}</td>
                            <td style={{ padding: '8px 10px', color: T.labelColor, fontSize: '10.5px' }}>{item.type}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: T.rose, fontSize: '10.5px', fontWeight: 700 }}>{item.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* activePillar === 'EXTERNAL' Workspace */}
            {activePillar === 'EXTERNAL' && (
              <div className="flex flex-col gap-6 py-1 w-full animate-in fade-in duration-200">
                <div style={{ ...card, padding: '24px' }}>
                  <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
                    <div>
                      <h4 style={{ color: T.amber, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Batch Warranty Lag (Elapsed Days)</h4>
                      <p className="mt-1" style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Average claims lag days mapped with total warranty losses</p>
                    </div>
                    {q3Lock.isLocked && (
                      <span className="text-[8px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Isolated state</span>
                    )}
                  </div>
                  <div style={{ height: '240px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={q3Data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.mutedColor, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fontSize: 8, fill: T.mutedColor }} axisLine={false} tickLine={false} tickFormatter={(v) => formatLoss(v)} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 8, fill: T.mutedColor }} axisLine={false} tickLine={false} unit="d" />
                        <Tooltip contentStyle={T.tt} formatter={(value: any, name: string) => name === 'Claim Cost' ? [formatLoss(value), name] : [`${value} days`, name]} />
                        <Bar yAxisId="left" dataKey="actual" name="Claim Cost" fill="url(#orangeGrad)" maxBarSize={16} radius={[3, 3, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="lagDays" name="Avg Lag Time" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        <Legend {...commonLegendProps} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ ...card, padding: '24px' }} className="flex flex-col gap-4">
                  <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
                    <h4 style={{ color: T.numColor, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Active Recalls &amp; Containments Ledger</h4>
                    <p className="mt-1" style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Financial impact log of external claims</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #F1F5F9' }}>
                          {['Claim ID','Batch Affected','Action','Cost'].map(h => (
                            <th key={h} className={h === 'Cost' ? 'text-right' : ''} style={{ padding: '8px 10px', color: T.mutedColor, fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {warrantyClaimsTable.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: idx < warrantyClaimsTable.length - 1 ? '1px solid #F8FAFC' : 'none' }} className="hover:bg-slate-50/60 transition-colors">
                            <td style={{ padding: '8px 10px', color: T.numColor, fontSize: '10.5px', fontWeight: 700 }}>{item.id}</td>
                            <td style={{ padding: '8px 10px', color: T.labelColor, fontSize: '10.5px' }}>{item.batch}</td>
                            <td style={{ padding: '8px 10px', color: T.labelColor, fontSize: '10.5px' }}>{item.action}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: T.rose, fontSize: '10.5px', fontWeight: 700 }}>{formatLoss(item.cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* activePillar === 'PREVENTION' Workspace */}
            {activePillar === 'PREVENTION' && (
              <div className="flex flex-col gap-6 py-1 w-full animate-in fade-in duration-200">
                <div style={{ ...card, padding: '24px' }} className="flex flex-col gap-4">
                  <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
                    <h4 style={{ color: T.emerald, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Supplier Quality Scorecard</h4>
                    <p className="mt-1" style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Material rejection rates &amp; PPM vendor sorting — {q4Profile.label}</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #F1F5F9' }}>
                          {['Vendor','Material','Rejection %','Defects'].map(h => (
                            <th key={h} className={h.startsWith('Rejection') || h === 'Defects' ? 'text-right' : ''} style={{ padding: '8px 10px', color: T.mutedColor, fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {getSupplierQualityMatrix(q4Lock.effectiveFilters).map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: idx < getSupplierQualityMatrix(q4Lock.effectiveFilters).length - 1 ? '1px solid #F8FAFC' : 'none' }} className="hover:bg-slate-50/60 transition-colors">
                            <td style={{ padding: '8px 10px', color: T.numColor, fontSize: '10.5px', fontWeight: 700 }}>{item.vendor}</td>
                            <td style={{ padding: '8px 10px', color: T.labelColor, fontSize: '10.5px' }}>{item.material}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: T.amber, fontSize: '10.5px', fontWeight: 700 }}>{item.rejectionRate}%</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: T.rose, fontSize: '10.5px', fontWeight: 700 }}>{item.ppm} PPM</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ ...card, padding: '24px' }} className="flex flex-col gap-4">
                  <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
                    <h4 style={{ color: T.numColor, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>LPA Corrective Action Scorecard</h4>
                    <p className="mt-1" style={{ color: T.mutedColor, fontSize: '9px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Outstanding corrective actions</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="p-4 rounded-xl flex items-start gap-3 border bg-rose-50/20 border-rose-200">
                      <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 style={{ color: T.numColor, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>3 Open Corrective Actions (CARs)</h4>
                        <p className="mt-1 text-slate-500" style={{ fontSize: '10px', lineHeight: 1.4 }}>SealTech components delayed in submitting material conformance logs. Action owner: Supply Quality.</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl flex items-start gap-3 border bg-emerald-50/20 border-emerald-200">
                      <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <div>
                        <h4 style={{ color: T.numColor, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Audit Completeness: 98.2%</h4>
                        <p className="mt-1 text-slate-500" style={{ fontSize: '10px', lineHeight: 1.4 }}>22 out of 23 scheduled layered process audits (LPA) completed this week. No major deviations.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
