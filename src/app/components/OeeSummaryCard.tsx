import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { type ThemeGradients, defaultThemeGradients } from '../contexts/FilterContext';
import { CardLockHeader, lockedCardStyle } from './CardLockHeader';
import { type FilterState } from './TimeTrendFilter';

interface OeeSummaryCardProps {
  isVariantB?: boolean;
  hoverSync?: boolean;
  ticksAndBreach?: boolean;
  sparklines?: boolean;
  glassmorphic?: boolean;
  themeGradients?: ThemeGradients;
  onClick?: () => void;
  oeeValue?: number;
  availValue?: number;
  perfValue?: number;
  qualValue?: number;
  isLocked?: boolean;
  effectiveFilters?: FilterState;
  globalFilters?: FilterState;
  onToggleLock?: () => void;
  onSync?: () => void;
}

export function OeeSummaryCard({
  isVariantB = false,
  hoverSync = false,
  ticksAndBreach = false,
  sparklines = false,
  glassmorphic = false,
  themeGradients,
  onClick,
  oeeValue: propOeeValue,
  availValue: propAvailValue,
  perfValue: propPerfValue,
  qualValue: propQualValue,
  isLocked,
  effectiveFilters,
  globalFilters,
  onToggleLock,
  onSync,
}: OeeSummaryCardProps) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [isCardHovered, setIsCardHovered] = useState(false);

  // Dynamic theme mapping
  const activeTheme = themeGradients || defaultThemeGradients;

  const hexToRgba = (hex: string, alpha: number) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b)
      ? `rgba(0,0,0,${alpha})`
      : `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Normalized values
  const oeeValue = propOeeValue !== undefined ? propOeeValue : 67;
  const availValue = propAvailValue !== undefined ? propAvailValue : 82;
  const perfValue = propPerfValue !== undefined ? propPerfValue : 78;
  const qualValue = propQualValue !== undefined ? propQualValue : 85;

  const oeeTarget = 80;
  const availTarget = 82;
  const perfTarget = 80;
  const qualTarget = 85;

  // Ring geometries
  const R_oee = 44;
  const R_avail = 36;
  const R_perf = 28;
  const R_qual = 20;

  const C_oee = 2 * Math.PI * R_oee;
  const C_avail = 2 * Math.PI * R_avail;
  const C_perf = 2 * Math.PI * R_perf;
  const C_qual = 2 * Math.PI * R_qual;

  // Helper to determine active hover sync style
  const getRingStyle = (metric: string, defaultColor: string, gradientId: string, activeStart: string) => {
    const strokeColor = isVariantB ? `url(#${gradientId})` : defaultColor;
    if (!isVariantB || !hoverSync || !hoveredMetric) {
      return {
        stroke: strokeColor,
        strokeWidth: 5,
        opacity: 1,
        transition: 'all 0.3s ease',
      };
    }

    if (hoveredMetric === metric) {
      return {
        stroke: strokeColor,
        strokeWidth: 7,
        opacity: 1,
        filter: `drop-shadow(0 0 5px ${isVariantB ? activeStart : defaultColor})`,
        transition: 'all 0.3s ease',
      };
    }

    return {
      stroke: strokeColor,
      strokeWidth: 4,
      opacity: 0.25,
      transition: 'all 0.3s ease',
    };
  };

  // Sparkline mockup
  const renderSparkline = (seedPath: string) => {
    if (!sparklines) return null;
    return (
      <div className="w-full h-2.5 mt-1 opacity-50 select-none pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 10">
          <path
            d={seedPath}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="0.8"
          />
        </svg>
      </div>
    );
  };

  // Progress bar row builder
  const renderMetricRow = (
    label: string,
    value: number,
    target: number,
    color: string,
    gradientId: string,
    trackBg: string,
    metricKey: string,
    sparklineSeed: string
  ) => {
    const isBreached = value < target;
    const gapPct = target - value;
    const pct = (value / 100) * 100;
    const targetPct = (target / 100) * 100;

    return (
      <div
        key={label}
        className="space-y-1 group/row transition-all duration-200"
        onMouseEnter={() => hoverSync && setHoveredMetric(metricKey)}
        onMouseLeave={() => hoverSync && setHoveredMetric(null)}
      >
        <div className="flex justify-between text-[9px] font-bold">
          <span className="text-slate-500">{label}</span>
          <span className="font-black" style={{ color: isVariantB ? color : '#475569' }}>
            {value}% <span className="text-[8px] text-slate-400 font-normal">/ Target {target}%</span>
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2 rounded-full overflow-hidden relative" style={{ backgroundColor: isVariantB ? trackBg : '#F1F5F9' }}>
          {/* Target tick line */}
          {isVariantB && ticksAndBreach && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20"
              style={{ left: `${targetPct}%` }}
            />
          )}

          {/* Breach warning segment */}
          {isVariantB && ticksAndBreach && isBreached && gapPct > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-red-400 opacity-60 z-10"
              style={{ left: `${pct}%`, width: `${gapPct}%` }}
            />
          )}

          {/* Filled value */}
          <div
            className="h-full rounded-full transition-all duration-500 relative"
            style={{
              width: `${pct}%`,
              background: isVariantB
                ? gradientId === 'oeeAvailGrad'
                  ? `linear-gradient(90deg, ${activeTheme.availabilityStart} 0%, ${activeTheme.availabilityEnd} 100%)`
                  : gradientId === 'oeePerfGrad'
                  ? `linear-gradient(90deg, ${activeTheme.performanceStart} 0%, ${activeTheme.performanceEnd} 100%)`
                  : gradientId === 'oeeQualGrad'
                  ? `linear-gradient(90deg, ${activeTheme.qualityStart} 0%, ${activeTheme.qualityEnd} 100%)`
                  : `linear-gradient(90deg, ${activeTheme.oeeStart} 0%, ${activeTheme.oeeEnd} 100%)`
                : color
            }}
          >
            {/* Specular Highlight glossy overlay */}
            {isVariantB && glassmorphic && (
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)',
                }}
              />
            )}
          </div>
        </div>

        {/* Sparkline below */}
        {isVariantB && renderSparkline(sparklineSeed)}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
      className="rounded-2xl px-6 pt-5 pb-4 transition-all duration-300 flex flex-col group justify-between h-full"
      style={{
        boxShadow: '0 20px 50px -12px rgba(93, 28, 106, 0.25), 0 4px 20px -2px rgba(93, 28, 106, 0.12), 0 0 15px 1px rgba(93, 28, 106, 0.08)',
        border: isCardHovered ? '1px solid rgba(93, 28, 106, 0.5)' : '1px solid rgba(93, 28, 106, 0.45)',
        background: isCardHovered
          ? 'radial-gradient(circle at center, rgba(93, 28, 106, 0.06) 0%, #FFFFFF 80%)'
          : '#FFFFFF',
        transform: isCardHovered ? 'translateY(-4px)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        ...lockedCardStyle(isLocked ?? false),
      }}
    >
      {/* Header Row */}
      {isLocked !== undefined && effectiveFilters && globalFilters && onToggleLock && onSync ? (
        <CardLockHeader
          eyebrow="OEE Summary Index"
          title="OEE Overview summary"
          metric={
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tabular-nums leading-none" style={{ color: isVariantB ? activeTheme.oeeStart : '#6366F1' }}>
                {oeeValue}%
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200" />
            </div>
          }
          isLocked={isLocked}
          effectiveFilters={effectiveFilters}
          globalFilters={globalFilters}
          onToggleLock={onToggleLock}
          onSync={onSync}
        />
      ) : (
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">
              OEE Summary Index
            </p>
            <p className="text-[7.5px] font-semibold text-slate-300 mt-1 leading-none">
              {isVariantB ? 'YTD Consolidated Performance | Updated Live' : 'Availability · Performance · Quality'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black tabular-nums leading-none" style={{ color: isVariantB ? activeTheme.oeeStart : '#6366F1' }}>
              {oeeValue}%
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200" />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-grow flex items-center ${isVariantB ? 'gap-10 py-3' : 'justify-around py-3'}`}>
        {/* Concentric rings */}
        <div className={`relative ${isVariantB ? 'w-32 h-32 flex-shrink-0' : 'w-[110px] h-[110px] shrink-0'}`}>
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="oeeAvailGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={activeTheme.availabilityStart} />
                <stop offset="100%" stopColor={activeTheme.availabilityEnd} />
              </linearGradient>
              <linearGradient id="oeePerfGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={activeTheme.performanceStart} />
                <stop offset="100%" stopColor={activeTheme.performanceEnd} />
              </linearGradient>
              <linearGradient id="oeeQualGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={activeTheme.qualityStart} />
                <stop offset="100%" stopColor={activeTheme.qualityEnd} />
              </linearGradient>
              <linearGradient id="oeeMainGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={activeTheme.oeeStart} />
                <stop offset="100%" stopColor={activeTheme.oeeEnd} />
              </linearGradient>
            </defs>

            {/* Background Tracks */}
            {isVariantB && <circle cx="50" cy="50" r={R_oee} fill="transparent" stroke={activeTheme.oeeEnd} strokeWidth="5.5" />}
            <circle cx="50" cy="50" r={R_avail} fill="transparent" stroke={isVariantB ? activeTheme.oeeEnd : "#F1F5F9"} strokeWidth="5.5" />
            <circle cx="50" cy="50" r={R_perf} fill="transparent" stroke={isVariantB ? activeTheme.oeeEnd : "#F1F5F9"} strokeWidth="5.5" />
            <circle cx="50" cy="50" r={R_qual} fill="transparent" stroke={isVariantB ? activeTheme.oeeEnd : "#F1F5F9"} strokeWidth="5.5" />

            {/* Overall OEE (Outer Ring) */}
            {isVariantB && (
              <circle
                cx="50"
                cy="50"
                r={R_oee}
                fill="transparent"
                strokeDasharray={C_oee}
                strokeDashoffset={C_oee * (1 - oeeValue / 100)}
                strokeLinecap="round"
                style={getRingStyle('oee', '#6366F1', 'oeeMainGrad', activeTheme.oeeStart)}
              />
            )}

            {/* Availability */}
            <circle
              cx="50"
              cy="50"
              r={R_avail}
              fill="transparent"
              strokeDasharray={C_avail}
              strokeDashoffset={C_avail * (1 - availValue / 100)}
              strokeLinecap="round"
              style={getRingStyle('availability', '#00B574', 'oeeAvailGrad', activeTheme.availabilityStart)}
            />

            {/* Performance */}
            <circle
              cx="50"
              cy="50"
              r={R_perf}
              fill="transparent"
              strokeDasharray={C_perf}
              strokeDashoffset={C_perf * (1 - perfValue / 100)}
              strokeLinecap="round"
              style={getRingStyle('performance', '#FFA000', 'oeePerfGrad', activeTheme.performanceStart)}
            />

            {/* Quality */}
            <circle
              cx="50"
              cy="50"
              r={R_qual}
              fill="transparent"
              strokeDasharray={C_qual}
              strokeDashoffset={C_qual * (1 - qualValue / 100)}
              strokeLinecap="round"
              style={getRingStyle('quality', '#F5788B', 'oeeQualGrad', activeTheme.qualityStart)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-black leading-none" style={{ color: isVariantB ? activeTheme.oeeStart : '#0F172A' }}>
              {oeeValue}%
            </span>
            <span className="text-[6px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">OEE</span>
          </div>
        </div>

        {/* Horizontal Stack */}
        <div className={isVariantB ? 'flex-grow flex flex-col gap-4' : 'flex-1 space-y-3.5 pl-6'}>
          {renderMetricRow('Availability', availValue, availTarget, activeTheme.availabilityStart, 'oeeAvailGrad', hexToRgba(activeTheme.availabilityStart, 0.05), 'availability', 'M0,5 Q15,1 30,8 T60,5 T80,2 T100,5')}
          {renderMetricRow('Performance', perfValue, perfTarget, activeTheme.performanceStart, 'oeePerfGrad', hexToRgba(activeTheme.performanceStart, 0.05), 'performance', 'M0,5 Q20,8 40,2 T70,5 T90,7 T100,3')}
          {renderMetricRow('Quality', qualValue, qualTarget, activeTheme.qualityStart, 'oeeQualGrad', hexToRgba(activeTheme.qualityStart, 0.05), 'quality', 'M0,3 Q10,1 20,6 T50,3 T80,4 T100,2')}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-100/80 pt-2 flex justify-between items-center text-[7.5px] font-black text-slate-300 group-hover:text-slate-500 uppercase tracking-widest transition-colors">
        <span>RCA Diagnostics</span>
        <span>CLICK TO DRILL ↗</span>
      </div>
    </div>
  );
}
