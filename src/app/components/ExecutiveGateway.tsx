import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Settings, Layers, ShieldAlert, Package, Truck, GitBranch,
  FileText, Database, ShieldCheck, Calendar, ClipboardCheck, Cpu,
  Activity, Warehouse, TrendingDown, AlertOctagon, PackageCheck, GitCommit
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Cell, ReferenceLine, Tooltip, LabelList } from 'recharts';
import type { PageId } from './Sidebar';
import { cn } from './ui/utils';
import shopFloorBg from '../../assets/Tiu-Plant.png';
import lighthouseBg from '../../assets/21221.png';
import { useFilter, ZONE_METADATA, default15ZoneCoords, defaultMasterControlTowerLayout, defaultContainerSettings, defaultCardCoords, defaultRadarCoords, MasterControlTowerLayout } from '../contexts/FilterContext';

// 7-month YTD historical datasets with high natural variance (Jan to Jul)
const oeeYtdData = [
  { name: 'Apr', value: 81.3 },
  { name: 'May', value: 73.8 },
  { name: 'Jun', value: 79.4 },
  { name: 'Jul', value: 75.0 }
];

const inventoryYtdData = [
  { name: 'Apr', value: 1050 },
  { name: 'May', value: 1220 },
  { name: 'Jun', value: 1140 },
  { name: 'Jul', value: 1192 }
];

const biqYtdData = [
  { name: 'Apr', value: 94.2 },
  { name: 'May', value: 93.8 },
  { name: 'Jun', value: 95.1 },
  { name: 'Jul', value: 94.7 }
];

const rawMaterialYtdData = [
  { name: 'Apr', value: 1 },
  { name: 'May', value: 4 },
  { name: 'Jun', value: 2 },
  { name: 'Jul', value: 0 }
];

const otifYtdData = [
  { name: 'Apr', value: 96.4 },
  { name: 'May', value: 93.1 },
  { name: 'Jun', value: 95.0 },
  { name: 'Jul', value: 93.9 }
];

const traceabilityYtdData = [
  { name: 'Apr', value: 100.0 },
  { name: 'May', value: 99.5 },
  { name: 'Jun', value: 99.9 },
  { name: 'Jul', value: 100.0 }
];

// Percentage coordinates mapping directly to 3D isometric shop floor hotspot regions
const radarCoords: Record<number, { top: number; left: number }> = {
  1: { top: 38, left: 26 }, // OEE Performance Index -> CNC Line (top-left production area)
  2: { top: 23, left: 52 }, // Inventory Pipeline Integrity -> Warehouse (top-center storage racks)
  3: { top: 80, left: 16 }, // BIQ -> Inspection (bottom-left area)
  4: { top: 60, left: 50 }, // Raw Material Coverage -> Assembly (bottom-center area)
  5: { top: 33, left: 72 }, // OTIF Delivery -> Shipping Docks (top-right area)
  6: { top: 75, left: 75 }, // Traceability -> Material Flow (bottom-right area)
};

// Start anchor point for card connection leader lines (left, top percentages in SVG layout)
const cardAnchors: Record<number, { left: number; top: number }> = {
  1: { left: 30, top: 25 }, // OEE card bottom-center
  2: { left: 53, top: 21 }, // Inventory card bottom-center
  3: { left: 18, top: 70 }, // BIQ card right-center
  4: { left: 47, top: 72 }, // BPR card top-center
  5: { left: 78, top: 25 }, // OTIF card bottom-left
  6: { left: 79, top: 81 }, // Traceability card left-center
};

// Dimensions and positions of floating cards surrounding the border in Isometric View
const cardCoords: Record<number, { top: number; left: number; width: number }> = {
  1: { top: 12, left: 22, width: 16.5 }, // OEE Card
  2: { top: 8, left: 45, width: 16.5 }, // Inventory Card
  3: { top: 55, left: 2, width: 16.5 }, // BIQ Card
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
    const isSunday = label === '7' || label === '14' || label === '21' || label === '28';
    if (isSunday) {
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
            Sunday | Factory Holiday (Plant Shutdown)
          </p>
        </div>
      );
    }
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
function CompactKPICard({ card, isHovered, onHover, onClick, liveData, isPulsing, onChartNodeClick, isSpotlightActive, isSectionCard = false }: {
  card: any;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
  liveData: any;
  isPulsing: boolean;
  onChartNodeClick?: (month: string) => void;
  isSpotlightActive?: boolean;
  isSectionCard?: boolean;
}) {
  const Icon = card.icon;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const isSectionOee = card.id === 101 || card.id === 102;
  const isSectionBiq  = card.id === 103 || card.id === 104;

  const getCardCategory = (card: any) => {
    const title = card.title.toLowerCase();
    const classification = card.classification.toLowerCase();
    if (card.id === 1 || title.includes('oee') || classification.includes('performance')) return 'oee';
    if (card.id === 2 || title.includes('inventory') || classification.includes('wip')) return 'inventory';
    if (card.id === 3 || title.includes('biq') || classification.includes('quality')) return 'biq';
    if (title.includes('copq') || classification.includes('loss')) return 'copq';
    if (card.id === 4 || title.includes('bpr') || title.includes('coverage') || classification.includes('buffer') || classification.includes('purchase')) return 'bpr';
    if (card.id === 5 || title.includes('otif') || classification.includes('adherence') || classification.includes('delivery')) return 'otif';
    if (card.id === 6 || title.includes('traceability') || title.includes('serialization') || title.includes('scan') || title.includes('trace')) return 'traceability';
    return 'other';
  };

  const category = getCardCategory(card);

  const yTicks = (category === 'biq' || isSectionBiq)
    ? [0, 25, 50, 75, 100]
    : (category === 'copq'
      ? [0, 1000000, 2000000, 3000000, 4000000, 5000000, 6000000]
      : (card.id === 2 ? [0, 500, 1000, 1500, 2000] : (card.id === 4 ? [0, 25, 50, 75, 100] : [0, 25, 50, 75, 100])));
  
  const yDomain = (category === 'biq' || isSectionBiq)
    ? [0, 100]
    : (category === 'copq'
      ? [0, 6000000]
      : (card.id === 2 ? [0, 2000] : (card.id === 4 ? [0, 100] : [0, 100])));

  const tickFormatter = (v: any) => {
    if (category === 'biq' || isSectionBiq) return `${v}%`;
    if (isSectionOee || category === 'oee' || category === 'traceability' || category === 'otif') return `${v}%`;
    if (category === 'copq') return v === 0 ? '₹0' : `₹${(v / 100000).toFixed(0)} L`;
    if (category === 'inventory') return v.toLocaleString();
    if (category === 'bpr') return `${v}%`;
    return v;
  };

  const getGradientColors = (cat: string) => {
    switch (cat) {
      case 'oee':
        return { start: '#2563EB', end: '#1D4ED8' };
      case 'inventory':
        return { start: '#10B981', end: '#059669' };
      case 'biq':
      case 'copq':
        return { start: '#7C3AED', end: '#6D28D9' };
      case 'bpr':
        return { start: '#0EA5E9', end: '#0284C7' };
      case 'otif':
        return { start: '#F5788B', end: '#FFAE6E' };
      case 'traceability':
        return { start: '#6366F1', end: '#818CF8' };
      default:
        return { start: card.color, end: card.lighterColor || card.color };
    }
  };

  const gradColors = getGradientColors(category);

  const getCardTarget = (cat: string) => {
    if (cat === 'oee') return { y: 80, label: "Target 80%" };
    if (cat === 'inventory') return { y: 1200, label: "Target Limit: 1,200 Units" };
    if (cat === 'biq') return { y: 97, label: "Target 97%" };
    if (cat === 'copq') {
      const isSectionCopq = card.id === 103 || card.id === 104;
      return { y: isSectionCopq ? 15 : 1500000, label: "Target ₹15L" };
    }
    if (cat === 'bpr') {
      if (card.id === 4) return { y: 12, label: "Target 12d" };
      return { y: 75, label: "Target 75%" };
    }
    if (cat === 'otif') return { y: 95, label: "Target 95%" };
    if (cat === 'traceability') return { y: 100, label: "Target 100%" };
    return null;
  };

  const target = getCardTarget(category);

  const getTooltipUnit = (cat: string) => {
    switch (cat) {
      case 'oee': return "% OEE";
      case 'inventory': return " Units";
      case 'biq': return "% FTR";
      case 'copq': return " L";
      case 'bpr': return "% BPR";
      case 'otif': return "% OTIF";
      case 'traceability': return "%";
      default: return "";
    }
  };

  const tooltipUnit = getTooltipUnit(category);

  const formatValue = (value: number) => {
    if (category === 'copq') {
      if (value >= 100000) {
        return `₹${Math.round(value / 100000)}L`;
      } else {
        return `₹${value}L`;
      }
    }
    if (category === 'inventory') {
      return Math.round(value).toLocaleString();
    }
    return `${Math.round(value)}%`;
  };

  const hoverGlow = card.id === 1 || isSectionOee
    ? 'rgba(93, 28, 106, 0.25)'
    : card.id === 5
      ? 'rgba(245, 120, 139, 0.25)'
      : `rgba(${card.rgb}, 0.25)`;

  const normalGlow = card.id === 1 || isSectionOee
    ? 'rgba(93, 28, 106, 0.15)'
    : card.id === 5
      ? 'rgba(245, 120, 139, 0.15)'
      : `rgba(${card.rgb}, 0.15)`;

  const isWarningActive = (() => {
    if (card.id === 102 || card.id === 104) return true;
    if (card.id === 1) return liveData.oee < 70;
    if (card.id === 3) return liveData.biqFtr < 95.0;
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
      : (isSpotlightActive ? `2px solid ${card.color}` : '1px solid rgba(226, 232, 240, 0.8)'),
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
    justifyContent: isHovered ? 'space-between' : undefined,
    width: isHovered ? '320px' : '270px',
    height: isHovered ? '260px' : '110px',
    padding: '12px',
    paddingBottom: '12px',
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
          maxHeight: isHovered ? '200px' : '0px',
          opacity: isHovered ? 1 : 0,
          transition: 'all 0.3s ease-in-out',
          visibility: isHovered ? 'visible' : 'hidden',
        }}
        className="flex flex-col justify-between flex-grow w-full mt-1 overflow-hidden"
      >
        {/* The Recharts Graph */}
        <div className="w-full overflow-hidden shrink-0 flex-grow" style={{ minHeight: '160px', flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={card.chartData} barCategoryGap="25%" margin={{ top: 10, right: 5, left: 16, bottom: 5 }}>
              <defs>
                <linearGradient id={`barGradHover-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradColors.start} />
                  <stop offset="100%" stopColor={gradColors.end} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} dy={4} />
              <YAxis tick={{ fontSize: 7, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} ticks={yTicks} domain={yDomain} tickFormatter={tickFormatter} width={25} />
              {target && (
                <ReferenceLine y={target.y} stroke="#EF4444" strokeDasharray="3 3" label={{ value: target.label, fill: '#EF4444', fontSize: 7, fontWeight: 700 }} />
              )}
              <Tooltip content={<MiniChartTooltip unit={tooltipUnit} />} cursor={false} />
              <Bar
                dataKey="value"
                radius={[3, 3, 0, 0]}
                maxBarSize={isHovered ? 22 : 14}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
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
                  const isAnyActive = activeIndex !== null;
                  const opacity = isAnyActive ? (isActive ? 1 : 0.6) : 1;
                  return (
                    <Cell
                      key={`cell-hover-${index}`}
                      fill={`url(#barGradHover-${card.id})`}
                      opacity={opacity}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                      style={{
                        transform: isActive ? 'scaleY(1.06)' : 'scaleY(1)',
                        transformOrigin: 'bottom center',
                        filter: isActive ? `drop-shadow(0 0 6px ${gradColors.start})` : 'none',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    />
                  );
                })}
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={formatValue}
                  fontSize={7.5}
                  fontWeight={700}
                  fill="#475569"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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
  const { calibratedIsometricCoords, calibrated15ZoneCoords, setCalibrated15ZoneCoords, masterControlTowerLayout, setMasterControlTowerLayout } = useFilter();

  const zone15ClipPaths = useMemo(() => {
    const paths: Record<string, string> = {};
    ZONE_METADATA.forEach(zone => {
      const pts = calibrated15ZoneCoords[zone.id] || default15ZoneCoords[zone.id];
      paths[zone.id] = `polygon(${pts.map(p => `${p.x}% ${p.y}%`).join(', ')})`;
    });
    return paths;
  }, [calibrated15ZoneCoords]);

  const zone15SvgPoints = useMemo(() => {
    const svgPts: Record<string, string> = {};
    ZONE_METADATA.forEach(zone => {
      const pts = calibrated15ZoneCoords[zone.id] || default15ZoneCoords[zone.id];
      svgPts[zone.id] = pts.map(p => `${p.x},${p.y}`).join(' ');
    });
    return svgPts;
  }, [calibrated15ZoneCoords]);

  const zone15Centroids = useMemo(() => {
    const centroids: Record<string, { x: number; y: number }> = {};
    ZONE_METADATA.forEach(zone => {
      const pts = calibrated15ZoneCoords[zone.id] || default15ZoneCoords[zone.id];
      const sumX = pts.reduce((acc, curr) => acc + curr.x, 0);
      const sumY = pts.reduce((acc, curr) => acc + curr.y, 0);
      centroids[zone.id] = { x: sumX / pts.length, y: sumY / pts.length };
    });
    return centroids;
  }, [calibrated15ZoneCoords]);

  const getZoneColorAlpha = (color: string, alphaHex: string) => {
    if (!color) return `#0EA5E9${alphaHex}`;
    const cleanHex = color.startsWith('#') ? color.slice(1, 7) : color.slice(0, 6);
    return `#${cleanHex}${alphaHex}`;
  };

  // Exception-Based Limited Hotspots Engine (Max 2-3 Hotspots at a time)
  // All other 12+ non-alert zones remain 100% transparent (opacity: 0) unless hovered via card/zone peek.
  const EXCEPTION_HOTSPOTS = useMemo(() => {
    return {
      zone6: {
        status: 'critical' as const,
        tag: 'Critical Bottleneck Alert',
        label: 'Post-Machining LW1 Welder Bottleneck (OEE < 70%)',
        color: '#EF4444',
        bgFill: 'rgba(239, 68, 68, 0.22)',
        hoverBgFill: 'rgba(239, 68, 68, 0.45)',
        borderColor: '#EF4444',
        strokeWidth: '0.55',
        shadow: 'drop-shadow(0 0 12px #EF4444)',
      },
      zone8: {
        status: 'warning' as const,
        tag: 'Secondary Warning',
        label: 'CL1 Station Chemical Wash Queue Overrun',
        color: '#F59E0B',
        bgFill: 'rgba(245, 158, 11, 0.18)',
        hoverBgFill: 'rgba(245, 158, 11, 0.38)',
        borderColor: '#F59E0B',
        strokeWidth: '0.45',
        shadow: 'drop-shadow(0 0 8px #F59E0B)',
      },
      zone1: {
        status: 'optimal' as const,
        tag: 'Optimal Flow Peak',
        label: 'Top Throughput OP-30 Line (BPR 94.2%)',
        color: '#10B981',
        bgFill: 'rgba(16, 185, 129, 0.12)',
        hoverBgFill: 'rgba(16, 185, 129, 0.30)',
        borderColor: '#10B981',
        strokeWidth: '0.35',
        shadow: 'drop-shadow(0 0 6px #10B981)',
      },
    };
  }, []);

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
    oee: 73.5,
    overduePms: 0.5,
    activeWipUnits: 1192,
    wipAge: 12.8,
    daysOfSupply: 12.0,
    biqFtr: 94.7,
    qGate: 98.2,
    otif: 94.4,
    scheduleAdherence: 1.5,
    serialization: 100,
    unmappedComponents: 0.0,
  });

  const [pulseStates, setPulseStates] = useState<Record<string, boolean>>({});
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const [gridHoveredBarIndex, setGridHoveredBarIndex] = useState<number | null>(null);
  const [gridHoveredCardId, setGridHoveredCardId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'ISOMETRIC' | 'RADAR' | 'CALIBRATION'>('RADAR');
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [selectedCalibrationZone, setSelectedCalibrationZone] = useState<string>('zone1');
  const [local15ZoneCoords, setLocal15ZoneCoords] = useState<IsometricZoneCoords>(() => {
    return { ...calibrated15ZoneCoords };
  });
  const [activePinIndex, setActivePinIndex] = useState<number>(0);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isMasterPlacementModeActive, setIsMasterPlacementModeActive] = useState<boolean>(true);
  const [localMasterLayout, setLocalMasterLayout] = useState<MasterControlTowerLayout>(() => {
    return { ...masterControlTowerLayout };
  });

  useEffect(() => {
    setLocal15ZoneCoords({ ...calibrated15ZoneCoords });
  }, [calibrated15ZoneCoords, viewMode]);

  useEffect(() => {
    setLocalMasterLayout({ ...masterControlTowerLayout });
  }, [masterControlTowerLayout, viewMode]);

  const containerScaleClass = useMemo(() => {
    const mode = localMasterLayout.containerSettings?.scaleMode || 'stretch';
    if (mode === 'contain') return 'bg-contain bg-center bg-no-repeat';
    if (mode === 'cover') return 'bg-cover bg-center';
    return 'bg-[length:100%_100%] bg-center bg-no-repeat';
  }, [localMasterLayout.containerSettings?.scaleMode]);

  const handleElementDrag = (
    e: React.MouseEvent,
    type: 'card' | 'radar',
    id: string
  ) => {
    e.preventDefault();
    const container = e.currentTarget.closest('.map-canvas-container') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const xPercent = +Math.min(92, Math.max(0, ((moveEvent.clientX - rect.left) / rect.width) * 100)).toFixed(1);
      const yPercent = +Math.min(92, Math.max(0, ((moveEvent.clientY - rect.top) / rect.height) * 100)).toFixed(1);

      setLocalMasterLayout(prev => {
        if (type === 'card') {
          return {
            ...prev,
            cardCoords: {
              ...prev.cardCoords,
              [id]: {
                ...(prev.cardCoords[id] || { id, top: 0, left: 0 }),
                left: xPercent,
                top: yPercent,
              }
            }
          };
        } else {
          return {
            ...prev,
            radarCoords: {
              ...prev.radarCoords,
              [id]: {
                ...(prev.radarCoords[id] || { id, top: 0, left: 0 }),
                left: xPercent,
                top: yPercent,
              }
            }
          };
        }
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const [selectedRadarKpi, setSelectedRadarKpi] = useState<number>(1);
  const [expandedSection, setExpandedSection] = useState<'premachining' | 'postmachining' | null>(null);
  const [hoveredSection, setHoveredSection] = useState<'premachining' | 'postmachining' | null>(null);
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

  const getZoneGlowStyle = (zoneId: string) => {
    if (viewMode === 'ISOMETRIC') {
      let isRed = false;
      if (selectedRadarKpi === 2) {
        // Inventory Mode: Only Assembly (process) glows Red
        isRed = (zoneId === 'process');
      } else if (selectedRadarKpi === 3) {
        // COPQ Mode: Only Quality Inspection glows Red
        isRed = (zoneId === 'quality');
      } else if (selectedRadarKpi === 4) {
        // BPR Mode: Only Process & Assembly glows Red
        isRed = (zoneId === 'process');
      } else if (selectedRadarKpi === 5) {
        // OTIF Mode: Only Shipping Docks glows Red
        isRed = (zoneId === 'shipping');
      } else if (selectedRadarKpi === 6) {
        // Traceability Mode: Only Welding (material) glows Red
        isRed = (zoneId === 'material');
      } else {
        // OEE Mode (1) / Default: Only Assembly (process) glows Red
        isRed = (zoneId === 'process');
      }

      if (isRed) {
        return { glow: 'rgba(239, 68, 68, 0.18)', stroke: '#EF4444', isCritical: true };
      } else {
        // Healthy zones: transparent, with light-yellow outline (handled at render time with low opacity)
        return { glow: 'transparent', stroke: 'rgba(254, 240, 138, 0.45)', isCritical: false };
      }
    }

    // Default Radar view exception glows
    switch (zoneId) {
      case 'production': return isOeeCritical ? { glow: 'rgba(99, 102, 241, 0.15)', stroke: '#6366F1', isCritical: true } : null;
      case 'warehouse': return isInventoryCritical ? { glow: 'rgba(16, 185, 129, 0.15)', stroke: '#10B981', isCritical: true } : null;
      case 'quality': return isCopqCritical ? { glow: 'rgba(239, 68, 68, 0.15)', stroke: '#EF4444', isCritical: true } : null;
      case 'process': return isBprCritical ? { glow: 'rgba(249, 115, 22, 0.15)', stroke: '#F97316', isCritical: true } : null;
      case 'shipping': return isOtifCritical ? { glow: 'rgba(245, 158, 11, 0.15)', stroke: '#F59E0B', isCritical: true } : null;
      case 'material': return isTraceabilityCritical ? { glow: 'rgba(139, 92, 246, 0.15)', stroke: '#8B5CF6', isCritical: true } : null;
      default: return null;
    }
  };

  // Monitor resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1150);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  const chartDataWithLive = useMemo(() => {
    return {
      oee: [...oeeYtdData.slice(0, 3), { name: 'Jul', value: liveData.oee }],
      inventory: [...inventoryYtdData.slice(0, 3), { name: 'Jul', value: liveData.activeWipUnits }],
      biq: [...biqYtdData.slice(0, 3), { name: 'Jul', value: liveData.biqFtr }],
      purchase: [
        { name: 'Apr', critical: 15, warning: 30, safe: 70, overstock: 100, value: 48 },
        { name: 'May', critical: 15, warning: 30, safe: 70, overstock: 100, value: 64 },
        { name: 'Jun', critical: 15, warning: 30, safe: 70, overstock: 100, value: 72 },
        { name: 'Jul', critical: 15, warning: 30, safe: 70, overstock: 100, value: Math.round(liveData.daysOfSupply * 5.8) }
      ],
      otif: [...otifYtdData.slice(0, 3), { name: 'Jul', value: liveData.otif }],
      compliance: [...traceabilityYtdData.slice(0, 3), { name: 'Jul', value: liveData.serialization }],
    };
  }, [liveData]);

  const getCommandCardData = () => {
    switch (selectedRadarKpi) {
      case 2: // Inventory Pipeline
        return {
          title: "PLANT-WIDE INVENTORY FLOW",
          rows: [
            { label: "TOTAL WIP ON FLOOR", valText: "2,405 Units", pct: (2405 / 3000) * 100, color: "#10B981" },
            { label: "PRE-MACHINING WIP", valText: "1,190 Units", pct: (1190 / 3000) * 100, color: "#0EA5E9" },
            { label: "POST-MACHINING WIP", valText: "2,850 Units", pct: (2850 / 3000) * 100, color: "#EF4444" },
          ]
        };
      case 3: // BIQ
        return {
          title: "PLANT-WIDE BUILT-IN QUALITY INDEX",
          rows: [
            { label: "OVERALL FTR RATE", valText: "94.7%", pct: 94.7, color: "#7C3AED" },
            { label: "PRE-MACHINING FTR", valText: "96.2%", pct: 96.2, color: "#0EA5E9" },
            { label: "POST-MACHINING FTR", valText: "91.5%", pct: 91.5, color: "#EF4444" },
          ]
        };
      case 4: // BPR
        return {
          title: "PLANT-WIDE BUFFER HEALTH INDEX",
          rows: [
            { label: "AVERAGE BPR INDEX", valText: "88.0%", pct: 88.0, color: "#F59E0B" },
            { label: "PRE-MACHINING BUFFER", valText: "94.2%", pct: 94.2, color: "#10B981" },
            { label: "POST-MACHINING BUFFER", valText: "62.0%", pct: 62.0, color: "#EF4444" },
          ]
        };
      case 5: // OTIF
        return {
          title: "PLANT-WIDE OTIF DELIVERY INDEX",
          rows: [
            { label: "OVERALL OTIF", valText: "94.4%", pct: 94.4, color: "#F97316" },
            { label: "PRE-MACHINING SCHEDULE", valText: "98.1%", pct: 98.1, color: "#10B981" },
            { label: "POST-MACHINING DISPATCH", valText: "88.5%", pct: 88.5, color: "#EF4444" },
          ]
        };
      case 6: // Traceability
        return {
          title: "DIGITAL THREAD SERIALIZATION",
          rows: [
            { label: "COMPLIANCE INDEX", valText: "99.4%", pct: 99.4, color: "#6366F1" },
            { label: "PRE-MACHINING SCANS", valText: "100.0%", pct: 100.0, color: "#10B981" },
            { label: "POST-MACHINING SCANS", valText: "78.2%", pct: 78.2, color: "#EF4444" },
          ]
        };
      case 1:
      default: // OEE
        return {
          title: "PLANT-WIDE OEE INDEX",
          rows: [
            { label: "OVERALL PLANT OEE", valText: "73.5%", pct: 73.5, color: "#3B82F6" },
            { label: "PRE-MACHINING OEE", valText: "76.2%", pct: 76.2, color: "#0EA5E9" },
            { label: "POST-MACHINING OEE", valText: "68.4%", pct: 68.4, color: "#EF4444" },
          ]
        };
    }
  };

  const getSectionCards = () => {
    if (selectedRadarKpi === 2) {
      // Inventory
      return [
        {
          id: 101,
          title: 'Premachining Inventory',
          hoverGlowClass: 'hover:border-emerald-300',
          icon: Warehouse,
          color: '#10B981',
          lighterColor: '#059669',
          trackWash: 'rgba(16, 185, 129, 0.08)',
          rgb: '16, 185, 129',
          classification: 'PREMACHINING WIP',
          categoryPillClass: 'bg-emerald-50 text-[#10B981] border border-emerald-100',
          retroValue: '1,190 Active Units',
          retroLabel: 'WIP active inventory',
          progressPercent: 59.5,
          trendText: '▼ 2.1%',
          trendSub: 'vs target',
          trendBadgeBgClass: 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]',
          leadingValue: 'Stable shop buffer',
          chartType: 'bar' as const,
          chartData: [
            { name: 'Apr', value: 1220 },
            { name: 'May', value: 1210 },
            { name: 'Jun', value: 1195 },
            { name: 'Jul', value: 1190 }
          ],
          redirectTarget: 'inventory' as PageId,
        },
        {
          id: 102,
          title: 'Post-Machining Inventory',
          hoverGlowClass: 'hover:border-rose-300',
          icon: Warehouse,
          color: '#EF4444',
          lighterColor: '#DC2626',
          trackWash: 'rgba(239, 68, 68, 0.08)',
          rgb: '239, 68, 68',
          classification: 'POST-MACHINING WIP',
          categoryPillClass: 'bg-red-50 text-[#EF4444] border border-red-100',
          retroValue: '2,850 Active Units',
          retroLabel: 'Critical WIP build-up (CL1 overrun)',
          progressPercent: 95.0,
          trendText: '▲ 15.4%',
          trendSub: 'vs target',
          trendBadgeBgClass: 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]',
          leadingValue: 'CL1 station buffer overrun',
          chartType: 'bar' as const,
          chartData: [
            { name: 'Apr', value: 1850 },
            { name: 'May', value: 2100 },
            { name: 'Jun', value: 2450 },
            { name: 'Jul', value: 2850 }
          ],
          redirectTarget: 'inventory' as PageId,
        }
      ];
    } else if (selectedRadarKpi === 3) {
      // BIQ Selected
      return [
        {
          id: 103,
          title: 'Premachining BIQ',
          hoverGlowClass: 'hover:border-emerald-300',
          icon: TrendingDown,
          color: '#7C3AED',
          lighterColor: '#5D1C6A',
          trackWash: 'rgba(124, 58, 237, 0.08)',
          rgb: '124, 58, 237',
          classification: 'PREMACHINING FTR',
          categoryPillClass: 'bg-purple-50 text-[#7C3AED] border border-purple-100',
          retroValue: '96.2% FTR',
          retroLabel: 'Premachining First Time Right',
          progressPercent: 96.2,
          trendText: '▲ 1.4%',
          trendSub: 'vs target',
          trendBadgeBgClass: 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]',
          leadingValue: 'High FTR yield',
          chartType: 'bar' as const,
          chartData: [
            { name: 'Apr', value: 95.0 },
            { name: 'May', value: 95.8 },
            { name: 'Jun', value: 96.0 },
            { name: 'Jul', value: 96.2 }
          ],
          redirectTarget: 'biq' as PageId,
        },
        {
          id: 104,
          title: 'Post-Machining BIQ',
          hoverGlowClass: 'hover:border-rose-300',
          icon: TrendingDown,
          color: '#EF4444',
          lighterColor: '#DC2626',
          trackWash: 'rgba(239, 68, 68, 0.08)',
          rgb: '239, 68, 68',
          classification: 'POST-MACHINING FTR',
          categoryPillClass: 'bg-red-50 text-[#EF4444] border border-red-100',
          retroValue: '91.5% FTR',
          retroLabel: 'Post-Machining First Time Right',
          progressPercent: 91.5,
          trendText: '▲ 0.8%',
          trendSub: 'vs target',
          trendBadgeBgClass: 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]',
          leadingValue: 'Weld leak rework at LW1',
          chartType: 'bar' as const,
          chartData: [
            { name: 'Apr', value: 89.2 },
            { name: 'May', value: 90.1 },
            { name: 'Jun', value: 91.0 },
            { name: 'Jul', value: 91.5 }
          ],
          redirectTarget: 'biq' as PageId,
        }
      ];
    } else if (selectedRadarKpi === 4) {
      // BPR
      return [
        {
          id: 101,
          title: 'Premachining BPR',
          hoverGlowClass: 'hover:border-emerald-300',
          icon: Activity,
          color: '#10B981',
          lighterColor: '#059669',
          trackWash: 'rgba(16, 185, 129, 0.08)',
          rgb: '16, 185, 129',
          classification: 'PREMACHINING BUFFER',
          categoryPillClass: 'bg-emerald-50 text-[#10B981] border border-emerald-100',
          retroValue: '94.2% Penetration',
          retroLabel: 'Buffer penetration',
          progressPercent: 94.2,
          trendText: '▲ 1.8%',
          trendSub: 'vs target',
          trendBadgeBgClass: 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]',
          leadingValue: 'UC1, SF01 buffer',
          chartType: 'bar' as const,
          chartData: [
            { name: 'Apr', value: 91.5 },
            { name: 'May', value: 92.8 },
            { name: 'Jun', value: 93.6 },
            { name: 'Jul', value: 94.2 }
          ],
          redirectTarget: 'bpr' as PageId,
        },
        {
          id: 102,
          title: 'Post-Machining BPR',
          hoverGlowClass: 'hover:border-rose-300',
          icon: Activity,
          color: '#EF4444',
          lighterColor: '#DC2626',
          trackWash: 'rgba(239, 68, 68, 0.08)',
          rgb: '239, 68, 68',
          classification: 'POST-MACHINING BUFFER',
          categoryPillClass: 'bg-red-50 text-[#EF4444] border border-red-100',
          retroValue: '62.0% Penetration',
          retroLabel: 'Critical buffer shortage (LW1 bottleneck)',
          progressPercent: 62.0,
          trendText: '▼ 4.5%',
          trendSub: 'vs target',
          trendBadgeBgClass: 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]',
          leadingValue: 'LW1 welder bottleneck',
          chartType: 'bar' as const,
          chartData: [
            { name: 'Apr', value: 75.0 },
            { name: 'May', value: 71.2 },
            { name: 'Jun', value: 66.8 },
            { name: 'Jul', value: 62.0 }
          ],
          redirectTarget: 'bpr' as PageId,
        }
      ];
    } else if (selectedRadarKpi === 5) {
      // OTIF
      return [
        {
          id: 103,
          title: 'Premachining Adherence',
          hoverGlowClass: 'hover:border-emerald-300',
          icon: ShieldAlert,
          color: '#10B981',
          lighterColor: '#059669',
          trackWash: 'rgba(16, 185, 129, 0.08)',
          rgb: '16, 185, 129',
          classification: 'PREMACHINING ADHERENCE',
          categoryPillClass: 'bg-emerald-50 text-[#10B981] border border-emerald-100',
          retroValue: '98.1% Adherence',
          retroLabel: 'Schedule adherence',
          progressPercent: 98.1,
          trendText: '▲ 0.9%',
          trendSub: 'vs target',
          trendBadgeBgClass: 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]',
          leadingValue: 'Production runs',
          chartType: 'bar' as const,
          chartData: [
            { name: 'Apr', value: 97.2 },
            { name: 'May', value: 97.8 },
            { name: 'Jun', value: 97.9 },
            { name: 'Jul', value: 98.1 }
          ],
          redirectTarget: 'otif' as PageId,
        },
        {
          id: 104,
          title: 'Post-Machining OTIF',
          hoverGlowClass: 'hover:border-rose-300',
          icon: ShieldAlert,
          color: '#EF4444',
          lighterColor: '#DC2626',
          trackWash: 'rgba(239, 68, 68, 0.08)',
          rgb: '239, 68, 68',
          classification: 'POST-MACHINING DELIVERY',
          categoryPillClass: 'bg-red-50 text-[#EF4444] border border-red-100',
          retroValue: '88.5% OTIF',
          retroLabel: 'Critical OTIF loss (packing delays)',
          progressPercent: 88.5,
          trendText: '▼ 3.8%',
          trendSub: 'vs target',
          trendBadgeBgClass: 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]',
          leadingValue: 'Packing queue delays',
          chartType: 'bar' as const,
          chartData: [
            { name: 'Apr', value: 92.5 },
            { name: 'May', value: 91.0 },
            { name: 'Jun', value: 89.4 },
            { name: 'Jul', value: 88.5 }
          ],
          redirectTarget: 'otif' as PageId,
        }
      ];
    } else if (selectedRadarKpi === 6) {
      // Traceability
      return [
        {
          id: 103,
          title: 'Premachining Serialization',
          hoverGlowClass: 'hover:border-emerald-300',
          icon: Database,
          color: '#10B981',
          lighterColor: '#059669',
          trackWash: 'rgba(16, 185, 129, 0.08)',
          rgb: '16, 185, 129',
          classification: 'PREMACHINING SCANS',
          categoryPillClass: 'bg-emerald-50 text-[#10B981] border border-emerald-100',
          retroValue: '100% Serialization',
          retroLabel: 'L1 serialization scan rate',
          progressPercent: 100,
          trendText: '—',
          trendSub: 'vs target',
          trendBadgeBgClass: 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]',
          leadingValue: 'Zero barcode faults',
          chartType: 'bar' as const,
          chartData: [
            { name: 'Apr', value: 100 },
            { name: 'May', value: 100 },
            { name: 'Jun', value: 100 },
            { name: 'Jul', value: 100 }
          ],
          redirectTarget: 'overview' as PageId,
        },
        {
          id: 104,
          title: 'Post-Machining Scans',
          hoverGlowClass: 'hover:border-rose-300',
          icon: Database,
          color: '#EF4444',
          lighterColor: '#DC2626',
          trackWash: 'rgba(239, 68, 68, 0.08)',
          rgb: '239, 68, 68',
          classification: 'POST-MACHINING SCANS',
          categoryPillClass: 'bg-red-50 text-[#EF4444] border border-red-100',
          retroValue: '78.2% First-Scan',
          retroLabel: 'Critical scan failures (thermal damage)',
          progressPercent: 78.2,
          trendText: '▼ 11.2%',
          trendSub: 'vs target',
          trendBadgeBgClass: 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]',
          leadingValue: 'Thermal barcode damage',
          chartType: 'bar' as const,
          chartData: [
            { name: 'Apr', value: 94.2 },
            { name: 'May', value: 89.5 },
            { name: 'Jun', value: 83.1 },
            { name: 'Jul', value: 78.2 }
          ],
          redirectTarget: 'overview' as PageId,
        }
      ];
    } else {
      // OEE Selected (1)
      return [
        {
          id: 101,
          title: 'Premachining OEE',
          hoverGlowClass: 'hover:border-emerald-300',
          icon: Activity,
          color: '#10B981',
          lighterColor: '#059669',
          trackWash: 'rgba(16, 185, 129, 0.08)',
          rgb: '16, 185, 129',
          classification: 'PREMACHINING OEE',
          categoryPillClass: 'bg-emerald-50 text-[#10B981] border border-emerald-100',
          retroValue: '76.2% OEE',
          retroLabel: 'Premachining average OEE',
          progressPercent: 76.2,
          trendText: '▲ 1.4%',
          trendSub: 'vs target',
          trendBadgeBgClass: 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]',
          leadingValue: 'VMC1, SF01, alt',
          chartType: 'bar' as const,
          chartData: [
            { name: 'Apr', value: 74.5 },
            { name: 'May', value: 75.1 },
            { name: 'Jun', value: 75.8 },
            { name: 'Jul', value: 76.2 }
          ],
          redirectTarget: 'overview' as PageId,
        },
        {
          id: 102,
          title: 'Post-Machining OEE',
          hoverGlowClass: 'hover:border-rose-300',
          icon: Activity,
          color: '#EF4444',
          lighterColor: '#DC2626',
          trackWash: 'rgba(239, 68, 68, 0.08)',
          rgb: '239, 68, 68',
          classification: 'POST-MACHINING OEE',
          categoryPillClass: 'bg-red-50 text-[#EF4444] border border-red-100',
          retroValue: '68.4% OEE',
          retroLabel: 'Post-Machining average OEE',
          progressPercent: 68.4,
          trendText: '▼ 2.1%',
          trendSub: 'vs target',
          trendBadgeBgClass: 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]',
          leadingValue: 'PACK, EOL',
          chartType: 'bar' as const,
          chartData: [
            { name: 'Apr', value: 72.8 },
            { name: 'May', value: 71.0 },
            { name: 'Jun', value: 69.5 },
            { name: 'Jul', value: 68.4 }
          ],
          redirectTarget: 'overview' as PageId,
        }
      ];
    }
  };

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
      chartType: 'bar' as const,
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
      chartType: 'bar' as const,
      chartData: chartDataWithLive.inventory,
      gradientStartColor: '#34D399',
      redirectTarget: 'inventory' as PageId,
      pulseKey: 'activeWipUnits',
    },
    {
      id: 3,
      title: 'BIQ — Built-In Quality',
      hoverGlowClass: 'hover:border-violet-300',
      icon: TrendingDown,
      color: '#7C3AED',
      lighterColor: '#5D1C6A',
      trackWash: 'rgba(124, 58, 237, 0.08)',
      rgb: '124, 58, 237',
      classification: 'BUILT-IN QUALITY KPI',
      categoryPillClass: 'bg-purple-50 text-[#7C3AED] border border-purple-100',
      retroValue: `${liveData.biqFtr.toFixed(1)}% FTR`,
      retroLabel: 'First Time Right — YTD quality pass rate',
      progressPercent: liveData.biqFtr,
      trendText: '▲ 0.9%',
      trendSub: 'vs YTD 2025',
      trendBadgeBgClass: 'bg-[#ECFDF5] border border-[#A7F3D0] shadow-[0_2px_8px_rgba(16,185,129,0.15)] text-[#065F46]',
      trendTextClass: 'text-[#065F46]',
      leadingValue: `${liveData.biqFtr.toFixed(1)}% Q-Gate Filtration`,
      leadingLabel: 'Defects caught inline before escaping',
      leadingIcon: ShieldCheck,
      leadingIconBgClass: 'bg-purple-50/50 border-purple-100/50',
      chartType: 'bar' as const,
      chartData: chartDataWithLive.biq,
      gradientStartColor: '#7C3AED',
      redirectTarget: 'biq' as PageId,
      pulseKey: 'biqFtr',
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
      chartType: 'bar' as const,
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
      chartType: 'bar' as const,
      chartData: chartDataWithLive.compliance,
      gradientStartColor: '#818CF8',
      redirectTarget: 'traceability' as PageId,
      pulseKey: 'serialization',
    },
  ];

  const activeViewMode = viewMode;

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
              onClick={() => setViewMode('RADAR')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer",
                viewMode === 'RADAR'
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Manufacturing Control Tower 
            </button>

            <button
              onClick={() => { setViewMode('ISOMETRIC'); setExpandedSection(null); }}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer",
                viewMode === 'ISOMETRIC'
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Shop Floor Map
            </button>

            <button
              onClick={() => { setViewMode('CALIBRATION'); }}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer",
                viewMode === 'CALIBRATION'
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              UI Lab Sandbox
            </button>

          </div>
        )}

        <div className="text-right">
          <p className="text-[9px] tracking-[0.25em] font-extrabold text-blue-600 uppercase">
            ATLAS Operational Control Tower
          </p>
          <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">
            Summary Page
          </h1>
        </div>
      </header>

      {/* ── Main Content Grid ── */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-8 py-6">
        <div className="w-full max-w-[1500px]">
          {/* Header Introduction */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-transparent border border-emerald-500/20 text-[9px] font-extrabold text-emerald-600 tracking-wider uppercase mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed Connected
            </div>
            <h2 className="text-2xl font-medium tracking-[0.05em] text-slate-900 uppercase">
              {activeViewMode === 'ISOMETRIC'
                ? 'Operational Control Tower Map'
                : activeViewMode === 'CALIBRATION'
                ? 'UI Lab Isometric Calibration Sandbox'
                : 'Manufacturing Control Tower'}
            </h2>
            {/* <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
              {activeViewMode === 'ISOMETRIC'
                ? 'Interactive shop floor telemetry. Hover to trace connections, click to enter dedicated diagnostic portals.'
                : 'Real-time telemetry projection rays spotlighting operational hazards and clear shipping corridors.'}
            </p> */}
          </div>

          {activeViewMode === 'ISOMETRIC' ? (
            /* ── UPGRADED 15-ZONE ISOMETRIC 3D MAP VIEW ── */
            <div
              className={cn(
                "relative w-full rounded-2xl border border-slate-200/50 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12)] overflow-hidden transition-all duration-300",
                containerScaleClass
              )}
              style={{
                aspectRatio: localMasterLayout.containerSettings?.aspectRatio || 1.6,
                backgroundImage: `url(${shopFloorBg})`,
                paddingTop: `${localMasterLayout.containerSettings?.paddingY || 0}px`,
                paddingBottom: `${localMasterLayout.containerSettings?.paddingY || 0}px`,
              }}
            >
              {/* Layer 1: SVG Dynamic Connector Leader Lines connecting Cards to Hotspots */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                {(() => {
                  const prePos = localMasterLayout.cardCoords?.premachiningCard || { top: 25, left: 24 };
                  const postPos = localMasterLayout.cardCoords?.postmachiningCard || { top: 52, left: 62 };
                  const preTarget = zone15Centroids['zone1'] || { x: 20, y: 25 };
                  const postTarget = zone15Centroids['zone6'] || { x: 55, y: 25 };
                  return (
                    <>
                      <line
                        x1={`${prePos.left + 5}%`}
                        y1={`${prePos.top + 5}%`}
                        x2={`${preTarget.x}%`}
                        y2={`${preTarget.y}%`}
                        stroke="#0EA5E9"
                        strokeWidth="0.25"
                        strokeDasharray="0.8 0.8"
                        opacity="0.85"
                      />
                      <line
                        x1={`${postPos.left + 5}%`}
                        y1={`${postPos.top + 5}%`}
                        x2={`${postTarget.x}%`}
                        y2={`${postTarget.y}%`}
                        stroke="#EC6530"
                        strokeWidth="0.25"
                        strokeDasharray="0.8 0.8"
                        opacity="0.85"
                      />
                    </>
                  );
                })()}
              </svg>

              {/* Layer 2: Exception-Based Limited Hotspot Overlays (Max 3 Exception Zones Default) */}
              {(() => {
                const isPreActive = filters.opSections?.premachining !== false;
                const isPostActive = filters.opSections?.postMachining !== false;

                return ZONE_METADATA.map(zone => {
                  const pts = calibrated15ZoneCoords[zone.id] || default15ZoneCoords[zone.id];
                  const clipPath = zone15ClipPaths[zone.id];
                  const svgPoints = zone15SvgPoints[zone.id];
                  const centroid = zone15Centroids[zone.id];
                  
                  const exceptionConfig = EXCEPTION_HOTSPOTS[zone.id as keyof typeof EXCEPTION_HOTSPOTS];
                  const isExceptionHotspot = !!exceptionConfig;
                  const isHovered = hoveredZoneId === zone.id;
                  
                  let isCategoryActive = true;
                  if (zone.category === 'premachining') isCategoryActive = isPreActive;
                  if (zone.category === 'postmachining') isCategoryActive = isPostActive;

                  // Active if one of the 3 Exception Hotspots OR if user is hovering over card/zone (Dynamic Hover Peek)
                  const isVisible = isCategoryActive && (isExceptionHotspot || isHovered);
                  if (!isVisible && !isHovered) return null;

                  const overlayColor = exceptionConfig?.color || zone.color;
                  const bgFill = isHovered 
                    ? (exceptionConfig ? exceptionConfig.hoverBgFill : getZoneColorAlpha(zone.color, '45'))
                    : (exceptionConfig ? exceptionConfig.bgFill : getZoneColorAlpha(zone.color, '18'));
                  
                  const borderColor = exceptionConfig?.borderColor || zone.color;
                  const strokeWidth = isHovered ? "0.6" : (exceptionConfig?.strokeWidth || "0.35");
                  const shadowFilter = exceptionConfig?.shadow || `drop-shadow(0 0 6px ${zone.color})`;

                  return (
                    <div
                      key={`zone-overlay-${zone.id}`}
                      className="absolute inset-0 transition-opacity duration-300 z-10"
                      style={{ opacity: isVisible ? 1.0 : 0 }}
                      onMouseEnter={() => setHoveredZoneId(zone.id)}
                      onMouseLeave={() => setHoveredZoneId(null)}
                    >
                      <div
                        className="w-full h-full transition-all duration-300 cursor-pointer"
                        style={{
                          clipPath: clipPath,
                          background: bgFill,
                        }}
                      />
                      
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polygon
                          points={svgPoints}
                          fill="none"
                          stroke={borderColor}
                          strokeWidth={strokeWidth}
                          opacity={isHovered ? 1.0 : 0.85}
                          className={exceptionConfig?.status === 'critical' || isHovered ? "animate-pulse" : ""}
                          style={{
                            filter: shadowFilter,
                          }}
                        />
                      </svg>

                      {centroid && (
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            top: `${centroid.y}%`,
                            left: `${centroid.x}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          <span className="absolute inline-flex h-4.5 w-4.5 rounded-full opacity-75 animate-ping" style={{ backgroundColor: overlayColor }} />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 shadow-md border border-white/80" style={{ backgroundColor: overlayColor }} />
                        </div>
                      )}
                    </div>
                  );
                });
              })()}

              {/* Layer 3: Floating Hover Tooltips */}
              {hoveredZoneId && (() => {
                const zone = ZONE_METADATA.find(z => z.id === hoveredZoneId);
                const centroid = zone15Centroids[hoveredZoneId];
                if (!zone || !centroid) return null;
                return (
                  <div
                    className="absolute z-35 pointer-events-none transition-all duration-200 select-none flex flex-col items-center"
                    style={{
                      top: `${centroid.y}%`,
                      left: `${centroid.x}%`,
                      transform: 'translate(-50%, -125%)',
                    }}
                  >
                    <div className="bg-slate-900/90 backdrop-blur-md text-white border border-slate-700/50 rounded-xl px-3 py-2 shadow-2xl flex flex-col gap-0.5 text-center min-w-[160px]">
                      <span className="text-[7px] font-black tracking-widest text-sky-400 uppercase">
                        {zone.category.replace('machining', ' Machining').toUpperCase()}
                      </span>
                      <span className="text-[9.5px] font-black uppercase tracking-tight">
                        {zone.id.replace('zone', 'Zone ')}: {zone.name}
                      </span>
                      <span className="text-[8px] text-slate-300 font-bold mt-0.5">
                        Workstations: {zone.workstations}
                      </span>
                    </div>
                    <div className="w-2.5 h-2.5 bg-slate-900/90 border-r border-b border-slate-700/50 rotate-45 -mt-1.5" />
                  </div>
                );
              })()}

              {/* Layer 4: General Plant-Wide Index command card */}
              {(() => {
                const cmdPos = localMasterLayout.cardCoords?.atlasCommandCard || { top: 15, left: 2 };
                return (
                  <div
                    style={{
                      position: 'absolute',
                      top: `${cmdPos.top}%`,
                      left: `${cmdPos.left}%`,
                      width: `${cmdPos.width || 240}px`,
                      zIndex: 40,
                      boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 10px 10px -5px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(226, 232, 240, 0.8)',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      background: 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(16px)',
                      borderRadius: '20px',
                    }}
                    className="p-4 flex flex-col gap-3.5 select-none"
                  >
                    {(() => {
                      const cmdData = getCommandCardData();
                      return (
                        <>
                          <div className="border-b border-slate-100 pb-2">
                            <span className="text-[8px] font-bold tracking-[0.1em] text-[#0284C7] uppercase block mb-1">ATLAS CONTROL TOWER</span>
                            <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">{cmdData.title}</h3>
                            <span className="text-[9px] text-[#64748B] font-bold">Tata Toyo Radiator (Chakan)</span>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            {cmdData.rows.map((row, idx) => (
                              <div key={`cmd-row-${idx}`}>
                                <div className="flex justify-between items-baseline text-[8.5px] font-bold text-slate-600 uppercase tracking-wider">
                                  <span>{row.label}</span>
                                  <span className="text-slate-800 font-black">{row.valText}</span>
                                </div>
                                <div className="relative w-full bg-slate-100 h-1 rounded-full mt-1.5">
                                  <div className="h-full rounded-full relative" style={{ width: `${Math.min(100, Math.max(0, row.pct))}%`, backgroundColor: row.color }}>
                                    <div 
                                      className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border shadow-sm" 
                                      style={{ 
                                        transform: 'translate(50%, -50%)', 
                                        borderColor: row.color
                                      }} 
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-[8px] font-bold uppercase text-slate-500 tracking-wider flex justify-between items-center">
                      <span>SYSTEM STATUS:</span>
                      <span className="text-[#0284C7] flex items-center gap-1 font-black">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_4px_#10B981]" />
                        ONLINE
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Layer 5: Absolute-positioned Section-Level KPI Cards (Anchored over floor zones) */}
              {getSectionCards().map((sc, scIdx) => {
                const isPremachining = scIdx === 0;
                const isCardExpanded = isPremachining 
                  ? expandedSection === 'premachining'
                  : expandedSection === 'postmachining';
                const isCardHovered = isPremachining
                  ? hoveredSection === 'premachining'
                  : hoveredSection === 'postmachining';
                const isCardActive = isCardExpanded || isCardHovered;
                
                const cardKey = isPremachining ? 'premachiningCard' : 'postmachiningCard';
                const cardCoord = localMasterLayout.cardCoords?.[cardKey] || (isPremachining ? { top: 25, left: 24 } : { top: 52, left: 62 });

                return (
                  <div
                    key={`section-card-${sc.id}`}
                    style={{
                      position: 'absolute',
                      top: isCardActive ? `${cardCoord.top - 4}%` : `${cardCoord.top}%`,
                      left: isCardActive ? `calc(${cardCoord.left}% - 25px)` : `${cardCoord.left}%`,
                      width: isCardActive ? '320px' : '270px',
                      zIndex: isCardActive ? 50 : 40,
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    }}
                  >
                    <CompactKPICard
                      card={sc}
                      isHovered={isCardActive}
                      isSectionCard={true}
                      onHover={(h) => {
                        setHoveredSection(h ? (isPremachining ? 'premachining' : 'postmachining') : null);
                      }}
                      onClick={() => {
                        const secName = isPremachining ? 'premachining' : 'postmachining';
                        if (expandedSection === secName) {
                          onEnterDashboard(sc.redirectTarget);
                        } else {
                          setExpandedSection(secName);
                        }
                      }}
                      liveData={liveData}
                      isPulsing={false}
                      onChartNodeClick={(monthName) => {
                        handleChartNodeClick(monthName, sc.redirectTarget);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ) : activeViewMode === 'CALIBRATION' ? (
            /* ── MASTER FLOOR & CARD PLACEMENT STUDIO ── */
            <div className="w-full flex flex-col lg:flex-row gap-6 items-stretch">
              {/* Left Column: Interactive Shop Floor Calibration Map Canvas */}
              <div className="flex-1 bg-white border border-slate-200/60 rounded-3xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Master Placement Studio Canvas</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Drag cards, hotspots, or zone pins across the 3D map canvas</p>
                  </div>
                  {showSavedToast && (
                    <div className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black tracking-widest uppercase animate-pulse shadow-sm">
                      Master Layout Saved Globally!
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    "map-canvas-container relative w-full rounded-2xl border border-slate-200 shadow-inner overflow-hidden select-none transition-all duration-300",
                    containerScaleClass
                  )}
                  style={{
                    aspectRatio: localMasterLayout.containerSettings?.aspectRatio || 1.6,
                    backgroundImage: `url(${shopFloorBg})`,
                    paddingTop: `${localMasterLayout.containerSettings?.paddingY || 0}px`,
                    paddingBottom: `${localMasterLayout.containerSettings?.paddingY || 0}px`,
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none bg-slate-900/5 backdrop-blur-[0.5px]" />

                  {/* SVG Dynamic Connector Leader Lines Layer */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {(() => {
                      const prePos = localMasterLayout.cardCoords?.premachiningCard || { top: 25, left: 24 };
                      const postPos = localMasterLayout.cardCoords?.postmachiningCard || { top: 52, left: 62 };
                      const preTarget = zone15Centroids['zone1'] || { x: 20, y: 25 };
                      const postTarget = zone15Centroids['zone6'] || { x: 55, y: 25 };
                      return (
                        <>
                          <line
                            x1={`${prePos.left + 5}%`}
                            y1={`${prePos.top + 5}%`}
                            x2={`${preTarget.x}%`}
                            y2={`${preTarget.y}%`}
                            stroke="#0EA5E9"
                            strokeWidth="0.35"
                            strokeDasharray="1 1"
                          />
                          <line
                            x1={`${postPos.left + 5}%`}
                            y1={`${postPos.top + 5}%`}
                            x2={`${postTarget.x}%`}
                            y2={`${postTarget.y}%`}
                            stroke="#EC6530"
                            strokeWidth="0.35"
                            strokeDasharray="1 1"
                          />
                        </>
                      );
                    })()}
                  </svg>

                  {/* SVG overlay of 15 zones with darker, high-contrast tint & strokes */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {ZONE_METADATA.map(zone => {
                      const isCurrent = zone.id === selectedCalibrationZone;
                      const pts = local15ZoneCoords[zone.id] || default15ZoneCoords[zone.id];
                      const ptsStr = pts.map(p => `${p.x},${p.y}`).join(' ');
                      return (
                        <polygon
                          key={`calib-poly-${zone.id}`}
                          points={ptsStr}
                          fill={isCurrent ? getZoneColorAlpha(zone.color, '45') : getZoneColorAlpha(zone.color, '20')}
                          stroke={getZoneColorAlpha(zone.color, 'FF')}
                          strokeWidth={isCurrent ? "0.65" : "0.35"}
                          opacity={isCurrent ? 1.0 : 0.65}
                          style={{
                            filter: isCurrent ? `drop-shadow(0 0 8px ${getZoneColorAlpha(zone.color, 'FF')})` : `drop-shadow(0 0 2px ${getZoneColorAlpha(zone.color, '60')})`
                          }}
                        />
                      );
                    })}
                  </svg>

                  {/* Draggable Zone Handle Pins */}
                  {(() => {
                    const activePts = local15ZoneCoords[selectedCalibrationZone] || default15ZoneCoords[selectedCalibrationZone];
                    const activeZone = ZONE_METADATA.find(z => z.id === selectedCalibrationZone);
                    const color = activeZone?.color || '#0EA5E9';
                    return activePts.map((pt, idx) => {
                      const isActivePin = activePinIndex === idx;
                      return (
                        <div
                          key={`handle-pin-${idx}`}
                          className="absolute z-30 flex flex-col items-center cursor-move"
                          style={{
                            left: `${pt.x}%`,
                            top: `${pt.y}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          onMouseDown={(e) => {
                            setActivePinIndex(idx);
                            e.preventDefault();
                            const container = e.currentTarget.closest('.map-canvas-container') as HTMLElement;
                            if (!container) return;
                            const rect = container.getBoundingClientRect();

                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const xPercent = ((moveEvent.clientX - rect.left) / rect.width) * 100;
                              const yPercent = ((moveEvent.clientY - rect.top) / rect.height) * 100;
                              
                              setLocal15ZoneCoords(prev => {
                                const updated = { ...prev };
                                const pts = [...(updated[selectedCalibrationZone] || default15ZoneCoords[selectedCalibrationZone])];
                                pts[idx] = {
                                  x: +Math.min(100, Math.max(0, xPercent)).toFixed(1),
                                  y: +Math.min(100, Math.max(0, yPercent)).toFixed(1)
                                };
                                updated[selectedCalibrationZone] = pts;
                                return updated;
                              });
                            };

                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };

                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center font-black text-[9px] shadow-lg transition-all",
                              isActivePin
                                ? "bg-slate-900 border-white text-white scale-110 ring-4"
                                : "bg-white text-slate-800"
                            )}
                            style={{
                              borderColor: isActivePin ? '#FFFFFF' : color,
                              boxShadow: isActivePin ? `0 0 10px ${color}` : 'none'
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div className="mt-1 bg-slate-900/90 text-white font-mono text-[7px] px-1 py-0.5 rounded shadow-sm border border-slate-700/50">
                            {pt.x}%, {pt.y}%
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Draggable Cards on Canvas when Master Placement Mode is active */}
                  {isMasterPlacementModeActive && (() => {
                    const cardsToRender = [
                      { id: 'premachiningCard', name: 'Premachining Card', color: '#0EA5E9' },
                      { id: 'postmachiningCard', name: 'Assembly Card', color: '#EC6530' },
                      { id: 'atlasCommandCard', name: 'ATLAS Index Card', color: '#0284C7' },
                    ];
                    return cardsToRender.map(cardItem => {
                      const pos = localMasterLayout.cardCoords?.[cardItem.id] || { top: 30, left: 30 };
                      return (
                        <div
                          key={`draggable-card-${cardItem.id}`}
                          className="absolute z-40 cursor-grab active:cursor-grabbing border-2 rounded-2xl p-2 bg-white/90 backdrop-blur-md shadow-2xl transition-shadow hover:ring-4 hover:ring-blue-400/50"
                          style={{
                            top: `${pos.top}%`,
                            left: `${pos.left}%`,
                            width: `${pos.width || 200}px`,
                            borderColor: cardItem.color,
                          }}
                          onMouseDown={(e) => handleElementDrag(e, 'card', cardItem.id)}
                        >
                          <div className="flex justify-between items-center pb-1 border-b border-slate-200/80 mb-1 pointer-events-none select-none">
                            <span className="text-[9px] font-black uppercase text-slate-800 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cardItem.color }} />
                              {cardItem.name}
                            </span>
                            <span className="text-[7.5px] font-mono font-bold text-slate-500">
                              {pos.left}%, {pos.top}%
                            </span>
                          </div>
                          <p className="text-[7.5px] font-bold text-slate-500 uppercase tracking-tight pointer-events-none select-none">
                            Drag anywhere to position over 3D floor map
                          </p>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Right Column: Master Placement & Calibration Studio Control Panel */}
              <div className="w-full lg:w-[340px] bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex flex-col justify-between select-none gap-4">
                <div className="flex flex-col gap-4 overflow-y-auto max-h-[750px] pr-1">
                  <div className="border-b border-slate-100 pb-2.5">
                    <span className="text-[7.5px] font-black tracking-widest text-[#0284C7] uppercase block mb-1">Layout Studio</span>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Master Placement Studio</h3>
                  </div>

                  {/* 1. Placement Mode Toggle */}
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-[9.5px] font-black uppercase text-slate-800 block">Master Drag & Drop</span>
                      <span className="text-[7.5px] font-bold text-slate-400 uppercase">Enable card & dot dragging</span>
                    </div>
                    <button
                      onClick={() => setIsMasterPlacementModeActive(!isMasterPlacementModeActive)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer shadow-sm",
                        isMasterPlacementModeActive
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-600"
                      )}
                    >
                      {isMasterPlacementModeActive ? "ACTIVE" : "OFF"}
                    </button>
                  </div>

                  {/* 2. Live Container Framing & Scaling Sliders */}
                  <div className="flex flex-col gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400">1. Container Aspect Ratio & Scale Controls</span>

                    {/* Aspect Ratio Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] font-bold text-slate-600 uppercase">
                        <span>Aspect Ratio</span>
                        <span className="text-blue-600 font-black">{localMasterLayout.containerSettings?.aspectRatio || 1.6}:1</span>
                      </div>
                      <input
                        type="range"
                        min="1.3"
                        max="2.0"
                        step="0.05"
                        value={localMasterLayout.containerSettings?.aspectRatio || 1.6}
                        onChange={(e) => {
                          const val = +parseFloat(e.target.value).toFixed(2);
                          setLocalMasterLayout(prev => ({
                            ...prev,
                            containerSettings: {
                              ...(prev.containerSettings || defaultContainerSettings),
                              aspectRatio: val,
                            }
                          }));
                        }}
                        className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Scale Mode Selector */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[8.5px] font-bold text-slate-500 uppercase">Background Scale Mode</label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['stretch', 'contain', 'cover'] as const).map(mode => (
                          <button
                            key={mode}
                            onClick={() => {
                              setLocalMasterLayout(prev => ({
                                ...prev,
                                containerSettings: {
                                  ...(prev.containerSettings || defaultContainerSettings),
                                  scaleMode: mode,
                                }
                              }));
                            }}
                            className={cn(
                              "py-1 text-[8px] font-black uppercase rounded-lg border transition-all cursor-pointer text-center",
                              localMasterLayout.containerSettings?.scaleMode === mode
                                ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            {mode === 'stretch' ? '100% 100%' : mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Padding Y Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] font-bold text-slate-600 uppercase">
                        <span>Vertical Padding</span>
                        <span className="text-blue-600 font-black">{localMasterLayout.containerSettings?.paddingY || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="48"
                        step="4"
                        value={localMasterLayout.containerSettings?.paddingY || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setLocalMasterLayout(prev => ({
                            ...prev,
                            containerSettings: {
                              ...(prev.containerSettings || defaultContainerSettings),
                              paddingY: val,
                            }
                          }));
                        }}
                        className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 3. 15-Zone Polygon Calibration Engine */}
                  <div className="flex flex-col gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400">2. 15-Zone Polygon Calibration</span>

                    {/* Zone Dropdown */}
                    <div className="flex flex-col gap-1">
                      <select
                        value={selectedCalibrationZone}
                        onChange={(e) => {
                          setSelectedCalibrationZone(e.target.value);
                          setActivePinIndex(0);
                        }}
                        className="w-full pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                      >
                        {ZONE_METADATA.map(zone => (
                          <option key={zone.id} value={zone.id}>
                            {zone.id.replace('zone', '')}. {zone.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Active Pin Switcher */}
                    <div className="grid grid-cols-4 gap-1">
                      {[0, 1, 2, 3].map(idx => (
                        <button
                          key={idx}
                          onClick={() => setActivePinIndex(idx)}
                          className={cn(
                            "py-1 rounded-lg text-[8.5px] font-black uppercase border transition-all cursor-pointer text-center",
                            activePinIndex === idx
                              ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          Pin {idx + 1}
                        </button>
                      ))}
                    </div>

                    {/* Directional Nudge Buttons */}
                    <div className="flex flex-col items-center gap-1.5 pt-1">
                      <div className="relative w-28 h-28 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-inner">
                        <button
                          onClick={() => nudgeActivePin(0, -0.1)}
                          className="absolute top-1.5 w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => nudgeActivePin(-0.1, 0)}
                          className="absolute left-1.5 w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => nudgeActivePin(0.1, 0)}
                          className="absolute right-1.5 w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => nudgeActivePin(0, 0.1)}
                          className="absolute bottom-1.5 w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-9 h-9 bg-slate-50 rounded-full flex flex-col items-center justify-center border border-slate-200">
                          <span className="text-[6.5px] text-slate-400 font-extrabold uppercase">Pin</span>
                          <span className="text-[10px] font-black text-slate-800">#{activePinIndex + 1}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Global Serialization Actions */}
                <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 mt-2">
                  <button
                    onClick={() => {
                      const layoutToSave: MasterControlTowerLayout = {
                        ...localMasterLayout,
                        polygonCoords: local15ZoneCoords,
                      };
                      setMasterControlTowerLayout(layoutToSave);
                      setCalibrated15ZoneCoords(local15ZoneCoords);
                      setShowSavedToast(true);
                      setTimeout(() => setShowSavedToast(false), 3000);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-[10px] tracking-wider uppercase shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] transition-all cursor-pointer"
                  >
                    Save All Placements Globally
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Reset layout & placements to default positions?")) {
                        setLocalMasterLayout({ ...defaultMasterControlTowerLayout });
                        setLocal15ZoneCoords({ ...default15ZoneCoords });
                        setMasterControlTowerLayout(defaultMasterControlTowerLayout);
                      }
                    }}
                    className="w-full py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 font-bold text-[8.5px] tracking-wider uppercase transition-all cursor-pointer"
                  >
                    Reset All Layout Defaults
                  </button>
                </div>
              </div>
            </div>
          ) : (
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
                    1: { x2: 18, y2: 22, points: "50,43.5 11,28 25,16", isCritical: isOeeCritical }, // OEE
                    3: { x2: 82, y2: 22, points: "50,43.5 75,16 89,28", isCritical: isCopqCritical }, // COPQ
                    4: { x2: 16, y2: 50, points: "50,43.5 16,47 16,53", isCritical: isBprCritical }, // BPR
                    5: { x2: 84, y2: 50, points: "50,43.5 84,47 84,53", isCritical: isOtifCritical }, // OTIF
                    2: { x2: 18, y2: 76, points: "50,43.5 11,71 25,81", isCritical: isInventoryCritical }, // Inventory
                    6: { x2: 82, y2: 76, points: "50,43.5 75,81 89,71", isCritical: isTraceabilityCritical }, // Traceability
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
                  1: { top: '22%', left: '18%' },
                  3: { top: '22%', left: '82%' },
                  4: { top: '50%', left: '16%' },
                  5: { top: '50%', left: '84%' },
                  2: { top: '76%', left: '18%' },
                  6: { top: '76%', left: '82%' },
                };

                return cards.map((c) => {
                  const coord = radarCardCoords[c.id];
                  if (!coord) return null;

                  const isHovered = hoveredCardId === c.id;
                  const isSpotlightActive = c.id === activeSpotlightCardId;
                  const isPulsing = pulseStates[c.pulseKey];

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
                      <CompactKPICard
                        card={c}
                        isHovered={isHovered}
                        onHover={(hover) => setHoveredCardId(hover ? c.id : null)}
                        onClick={() => {
                          setViewMode('ISOMETRIC');
                          setSelectedRadarKpi(c.id);
                          setExpandedSection(null);
                        }}
                        liveData={liveData}
                        isPulsing={isPulsing}
                        onChartNodeClick={(monthName) => {
                          setViewMode('ISOMETRIC');
                          setSelectedRadarKpi(c.id);
                          setExpandedSection(null);
                        }}
                        isSpotlightActive={isSpotlightActive}
                      />
                    </div>
                  );
                });
              })()}
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

