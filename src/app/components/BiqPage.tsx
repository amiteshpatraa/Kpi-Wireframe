import { useState, useMemo } from 'react';
import {
  ComposedChart, BarChart, AreaChart, ScatterChart, Bar, Line, Area, Scatter,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Cell, LabelList,
} from 'recharts';
import { getDashboardData } from '../data/dataStores';
import { type FilterState } from './TimeTrendFilter';
import {
  ArrowLeft, ArrowRight, ShieldCheck, ShieldAlert, AlertTriangle,
  TrendingUp, Activity, Pin, PinOff, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';
import { CardLockHeader, lockedCardStyle } from './CardLockHeader';
import { usePageCardLocks } from './useCardFilterLock';
import { BIQ_PILLARS, WARRANTY_CLAIMS, type ActiveBiqPillar } from '../data/dataStores/biqDataStore';
import { FilterTagPills } from './FilterTagPills';

interface BiqPageProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

type BiqView = 'SUMMARY_CARD' | 'SPLIT_SCREEN';

// ── Color tokens ──────────────────────────────────────────────────────────────
const C = {
  amethyst:    '#7C3AED',
  amethystDim: '#6D28D9',
  velvet:      '#5D1C6A',
  emerald:     '#10B981',
  cobalt:      '#1C4D8D',
  coral:       '#EC6530',
  gold:        '#FFDA62',
  cyan:        '#0EA5E9',
  pageBg:      '#F8FAFC',
  cardBg:      '#FFFFFF',
  cardBorder:  '1px solid rgba(226,232,240,0.9)',
  cardShadow:  '0 10px 30px -6px rgba(15,23,42,0.05), 0 4px 10px -4px rgba(15,23,42,0.04)',
  numColor:    '#0F172A',
  labelColor:  '#475569',
  mutedColor:  '#94A3B8',
  tt: {
    background: '#0F172A',
    border: '1px solid rgba(124,58,237,0.3)',
    borderRadius: '10px',
    boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
    fontSize: '10px',
    fontWeight: 600 as const,
    color: '#E0F2FE',
    padding: '8px 12px',
  },
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
function BiqTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ ...C.tt, pointerEvents: 'none' }}>
      <p style={{ margin: 0, fontWeight: 700, fontSize: '9px', color: '#94A3B8', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ margin: 0, color: p.color || '#E0F2FE' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ── Concentric Rings ──────────────────────────────────────────────────────────
function ConcentricRings({ ftr, cpk, lpa, size = 160 }: { ftr: number; cpk: number; lpa: number; size?: number }) {
  const r1 = 56; const c1 = 2 * Math.PI * r1; const off1 = c1 * (1 - Math.min(100, ftr) / 100);
  const r2 = 46; const c2 = 2 * Math.PI * r2; const off2 = c2 * (1 - Math.min(2, cpk) / 2);
  const r3 = 36; const c3 = 2 * Math.PI * r3; const off3 = c3 * (1 - Math.min(100, lpa) / 100);
  return (
    <div className="relative shrink-0 select-none" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r1} fill="transparent" stroke="#F1F5F9" strokeWidth="5" />
        <circle cx="60" cy="60" r={r2} fill="transparent" stroke="#F1F5F9" strokeWidth="5" />
        <circle cx="60" cy="60" r={r3} fill="transparent" stroke="#F1F5F9" strokeWidth="5" />
        <circle cx="60" cy="60" r={r1} fill="transparent" stroke={C.amethyst} strokeWidth="5"
          strokeDasharray={c1} strokeDashoffset={off1} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease', filter: 'drop-shadow(0 0 4px rgba(124,58,237,0.5))' }} />
        <circle cx="60" cy="60" r={r2} fill="transparent" stroke={C.emerald} strokeWidth="5"
          strokeDasharray={c2} strokeDashoffset={off2} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease', filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.5))' }} />
        <circle cx="60" cy="60" r={r3} fill="transparent" stroke={C.cobalt} strokeWidth="5"
          strokeDasharray={c3} strokeDashoffset={off3} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease', filter: 'drop-shadow(0 0 4px rgba(28,77,141,0.5))' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span style={{ color: C.numColor, fontSize: 15, fontWeight: 800, lineHeight: 1 }}>{ftr.toFixed(1)}%</span>
        <span style={{ color: C.mutedColor, fontSize: 7, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 3 }}>FTR</span>
      </div>
    </div>
  );
}

// ── Progress Track ────────────────────────────────────────────────────────────
function ProgressTrack({ label, value, target, unit = '%', color }: { label: string; value: number; target: number; unit?: string; color: string }) {
  const pct = Math.min(100, (value / (target * 1.1)) * 100);
  const isOk = value >= target;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 9, fontWeight: 700, color: C.labelColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: isOk ? '#059669' : '#DC2626' }}>
          {value < 50 ? value.toFixed(2) : value.toFixed(1)}{unit}
        </span>
      </div>
      <div style={{ height: 5, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: 8, color: C.mutedColor, fontWeight: 600 }}>Target: {target < 5 ? target.toFixed(2) : target.toFixed(1)}{unit}</span>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    ok:             { bg: '#ECFDF5', color: '#059669' },
    safe:           { bg: '#ECFDF5', color: '#059669' },
    Pass:           { bg: '#ECFDF5', color: '#059669' },
    warning:        { bg: '#FFFBEB', color: '#D97706' },
    Watch:          { bg: '#FFFBEB', color: '#D97706' },
    critical:       { bg: '#FEF2F2', color: '#DC2626' },
    'At Risk':      { bg: '#FEF2F2', color: '#DC2626' },
    'Approved':     { bg: '#ECFDF5', color: '#059669' },
    'Under Review': { bg: '#FFFBEB', color: '#D97706' },
    'Rejected':     { bg: '#FEF2F2', color: '#DC2626' },
  };
  const s = map[status] || { bg: '#F8FAFC', color: '#475569' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 99, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

// ── Card Shell ────────────────────────────────────────────────────────────────
function Card({ children, style, className, onClick }: { children: React.ReactNode; style?: React.CSSProperties; className?: string; onClick?: () => void }) {
  return (
    <div className={className} onClick={onClick} style={{ background: C.cardBg, border: C.cardBorder, boxShadow: C.cardShadow, borderRadius: 20, overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

// ── Data Resolver ─────────────────────────────────────────────────────────────
function getBiqProfile(filters: FilterState) {
  return getDashboardData('BIQ', filters.subPeriod || filters.trend, filters.product, filters.process, filters.shift);
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function BiqPage({ filters, onChange }: BiqPageProps) {
  const [view, setView] = useState<BiqView>('SUMMARY_CARD');
  const [activePillar, setActivePillar] = useState<ActiveBiqPillar>('PROCESS_QUALITY');

  const { lockedCardFilters, handleCardLockToggle, isLocked } = usePageCardLocks('biq', filters);

  const profile = useMemo(() => getBiqProfile(filters), [filters]);

  const {
    ftr = 94.2, cpk = 1.28, lpaCompliance = 97.5, supplierPpm = 1250,
    ftrCpkTrend = [], scrapWarrantyTrend = [], lpaSupplierTrend = [],
    spcChartData = [], ftrStationMatrix = [], defectPareto = [],
    warrantyClaimsTable = [], supplierPpmScorecard = [], lpaAuditLog = [],
  } = profile || {};

  // ── Level 0 ──────────────────────────────────────────────────────────────
  if (view === 'SUMMARY_CARD') {
    return (
      <div style={{ minHeight: '100vh', background: C.pageBg, padding: 24 }}>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg, ${C.amethyst}, ${C.velvet})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${C.velvet}55` }}>
              <ShieldCheck style={{ width: 18, height: 18, color: '#fff', strokeWidth: 1.8 }} />
            </div>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 900, color: C.numColor, letterSpacing: '-0.01em', margin: 0 }}>
                BIQ — BUILT-IN QUALITY &amp; COMPLIANCE PORTAL
              </h1>
              <p style={{ fontSize: 10, color: C.mutedColor, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
                First Time Right · Cpk · LPA Compliance · Supplier PPM
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 9, background: `${C.amethyst}12`, color: C.amethyst, border: `1px solid ${C.amethyst}30`, padding: '3px 10px', borderRadius: 99, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              BUILT-IN QUALITY KPI
            </span>
            <button
              onClick={() => setView('SPLIT_SCREEN')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: `linear-gradient(135deg, ${C.amethyst}, ${C.velvet})`, color: '#fff', boxShadow: `0 4px 12px ${C.velvet}40` }}
            >
              Deep Dive <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <FilterTagPills filters={filters} />

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4 mt-4" style={{ gridTemplateRows: 'auto auto' }}>

          {/* Q1 — BIQ Summary Index */}
          <Card
            onClick={() => { setView('SPLIT_SCREEN'); setActivePillar('PROCESS_QUALITY'); }}
            aria-label="Navigate to Process Quality & Capability"
            role="button"
            className="transition-all hover:scale-[1.01] hover:shadow-lg"
            style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center', boxShadow: `0 10px 40px rgba(93,28,106,0.12), 0 4px 10px rgba(15,23,42,0.04)`, cursor: 'pointer' }}
          >
            <ConcentricRings ftr={ftr} cpk={cpk} lpa={lpaCompliance} size={170} />
            <div className="flex flex-col gap-4 flex-1 min-w-0">
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.amethyst, margin: 0 }}>BIQ Summary Index</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: C.numColor, margin: '2px 0 0' }}>Quality Health Dashboard</p>
              </div>
              <div className="flex flex-col gap-3">
                <ProgressTrack label="Process Quality — FTR %" value={ftr} target={97.0} unit="%" color={C.amethyst} />
                <ProgressTrack label="Process Capability — Cpk" value={cpk} target={1.33} unit="" color={C.emerald} />
                <ProgressTrack label="LPA Audit Compliance" value={lpaCompliance} target={98.0} unit="%" color={C.cobalt} />
                <ProgressTrack label="Supplier Defect PPM" value={supplierPpm} target={500} unit=" PPM" color={C.cyan} />
              </div>
              <div className="flex gap-3 mt-1 flex-wrap">
                {[
                  { dot: C.amethyst, text: `FTR ${ftr.toFixed(1)}%` },
                  { dot: C.emerald,  text: `Cpk ${cpk.toFixed(2)}` },
                  { dot: C.cobalt,   text: `LPA ${lpaCompliance.toFixed(1)}%` },
                ].map(i => (
                  <div key={i.text} className="flex items-center gap-1">
                    <div style={{ width: 7, height: 7, borderRadius: 99, background: i.dot }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: C.labelColor }}>{i.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Q2 — Process Quality & Capability */}
          <Card
            onClick={() => { setView('SPLIT_SCREEN'); setActivePillar('PROCESS_QUALITY'); }}
            aria-label="Navigate to Process Quality & Capability"
            role="button"
            className="transition-all hover:scale-[1.01] hover:shadow-lg"
            style={{ padding: 20, display: 'flex', flexDirection: 'column', minHeight: 360, cursor: 'pointer' }}
          >
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.amethyst, margin: '0 0 2px' }}>Process Quality &amp; Capability</p>
            <p style={{ fontSize: 12, fontWeight: 800, color: C.numColor, margin: '0 0 12px' }}>FTR % (Bars) &amp; Cpk Index (Line)</p>
            <div className="w-full flex-1" style={{ minHeight: 280, height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={ftrCpkTrend} margin={{ top: 10, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="biqFtrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.amethyst} stopOpacity={0.85} />
                      <stop offset="100%" stopColor={C.amethyst} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.6)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: C.mutedColor }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis yAxisId="ftr" domain={[80, 100]} tick={{ fontSize: 9, fill: C.mutedColor }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
                  <YAxis yAxisId="cpk" orientation="right" domain={[0.8, 2.0]} tick={{ fontSize: 9, fill: C.mutedColor }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v.toFixed(1)} />
                  <Tooltip content={<BiqTooltip />} />
                  <ReferenceLine yAxisId="cpk" y={1.33} stroke="#EF4444" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Cpk=1.33', fill: '#EF4444', fontSize: 8, position: 'right' }} />
                  <Bar yAxisId="ftr" dataKey="ftr" name="FTR %" fill="url(#biqFtrGrad)" radius={[3, 3, 0, 0]} maxBarSize={18}>
                    <LabelList dataKey="ftr" position="top" style={{ fontSize: 7, fill: C.amethyst, fontWeight: 700 }} formatter={(v: number) => `${v.toFixed(1)}%`} />
                  </Bar>
                  <Line yAxisId="cpk" dataKey="cpk" name="Cpk" stroke={C.emerald} strokeWidth={2} dot={{ fill: C.emerald, r: 3 }} type="monotone" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Q3 — Internal & Customer Quality */}
          <Card
            onClick={() => { setView('SPLIT_SCREEN'); setActivePillar('INTERNAL_QUALITY'); }}
            aria-label="Navigate to Internal & Customer Quality"
            role="button"
            className="transition-all hover:scale-[1.01] hover:shadow-lg"
            style={{ padding: 20, display: 'flex', flexDirection: 'column', minHeight: 280, cursor: 'pointer' }}
          >
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.coral, margin: '0 0 2px' }}>Internal &amp; Customer Quality</p>
            <p style={{ fontSize: 12, fontWeight: 800, color: C.numColor, margin: '0 0 12px' }}>Scrap &amp; Warranty Defect Volume (Units)</p>
            <div className="w-full flex-1" style={{ minHeight: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scrapWarrantyTrend} margin={{ top: 10, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="biqScrapGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.coral} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={C.coral} stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="biqWarrantyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.gold} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={C.gold} stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.6)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: C.mutedColor }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: C.mutedColor }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}`} />
                  <Tooltip content={<BiqTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 9, paddingTop: 6 }} />
                  <Bar dataKey="scrap" name="Scrap Parts Count" fill="url(#biqScrapGrad)" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="warranty" name="Warranty Claim Occurrences" fill="url(#biqWarrantyGrad)" radius={[3, 3, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Q4 — Incoming Quality & Compliance */}
          <Card
            onClick={() => { setView('SPLIT_SCREEN'); setActivePillar('INCOMING_COMPLIANCE'); }}
            aria-label="Navigate to Incoming Quality & Compliance"
            role="button"
            className="transition-all hover:scale-[1.01] hover:shadow-lg"
            style={{ padding: 20, display: 'flex', flexDirection: 'column', minHeight: 280, cursor: 'pointer' }}
          >
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.cyan, margin: '0 0 2px' }}>Incoming Quality &amp; Compliance</p>
            <p style={{ fontSize: 12, fontWeight: 800, color: C.numColor, margin: '0 0 12px' }}>LPA Audit % &amp; Supplier PPM</p>
            <div className="w-full flex-1" style={{ minHeight: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={lpaSupplierTrend} margin={{ top: 10, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="biqLpaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.emerald} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={C.emerald} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.6)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: C.mutedColor }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis yAxisId="lpa" domain={[85, 100]} tick={{ fontSize: 9, fill: C.mutedColor }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
                  <YAxis yAxisId="ppm" orientation="right" tick={{ fontSize: 9, fill: C.mutedColor }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BiqTooltip />} />
                  <ReferenceLine yAxisId="ppm" y={500} stroke="#F59E0B" strokeDasharray="4 3" strokeWidth={1.5} />
                  <Area yAxisId="lpa" dataKey="lpa" name="LPA Compliance %" stroke={C.emerald} strokeWidth={2} fill="url(#biqLpaGrad)" type="monotone" dot={{ fill: C.emerald, r: 2 }} />
                  <Line yAxisId="ppm" dataKey="ppm" name="Supplier PPM" stroke={C.cyan} strokeWidth={2} dot={{ fill: C.cyan, r: 2 }} type="monotone" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>
      </div>
    );
  }

  // ── Level 2 — Split Screen ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.pageBg, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-white shrink-0" style={{ boxShadow: '0 1px 8px rgba(15,23,42,0.04)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('SUMMARY_CARD')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Summary
          </button>
          <div>
            <h1 style={{ fontSize: 13, fontWeight: 900, color: C.numColor, margin: 0, letterSpacing: '-0.01em' }}>
              BIQ — Built-In Quality Diagnostic Workspace
            </h1>
            <p style={{ fontSize: 9, color: C.mutedColor, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
              {BIQ_PILLARS.find(p => p.id === activePillar)?.label}
            </p>
          </div>
        </div>
        <FilterTagPills filters={filters} />
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left Column: Pillar Selector 25% */}
        <div className="shrink-0 overflow-y-auto border-r border-slate-200/70 bg-white" style={{ width: '25%', minWidth: 240, maxWidth: 340 }}>
          <div className="px-4 py-4">
            <p style={{ fontSize: 9, fontWeight: 700, color: C.mutedColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>BIQ Pillars</p>
            <div className="flex flex-col gap-3">
              {BIQ_PILLARS.map(pillar => {
                const isActive = activePillar === pillar.id;
                return (
                  <button
                    key={pillar.id}
                    onClick={() => setActivePillar(pillar.id)}
                    className="text-left w-full transition-all duration-200"
                    style={{
                      background: isActive ? 'rgba(93,28,106,0.03)' : 'transparent',
                      border: isActive ? `1px solid rgba(93,28,106,0.15)` : '1px solid rgba(226,232,240,0.8)',
                      borderLeft: isActive ? `3px solid ${C.velvet}` : '1px solid rgba(226,232,240,0.8)',
                      borderRadius: 14,
                      padding: '10px 12px',
                      opacity: !isActive ? 0.5 : 1,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, color: isActive ? C.velvet : C.numColor, marginBottom: 2 }}>
                      {pillar.label}
                    </div>
                    <div style={{ fontSize: 9, color: C.mutedColor, fontWeight: 600, marginBottom: 8 }}>
                      {pillar.subtitle}
                    </div>
                    <FilterTagPills filters={filters} />
                    {/* Mini Chart */}
                    <div style={{ height: 52, marginTop: 8 }}>
                      {pillar.id === 'PROCESS_QUALITY' && (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={ftrCpkTrend.slice(-6)} margin={{ top: 2, right: 2, bottom: 0, left: -36 }}>
                            <Bar dataKey="ftr" fill={C.amethyst} radius={[2, 2, 0, 0]} maxBarSize={10} opacity={0.8} yAxisId={0} />
                            <Line dataKey="cpk" stroke={C.emerald} strokeWidth={1.5} dot={false} yAxisId={1} />
                            <XAxis dataKey="name" hide />
                            <YAxis yAxisId={0} hide domain={[80, 100]} />
                            <YAxis yAxisId={1} hide orientation="right" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                      {pillar.id === 'INTERNAL_QUALITY' && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={scrapWarrantyTrend.slice(-6)} margin={{ top: 2, right: 2, bottom: 0, left: -36 }}>
                            <Bar dataKey="scrap" fill={C.coral} radius={[2, 2, 0, 0]} maxBarSize={8} />
                            <Bar dataKey="warranty" fill={C.gold} radius={[2, 2, 0, 0]} maxBarSize={8} />
                            <XAxis dataKey="name" hide />
                            <YAxis hide />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                      {pillar.id === 'INCOMING_COMPLIANCE' && (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={lpaSupplierTrend.slice(-6)} margin={{ top: 2, right: 2, bottom: 0, left: -36 }}>
                            <Area dataKey="lpa" stroke={C.emerald} fill={`${C.emerald}30`} strokeWidth={1.5} dot={false} type="monotone" yAxisId={0} />
                            <Line dataKey="ppm" stroke={C.cyan} strokeWidth={1.5} dot={false} type="monotone" yAxisId={1} />
                            <XAxis dataKey="name" hide />
                            <YAxis yAxisId={0} hide />
                            <YAxis yAxisId={1} hide orientation="right" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    {/* KPI badges */}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span style={{ fontSize: 9, fontWeight: 800, color: pillar.color, background: `${pillar.color}12`, padding: '2px 7px', borderRadius: 99, border: `1px solid ${pillar.color}30` }}>
                        {pillar.value}
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: C.mutedColor, background: '#F1F5F9', padding: '2px 7px', borderRadius: 99 }}>
                        Target: {pillar.target}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Diagnostic Workspace 75% */}
        <div className="flex-1 overflow-y-auto" style={{ background: C.pageBg, padding: 20 }}>

          {/* Tab 1: Process Quality & Capability */}
          {activePillar === 'PROCESS_QUALITY' && (
            <div className="flex flex-col gap-5">
              <Card style={{ padding: 20 }}>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.amethyst, margin: '0 0 2px' }}>SPC Control Chart</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: C.numColor, margin: '0 0 12px' }}>Cp / Cpk Process Capability Tolerance</p>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={spcChartData} margin={{ top: 10, right: 4, bottom: 0, left: -16 }}>
                      <defs>
                        <linearGradient id="spcGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.amethyst} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={C.amethyst} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.6)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: C.mutedColor }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis domain={[0, 2.0]} tick={{ fontSize: 9, fill: C.mutedColor }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v.toFixed(1)} />
                      <Tooltip content={<BiqTooltip />} />
                      <ReferenceLine y={1.67} stroke="#EF4444" strokeDasharray="5 3" strokeWidth={1.5} label={{ value: 'USL 1.67', fill: '#EF4444', fontSize: 8 }} />
                      <ReferenceLine y={1.33} stroke="#F59E0B" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Target 1.33', fill: '#F59E0B', fontSize: 8 }} />
                      <ReferenceLine y={1.00} stroke="#EF4444" strokeDasharray="5 3" strokeWidth={1.5} label={{ value: 'LSL 1.00', fill: '#EF4444', fontSize: 8 }} />
                      <Area dataKey="value" name="Cpk" stroke={C.amethyst} fill="url(#spcGrad)" strokeWidth={2} dot={{ fill: C.amethyst, r: 3 }} type="monotone" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card style={{ padding: 20 }}>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.amethyst, margin: '0 0 2px' }}>Station-Level Quality Yield</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: C.numColor, margin: '0 0 14px' }}>First Time Right (FTR) % by Station</p>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={ftrStationMatrix} margin={{ top: 15, right: 10, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.6)" vertical={false} />
                      <XAxis dataKey="station" tick={{ fontSize: 10, fill: C.numColor, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[80, 100]} tick={{ fontSize: 9, fill: C.mutedColor }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
                      <Tooltip content={<BiqTooltip />} />
                      <ReferenceLine y={97.0} stroke="#EF4444" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Target FTR: 97%', fill: '#EF4444', fontSize: 9, position: 'top' }} />
                      <Bar dataKey="ftr" name="Station FTR %" radius={[4, 4, 0, 0]} maxBarSize={28}>
                        {ftrStationMatrix.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.ftr < entry.target ? '#EF4444' : C.amethyst} />
                        ))}
                        <LabelList dataKey="ftr" position="top" style={{ fontSize: 8, fontWeight: 700 }} formatter={(v: number) => `${v.toFixed(1)}%`} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {/* Tab 2: Internal & Customer Quality */}
          {activePillar === 'INTERNAL_QUALITY' && (
            <div className="flex flex-col gap-5">
              <Card style={{ padding: 20 }}>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.coral, margin: '0 0 2px' }}>Defect Taxonomy</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: C.numColor, margin: '0 0 12px' }}>Root Cause Pareto Chart (by Defect Count)</p>
                <div style={{ width: '100%', height: 210 }}>
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={defectPareto} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="paretoGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={C.coral} stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#FF8C5A" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.5)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9, fill: C.mutedColor }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="category" tick={{ fontSize: 9, fill: C.labelColor, fontWeight: 600 }} axisLine={false} tickLine={false} width={180} />
                      <Tooltip content={<BiqTooltip />} />
                      <Bar dataKey="count" name="Defect Count" fill="url(#paretoGrad)" radius={[0, 4, 4, 0]} maxBarSize={20}>
                        <LabelList dataKey="count" position="right" style={{ fontSize: 9, fill: C.coral, fontWeight: 700 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card style={{ padding: 20 }}>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.coral, margin: '0 0 2px' }}>Customer Quality</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: C.numColor, margin: '0 0 14px' }}>Active Warranty Claims &amp; Escalations</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(226,232,240,0.8)' }}>
                        {['Claim ID', 'SKU', 'Customer', 'Defective Units', 'Cost (₹ Lakhs)', 'Defect Type', 'Status'].map(h => (
                          <th key={h} style={{ fontSize: 8, fontWeight: 700, color: C.mutedColor, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 10px 10px 0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(warrantyClaimsTable.length ? warrantyClaimsTable : WARRANTY_CLAIMS).map((row: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(241,245,249,0.8)' }}>
                          <td style={{ padding: '8px 10px 8px 0', fontSize: 10, fontWeight: 800, color: C.numColor, fontFamily: 'monospace' }}>{row.claimId}</td>
                           <td style={{ padding: '8px 10px 8px 0', fontSize: 9, color: C.mutedColor, fontFamily: 'monospace' }}>{row.sku}</td>
                          <td style={{ padding: '8px 10px 8px 0', fontSize: 10, fontWeight: 700, color: C.labelColor }}>{row.customer}</td>
                          <td style={{ padding: '8px 10px 8px 0', fontSize: 11, fontWeight: 800, color: C.coral }}>{row.defectiveUnits}</td>
                          <td style={{ padding: '8px 10px 8px 0', fontSize: 11, fontWeight: 800, color: C.amber }}>₹{row.costLakhs ? row.costLakhs.toFixed(1) : '0.0'} L</td>
                          <td style={{ padding: '8px 10px 8px 0', fontSize: 10, color: C.labelColor }}>{row.defect}</td>
                          <td style={{ padding: '8px 0 8px 0' }}><StatusBadge status={row.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Tab 3: Incoming Quality & Compliance */}
          {activePillar === 'INCOMING_COMPLIANCE' && (
            <div className="flex flex-col gap-5">
              <Card style={{ padding: 20 }}>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.cyan, margin: '0 0 2px' }}>Incoming Quality Matrix</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: C.numColor, margin: '0 0 14px' }}>Supplier Defect PPM Scorecard vs. Inspected Volume</p>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.6)" />
                      <XAxis dataKey="supplier" type="category" tick={{ fontSize: 9, fill: C.numColor, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="ppm" type="number" name="Defect PPM" tick={{ fontSize: 9, fill: C.mutedColor }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v} PPM`} />
                      <ZAxis dataKey="lots" type="number" range={[150, 600]} name="Lots Inspected" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<BiqTooltip />} />
                      <ReferenceLine y={500} stroke="#F59E0B" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Max 500 PPM Target', fill: '#F59E0B', fontSize: 8, position: 'right' }} />
                      <Scatter data={supplierPpmScorecard} name="Supplier Quality">
                        {supplierPpmScorecard.map((entry: any, index: number) => {
                          const isHighRisk = entry.ppm > 1000;
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={isHighRisk ? '#EF4444' : entry.ppm > 500 ? '#F59E0B' : '#10B981'}
                              style={{
                                filter: isHighRisk ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))' : 'none',
                                transition: 'all 0.3s ease',
                              }}
                            />
                          );
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card style={{ padding: 20 }}>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.emerald, margin: '0 0 2px' }}>Layered Process Audit</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: C.numColor, margin: '0 0 14px' }}>LPA Compliance Log &amp; Open CARs</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(226,232,240,0.8)' }}>
                        {['Audit ID', 'Station', 'Date', 'Score', 'Open CARs', 'Status'].map(h => (
                          <th key={h} style={{ fontSize: 8, fontWeight: 700, color: C.mutedColor, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 10px 10px 0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lpaAuditLog.map((row: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(241,245,249,0.8)' }}>
                          <td style={{ padding: '8px 10px 8px 0', fontSize: 10, fontWeight: 800, color: C.numColor, fontFamily: 'monospace' }}>{row.auditId}</td>
                          <td style={{ padding: '8px 10px 8px 0', fontSize: 11, fontWeight: 800, color: C.labelColor }}>{row.station}</td>
                          <td style={{ padding: '8px 10px 8px 0', fontSize: 9, color: C.mutedColor }}>{row.date}</td>
                          <td style={{ padding: '8px 10px 8px 0' }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: row.score >= 97 ? '#059669' : row.score >= 93 ? '#D97706' : '#DC2626' }}>
                              {row.score.toFixed(1)}%
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px 8px 0' }}>
                            {row.openCars > 0 ? (
                              <span style={{ fontSize: 10, fontWeight: 800, color: '#DC2626', background: 'rgba(220, 38, 38, 0.1)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                                {row.openCars} CARs
                              </span>
                            ) : (
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', background: 'rgba(5, 150, 105, 0.1)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(5, 150, 105, 0.2)' }}>
                                0
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '8px 0 8px 0' }}><StatusBadge status={row.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
