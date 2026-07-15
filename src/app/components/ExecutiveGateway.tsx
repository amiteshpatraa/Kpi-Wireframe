import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, ArrowRight, Settings, Layers, ShieldAlert, Package, Truck, GitBranch,
  FileText, Database, ShieldCheck, Calendar, ClipboardCheck, Cpu,
  Activity, Warehouse, TrendingDown, AlertOctagon, PackageCheck, GitCommit
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Cell, ReferenceLine, Tooltip } from 'recharts';
import type { PageId } from './Sidebar';
import { cn } from './ui/utils';
import shopFloorBg from '../../imports/11.png';
import lighthouseBg from '../../imports/21221.png';
import { useFilter } from '../contexts/FilterContext';

// 7-month YTD historical datasets with high natural variance (Jan to Jul)
const oeeYtdData = [
  { name: 'Jan', value: 71.2 },
  { name: 'Feb', value: 78.5 },
  { name: 'Mar', value: 64.1 },
  { name: 'Apr', value: 81.3 },
  { name: 'May', value: 73.8 },
  { name: 'Jun', value: 79.4 },
  { name: 'Jul', value: 75.0 }
];

const inventoryYtdData = [
  { name: 'Jan', value: 1280 },
  { name: 'Feb', value: 990 },
  { name: 'Mar', value: 1350 },
  { name: 'Apr', value: 1050 },
  { name: 'May', value: 1220 },
  { name: 'Jun', value: 1140 },
  { name: 'Jul', value: 1192 }
];

const copqYtdData = [
  { name: 'Jan', value: 1480000 },
  { name: 'Feb', value: 4300000 },
  { name: 'Mar', value: 2400000 },
  { name: 'Apr', value: 5290000 },
  { name: 'May', value: 2560000 },
  { name: 'Jun', value: 3880000 },
  { name: 'Jul', value: 3520000 }
];

const rawMaterialYtdData = [
  { name: 'Jan', value: 3 },
  { name: 'Feb', value: 0 },
  { name: 'Mar', value: 5 },
  { name: 'Apr', value: 1 },
  { name: 'May', value: 4 },
  { name: 'Jun', value: 2 },
  { name: 'Jul', value: 0 }
];

const otifYtdData = [
  { name: 'Jan', value: 91.5 },
  { name: 'Feb', value: 95.8 },
  { name: 'Mar', value: 89.2 },
  { name: 'Apr', value: 96.4 },
  { name: 'May', value: 93.1 },
  { name: 'Jun', value: 95.0 },
  { name: 'Jul', value: 93.9 }
];

const traceabilityYtdData = [
  { name: 'Jan', value: 99.1 },
  { name: 'Feb', value: 99.8 },
  { name: 'Mar', value: 98.4 },
  { name: 'Apr', value: 100.0 },
  { name: 'May', value: 99.5 },
  { name: 'Jun', value: 99.9 },
  { name: 'Jul', value: 100.0 }
];

// Percentage coordinates mapping directly to 3D isometric shop floor hotspot regions
const radarCoords: Record<number, { top: number; left: number }> = {
  1: { top: 38, left: 26 }, // OEE Performance Index -> CNC Line (top-left production area)
  2: { top: 23, left: 52 }, // Inventory Pipeline Integrity -> Warehouse (top-center storage racks)
  3: { top: 80, left: 16 }, // COPQ -> Inspection (bottom-left area)
  4: { top: 60, left: 50 }, // Raw Material Coverage -> Assembly (bottom-center area)
  5: { top: 33, left: 72 }, // OTIF Delivery -> Shipping Docks (top-right area)
  6: { top: 75, left: 75 }, // Traceability -> Material Flow (bottom-right area)
};

// Start anchor point for card connection leader lines (left, top percentages in SVG layout)
const cardAnchors: Record<number, { left: number; top: number }> = {
  1: { left: 30, top: 25 }, // OEE card bottom-center
  2: { left: 53, top: 21 }, // Inventory card bottom-center
  3: { left: 18, top: 70 }, // COPQ card right-center
  4: { left: 47, top: 72 }, // BPR card top-center
  5: { left: 78, top: 25 }, // OTIF card bottom-left
  6: { left: 79, top: 81 }, // Traceability card left-center
};

// Dimensions and positions of floating cards surrounding the border in Isometric View
const cardCoords: Record<number, { top: number; left: number; width: number }> = {
  1: { top: 12, left: 22, width: 16.5 }, // OEE Card
  2: { top: 8, left: 45, width: 16.5 }, // Inventory Card
  3: { top: 55, left: 2, width: 16.5 }, // COPQ Card
  4: { top: 65, left: 39, width: 16.5 }, // BPR Card
  5: { top: 12, left: 76, width: 16.5 }, // OTIF Card
  6: { top: 67, left: 79, width: 16.5 }, // Traceability Card
};

interface ExecutiveGatewayProps {
  onEnterDashboard: (pageId: PageId) => void;
  onBack: () => void;
  filters: any;
  onChange: (filters: any) => void;
}

const MiniChartTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    const fullMonthMap: Record<string, string> = {
      'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
      'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
      'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
    };
    const monthName = fullMonthMap[label] || label;
    const value = payload[0].value;
    const formattedVal = typeof value === 'number' ? value.toFixed(1) : value;

    return (
      <div
        className="backdrop-blur-md shadow-lg animate-in fade-in zoom-in-95 duration-100"
        style={{
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '4px 8px',
          pointerEvents: 'none',
        }}
      >
        <p
          style={{
            fontSize: '8px',
            color: '#E2E8F0',
            fontWeight: 700,
            margin: 0,
            fontFamily: 'sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          {`${monthName} | ${formattedVal}${unit}`}
        </p>
      </div>
    );
  }
  return null;
};

// ── COMPACT KPI CARD COMPONENT FOR ISOMETRIC VIEW OVERLAYS ───────────────────
function CompactKPICard({ card, isHovered, onHover, onClick, liveData, isPulsing, onChartNodeClick }: {
  card: any;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
  liveData: any;
  isPulsing: boolean;
  onChartNodeClick?: (month: string) => void;
}) {
  const Icon = card.icon;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const yTicks = card.id === 3
    ? [0, 1000000, 2000000, 3000000, 4000000, 5000000, 6000000]
    : (card.id === 2 ? [0, 500, 1000, 1500, 2000] : (card.id === 4 ? [0, 25, 50, 75, 100] : [0, 25, 50, 75, 100]));
  const yDomain = card.id === 3
    ? [0, 6000000]
    : (card.id === 2 ? [0, 2000] : (card.id === 4 ? [0, 100] : [0, 100]));

  const tickFormatter = (v: any) => {
    if (card.id === 1 || card.id === 6 || card.id === 5) return `${v}%`;
    if (card.id === 3) return v === 0 ? '₹0' : `₹${v / 100000} L`;
    if (card.id === 2) return v.toLocaleString();
    if (card.id === 4) return `${v}%`;
    return v;
  };

  const getAreaTarget = () => {
    if (card.id === 1) return { y: 80, label: "Target 80%" };
    if (card.id === 2) return { y: 1200, label: "Target Limit: 1,200 Units" };
    if (card.id === 4) return { y: 12, label: "Target 12d" };
    return { y: 0, label: "Target 0" };
  };
  const areaTarget = getAreaTarget();

  const hoverGlow = card.id === 1
    ? 'rgba(93, 28, 106, 0.25)'
    : card.id === 5
      ? 'rgba(245, 120, 139, 0.25)'
      : `rgba(${card.rgb}, 0.25)`;

  const normalGlow = card.id === 1
    ? 'rgba(93, 28, 106, 0.15)'
    : card.id === 5
      ? 'rgba(245, 120, 139, 0.15)'
      : `rgba(${card.rgb}, 0.15)`;

  const isWarningActive = (() => {
    if (card.id === 1) return liveData.oee < 70;
    if (card.id === 3) return liveData.copqLoss > 3500000;
    if (card.id === 4) return liveData.daysOfSupply < 12.0;
    if (card.id === 5) return liveData.otif < 94.2;
    return false;
  })();

  const showWarningHighlight = isWarningActive && !isHovered;
  const warningColor = card.id === 4 ? '#F97316' : '#EF4444';
  const warningShadow = card.id === 4
    ? '0 15px 35px -5px rgba(249, 115, 22, 0.2), 0 0 15px 2px rgba(249, 115, 22, 0.15)'
    : '0 15px 35px -5px rgba(239, 68, 68, 0.2), 0 0 15px 2px rgba(239, 68, 68, 0.15)';

  const cardStyle: React.CSSProperties = {
    boxShadow: showWarningHighlight
      ? warningShadow
      : (isHovered
        ? `0 12px 30px -10px rgba(15, 23, 42, 0.08), 0 0 20px 2px ${hoverGlow}`
        : `0 12px 30px -10px rgba(15, 23, 42, 0.04), 0 0 15px 1px ${normalGlow}`),
    border: showWarningHighlight
      ? `2px solid ${warningColor}`
      : '1px solid rgba(226, 232, 240, 0.8)',
    background: isHovered
      ? 'rgba(255, 255, 255, 0.88)'
      : 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(12px)',
    borderRadius: '24px',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    cursor: 'pointer',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: isHovered ? '8px' : '10px',
    width: isHovered ? '320px' : '270px',
    height: isHovered ? '320px' : '110px',
    padding: isHovered ? '12px 12px 20px 12px' : '10px',
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={cardStyle}
      className="select-none relative transition-all duration-300"
    >
      {/* Header Row: Left (Icon & Category Capsule), Right (Trend Badge) */}
      <div className="flex items-center justify-between w-full shrink-0">
        <div className="flex items-center gap-2">
          {/* Icon Squircle (36px wide/tall) */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/20 shrink-0"
            style={{ backgroundColor: `rgba(${card.rgb}, 0.08)` }}
          >
            <Icon className="w-5 h-5" style={{ color: card.color }} />
          </div>
          {/* Category Capsule & Title */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span
              className="text-[7px] font-bold tracking-[0.05em] px-2 py-0.5 rounded-full uppercase leading-none bg-transparent border shrink-0 w-max"
              style={{
                borderColor: `rgba(${card.rgb}, 0.25)`,
                color: card.color
              }}
            >
              {card.classification}
            </span>
            {/* Title row */}
            <h3 className={cn(
              "text-[8.5px] font-medium text-[#64748B] uppercase tracking-[0.08em] transition-all duration-300",
              isHovered ? "whitespace-normal break-words w-48" : "truncate w-36"
            )}>
              {card.title}
            </h3>
          </div>
        </div>
        {/* Trend Badge */}
        <div className={cn("flex items-center justify-center px-2 py-0.5 rounded-full text-center shrink-0 border border-transparent", card.trendBadgeBgClass)}>
          <span className="text-[7.5px] font-bold">{card.trendText}</span>
        </div>
      </div>

      {/* Primary Value Display */}
      <div className="flex justify-between items-baseline shrink-0">
        <span
          style={{
            color: showWarningHighlight ? warningColor : '#1E293B',
            fontSize: '1.25rem',
            fontWeight: 600,
            fontFamily: 'sans-serif',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em'
          }}
          className={cn("transition-all duration-300 leading-none", isPulsing ? "text-blue-600 scale-102" : "")}
        >
          {card.retroValue}
        </span>
      </div>

      {/* Compact Default State: Thin Primary Driver Row */}
      <div
        style={{
          maxHeight: !isHovered ? '36px' : '0px',
          opacity: !isHovered ? 1 : 0,
          transition: 'all 0.3s ease-in-out',
        }}
        className="overflow-hidden border-t border-slate-100/70 pt-0.5 flex items-center justify-between mt-auto shrink-0 w-full"
      >
        <div className="flex items-center gap-1 min-w-0 w-full">
          {/* Indicator Dot */}
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
            style={{ backgroundColor: card.color }}
          />
          <span className="text-[7.5px] font-semibold text-[#94A3B8] tracking-[0.06em] uppercase shrink-0">
            PRIMARY DRIVER
          </span>
          <span className="text-[8px] text-slate-200 shrink-0 px-0.5" style={{ color: 'rgba(226, 232, 240, 0.8)' }}>|</span>
          <span className="text-[8px] font-medium text-[#475569] truncate">
            {card.leadingValue}
          </span>
        </div>
      </div>

      {/* Expanded Hovered State: Leading Indicator Box, Recharts Graph & Action Footer */}
      <div
        style={{
          maxHeight: isHovered ? '240px' : '0px',
          opacity: isHovered ? 1 : 0,
          transition: 'all 0.3s ease-in-out',
          visibility: isHovered ? 'visible' : 'hidden',
        }}
        className="flex flex-col gap-2 w-full mt-1 overflow-hidden"
      >
        {/* Leading Indicator Inner Box */}
        <div
          className="border flex items-center gap-2 shrink-0 p-2"
          style={{
            borderRadius: '12px',
            background: 'rgba(248, 250, 252, 0.8)',
            borderColor: '#F1F5F9',
            marginBottom: '4px'
          }}
        >
          <div className={cn("flex items-center justify-center rounded-lg p-1 border border-white/20 shrink-0", card.leadingIconBgClass)} style={{ backgroundColor: card.trackWash }}>
            {(() => {
              const LIcon = card.leadingIcon;
              return <LIcon className="w-4 h-4" style={{ color: card.color }} />;
            })()}
          </div>
          <div className="min-w-0 flex-grow">
            <p className="text-[10px] font-bold text-[#1E293B] truncate">{card.leadingValue}</p>
            <p className="text-[8px] text-slate-500 truncate">{card.leadingLabel}</p>
          </div>
        </div>

        {/* The Recharts Graph */}
        <div className="w-full h-24 overflow-hidden shrink-0">
          {card.chartType === 'area' ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={card.chartData} margin={{ top: 10, right: 5, left: 16, bottom: 5 }}>
                <defs>
                  <linearGradient id={`areaGradHover-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={card.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={card.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} dy={4} />
                <YAxis tick={{ fontSize: 7, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} ticks={yTicks} domain={yDomain} tickFormatter={tickFormatter} width={25} />
                <ReferenceLine y={areaTarget.y} stroke="#EF4444" strokeDasharray="3 3" label={{ value: areaTarget.label, fill: '#EF4444', fontSize: 7, fontWeight: 700 }} />
                <Tooltip content={<MiniChartTooltip unit={card.id === 1 ? "% OEE" : "% OTIF"} />} cursor={false} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={card.color}
                  strokeWidth={1.5}
                  fill={`url(#areaGradHover-${card.id})`}
                  dot={{ r: 1.5, stroke: card.color, strokeWidth: 0.5, fill: '#ffffff' }}
                  activeDot={{
                    r: 4,
                    stroke: card.color,
                    strokeWidth: 1.5,
                    fill: '#ffffff',
                    style: {
                      transform: 'scale(1.3)',
                      transformOrigin: 'center',
                      filter: `drop-shadow(0 0 6px ${card.color})`,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    },
                    onClick: (e: any, payload: any) => {
                      if (e && e.stopPropagation) e.stopPropagation();
                      const clickedMonth = payload?.payload?.name || payload?.name || e?.payload?.name || e?.name;
                      if (clickedMonth && onChartNodeClick) {
                        onChartNodeClick(clickedMonth);
                      }
                    }
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={card.chartData} margin={{ top: 10, right: 5, left: 16, bottom: 5 }}>
                <defs>
                  <linearGradient id={`barGradHover-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={card.color} />
                    <stop offset="100%" stopColor={card.lighterColor || card.color} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} dy={4} />
                <YAxis tick={{ fontSize: 7, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} ticks={yTicks} domain={yDomain} tickFormatter={tickFormatter} width={25} />
                <ReferenceLine y={card.id === 5 ? 95 : 1500000} stroke="#EF4444" strokeDasharray="3 3" label={{ value: `Target ${card.id === 5 ? '95%' : '₹15L'}`, fill: '#EF4444', fontSize: 7, fontWeight: 700 }} />
                <Tooltip content={<MiniChartTooltip unit={card.id === 5 ? "% OTIF" : " L"} />} cursor={false} />
                <Bar
                  dataKey="value"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={8}
                  onMouseEnter={(data: any, state: any) => {
                    if (state && typeof state.activeIndex === 'number') {
                      setActiveIndex(state.activeIndex);
                    }
                  }}
                  onMouseLeave={() => {
                    setActiveIndex(null);
                  }}
                  onClick={(data: any, index: number, e: any) => {
                    const eventObj = e || (index && typeof index === 'object' && index) || data;
                    if (eventObj && eventObj.stopPropagation) {
                      eventObj.stopPropagation();
                    }
                    const clickedMonth = data?.name || data?.payload?.name || data?.activeLabel;
                    if (clickedMonth && onChartNodeClick) {
                      onChartNodeClick(clickedMonth);
                    }
                  }}
                >
                  {card.chartData.map((entry: any, index: number) => {
                    const isActive = activeIndex === index;
                    return (
                      <Cell
                        key={`cell-hover-${index}`}
                        fill={`url(#barGradHover-${card.id})`}
                        style={{
                          transform: isActive ? 'scale(1.05)' : 'scale(1)',
                          transformOrigin: 'bottom center',
                          filter: isActive ? `drop-shadow(0 0 4px ${card.color})` : 'none',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Access Diagnostics Link */}
        <div className="border-t border-slate-100/70 pt-2 flex items-center justify-end w-full shrink-0">
          <span
            className="text-[8.5px] font-semibold tracking-[0.05em] uppercase transition-colors duration-200 flex items-center gap-1 hover:opacity-85"
            style={{ color: card.color }}
          >
            Access Diagnostics →
          </span>
        </div>
      </div>
    </div>
  );
}

export function ExecutiveGateway({ onEnterDashboard, onBack, filters, onChange }: ExecutiveGatewayProps) {
  const { calibratedIsometricCoords } = useFilter();

  const handleChartNodeClick = (monthName: string, redirectTarget: PageId) => {
    const shortMonthMap: Record<string, number> = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
    };
    const monthIdx = shortMonthMap[monthName] !== undefined ? shortMonthMap[monthName] : 2; // Default to Mar (2)
    const currentYear = filters?.selectedDate ? filters.selectedDate.getFullYear() : 2026;
    const newDate = new Date(currentYear, monthIdx, 12);

    onChange({
      ...filters,
      trend: 'month',
      subPeriod: 'mtd',
      selectedDate: newDate,
      sidebarPeriodSelected: true
    });

    onEnterDashboard(redirectTarget);
  };

  const getPointsCentroid = (points: { x: number; y: number }[], fallback: { top: number; left: number }) => {
    if (!points || points.length === 0) return fallback;
    const sumX = points.reduce((acc, curr) => acc + curr.x, 0);
    const sumY = points.reduce((acc, curr) => acc + curr.y, 0);
    return { top: sumY / points.length, left: sumX / points.length };
  };

  const dynamicRadarCoords = useMemo<Record<number, { top: number; left: number }>>(() => {
    return {
      1: getPointsCentroid(calibratedIsometricCoords.production, { top: 38, left: 26 }),
      2: getPointsCentroid(calibratedIsometricCoords.warehouse, { top: 23, left: 52 }),
      3: getPointsCentroid(calibratedIsometricCoords.quality, { top: 80, left: 16 }),
      4: getPointsCentroid(calibratedIsometricCoords.process, { top: 60, left: 50 }),
      5: getPointsCentroid(calibratedIsometricCoords.shipping, { top: 33, left: 72 }),
      6: getPointsCentroid(calibratedIsometricCoords.material, { top: 75, left: 75 }),
    };
  }, [calibratedIsometricCoords]);

  const getClipPathString = (pts: { x: number; y: number }[]) => {
    return `polygon(${pts.map(p => `${p.x}% ${p.y}%`).join(', ')})`;
  };

  const getSvgPointsString = (pts: { x: number; y: number }[]) => {
    return pts.map(p => `${p.x},${p.y}`).join(' ');
  };

  const productionPoints = calibratedIsometricCoords.production;
  const warehousePoints = calibratedIsometricCoords.warehouse;
  const qualityPoints = calibratedIsometricCoords.quality;
  const processPoints = calibratedIsometricCoords.process;
  const shippingPoints = calibratedIsometricCoords.shipping;
  const materialPoints = calibratedIsometricCoords.material;

  const productionClipPath = getClipPathString(productionPoints);
  const productionSvgPoints = getSvgPointsString(productionPoints);

  const warehouseClipPath = getClipPathString(warehousePoints);
  const warehouseSvgPoints = getSvgPointsString(warehousePoints);

  const qualityClipPath = getClipPathString(qualityPoints);
  const qualitySvgPoints = getSvgPointsString(qualityPoints);

  const processClipPath = getClipPathString(processPoints);
  const processSvgPoints = getSvgPointsString(processPoints);

  const shippingClipPath = getClipPathString(shippingPoints);
  const shippingSvgPoints = getSvgPointsString(shippingPoints);

  const materialClipPath = getClipPathString(materialPoints);
  const materialSvgPoints = getSvgPointsString(materialPoints);

  // Live fluctuating data state
  const COPQ_BUDGET = 3500000;

  // Live fluctuating data state
  const [liveData, setLiveData] = useState({
    oee: 75.0,
    overduePms: 0.5,
    activeWipUnits: 1192,
    wipAge: 12.8,
    daysOfSupply: 12.0,
    copqLoss: 3480000, // Starts below ₹35L budget
    qGate: 98.2,
    otif: 93.9,
    scheduleAdherence: 1.5,
    serialization: 100,
    unmappedComponents: 0.0,
  });

  const [pulseStates, setPulseStates] = useState<Record<string, boolean>>({});
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const [gridHoveredBarIndex, setGridHoveredBarIndex] = useState<number | null>(null);
  const [gridHoveredCardId, setGridHoveredCardId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'ISOMETRIC' | 'GRID' | 'RADAR'>('GRID');
  const [isMobile, setIsMobile] = useState(false);

  const [activeSpotlightCardId, setActiveSpotlightCardId] = useState<number>(1);
  const [spotlightOpacity, setSpotlightOpacity] = useState<number>(1);

  // Lighthouse spotlight search timer loop (4s interval)
  useEffect(() => {
    if (viewMode !== 'RADAR') return;

    const interval = setInterval(() => {
      setSpotlightOpacity(0);
      setTimeout(() => {
        setActiveSpotlightCardId(prev => {
          const sequence = [1, 3, 5, 6, 2, 4]; // Clockwise: OEE (1), COPQ (3), OTIF (5), Trace (6), Inv (2), BPR (4)
          const currentIndex = sequence.indexOf(prev);
          const nextIndex = (currentIndex + 1) % sequence.length;
          return sequence[nextIndex];
        });
        setSpotlightOpacity(1);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [viewMode]);

  // Derived KPI exception states for isometric floor glows
  const isOeeCritical = liveData.oee < 70;
  const isCopqCritical = liveData.copqLoss > COPQ_BUDGET;
  const isBprCritical = liveData.daysOfSupply < 12.0;
  const isInventoryCritical = liveData.activeWipUnits > 1200;
  const isOtifCritical = liveData.otif < 94.2;
  const isTraceabilityCritical = liveData.unmappedComponents > 0.0;

  // Monitor resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1150);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update live fluctuations in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(prev => {
        // Occasionally drop OEE below 70% to trigger Production Hall alarm
        const oeeAnomaly = Math.random() > 0.85;
        const nextOee = oeeAnomaly
          ? Math.max(65.0, Math.min(69.8, prev.oee + (Math.random() - 0.5) * 2.0))
          : Math.max(73.5, Math.min(78.2, prev.oee + (Math.random() - 0.5) * 0.4));

        const nextOverduePms = Math.max(0.42, Math.min(0.58, prev.overduePms + (Math.random() - 0.5) * 0.03));
        const nextActiveWipUnits = Math.max(1190, Math.min(1210, Math.round(prev.activeWipUnits + (Math.random() - 0.5) * 4)));
        const nextWipAge = Math.max(12.5, Math.min(13.1, prev.wipAge + (Math.random() - 0.5) * 0.12));

        // Let Days of Supply swing around 12.0 to trigger Assembly orange glow
        const nextDaysOfSupply = Math.max(11.0, Math.min(13.2, prev.daysOfSupply + (Math.random() - 0.5) * 0.25));

        // Fluctuate COPQ loss around budget (3,500,000) so it sometimes breaches
        const nextCopqLoss = Math.max(3420000, Math.min(3580000, Math.round(prev.copqLoss + (Math.random() - 0.5) * 45000)));

        const nextQGate = Math.max(97.8, Math.min(98.6, prev.qGate + (Math.random() - 0.5) * 0.1));
        const nextOtif = Math.max(93.8, Math.min(94.6, prev.otif + (Math.random() - 0.5) * 0.1));
        const nextScheduleAdherence = Math.max(1.2, Math.min(1.8, prev.scheduleAdherence + (Math.random() - 0.5) * 0.1));
        const nextUnmapped = Math.random() > 0.9 ? (Math.random() > 0.6 ? 0.1 : 0.0) : 0.0;

        return {
          oee: nextOee,
          overduePms: nextOverduePms,
          activeWipUnits: nextActiveWipUnits,
          wipAge: nextWipAge,
          daysOfSupply: nextDaysOfSupply,
          copqLoss: nextCopqLoss,
          qGate: nextQGate,
          otif: nextOtif,
          scheduleAdherence: nextScheduleAdherence,
          serialization: prev.serialization,
          unmappedComponents: nextUnmapped,
        };
      });

      const changedKeys = ['oee', 'activeWipUnits', 'daysOfSupply', 'copqLoss', 'otif'];
      const randomKey = changedKeys[Math.floor(Math.random() * changedKeys.length)];
      setPulseStates(prev => ({ ...prev, [randomKey]: true }));
      setTimeout(() => {
        setPulseStates(prev => ({ ...prev, [randomKey]: false }));
      }, 800);

    }, 1100);

    return () => clearInterval(interval);
  }, []);

  const chartDataWithLive = useMemo(() => {
    return {
      oee: [...oeeYtdData.slice(0, 6), { name: 'Jul', value: liveData.oee }],
      inventory: [...inventoryYtdData.slice(0, 6), { name: 'Jul', value: liveData.activeWipUnits }],
      copq: [...copqYtdData.slice(0, 6), { name: 'Jul', value: liveData.copqLoss }],
      purchase: [
        { name: 'Jan', critical: 15, warning: 30, safe: 70, overstock: 100, value: 75 },
        { name: 'Feb', critical: 15, warning: 30, safe: 70, overstock: 100, value: 82 },
        { name: 'Mar', critical: 15, warning: 30, safe: 70, overstock: 100, value: 55 },
        { name: 'Apr', critical: 15, warning: 30, safe: 70, overstock: 100, value: 48 },
        { name: 'May', critical: 15, warning: 30, safe: 70, overstock: 100, value: 64 },
        { name: 'Jun', critical: 15, warning: 30, safe: 70, overstock: 100, value: 72 },
        { name: 'Jul', critical: 15, warning: 30, safe: 70, overstock: 100, value: Math.round(liveData.daysOfSupply * 5.8) }
      ],
      otif: [...otifYtdData.slice(0, 6), { name: 'Jul', value: liveData.otif }],
      compliance: [...traceabilityYtdData.slice(0, 6), { name: 'Jul', value: liveData.serialization }],
    };
  }, [liveData]);

  const cards = [
    {
      id: 1,
      title: 'OEE Performance Index',
      hoverGlowClass: 'hover:border-blue-300',
      icon: Activity,
      color: '#2563EB',
      lighterColor: '#1D4ED8',
      trackWash: 'rgba(37, 99, 235, 0.08)',
      rgb: '37, 99, 235',
      classification: 'PERFORMANCE KPI',
      categoryPillClass: 'bg-blue-50 text-[#2563EB] border border-blue-100',
      retroValue: `${liveData.oee.toFixed(1)}% OEE`,
      retroLabel: 'YTD average overall equipment effectiveness',
      progressPercent: liveData.oee,
      trendText: '▲ 3.6%',
      trendSub: 'vs YTD 2025',
      trendBadgeBgClass: 'bg-[#ECFDF5] border border-[#A7F3D0] shadow-[0_2px_8px_rgba(16,185,129,0.15)] text-[#065F46]',
      trendTextClass: 'text-[#065F46]',
      leadingValue: `${liveData.overduePms.toFixed(2)}% Overdue PMs`,
      leadingLabel: 'Preventive maintenance backlog rate',
      leadingIcon: FileText,
      leadingIconBgClass: 'bg-blue-50/50 border-blue-100/50',
      chartType: 'area' as const,
      chartData: chartDataWithLive.oee,
      gradientStartColor: '#3B82F6',
      redirectTarget: 'overview' as PageId,
      pulseKey: 'oee',
    },
    {
      id: 2,
      title: 'Inventory Pipeline Integrity',
      hoverGlowClass: 'hover:border-emerald-300',
      icon: Warehouse,
      color: '#10B981',
      lighterColor: '#059669',
      trackWash: 'rgba(16, 185, 129, 0.08)',
      rgb: '16, 185, 129',
      classification: 'INVENTORY KPI',
      categoryPillClass: 'bg-emerald-50 text-[#10B981] border border-emerald-100',
      retroValue: `${liveData.activeWipUnits.toLocaleString()} Active Units`,
      retroLabel: 'YTD cumulative WIP volume sitting on the floor',
      progressPercent: (liveData.activeWipUnits / 2000) * 100,
      trendText: '▲ 5.2%',
      trendSub: 'vs YTD 2025',
      trendBadgeBgClass: 'bg-[#ECFDF5] border border-[#A7F3D0] shadow-[0_2px_8px_rgba(16,185,129,0.15)] text-[#065F46]',
      trendTextClass: 'text-[#065F46]',
      leadingValue: `${liveData.wipAge.toFixed(1)}h Average WIP Age`,
      leadingLabel: 'Inventory flow velocity',
      leadingIcon: Database,
      leadingIconBgClass: 'bg-emerald-50/50 border-emerald-100/50',
      chartType: 'area' as const,
      chartData: chartDataWithLive.inventory,
      gradientStartColor: '#34D399',
      redirectTarget: 'inventory' as PageId,
      pulseKey: 'activeWipUnits',
    },
    {
      id: 3,
      title: 'COPQ (Cost of Poor Quality)',
      hoverGlowClass: 'hover:border-violet-300',
      icon: TrendingDown,
      color: '#7C3AED',
      lighterColor: '#6D28D9',
      trackWash: 'rgba(124, 58, 237, 0.08)',
      rgb: '124, 58, 237',
      classification: 'QUALITY LOSS KPI',
      categoryPillClass: 'bg-purple-50 text-[#8B5CF6] border border-purple-100',
      retroValue: `₹${(liveData.copqLoss / 100000).toFixed(1)} L Total Loss`,
      retroLabel: 'YTD scrap and rework costs incurred',
      progressPercent: (liveData.qGate / 100) * 80,
      trendText: '▼ 4.7%',
      trendSub: 'vs YTD 2025',
      trendBadgeBgClass: 'bg-[#FEF2F2] border border-[#FECACA] shadow-[0_2px_8px_rgba(244,63,94,0.15)] text-[#991B1B]',
      trendTextClass: 'text-[#991B1B]',
      leadingValue: `${liveData.qGate.toFixed(1)}% Q-Gate Filtration`,
      leadingLabel: 'Defects caught inline before escaping',
      leadingIcon: ShieldCheck,
      leadingIconBgClass: 'bg-purple-50/50 border-purple-100/50',
      chartType: 'bar' as const,
      chartData: chartDataWithLive.copq,
      redirectTarget: 'copq' as PageId,
      pulseKey: 'copqLoss',
    },
    {
      id: 4,
      title: 'Raw Material Coverage',
      hoverGlowClass: 'hover:border-cyan-300',
      icon: AlertOctagon,
      color: '#0EA5E9',
      lighterColor: '#0284C7',
      trackWash: 'rgba(14, 165, 233, 0.08)',
      rgb: '14, 165, 233',
      classification: 'PURCHASE KPI',
      categoryPillClass: 'bg-cyan-50 text-[#0EA5E9] border border-cyan-100',
      retroValue: `${liveData.serialization === 100 ? '0' : '1'} Shortages`,
      retroLabel: 'YTD active part shortages',
      progressPercent: (liveData.daysOfSupply / 16) * 100,
      trendText: '▼ 12.3%',
      trendSub: 'vs YTD 2025',
      trendBadgeBgClass: 'bg-[#FEF2F2] border border-[#FECACA] shadow-[0_2px_8px_rgba(244,63,94,0.15)] text-[#991B1B]',
      trendTextClass: 'text-[#991B1B]',
      leadingValue: `${liveData.daysOfSupply.toFixed(1)} Days of Supply`,
      leadingLabel: 'Current material buffer runway',
      leadingIcon: Calendar,
      leadingIconBgClass: 'bg-cyan-50/50 border-cyan-100/50',
      chartType: 'area' as const,
      chartData: chartDataWithLive.purchase,
      gradientStartColor: '#38BDF8',
      redirectTarget: 'bpr' as PageId,
      pulseKey: 'daysOfSupply',
    },
    {
      id: 5,
      title: 'OTIF Delivery',
      hoverGlowClass: 'hover:border-orange-300',
      icon: PackageCheck,
      color: '#F5788B',
      lighterColor: '#FFAE6E',
      trackWash: 'rgba(245, 120, 139, 0.08)',
      rgb: '245, 120, 139',
      classification: 'DELIVERY KPI',
      categoryPillClass: 'bg-amber-50 text-[#F5788B] border border-amber-100',
      retroValue: `${liveData.otif.toFixed(1)}% OTIF`,
      retroLabel: 'YTD historical shipment commitment success rate',
      progressPercent: liveData.otif,
      trendText: '▲ 1.5%',
      trendSub: 'vs YTD 2025',
      trendBadgeBgClass: 'bg-[#ECFDF5] border border-[#A7F3D0] shadow-[0_2px_8px_rgba(16,185,129,0.15)] text-[#065F46]',
      trendTextClass: 'text-[#065F46]',
      leadingValue: `+${liveData.scheduleAdherence.toFixed(1)}% Schedule Adherence`,
      leadingLabel: 'Actual output volume vs. plan',
      leadingIcon: ClipboardCheck,
      leadingIconBgClass: 'bg-amber-50/50 border-amber-100/50',
      chartType: 'bar' as const,
      chartData: chartDataWithLive.otif,
      redirectTarget: 'otif' as PageId,
      pulseKey: 'otif',
    },
    {
      id: 6,
      title: 'Traceability & Digital Thread',
      hoverGlowClass: 'hover:border-indigo-300',
      icon: GitCommit,
      color: '#6366F1',
      lighterColor: '#818CF8',
      trackWash: 'rgba(99, 102, 241, 0.08)',
      rgb: '99, 102, 241',
      classification: 'TRACEABILITY KPI',
      categoryPillClass: 'bg-indigo-50 text-[#6366F1] border border-indigo-100',
      retroValue: '100% Serialization',
      retroLabel: 'YTD assemblies carrying unique tracking keys',
      progressPercent: liveData.serialization,
      trendText: '—',
      trendSub: 'Consistent',
      trendBadgeBgClass: 'bg-slate-50 border border-slate-200 text-slate-500',
      trendTextClass: 'text-[#374151]',
      leadingValue: `${liveData.unmappedComponents.toFixed(1)}% Unmapped Components`,
      leadingLabel: 'Digital thread completion rate',
      leadingIcon: Cpu,
      leadingIconBgClass: 'bg-indigo-50/50 border-indigo-100/50',
      chartType: 'area' as const,
      chartData: chartDataWithLive.compliance,
      gradientStartColor: '#818CF8',
      redirectTarget: 'traceability' as PageId,
      pulseKey: 'serialization',
    },
  ];

  const activeViewMode = isMobile ? 'GRID' : viewMode;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 relative overflow-x-hidden font-sans select-none flex flex-col justify-between">
      {/* ── Background: Subtle white-theme grid and ambient pastel glows ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(226,232,240,0.8) 1px, transparent 1px), linear-gradient(to bottom, rgba(226,232,240,0.8) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-200/30 rounded-full blur-[80px]" />
        <div className="absolute bottom-20 right-10 w-[450px] h-[450px] bg-teal-200/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-violet-200/20 rounded-full blur-[90px]" />
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 px-8 pt-6 flex items-center justify-between shrink-0">
        <button
          onClick={onBack}
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all duration-200 text-[10px] font-bold tracking-widest uppercase text-slate-600"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 text-slate-500" />
          Back
        </button>

        {/* View Mode Switcher Selector */}
        {!isMobile && (
          <div className="flex bg-slate-200/60 p-1 rounded-xl border border-slate-300/35 shrink-0 shadow-inner">
            <button
              onClick={() => setViewMode('ISOMETRIC')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer",
                viewMode === 'ISOMETRIC'
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Control Tower Floor Map
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer",
                viewMode === 'GRID'
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Metrics Grid View
            </button>
            <button
              onClick={() => setViewMode('RADAR')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer",
                viewMode === 'RADAR'
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Lighthouse Radar View
            </button>
          </div>
        )}

        <div className="text-right">
          <p className="text-[9px] tracking-[0.25em] font-extrabold text-blue-600 uppercase">
            ATLAS Operational Control Tower
          </p>
          <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">
            Executive Gateway
          </h1>
        </div>
      </header>

      {/* ── Main Content Grid ── */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-8 py-6">
        <div className="w-full max-w-7xl">
          {/* Header Introduction */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-transparent border border-emerald-500/20 text-[9px] font-extrabold text-emerald-600 tracking-wider uppercase mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed Connected
            </div>
            <h2 className="text-2xl font-medium tracking-[0.05em] text-slate-900 uppercase">
              {activeViewMode === 'ISOMETRIC'
                ? 'Operational Control Tower Map'
                : activeViewMode === 'RADAR'
                  ? 'Lighthouse operational radar'
                  : 'Shopfloor KPI Summary'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
              {activeViewMode === 'ISOMETRIC'
                ? 'Interactive shop floor telemetry. Hover to trace connections, click to enter dedicated diagnostic portals.'
                : activeViewMode === 'RADAR'
                  ? 'Real-time telemetry projection rays spotlighting operational hazards and clear shipping corridors.'
                  : 'Real-time plant metrics updating in live cycles. Click a card to enter diagnostic control centers.'}
            </p>
          </div>

          {activeViewMode === 'ISOMETRIC' ? (
            /* ── ISOMETRIC 3D MAP VIEW (4 Layers) ── */
            <div
              className="relative w-full aspect-[16/9] bg-cover bg-center rounded-3xl border border-slate-200/50 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12)] overflow-hidden"
              style={{ backgroundImage: `url(${shopFloorBg})` }}
            >
              {/* Layer 1: Exception-Based Floor Zone Glows (Isometric Hotspots) */}
              {/* Production Hall Zone (OEE below 70%) */}
              <div
                className={cn(
                  "absolute inset-0 pointer-events-none transition-opacity duration-[1500ms] ease-in-out z-10",
                  isOeeCritical ? "opacity-100" : "opacity-0"
                )}
              >
                <div
                  className="w-full h-full animate-[pulse_3s_ease-in-out_infinite]"
                  style={{
                    clipPath: productionClipPath,
                    background: 'rgba(99, 102, 241, 0.15)',
                  }}
                />
                <svg className="absolute inset-0 w-full h-full animate-[pulse_3s_ease-in-out_infinite]" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Glow underlay */}
                  <polygon
                    points={productionSvgPoints}
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="0.6"
                    opacity="0.6"
                    style={{ filter: 'blur(2px)' }}
                  />
                  {/* Sharp 2px border */}
                  <polygon
                    points={productionSvgPoints}
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="0.2"
                  />
                </svg>
              </div>

              {/* Warehouse Zone (Inventory Alert) */}
              <div
                className={cn(
                  "absolute inset-0 pointer-events-none transition-opacity duration-[1500ms] ease-in-out z-10",
                  isInventoryCritical ? "opacity-100" : "opacity-0"
                )}
              >
                <div
                  className="w-full h-full animate-[pulse_3s_ease-in-out_infinite]"
                  style={{
                    clipPath: warehouseClipPath,
                    background: 'rgba(16, 185, 129, 0.15)',
                  }}
                />
                <svg className="absolute inset-0 w-full h-full animate-[pulse_3s_ease-in-out_infinite]" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Glow underlay */}
                  <polygon
                    points={warehouseSvgPoints}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="0.6"
                    opacity="0.6"
                    style={{ filter: 'blur(2px)' }}
                  />
                  {/* Sharp 2px border */}
                  <polygon
                    points={warehouseSvgPoints}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="0.2"
                  />
                </svg>
              </div>

              {/* Quality Inspection Zone (COPQ over budget) */}
              <div
                className={cn(
                  "absolute inset-0 pointer-events-none transition-opacity duration-[1500ms] ease-in-out z-10",
                  isCopqCritical ? "opacity-100" : "opacity-0"
                )}
              >
                <div
                  className="w-full h-full animate-[pulse_3s_ease-in-out_infinite]"
                  style={{
                    clipPath: qualityClipPath,
                    background: 'rgba(239, 68, 68, 0.15)',
                  }}
                />
                <svg className="absolute inset-0 w-full h-full animate-[pulse_3s_ease-in-out_infinite]" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Glow underlay */}
                  <polygon
                    points={qualitySvgPoints}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="0.6"
                    opacity="0.6"
                    style={{ filter: 'blur(2px)' }}
                  />
                  {/* Sharp 2px border */}
                  <polygon
                    points={qualitySvgPoints}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="0.2"
                  />
                </svg>
              </div>

              {/* Process & Assembly Zone (BPR Critical / starved) */}
              <div
                className={cn(
                  "absolute inset-0 pointer-events-none transition-opacity duration-[1500ms] ease-in-out z-10",
                  isBprCritical ? "opacity-100" : "opacity-0"
                )}
              >
                <div
                  className="w-full h-full animate-[pulse_3s_ease-in-out_infinite]"
                  style={{
                    clipPath: processClipPath,
                    background: 'rgba(249, 115, 22, 0.15)',
                  }}
                />
                <svg className="absolute inset-0 w-full h-full animate-[pulse_3s_ease-in-out_infinite]" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Glow underlay */}
                  <polygon
                    points={processSvgPoints}
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="0.6"
                    opacity="0.6"
                    style={{ filter: 'blur(2px)' }}
                  />
                  {/* Sharp 2px border */}
                  <polygon
                    points={processSvgPoints}
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="0.2"
                  />
                </svg>
              </div>

              {/* Shipping & Logistics Zone (OTIF Alert) */}
              <div
                className={cn(
                  "absolute inset-0 pointer-events-none transition-opacity duration-[1500ms] ease-in-out z-10",
                  isOtifCritical ? "opacity-100" : "opacity-0"
                )}
              >
                <div
                  className="w-full h-full animate-[pulse_3s_ease-in-out_infinite]"
                  style={{
                    clipPath: shippingClipPath,
                    background: 'rgba(245, 158, 11, 0.15)',
                  }}
                />
                <svg className="absolute inset-0 w-full h-full animate-[pulse_3s_ease-in-out_infinite]" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Glow underlay */}
                  <polygon
                    points={shippingSvgPoints}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="0.6"
                    opacity="0.6"
                    style={{ filter: 'blur(2px)' }}
                  />
                  {/* Sharp 2px border */}
                  <polygon
                    points={shippingSvgPoints}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="0.2"
                  />
                </svg>
              </div>

              {/* Material Flow Zone (Traceability Alert) */}
              <div
                className={cn(
                  "absolute inset-0 pointer-events-none transition-opacity duration-[1500ms] ease-in-out z-10",
                  isTraceabilityCritical ? "opacity-100" : "opacity-0"
                )}
              >
                <div
                  className="w-full h-full animate-[pulse_3s_ease-in-out_infinite]"
                  style={{
                    clipPath: materialClipPath,
                    background: 'rgba(139, 92, 246, 0.15)',
                  }}
                />
                <svg className="absolute inset-0 w-full h-full animate-[pulse_3s_ease-in-out_infinite]" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Glow underlay */}
                  <polygon
                    points={materialSvgPoints}
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="0.6"
                    opacity="0.6"
                    style={{ filter: 'blur(2px)' }}
                  />
                  {/* Sharp 2px border */}
                  <polygon
                    points={materialSvgPoints}
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="0.2"
                  />
                </svg>
              </div>

              {/* Layer 2: Pulsing Floor Hotspots */}
              {cards.map((c) => {
                const isHovered = hoveredCardId === c.id;
                const coord = dynamicRadarCoords[c.id];
                return (
                  <div
                    key={`radar-${c.id}`}
                    style={{
                      position: 'absolute',
                      top: `${coord.top}%`,
                      left: `${coord.left}%`,
                      transform: 'translate(-50%, -50%)',
                      cursor: 'pointer',
                      zIndex: 35,
                    }}
                    onClick={() => onEnterDashboard(c.redirectTarget)}
                    onMouseEnter={() => setHoveredCardId(c.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                    className="group"
                  >
                    <span
                      className={cn(
                        "absolute inline-flex h-8 w-8 rounded-full opacity-75 transition-all duration-300",
                        isHovered ? "animate-[ping_0.7s_linear_infinite]" : "animate-[ping_2s_linear_infinite]"
                      )}
                      style={{ backgroundColor: c.color }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-4.5 w-4.5 border-2 border-white shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-125"
                      style={{ backgroundColor: c.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </span>
                  </div>
                );
              })}

              {/* Layer 3: SVG Leader Lines with Drop-Shadow Neon Glow and pulsing critical zone borders */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Critical Floor Zone SVG Borders */}
                {isOeeCritical && (
                  <polygon
                    points={productionSvgPoints}
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="0.2"
                    className="animate-pulse"
                    style={{
                      filter: 'drop-shadow(0 0 4px #6366F1)',
                    }}
                  />
                )}
                {isInventoryCritical && (
                  <polygon
                    points={warehouseSvgPoints}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="0.2"
                    className="animate-pulse"
                    style={{
                      filter: 'drop-shadow(0 0 4px #10B981)',
                    }}
                  />
                )}
                {isCopqCritical && (
                  <polygon
                    points={qualitySvgPoints}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="0.2"
                    className="animate-pulse"
                    style={{
                      filter: 'drop-shadow(0 0 4px #EF4444)',
                    }}
                  />
                )}
                {isBprCritical && (
                  <polygon
                    points={processSvgPoints}
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="0.2"
                    className="animate-pulse"
                    style={{
                      filter: 'drop-shadow(0 0 4px #F97316)',
                    }}
                  />
                )}
                {isOtifCritical && (
                  <polygon
                    points={shippingSvgPoints}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="0.2"
                    className="animate-pulse"
                    style={{
                      filter: 'drop-shadow(0 0 4px #F59E0B)',
                    }}
                  />
                )}
                {isTraceabilityCritical && (
                  <polygon
                    points={materialSvgPoints}
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="0.2"
                    className="animate-pulse"
                    style={{
                      filter: 'drop-shadow(0 0 4px #8B5CF6)',
                    }}
                  />
                )}

                {/* Connection lines */}
                {cards.map((c) => {
                  const isHighlighted = hoveredCardId === c.id;
                  const start = cardAnchors[c.id];
                  const end = dynamicRadarCoords[c.id];
                  return (
                    <g key={`leader-${c.id}`}>
                      <path
                        d={`M ${start.left} ${start.top} L ${end.left} ${end.top}`}
                        stroke={c.color}
                        strokeWidth={isHighlighted ? 1.5 : 0.6}
                        strokeOpacity={isHighlighted ? 0.95 : 0.35}
                        fill="none"
                        strokeDasharray={isHighlighted ? "none" : "3 3"}
                        className="transition-all duration-300"
                        style={{
                          filter: isHighlighted ? `drop-shadow(0 0 4px ${c.color})` : 'none',
                        }}
                      />
                      <circle
                        cx={start.left}
                        cy={start.top}
                        r={isHighlighted ? 0.8 : 0.5}
                        fill={c.color}
                        className="transition-all duration-300"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Layer 4: General Plant-Wide Index command card */}
              <div
                style={{
                  position: 'absolute',
                  top: '15%',
                  left: '2%',
                  width: '18%',
                  zIndex: 40,
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  background: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(8px)',
                }}
                className="rounded-2xl p-4 flex flex-col gap-3.5 select-none"
              >
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-[7.5px] font-black tracking-widest text-blue-600 uppercase block mb-1">FACTORY GENERAL OVERVIEW</span>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">Plant-Wide Index</h3>
                  <span className="text-[9px] text-slate-400 font-bold">Tata Toyo Radiator (Chakan)</span>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div>
                    <div className="flex justify-between items-baseline text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>OVERALL PLANT OEE</span>
                      <span className="text-slate-800 font-black">{liveData.oee.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${liveData.oee}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>DELIVERY (OTIF)</span>
                      <span className="text-slate-800 font-black">{liveData.otif.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${liveData.otif}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>COPQ LOSS RATIO</span>
                      <span className="text-slate-800 font-black">₹{(liveData.copqLoss / 100000).toFixed(1)} L</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-[8px] font-bold uppercase text-slate-500 tracking-wider flex justify-between items-center">
                  <span>SYSTEM STATUS:</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ONLINE
                  </span>
                </div>
              </div>

              {/* Layer 4: Absolute-positioned KPI Cards */}
              {cards.map((c) => {
                const cardCoord = cardCoords[c.id];
                const isHovered = hoveredCardId === c.id;
                const isPulsing = pulseStates[c.pulseKey];
                return (
                  <div
                    key={`card-${c.id}`}
                    style={{
                      position: 'absolute',
                      top: isHovered ? `${cardCoord.top - 4}%` : `${cardCoord.top}%`,
                      left: isHovered ? `calc(${cardCoord.left}% - 25px)` : `${cardCoord.left}%`,
                      width: isHovered ? '320px' : '270px',
                      zIndex: isHovered ? 50 : 40,
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    }}
                  >
                    <CompactKPICard
                      card={c}
                      isHovered={isHovered}
                      onHover={(hover) => setHoveredCardId(hover ? c.id : null)}
                      onClick={() => onEnterDashboard(c.redirectTarget)}
                      liveData={liveData}
                      isPulsing={isPulsing}
                      onChartNodeClick={(monthName) => handleChartNodeClick(monthName, c.redirectTarget)}
                    />
                  </div>
                );
              })}
            </div>
          ) : activeViewMode === 'RADAR' ? (
            /* ── L0 GATEWAY "LIGHTHOUSE RADAR" VIEW ── */
            <div
              style={{
                backgroundImage: `url(${lighthouseBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'all 0.5s ease'
              }}
              className="relative w-full aspect-[16/9] rounded-3xl border border-slate-200/50 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12)] overflow-hidden flex items-center justify-center"
            >
              {/* Dynamic Spotlight Projection Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-25" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  {/* Glowing Spotlight Gradients */}
                  <radialGradient id="radarRedSpotlight" cx="50%" cy="43.5%" r="50%">
                    <stop offset="0%" stopColor="rgba(177, 37, 37, 0.88)" />
                    <stop offset="70%" stopColor="rgba(239, 68, 68, 0.77)" />
                    <stop offset="100%" stopColor="rgba(239, 68, 68, 0.86)" />
                  </radialGradient>
                  <radialGradient id="radarBlueSpotlight" cx="50%" cy="43.5%" r="50%">
                    <stop offset="0%" stopColor="rgba(38, 211, 217, 0.79)" />
                    <stop offset="70%" stopColor="rgba(20, 113, 220, 0.88)" />
                    <stop offset="100%" stopColor="rgba(26, 55, 183, 0.82)" />
                  </radialGradient>
                </defs>

                {(() => {
                  const radarCoords: Record<number, { x2: number, y2: number, points: string, isCritical: boolean }> = {
                    1: { x2: 16, y2: 15, points: "50,43.5 8,19 22,8", isCritical: isOeeCritical }, // OEE
                    3: { x2: 84, y2: 15, points: "50,43.5 78,8 92,19", isCritical: isCopqCritical }, // COPQ
                    4: { x2: 15, y2: 50, points: "50,43.5 15,47 15,53", isCritical: isBprCritical }, // BPR
                    5: { x2: 85, y2: 50, points: "50,43.5 85,47 85,53", isCritical: isOtifCritical }, // OTIF
                    2: { x2: 16, y2: 78, points: "50,43.5 8,74 22,84", isCritical: isInventoryCritical }, // Inventory
                    6: { x2: 84, y2: 78, points: "50,43.5 78,84 92,74", isCritical: isTraceabilityCritical }, // Traceability
                  };

                  return Object.entries(radarCoords).map(([cardIdStr, coord]) => {
                    const cardId = Number(cardIdStr);
                    const isActive = cardId === activeSpotlightCardId;

                    const showSpotlight = isActive;
                    const spotlightFill = coord.isCritical ? "url(#radarRedSpotlight)" : "url(#radarBlueSpotlight)";
                    const pulseClass = coord.isCritical ? "animate-pulse" : "";

                    const lineColor = coord.isCritical
                      ? (isActive ? "#EF4444" : "rgba(239, 68, 68, 0.3)")
                      : (isActive ? "rgba(143, 221, 223, 0.7)" : "rgba(143, 221, 223, 0.2)");

                    return (
                      <g key={`radar-ray-${cardId}`}>
                        {/* Connecting Leader Line (always visible, highlight active card) */}
                        <line
                          x1="50"
                          y1="43.5"
                          x2={coord.x2}
                          y2={coord.y2}
                          stroke={lineColor}
                          strokeWidth={isActive ? "0.45" : "0.2"}
                          strokeDasharray="2.5 2.5"
                          style={{
                            transition: 'all 0.5s ease-in-out',
                            filter: isActive && coord.isCritical ? 'drop-shadow(0 0 4px #EF4444)' : 'none'
                          }}
                        />

                        {/* Dynamic spotlight wedge */}
                        {showSpotlight && (
                          <polygon
                            points={coord.points}
                            fill={spotlightFill}
                            className={pulseClass}
                            style={{
                              transition: 'opacity 0.5s ease-in-out',
                              opacity: spotlightOpacity * (coord.isCritical ? 0.85 : 0.45)
                            }}
                          />
                        )}
                      </g>
                    );
                  });
                })()}
              </svg>

              {/* Pulsing Light Source Beacon at center lantern room */}
              <div
                className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none w-4 h-4 rounded-full flex items-center justify-center"
                style={{ top: '43.5%' }}
              >
                <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-300 shadow-[0_0_8px_#FACC15]" />
              </div>

              {/* Layer 5: Symmetrically distributed KPICards with Spotlight Scaling */}
              {(() => {
                const radarCardCoords: Record<number, { top: string, left: string }> = {
                  1: { top: '15%', left: '16%' },
                  3: { top: '15%', left: '84%' },
                  4: { top: '50%', left: '15%' },
                  5: { top: '50%', left: '85%' },
                  2: { top: '78%', left: '16%' },
                  6: { top: '78%', left: '84%' },
                };

                return cards.map((c) => {
                  const coord = radarCardCoords[c.id];
                  if (!coord) return null;

                  const isHovered = hoveredCardId === c.id;
                  const isSpotlightActive = c.id === activeSpotlightCardId;
                  const isPulsing = pulseStates[c.pulseKey];
                  const isWarningActive = (() => {
                    if (c.id === 1) return liveData.oee < 70;
                    if (c.id === 3) return liveData.copqLoss > 3500000;
                    if (c.id === 4) return liveData.daysOfSupply < 12.0;
                    if (c.id === 5) return liveData.otif < 94.2;
                    return false;
                  })();
                  const isWarning = isWarningActive && !isHovered;
                  const warningColor = c.id === 4 ? '#F97316' : '#EF4444';
                  const warningShadow = c.id === 4
                    ? '0 15px 35px -5px rgba(249, 115, 22, 0.2), 0 0 15px 2px rgba(249, 115, 22, 0.15)'
                    : '0 15px 35px -5px rgba(239, 68, 68, 0.2), 0 0 15px 2px rgba(239, 68, 68, 0.15)';

                  // Float style with shadow matching the light-themed backdrop
                  const cardShadow = isHovered
                    ? (c.id === 1
                      ? '0 20px 25px -5px rgba(93, 28, 106, 0.25), 0 10px 10px -5px rgba(93, 28, 106, 0.15)'
                      : (c.id === 5
                        ? '0 20px 25px -5px rgba(245, 120, 139, 0.25), 0 10px 10px -5px rgba(245, 120, 139, 0.15)'
                        : `0 20px 25px -5px rgba(${c.rgb}, 0.15), 0 10px 10px -5px rgba(${c.rgb}, 0.05)`))
                    : '0 8px 16px -6px rgba(15,23,42,0.08), 0 4px 8px -4px rgba(15,23,42,0.04)';

                  return (
                    <div
                      key={`radar-card-${c.id}`}
                      style={{
                        position: 'absolute',
                        top: isHovered ? `calc(${coord.top} - 18px)` : coord.top,
                        left: isHovered ? `calc(${coord.left} - 25px)` : coord.left,
                        width: isHovered ? '320px' : '270px',
                        transform: isSpotlightActive ? 'translate(-50%, -50%) scale(1.02)' : 'translate(-50%, -50%) scale(1)',
                        zIndex: isHovered ? 50 : 40,
                        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      }}
                    >
                      <div
                        style={{
                          borderRadius: '16px',
                          boxShadow: isWarning ? warningShadow : cardShadow,
                          border: isWarning
                            ? `2px solid ${warningColor}`
                            : (isSpotlightActive ? `2px solid ${c.color}` : '1px solid rgba(226, 232, 240, 0.8)'),
                          transition: 'all 0.4s ease'
                        }}
                      >
                        <CompactKPICard
                          card={c}
                          isHovered={isHovered}
                          onHover={(hover) => setHoveredCardId(hover ? c.id : null)}
                          onClick={() => onEnterDashboard(c.redirectTarget)}
                          liveData={liveData}
                          isPulsing={isPulsing}
                          onChartNodeClick={(monthName) => handleChartNodeClick(monthName, c.redirectTarget)}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            /* ── STANDARD SYMMETRICAL GRID VIEW ── */
            <div className="grid grid-cols-3 gap-5 animate-in fade-in duration-300">
              {cards.map((card) => {
                const Icon = card.icon;
                const isPulsing = pulseStates[card.pulseKey];

                const yTicks = card.id === 3 ? [0, 1000000, 2000000, 3000000, 4000000, 5000000, 6000000] : (card.id === 2 ? [0, 500, 1000, 1500, 2000] : (card.id === 4 ? [0, 25, 50, 75, 100] : [0, 25, 50, 75, 100]));
                const yDomain = card.id === 3 ? [0, 6000000] : (card.id === 2 ? [0, 2000] : (card.id === 4 ? [0, 100] : [0, 100]));
                const tickFormatter = (v: any) => {
                  if (card.id === 1 || card.id === 6 || card.id === 5) return `${v}%`;
                  if (card.id === 3) return v === 0 ? '₹0' : `₹${v / 100000} L`;
                  if (card.id === 2) return v.toLocaleString();
                  if (card.id === 4) return `${v}%`;
                  return v;
                };

                const isHovered = hoveredCardId === card.id;

                const isWarningActive = (() => {
                  if (card.id === 1) return liveData.oee < 70;
                  if (card.id === 3) return liveData.copqLoss > 3500000;
                  if (card.id === 4) return liveData.daysOfSupply < 12.0;
                  if (card.id === 5) return liveData.otif < 94.2;
                  return false;
                })();
                const showWarningHighlight = isWarningActive && !isHovered;
                const warningColor = card.id === 4 ? '#F97316' : '#EF4444';
                const warningShadow = card.id === 4
                  ? '0 15px 35px -5px rgba(249, 115, 22, 0.2), 0 0 15px 2px rgba(249, 115, 22, 0.15)'
                  : '0 15px 35px -5px rgba(239, 68, 68, 0.2), 0 0 15px 2px rgba(239, 68, 68, 0.15)';

                return (
                  <div
                    key={card.id}
                    onClick={() => onEnterDashboard(card.redirectTarget)}
                    onMouseEnter={() => setHoveredCardId(card.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                    className="group relative overflow-hidden rounded-2xl bg-white/95 p-4 cursor-pointer shadow-md"
                    style={{
                      boxShadow: showWarningHighlight
                        ? warningShadow
                        : (isHovered
                          ? (card.id === 1
                            ? '0 20px 25px -5px rgba(93, 28, 106, 0.25), 0 10px 10px -5px rgba(93, 28, 106, 0.15)'
                            : (card.id === 5
                              ? '0 20px 25px -5px rgba(245, 120, 139, 0.25), 0 10px 10px -5px rgba(245, 120, 139, 0.15)'
                              : `0 20px 25px -5px rgba(${card.rgb}, 0.15), 0 10px 10px -5px rgba(${card.rgb}, 0.05)`))
                          : '0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 4px 6px -4px rgba(15, 23, 42, 0.05)'),
                      border: showWarningHighlight
                        ? `2px solid ${warningColor}`
                        : (isHovered
                          ? (card.id === 1
                            ? '1px solid rgba(93, 28, 106, 0.4)'
                            : (card.id === 5
                              ? '1px solid rgba(245, 120, 139, 0.4)'
                              : `1px solid rgba(${card.rgb}, 0.4)`))
                          : '1px solid rgba(226, 232, 240, 0.9)'),
                      background: isHovered
                        ? (card.id === 1
                          ? 'radial-gradient(circle at center, rgba(93, 28, 106, 0.08) 0%, #FFFFFF 85%)'
                          : (card.id === 5
                            ? 'radial-gradient(circle at center, rgba(245, 120, 139, 0.08) 0%, #FFFFFF 85%)'
                            : `radial-gradient(circle at center, rgba(${card.rgb}, 0.08) 0%, #FFFFFF 85%)`))
                        : '#FFFFFF',
                      transform: isHovered ? 'translateY(-4px)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="relative w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 mr-3"
                          style={{ backgroundColor: card.trackWash }}
                        >
                          <Icon className="w-5 h-5 relative z-10 transition-transform duration-200 group-hover:scale-110" style={{ color: card.color }} />
                        </div>

                        <div className="min-w-0">
                          <span className={cn(
                            "text-[7px] font-black tracking-widest px-1.5 py-0.5 rounded-full mb-1 inline-block uppercase leading-none",
                            card.categoryPillClass
                          )}>
                            {card.classification}
                          </span>
                          <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                            {card.title}
                          </h3>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span
                              style={{
                                color: showWarningHighlight ? warningColor : undefined
                              }}
                              className={cn(
                                "text-base font-black tracking-tight transition-all duration-300",
                                isPulsing ? "scale-105 text-blue-600 animate-pulse" : (showWarningHighlight ? "" : "text-slate-900")
                              )}
                            >
                              {card.retroValue.split(' ')[0]}
                            </span>
                            <span
                              style={{
                                color: showWarningHighlight ? warningColor : undefined
                              }}
                              className="text-[9px] font-bold text-slate-500"
                            >
                              {card.retroValue.split(' ').slice(1).join(' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                        "flex flex-col items-center justify-center px-1.5 py-1 rounded-lg text-center min-w-[64px] shrink-0",
                        card.trendBadgeBgClass
                      )}>
                        <span className={cn("text-[9px] font-black flex items-center gap-0.5", card.trendTextClass)}>
                          {card.trendText}
                        </span>
                        <span className="text-[7px] font-bold text-slate-500 leading-none mt-0.5">
                          {card.trendSub}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#F8FAFC]/80 border border-slate-100 rounded-xl p-2.5 flex items-center gap-2.5 shadow-inner">
                      <div className={cn(
                        "flex items-center justify-center rounded-lg p-1.5 border shrink-0",
                        card.leadingIconBgClass
                      )}>
                        {(() => {
                          const LeadingIcon = card.leadingIcon;
                          return <LeadingIcon className="w-3.5 h-3.5" style={{ color: card.color }} />;
                        })()}
                      </div>
                      <div className="min-w-0 flex-grow flex items-center gap-1.5 pt-0.5">
                        <p className="text-[11px] font-black text-slate-800 leading-none">
                          {card.leadingValue}
                        </p>
                        <span className="text-[10px] text-slate-300 leading-none font-light">|</span>
                        <p className="text-[8px] text-slate-500 font-semibold leading-none">
                          {card.leadingLabel}
                        </p>
                      </div>
                    </div>

                    <div className="w-full h-24 mt-3.5">
                      {card.chartType === 'area' ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={card.chartData}
                            margin={{ top: 10, right: 5, left: 12, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id={`areaGrad-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={card.color} stopOpacity={0.35} />
                                <stop offset="100%" stopColor={card.lighterColor || card.color} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 8, fill: '#64748B', fontWeight: 600 }}
                              axisLine={false}
                              tickLine={{ stroke: '#CBD5E1', strokeWidth: 1 }}
                              tickSize={3}
                              dy={4}
                            />
                            <YAxis
                              tick={{ fontSize: 8, fill: '#64748B', fontWeight: 600 }}
                              axisLine={false}
                              tickLine={false}
                              ticks={yTicks}
                              domain={yDomain}
                              tickFormatter={tickFormatter}
                              width={30}
                            />
                            {card.id === 1 && (
                              <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="3 3" />
                            )}
                            {(card.id === 1 || card.id === 5) && (
                              <Tooltip content={<MiniChartTooltip unit={card.id === 1 ? "% OEE" : "% OTIF"} />} cursor={false} />
                            )}
                            {card.id === 4 ? (
                              <>
                                <Area type="step" dataKey="overstock" fill="url(#blueGradGrid)" fillOpacity={0.2} stroke="#3B82F6" strokeWidth={0} />
                                <Area type="step" dataKey="safe" fill="url(#greenGradGrid)" fillOpacity={0.2} stroke="#10B981" strokeWidth={0} />
                                <Area type="step" dataKey="warning" fill="url(#amberGradGrid)" fillOpacity={0.4} stroke="#F59E0B" strokeWidth={0} />
                                <Area type="step" dataKey="critical" fill="url(#redGradGrid)" fillOpacity={0.5} stroke="#EF4444" strokeWidth={0} />
                                <Area type="step" dataKey="value" stroke="#3B82F6" strokeWidth={1.5} fill="none" dot={{ r: 1.5, stroke: "#3B82F6", strokeWidth: 0.5, fill: "#ffffff" }} activeDot={{ r: 3, stroke: "#3B82F6", strokeWidth: 0.5, fill: "#3B82F6" }} />
                              </>
                            ) : (
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke={card.color}
                                strokeWidth={1.75}
                                fill={`url(#areaGrad-${card.id})`}
                                dot={{ r: 1.5, stroke: card.color, strokeWidth: 0.75, fill: '#ffffff' }}
                                activeDot={{
                                  r: 3,
                                  stroke: card.color,
                                  strokeWidth: 1.5,
                                  fill: card.color,
                                  style: {
                                    transform: 'scale(1.3)',
                                    transformOrigin: 'center',
                                    filter: `drop-shadow(0 0 6px ${card.color})`,
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                  },
                                  onClick: (e: any, payload: any) => {
                                    if (e && e.stopPropagation) e.stopPropagation();
                                    const clickedMonth = payload?.payload?.name || payload?.name || e?.payload?.name || e?.name;
                                    if (clickedMonth && (card.id === 1 || card.id === 5)) {
                                      handleChartNodeClick(clickedMonth, card.redirectTarget);
                                    }
                                  }
                                }}
                              />
                            )}
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={card.chartData}
                            margin={{ top: 10, right: 5, left: 12, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id={`barGrad-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={card.color} />
                                <stop offset="100%" stopColor={card.lighterColor || card.color} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 8, fill: '#64748B', fontWeight: 600 }}
                              axisLine={false}
                              tickLine={{ stroke: '#CBD5E1', strokeWidth: 1 }}
                              tickSize={3}
                              dy={4}
                            />
                            <YAxis
                              tick={{ fontSize: 8, fill: '#64748B', fontWeight: 600 }}
                              axisLine={false}
                              tickLine={false}
                              ticks={yTicks}
                              domain={yDomain}
                              tickFormatter={tickFormatter}
                              width={30}
                            />
                            {card.id === 5 && (
                              <ReferenceLine y={95} stroke="#F59E0B" strokeDasharray="3 3" />
                            )}
                            {(card.id === 1 || card.id === 5) && (
                              <Tooltip content={<MiniChartTooltip unit={card.id === 5 ? "% OTIF" : " L"} />} cursor={false} />
                            )}
                            <Bar
                              dataKey="value"
                              radius={[2, 2, 0, 0]}
                              maxBarSize={10}
                              onMouseEnter={(data: any, state: any) => {
                                setGridHoveredCardId(card.id);
                                if (state && typeof state.activeIndex === 'number') {
                                  setGridHoveredBarIndex(state.activeIndex);
                                }
                              }}
                              onMouseLeave={() => {
                                setGridHoveredCardId(null);
                                setGridHoveredBarIndex(null);
                              }}
                              onClick={(data: any, index: number, e: any) => {
                                const eventObj = e || (index && typeof index === 'object' && index) || data;
                                if (eventObj && eventObj.stopPropagation) {
                                  eventObj.stopPropagation();
                                }
                                const clickedMonth = data?.name || data?.payload?.name || data?.activeLabel;
                                if (clickedMonth && (card.id === 1 || card.id === 5)) {
                                  handleChartNodeClick(clickedMonth, card.redirectTarget);
                                }
                              }}
                            >
                              {card.chartData.map((entry: any, index: number) => {
                                const isActive = gridHoveredCardId === card.id && gridHoveredBarIndex === index;
                                return (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={`url(#barGrad-${card.id})`}
                                    style={{
                                      transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                      transformOrigin: 'bottom center',
                                      filter: isActive ? `drop-shadow(0 0 4px ${card.color})` : 'none',
                                      transition: 'all 0.2s ease',
                                      cursor: 'pointer'
                                    }}
                                  />
                                );
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100/70 flex items-center justify-end">
                      <span className="text-[8px] font-extrabold tracking-widest uppercase text-slate-400 group-hover:text-slate-800 transition-colors duration-200 flex items-center gap-1">
                        Access Diagnostics
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 text-slate-400 group-hover:text-slate-800" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Insights shortcut CTA */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => onEnterDashboard('overview')}
              className="group flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 text-white font-black text-[11px] tracking-widest uppercase shadow-[0_6px_20px_rgba(37,99,235,0.18)] hover:shadow-[0_12px_28px_rgba(37,99,235,0.35)] transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              for manufacturing insights click here
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-4 text-center shrink-0 border-t border-slate-200/50 bg-white/50 backdrop-blur-md">
        <p className="text-[9px] text-slate-400 tracking-[0.16em] uppercase font-bold">
          ATLAS Enterprise Operational Gateway · Secure Layer v2.0.2
        </p>
      </footer>
    </div>
  );
}
