import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend,
} from 'recharts';
import { type FilterState } from './TimeTrendFilter';
import { getDashboardData } from '../data/dashboardDataStore';
import {
  ArrowLeft,
  Package,
  Warehouse,
  Layers,
  Clock,
  Coins,
  TrendingUp,
  ChevronRight,
  Pin,
  PinOff,
} from 'lucide-react';
import { CardLockHeader, lockedCardStyle } from './CardLockHeader';
import { usePageCardLocks } from './useCardFilterLock';

interface InventoryPageProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

// ─── Design Tokens (Executive Editorial) ──────────────────────────────────────
const T = {
  pageBg:     '#F8FAFC',
  cardBg:     '#FFFFFF',
  cardBorder: '1px solid rgba(226,232,240,0.9)',
  cardShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)',
  numColor:   '#0F172A',
  labelColor: '#475569',
  mutedColor: '#94A3B8',
};

const GOLD   = '#F59E0B';
const BRONZE = '#B45309';
const TEAL   = '#14B8A6';
const CYAN   = '#06B6D4';
const ICE    = '#60A5FA';
const SLATE  = '#475569';
const RED    = '#EF4444';
const AMBER  = '#F59E0B';
const EMERALD= '#10B981';
const ORANGE = '#F97316';

function getInventoryProfile(product: string | undefined, process: string | undefined, trend: string = 'YTD', subPeriod?: string | null) {
  return getDashboardData('INVENTORY', subPeriod || trend, product || 'ALL', process || 'ALL');
}

export function InventoryPage({ filters, onChange }: InventoryPageProps) {
  const [activePillar, setActivePillar] = useState<'SUMMARY' | 'FG' | 'WIP' | 'VELOCITY' | null>(null);
  const [q2Hovered, setQ2Hovered] = useState(false);
  const [q3Hovered, setQ3Hovered] = useState(false);
  const [q4Hovered, setQ4Hovered] = useState(false);
  // Per-card local filter locks: [Q1, Q2, Q3, Q4]
  const [q1Lock, q2Lock, q3Lock, q4Lock] = usePageCardLocks(filters, 4);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // ── shared tooltip style ──────────────────────────────────────────────────
  const TT = {
    background: '#0F172A',
    border: '1px solid #1E3A5F',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,.4)',
    fontSize: '10px',
    fontWeight: 600,
    color: '#E0F2FE',
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(226,232,240,0.7)',
    boxShadow: '0 10px 30px -6px rgba(15,23,42,0.05), 0 4px 10px -4px rgba(15,23,42,0.04)',
    borderRadius: '16px',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  };

  const centeredLegendStyle = {
    paddingTop: '20px',
    fontSize: '9px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: '#475569',
  };

  // ── SVG gradient defs ─────────────────────────────────────────────────────
  const GradDefs = () => (
    <defs>
      <linearGradient id="goldGrad"    x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor={GOLD}   stopOpacity={1}  />
        <stop offset="100%" stopColor={BRONZE} stopOpacity={0.7}/>
      </linearGradient>
      <linearGradient id="tealGrad"    x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor={TEAL}   stopOpacity={.9} />
        <stop offset="100%" stopColor={CYAN}   stopOpacity={.3} />
      </linearGradient>
      <linearGradient id="wipTealGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#14B8A6" stopOpacity={1} />
        <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="wipAccumGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#14B8A6" stopOpacity={1} />
        <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="wipClearGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#64748B" stopOpacity={1} />
        <stop offset="100%" stopColor="#94A3B8" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="iceGrad"     x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor={ICE}    stopOpacity={1}  />
        <stop offset="100%" stopColor={SLATE}  stopOpacity={.6} />
      </linearGradient>
      <linearGradient id="redGrad"     x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor={RED}    stopOpacity={1}  />
        <stop offset="100%" stopColor="#991B1B" stopOpacity={.8}/>
      </linearGradient>
      <linearGradient id="amberGrad"   x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor={AMBER}  stopOpacity={1}  />
        <stop offset="100%" stopColor="#D97706" stopOpacity={.8}/>
      </linearGradient>
      <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor={EMERALD} stopOpacity={1} />
        <stop offset="100%" stopColor="#064E3B"  stopOpacity={.8}/>
      </linearGradient>
      <linearGradient id="goldBronzeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#FBBF24" stopOpacity={1} />
        <stop offset="100%" stopColor="#B45309" stopOpacity={0.8} />
      </linearGradient>
    </defs>
  );

  // ── DYNAMIC INVENTORY PROFILE ──────────────────────────────────────────────
  const invProfile = useMemo(() => {
    return getInventoryProfile(filters.product, filters.process, filters.trend, filters.subPeriod);
  }, [filters.product, filters.process, filters.trend, filters.subPeriod]);

  // ── TIME-PERIOD X-AXIS LABELS ─────────────────────────────────────────────
  const timeLabels = useMemo(() => {
    const trend = filters.trend;
    const sub   = filters.subPeriod;
    if (trend === 'year' && sub === 'yoy') return Array.from({ length: 16 }, (_, i) => String(2011 + i));
    if (trend === 'quarter') return ['Apr', 'May', 'Jun', 'Jul'];
    if (trend === 'month')   return Array.from({ length: 31 }, (_, i) => String(i + 1));
    if (trend === 'week')    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  }, [filters.trend, filters.subPeriod]);

  // ── FG DAILY BURN-DOWN DATA ────────────────────────────────────────────────
  const fgBurndownData = useMemo(() => {
    const dailyShipment = 35;
    const safetyStock = invProfile.safetyStock * 100;
    const startStock = safetyStock * 1.57; // proportionally scale start stock
    let stock = startStock;
    return Array.from({ length: 30 }, (_, d) => {
      const variance = Math.round(Math.sin(d * 0.7) * 8);
      stock = Math.max(0, stock - dailyShipment + variance);
      return { day: `D${d + 1}`, stock, safetyStock };
    });
  }, [invProfile.safetyStock]);

  const coverDaysRemaining = useMemo(() => {
    const cross = fgBurndownData.findIndex(d => d.stock <= d.safetyStock);
    return cross === -1 ? 30 : cross;
  }, [fgBurndownData]);

  // ── DYNAMIC FG DATA (FOR SELECTORS & GENERAL TRENDS) ───────────────────────
  const fgData = useMemo(() => {
    const scale = invProfile.valuation / 18000000;
    return timeLabels.map((name, i) => {
      let volume = 0;
      const trend = filters.trend;
      const sub = filters.subPeriod;
      if (trend === 'year' && sub === 'yoy') {
        volume = Math.round((2800 - (i / 15) * 1000) * scale);
      } else if (trend === 'quarter') {
        volume = Math.round((1800 + Math.sin(i) * 220) * scale);
      } else if (trend === 'month') {
        const day = i + 1;
        volume = Math.round((1900 + Math.sin(day * 0.5) * 150) * scale);
      } else if (trend === 'week') {
        volume = Math.round((1750 + (i % 3 === 0 ? 50 : -30)) * scale);
      } else {
        const monthlyV = [1800, 2020, 1950, 2100, 1780, 1900, 1850];
        volume = Math.round(monthlyV[i % monthlyV.length] * scale);
      }
      return { name, volume, safetyStock: invProfile.safetyStock * 100 };
    });
  }, [timeLabels, filters.trend, filters.subPeriod, invProfile]);

  // ── WIP WATERFALL (NET FLOW) DATA ──────────────────────────────────────────
  const wipWaterfall = useMemo(() => {
    const scale = invProfile.wipOnFloor / 2405;
    let running = 600 * scale;
    return timeLabels.map((name, i) => {
      let delta = 0;
      if (name === 'Mar') {
        // peak in March due to welding setup bottlenecks
        delta = Math.round(280 * scale);
      } else {
        delta = Math.round(((Math.sin(i * 1.4) * 80) + (i % 3 === 0 ? -50 : 30)) * scale);
      }
      const prev = running;
      running += delta;
      return { name, base: delta >= 0 ? prev : running, value: Math.abs(delta), isAdd: delta >= 0, running, delta };
    });
  }, [timeLabels, invProfile.wipOnFloor]);

  // ── DYNAMIC WIP TIMELINE DATA (for Workspace chart) ────────────────────────
  const dynamicWipData = useMemo(() => {
    const scale = invProfile.wipOnFloor / 2405;
    const trend = filters.trend;
    const sub = filters.subPeriod;

    return timeLabels.map((name, i) => {
      let wipUnits = 0;
      let avgDwellHours = 0;

      if (trend === 'year' && sub === 'yoy') {
        wipUnits = Math.round((4500 - (i / 15) * 2100) * scale);
        avgDwellHours = +(8.5 - (i / 15) * 5.0).toFixed(1);
      } else if (trend === 'month') {
        const day = i + 1;
        if (day === 12) {
          wipUnits = Math.round(680 * scale); // spike on day 12
          avgDwellHours = 14.3;
        } else {
          wipUnits = Math.round((280 + Math.sin(day * 0.8) * 30) * scale);
          avgDwellHours = +(3.5 + Math.cos(day) * 0.5).toFixed(1);
        }
      } else if (trend === 'week') {
        wipUnits = Math.round([320, 290, 410, 350, 380][i % 5] * scale);
        avgDwellHours = +[4.2, 3.8, 5.1, 4.5, 4.9][i % 5].toFixed(1);
      } else if (trend === 'quarter') {
        const quarterlyWip = [2200, 2400, 2150, 2405];
        wipUnits = Math.round(quarterlyWip[i % quarterlyWip.length] * scale);
        avgDwellHours = +[5.8, 6.2, 5.5, 6.5][i % 4].toFixed(1);
      } else {
        const monthlyWip = [1900, 2100, 2550, 2300, 2250, 2450, 2405];
        wipUnits = Math.round(monthlyWip[i % monthlyWip.length] * scale);
        avgDwellHours = +[5.2, 5.8, 8.2, 6.1, 6.0, 6.4, 6.5][i % 7].toFixed(1);
      }

      return {
        name,
        wipUnits,
        avgDwellHours
      };
    });
  }, [timeLabels, filters.trend, filters.subPeriod, invProfile]);

  // ── DYNAMIC WIP STATION DATA (for fixed process details) ───────────────────
  const wipStationData = useMemo(() => {
    const raw = invProfile.wipStationQueueData || [];
    return raw.filter((s: any) => {
      if (!filters.opSections) return true;
      if (s.section === 'premachining'  && !filters.opSections.premachining)  return false;
      if (s.section === 'machining'     && !filters.opSections.machining)     return false;
      if (s.section === 'postMachining' && !filters.opSections.postMachining) return false;
      return true;
    });
  }, [invProfile.wipStationQueueData, filters.opSections]);

  // ── DYNAMIC WIP AGING STATION DATA ─────────────────────────────────────────
  const wipAging = useMemo(() => {
    const raw = invProfile.wipPipelineAgingData || [];
    return raw.filter((a: any) => {
      if (!filters.opSections) return true;
      if (a.section === 'premachining'  && !filters.opSections.premachining)  return false;
      if (a.section === 'machining'     && !filters.opSections.machining)     return false;
      if (a.section === 'postMachining' && !filters.opSections.postMachining) return false;
      return true;
    });
  }, [invProfile.wipPipelineAgingData, filters.opSections]);

  // ── DYNAMIC VELOCITY STATION PROCESSING LEDGER ─────────────────────────────
  const stationTimeData = useMemo(() => {
    const raw = invProfile.processingVsQueueTimeData || [];
    return raw.filter((s: any) => {
      if (!filters.opSections) return true;
      if (s.section === 'premachining'  && !filters.opSections.premachining)  return false;
      if (s.section === 'machining'     && !filters.opSections.machining)     return false;
      if (s.section === 'postMachining' && !filters.opSections.postMachining) return false;
      return true;
    });
  }, [invProfile.processingVsQueueTimeData, filters.opSections]);

  const slowParts = useMemo(() => {
    let baseSlow = [
      { partNo: 'PART-441', desc: 'Cylinder Liners',   avgDays: 18.2, station: 'CL1', product: 'Matrix' },
      { partNo: 'PART-339', desc: 'Cap Screws',        avgDays: 12.4, station: 'SF01', product: 'Banana' },
      { partNo: 'PART-710', desc: 'Valve Seats',       avgDays: 9.8,  station: 'VMC1', product: 'Kiwi' },
      { partNo: 'PART-882', desc: 'Engine Gaskets',    avgDays: 7.1,  station: 'LW1', product: 'Matrix' },
      { partNo: 'PART-102', desc: 'CNC Rotor Block',   avgDays: 15.4, station: 'VMC1', product: 'Matrix' },
      { partNo: 'PART-204', desc: 'Extrusion Pipe',    avgDays: 8.5,  station: 'SF01', product: 'Banana' },
      { partNo: 'PART-306', desc: 'Brass Core Plug',   avgDays: 6.2,  station: 'BRZ', product: 'Kiwi' },
    ];

    if (filters.process === 'LW1') {
      baseSlow = [
        { partNo: 'BOT-LW1', desc: 'Active Welder Bottleneck', avgDays: 22.4, station: 'LW1', product: 'Matrix' },
        ...baseSlow.filter(p => p.station !== 'LW1')
      ];
    } else if (filters.process === 'VMC1') {
      baseSlow = [
        ...baseSlow.filter(p => p.station !== 'VMC1'),
        { partNo: 'HLT-VMC1', desc: 'Automated CNC (Safe)', avgDays: 1.8, station: 'VMC1', product: 'Kiwi' }
      ];
    }

    // Filter by product family
    const filtered = baseSlow.filter(p => {
      if (!filters.product) return true;
      return p.product === filters.product;
    });

    const scale = invProfile.daysOfCover / 14;
    return filtered.map(p => ({
      ...p,
      avgDays: p.partNo.includes('BOT-') || p.partNo.includes('HLT-') ? p.avgDays : +(p.avgDays * scale).toFixed(1)
    }));
  }, [invProfile.daysOfCover, filters.process, filters.product]);

  const fgAgingData = useMemo(() => {
    let scaleVol = invProfile.valuation / 18000000;
    let scaleCost = invProfile.valuation / 18000000;

    // Product overrides
    if (filters.product === 'Matrix') {
      scaleVol = 0.4;  // low-volume columns
      scaleCost = 2.5; // extremely high holding cost
    } else if (filters.product === 'Banana') {
      scaleVol = 2.0;  // high-volume columns
      scaleCost = 0.2; // very low, flat holding cost
    }

    // Process/Machine overrides: show only parts originating from specific machine
    if (filters.process) {
      scaleVol *= 0.15;
      scaleCost *= 0.15;
    }

    const baseAging = [
      { name: '<15 Days', fgVolume: 1200, cost: 150000 },
      { name: '15-30 Days', fgVolume: 480, cost: 120000 },
      { name: '30-60 Days', fgVolume: 260, cost: 130000 },
      { name: '60+ Days', fgVolume: 90, cost: 90000 },
    ];

    return baseAging.map(item => ({
      name: item.name,
      fgVolume: Math.round(item.fgVolume * scaleVol),
      cost: Math.round(item.cost * scaleCost),
    }));
  }, [invProfile.valuation, filters.product, filters.process]);

  // ── DYNAMIC JOYPLOT (OVERLAPPING stage waves) ──────────────────────────────
  const joyplotData = useMemo(() => {
    const scale = invProfile.wipOnFloor / 2405;
    return timeLabels.map((name, i) => {
      let rawMaterial = 150; let preMachining = 280; let machining = 360; let assembly = 220; let qualInspection = 110;
      const day = i + 1;
      const isDay12Spike = filters.trend === 'month' && day === 12;

      if (isDay12Spike) {
        machining = 680;
      } else {
        rawMaterial    = 150 + Math.sin(i * 0.8)         * 45;
        preMachining   = 280 + Math.sin(i * 1.2 + 0.5)  * 70;
        machining      = 360 + Math.sin(i * 0.9 + 1.0)  * 90;
        assembly       = 220 + Math.cos(i * 1.1)        * 55;
        qualInspection = 110 + Math.sin(i * 1.5 + 0.8)  * 40;
      }

      return {
        name,
        rawMaterial: Math.round(rawMaterial * scale),
        preMachining: Math.round(preMachining * scale),
        machining: Math.round(machining * scale),
        assembly: Math.round(assembly * scale),
        qualInspection: Math.round(qualInspection * scale),
      };
    });
  }, [timeLabels, filters.trend, invProfile.wipOnFloor]);

  // ── CYCLE TIME SCATTER DATA ────────────────────────────────────────────────
  const scatterData = useMemo(() => {
    const shifts = ['A', 'B', 'C'] as const;
    const targetScale = invProfile.daysOfCover / 14;
    return Array.from({ length: 40 }, (_, i) => {
      const shift = shifts[i % 3];
      const base = shift === 'A' ? 3.1 : shift === 'B' ? 3.6 : 3.4;
      const noise = (Math.sin(i * 1.3) * 0.9 + Math.cos(i * 0.7) * 0.4);
      const cycleTime = +( (base + noise) * targetScale ).toFixed(2);
      return { day: Math.floor(i * 0.75) + 1, cycleTime, shift, exceeded: cycleTime > 3.5 };
    });
  }, [invProfile.daysOfCover]);

  const throughputData = useMemo(() => {
    const scale = 3.5 / (invProfile.daysOfCover || 14);
    return timeLabels.map((name, i) => ({
      name,
      actual: +( (3.2 + Math.sin(i) * 0.8) * scale ).toFixed(1),
      target: 3.5,
    }));
  }, [timeLabels, invProfile.daysOfCover]);

  // FG Heat-map matrix data (capital scaled)
  const heatmapProducts = ['Cylinder Liners', 'Cap Screws', 'Valve Seats', 'Eng. Gaskets'];
  const heatmapBrackets = ['<15d', '15-30d', '30-60d', '60d+'];
  const heatmapData = useMemo(() => {
    const scale = invProfile.valuation / 18000000;
    const baseHeat = [
      [{ units: 620, cost: 77500  }, { units: 180, cost: 45000  }, { units: 85,  cost: 42500  }, { units: 30,  cost: 30000  }],
      [{ units: 280, cost: 35000  }, { units: 140, cost: 35000  }, { units: 95,  cost: 47500  }, { units: 20,  cost: 20000  }],
      [{ units: 190, cost: 23750  }, { units: 110, cost: 27500  }, { units: 60,  cost: 30000  }, { units: 25,  cost: 25000  }],
      [{ units: 110, cost: 13750  }, { units: 50,  cost: 12500  }, { units: 20,  cost: 10000  }, { units: 15,  cost: 15000  }],
    ];
    return baseHeat.map(row => row.map(cell => ({
      units: Math.round(cell.units * scale),
      cost: Math.round(cell.cost * scale)
    })));
  }, [invProfile.valuation]);
  const maxHeatCost = 77500 * (invProfile.valuation / 18000000);

  const dispatchCorr = useMemo(() => {
    const scale = invProfile.valuation / 18000000;
    return timeLabels.map((name, i) => ({
      name,
      fgLevel: Math.round((1800 + Math.sin(i) * 220) * scale),
      shipments: Math.round((420 + Math.cos(i * 1.3) * 80) * scale),
    }));
  }, [timeLabels, invProfile.valuation]);

  const PILLARS = useMemo(() => [
    { id: 'SUMMARY' as const, label: 'Inventory Summary', value: `${invProfile.daysOfCover} Days Cover` },
    { id: 'FG' as const, label: 'Finished Goods', value: `${invProfile.daysOfCover} Days Avg` },
    { id: 'WIP' as const, label: 'WIP Coverage', value: `${invProfile.wipOnFloor.toLocaleString()} Units` },
    { id: 'VELOCITY' as const, label: 'Throughput Velocity', value: '3.5d Target' },
  ], [invProfile]);

  const drillLabel =
    activePillar === 'FG'        ? 'FG Aging & Capital'
    : activePillar === 'WIP'       ? 'WIP Queues & Pipeline'
    : activePillar === 'VELOCITY'  ? 'Line Velocity Bottlenecks'
    : 'Summary Dashboard';

  const R_avail = 32;
  const R_perf = 24;
  const R_qual = 16;
  const C_avail = 2 * Math.PI * R_avail;
  const C_perf = 2 * Math.PI * R_perf;
  const C_qual = 2 * Math.PI * R_qual;

  // Concentric ring indicators mapped to the dynamic products scale
  const turnsPct = Math.min(100, (invProfile.stockTurns / 12) * 100);
  const coverPct = Math.min(100, (invProfile.daysOfCover / 25) * 100);
  const wipPct = Math.min(100, (invProfile.wipOnFloor / 3500) * 100);

  const dashoffsetAvail = C_avail * (1 - turnsPct / 100);
  const dashoffsetPerf = C_perf * (1 - coverPct / 100);
  const dashoffsetQual = C_qual * (1 - wipPct / 100);

  const formatValuation = (v: number) => {
    if (v === 0) return '₹0';
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`;
    return `₹${(v / 100000).toFixed(1)} L`;
  };

  // ── SELECTOR CARD COMPONENT ────────────────────────────────────────────────
  interface PillarTabProps {
    pillar: typeof PILLARS[number];
    isActive: boolean;
  }

  const PillarTab = ({ pillar, isActive }: PillarTabProps) => {
    const lock = pillar.id === 'SUMMARY' ? q1Lock
      : pillar.id === 'FG' ? q2Lock
      : pillar.id === 'WIP' ? q3Lock
      : q4Lock;

    const isSelected = isActive;
    
    // local profile & tags
    const localProfile = getInventoryProfile(lock.effectiveFilters.product, lock.effectiveFilters.process, lock.effectiveFilters.trend, lock.effectiveFilters.subPeriod);
    
    const localTimeLabels = useMemo(() => {
      const trend = lock.effectiveFilters.trend;
      const sub = lock.effectiveFilters.subPeriod;
      if (trend === 'year' && sub === 'yoy') return Array.from({ length: 16 }, (_, i) => String(2011 + i));
      if (trend === 'quarter') return ['Apr', 'May', 'Jun', 'Jul'];
      if (trend === 'month') return Array.from({ length: 31 }, (_, i) => String(i + 1));
      if (trend === 'week') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    }, [lock.effectiveFilters.trend, lock.effectiveFilters.subPeriod]);

    const localFgData = useMemo(() => {
      const scale = localProfile.valuation / 18000000;
      return localTimeLabels.map((name, i) => {
        let volume = 0;
        const trend = lock.effectiveFilters.trend;
        const sub = lock.effectiveFilters.subPeriod;
        if (trend === 'year' && sub === 'yoy') {
          volume = Math.round((2800 - (i / 15) * 1000) * scale);
        } else if (trend === 'quarter') {
          volume = Math.round((1800 + Math.sin(i) * 220) * scale);
        } else if (trend === 'month') {
          const day = i + 1;
          volume = Math.round((1900 + Math.sin(day * 0.5) * 150) * scale);
        } else if (trend === 'week') {
          volume = Math.round((1750 + (i % 3 === 0 ? 50 : -30)) * scale);
        } else {
          const monthlyV = [1800, 2020, 1950, 2100, 1780, 1900, 1850];
          volume = Math.round(monthlyV[i % monthlyV.length] * scale);
        }
        return { name, volume };
      });
    }, [localTimeLabels, localProfile.valuation, lock.effectiveFilters.trend, lock.effectiveFilters.subPeriod]);

    const localWipWaterfall = useMemo(() => {
      const scale = localProfile.wipOnFloor / 2405;
      let running = 600 * scale;
      return localTimeLabels.map((name, i) => {
        let delta = 0;
        if (name === 'Mar') {
          delta = Math.round(280 * scale);
        } else {
          delta = Math.round(((Math.sin(i * 1.4) * 80) + (i % 3 === 0 ? -50 : 30)) * scale);
        }
        const prev = running;
        running += delta;
        return { name, base: delta >= 0 ? prev : running, value: Math.abs(delta), isAdd: delta >= 0, running, delta };
      });
    }, [localTimeLabels, localProfile.wipOnFloor]);

    const localThroughputData = useMemo(() => {
      const scale = 3.5 / (localProfile.daysOfCover || 14);
      return localTimeLabels.map((name, i) => ({
        name,
        actual: +( (3.2 + Math.sin(i) * 0.8) * scale ).toFixed(1),
        target: 3.5,
      }));
    }, [localTimeLabels, localProfile.daysOfCover]);

    const renderFilterTags = () => {
      const f = lock.effectiveFilters;
      const tags: { text: string; type: 'period' | 'product' | 'process' }[] = [];
      
      // Period Tag
      if (f.trend === 'year' && f.subPeriod === 'yoy') {
        tags.push({ text: 'YoY', type: 'period' });
      } else if (f.trend === 'quarter') {
        tags.push({ text: 'QTD', type: 'period' });
      } else if (f.trend === 'month') {
        tags.push({ text: 'MTD', type: 'period' });
      } else if (f.trend === 'week') {
        tags.push({ text: 'WTD', type: 'period' });
      } else {
        tags.push({ text: 'YTD', type: 'period' });
      }

      // Product Tag
      if (f.product) {
        tags.push({ text: `Product: ${f.product}`, type: 'product' });
      }

      // Process Tag
      if (f.process) {
        tags.push({ text: `Process: ${f.process}`, type: 'process' });
      }

      return (
        <div className="flex flex-wrap gap-1 mt-1 pb-1">
          {tags.map((t, idx) => {
            let colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
            if (t.type === 'product') {
              colorClass = 'bg-amber-50 text-amber-700 border-amber-100'; // Peach/Orange/Gold
            } else if (t.type === 'process') {
              colorClass = 'bg-teal-50 text-teal-700 border-teal-100'; // Mint/Teal
            }
            return (
              <span 
                key={idx} 
                className={`text-[7px] font-black border px-1.5 py-0.5 rounded-full uppercase tracking-tight ${colorClass}`}
              >
                {t.text}
              </span>
            );
          })}
        </div>
      );
    };

    return (
      <button
        onClick={() => setActivePillar(pillar.id)}
        style={{
          background: isSelected ? 'rgba(180, 83, 9, 0.03)' : '#FFFFFF',
          border: lock.isLocked
            ? '1px solid rgba(180, 83, 9, 0.4)'
            : isSelected
            ? '1px solid rgba(180, 83, 9, 0.2)'
            : '1px solid rgba(226, 232, 240, 0.9)',
          borderLeft: isSelected ? '3px solid #B45309' : '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: lock.isLocked ? '0 0 8px rgba(180, 83, 9, 0.15)' : 'none',
          borderRadius: '16px',
          padding: '12px 14px',
          opacity: isSelected ? 1 : 0.5,
          transition: 'all 0.2s ease',
        }}
        className="w-full text-left flex flex-col justify-between min-h-[145px] shadow-sm relative group"
      >
        {/* Lock pin button */}
        <button
          onClick={(e) => { e.stopPropagation(); lock.toggle(); }}
          className={`absolute top-2.5 right-2.5 p-1 rounded-md transition-colors z-20 ${
            lock.isLocked 
              ? 'text-amber-600 bg-amber-50 border border-amber-100' 
              : 'text-slate-300 hover:text-slate-600 hover:bg-slate-50 border border-transparent'
          }`}
          title={lock.isLocked ? "Unlock/Sync Filters" : "Lock/Pin Filters"}
        >
          {lock.isLocked ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
        </button>

        <div className="w-full pr-6">
          <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider block">
            {pillar.id === 'SUMMARY' ? 'Overview' : 'Pillar'}
          </span>
          <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-tight mt-0.5 leading-tight">
            {pillar.label}
          </h4>
          {renderFilterTags()}
        </div>

        <div className="w-full h-[55px] my-1.5 overflow-hidden flex flex-col justify-center">
          {pillar.id === 'SUMMARY' && (
            <div className="flex items-center justify-between gap-2 h-full py-1">
              <div className="relative w-[46px] h-[46px] shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="23" cy="23" r="20" fill="transparent" stroke="#F1F5F9" strokeWidth="2.5" />
                  <circle cx="23" cy="23" r="14" fill="transparent" stroke="#F1F5F9" strokeWidth="2.5" />
                  <circle cx="23" cy="23" r="8" fill="transparent" stroke="#F1F5F9" strokeWidth="2.5" />
                  <circle cx="23" cy="23" r="20" fill="transparent" stroke={GOLD} strokeWidth="2.5" strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 * (1 - Math.min(100, (localProfile.stockTurns / 12) * 100) / 100)} strokeLinecap="round" />
                  <circle cx="23" cy="23" r="14" fill="transparent" stroke={TEAL} strokeWidth="2.5" strokeDasharray={2 * Math.PI * 14} strokeDashoffset={2 * Math.PI * 14 * (1 - Math.min(100, (localProfile.daysOfCover / 25) * 100) / 100)} strokeLinecap="round" />
                  <circle cx="23" cy="23" r="8" fill="transparent" stroke={ICE} strokeWidth="2.5" strokeDasharray={2 * Math.PI * 8} strokeDashoffset={2 * Math.PI * 8 * (1 - Math.min(100, (localProfile.wipOnFloor / 3500) * 100) / 100)} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-center">
                  <span className="text-[7.5px] font-black text-slate-800">{localProfile.stockTurns}x</span>
                </div>
              </div>
              <div className="flex-grow flex flex-col gap-0.5 text-[7px] font-black uppercase text-slate-500">
                <div className="flex justify-between items-center">
                  <span>Turns</span>
                  <span className="text-slate-700">{localProfile.stockTurns}x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cover</span>
                  <span className="text-slate-700">{localProfile.daysOfCover}d</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>WIP</span>
                  <span className="text-slate-700">{localProfile.wipOnFloor}</span>
                </div>
              </div>
            </div>
          )}
          {pillar.id === 'FG' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={localFgData} margin={{ top: 2, right: 2, left: -40, bottom: 2 }}>
                <Area type="step" dataKey="volume" stroke="#B45309" strokeWidth={1.5} fill="url(#goldGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {pillar.id === 'WIP' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={localWipWaterfall} barCategoryGap="25%" margin={{ top: 2, right: 2, left: -40, bottom: 2 }}>
                <Bar dataKey="base" stackId="wf" fill="transparent" legendType="none" />
                <Bar dataKey="value" stackId="wf" maxBarSize={22}>
                  {localWipWaterfall.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isAdd ? "#B45309" : "#14B8A6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {pillar.id === 'VELOCITY' && (
            <div className="flex flex-col gap-1 justify-center h-full py-1">
              {localThroughputData.slice(-5).map((d, idx) => (
                <div key={idx} className="flex items-center gap-1.5 w-full">
                  <div className="flex-grow bg-slate-100 rounded-full h-1 relative overflow-hidden">
                    <div className="absolute top-0 bottom-0 w-0.5 bg-rose-400" style={{ left: `${(d.target / 6) * 100}%` }} />
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(d.actual / 6) * 100}%`,
                        background: d.actual <= d.target ? ICE : AMBER
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center text-[7.5px] font-black text-slate-400 w-full uppercase mt-1">
          {lock.isLocked ? (
            <span 
              onClick={(e) => { e.stopPropagation(); lock.unlock(); }}
              className="text-amber-700 font-extrabold hover:underline"
            >
              *Isolated | Click to Sync
            </span>
          ) : (
            <span>Auto Syncing</span>
          )}
          <span className="text-slate-600 font-bold">{pillar.value}</span>
        </div>
      </button>
    );
  };

  // ── WORKSPACE COMPONENTS ───────────────────────────────────────────────────

  // ────────────────────────────────────────────────────────────────────────────
  // JoyplotRidgeline: Overlapping Ridgeline (Joyplot) Flow Chart
  // ────────────────────────────────────────────────────────────────────────────
  const JoyplotRidgeline = ({ data, compact = false }: { data: typeof joyplotData; compact?: boolean }) => {
    const VW     = 500;
    const laneH  = compact ? 34 : 48;
    const ovlap  = compact ? 8  : 13;
    const netSpc = laneH - ovlap;
    const padL   = compact ? 0  : 86;
    const padR   = 6;
    const dip    = 5;
    const totalH = 5 * netSpc + laneH + (compact ? 4 : 22);

    const stages = [
      { key: 'rawMaterial',    label: 'Raw Material',  stroke: '#BDE8F5', gradFrom: '#BDE8F5', gradTo: '#E8F9FE', gradId: 'jrRaw',  threshold: 180 },
      { key: 'preMachining',   label: 'Pre-Mach.',     stroke: '#4988C4', gradFrom: '#4988C4', gradTo: '#BDE8F5', gradId: 'jrPre',  threshold: 330 },
      { key: 'machining',      label: 'Machining',     stroke: '#1C4D8D', gradFrom: '#1C4D8D', gradTo: '#4988C4', gradId: 'jrMach', threshold: 420 },
      { key: 'assembly',       label: 'Assembly',      stroke: '#7C3AED', gradFrom: '#7C3AED', gradTo: '#A78BFA', gradId: 'jrAssy', threshold: 260 },
      { key: 'qualInspection', label: 'QC Insp.',      stroke: '#FFB090', gradFrom: '#FFB090', gradTo: '#FFF1D3', gradId: 'jrQual', threshold: 140 },
    ] as const;

    const baselineY = (idx: number) => totalH - (compact ? 6 : 18) - idx * netSpc;

    const makePath = (vals: number[], blY: number, maxV: number, closed: boolean): string => {
      const n = vals.length;
      const xStp = (VW - padL - padR) / (n - 1);
      const pts = vals.map((v, i) => ({
        x: padL + i * xStp,
        y: blY - (v / maxV) * laneH * 0.84,
      }));
      let d = closed
        ? `M ${pts[0].x} ${blY + dip} L ${pts[0].x} ${pts[0].y}`
        : `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const cpx = xStp * 0.36;
        d += ` C ${pts[i].x + cpx} ${pts[i].y} ${pts[i+1].x - cpx} ${pts[i+1].y} ${pts[i+1].x} ${pts[i+1].y}`;
      }
      if (closed) d += ` L ${pts[n-1].x} ${blY + dip} Z`;
      return d;
    };

    return (
      <svg
        viewBox={`0 0 ${VW} ${totalH}`}
        width="100%"
        height={compact ? totalH * 0.72 : totalH}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          {stages.map(s => (
            <linearGradient key={s.gradId} id={s.gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={s.gradFrom} stopOpacity={0.82} />
              <stop offset="100%" stopColor={s.gradTo}   stopOpacity={0.12} />
            </linearGradient>
          ))}
          <filter id="jrGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {stages.map((stage, idx) => {
          const blY   = baselineY(idx);
          const vals  = data.map(d => (d as any)[stage.key] as number);
          const maxV  = Math.max(...vals) * 1.08;
          const xStp  = (VW - padL - padR) / (data.length - 1);
          const areaD = makePath(vals, blY, maxV, true);
          const lineD = makePath(vals, blY, maxV, false);

          const peaks = vals
            .map((v, i) => ({ v, i, x: padL + i * xStp, y: blY - (v / maxV) * laneH * 0.84 }))
            .filter(p => p.v > stage.threshold);

          return (
            <g key={stage.key}>
              <line x1={padL} y1={blY} x2={VW - padR} y2={blY}
                stroke={stage.stroke} strokeWidth={0.4} strokeOpacity={0.22} />
              <path d={areaD} fill={`url(#${stage.gradId})`} />
              <path d={lineD} fill="none" stroke={stage.stroke}
                strokeWidth={compact ? 1 : 1.4} strokeLinejoin="round" />
              {peaks.map(pk => (
                <g key={pk.i}>
                  <circle cx={pk.x} cy={pk.y} r={compact ? 5 : 7}
                    fill="#F5788B" fillOpacity={0.18} filter="url(#jrGlow)" />
                  <circle cx={pk.x} cy={pk.y} r={compact ? 2.5 : 3.5}
                    fill="#F5788B" stroke="#FFFFFF" strokeWidth={compact ? 0.8 : 1.2} />
                </g>
              ))}
              {!compact && (
                <text
                  x={padL - 7} y={blY - laneH * 0.38}
                  textAnchor="end" fill={stage.stroke}
                  fontSize={7.5} fontWeight={800}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  letterSpacing="0.04em"
                >{stage.label}</text>
              )}
            </g>
          );
        })}

        {!compact && data.map((d, i) => {
          const xStp = (VW - padL - padR) / (data.length - 1);
          return (
            <text key={(d as any).name}
              x={padL + i * xStp} y={totalH - 2}
              textAnchor="middle" fill="#94A3B8"
              fontSize={7} fontWeight={700}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >{(d as any).name}</text>
          );
        })}
      </svg>
    );
  };

  const SummaryWorkspace = () => (
    <div className="flex flex-col gap-6 w-full pb-8">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-4 gap-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm" style={cardStyle}>
        {[
          { label: 'Total Valuation',    value: formatValuation(invProfile.valuation), sub: '+4.2% MoM',  color: GOLD,    bg: 'bg-amber-50',   border: 'border-amber-100',   icon: Coins,        up: true  },
          { label: 'Avg. Days of Cover', value: `${invProfile.daysOfCover} Days`,      sub: 'Target: 10d', color: TEAL,    bg: 'bg-teal-50',    border: 'border-teal-100',    icon: Clock,        up: false },
          { label: 'FG Stock Turns',     value: `${invProfile.stockTurns}x`,           sub: 'vs 8x target',color: ICE,    bg: 'bg-blue-50',    border: 'border-blue-100',    icon: TrendingUp,   up: false },
          { label: 'WIP On-Floor',       value: invProfile.wipOnFloor.toLocaleString(),sub: 'Units in queue',color:'#8B5CF6',bg:'bg-violet-50',border:'border-violet-100',  icon: Layers,       up: false },
        ].map(({ label, value, sub, color, bg, border, icon: Icon, up }) => (
          <div key={label} className="flex items-center justify-between border-r border-slate-100 last:border-0 pr-4">
            <div>
              <span className="text-[8.5px] font-black uppercase tracking-wider block" style={{ color }}>{label}</span>
              <p className="text-lg font-black text-slate-800 mt-0.5">{value}</p>
              <span className={`text-[8px] font-bold uppercase ${up ? 'text-emerald-600' : 'text-amber-500'}`}>{sub}</span>
            </div>
            <div className={`p-2 ${bg} border ${border} rounded-lg`}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 w-full">
        {/* P1: FG Burn-Down Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between" style={cardStyle}>
          <div className="border-b border-slate-100 pb-3 mb-3 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black text-amber-600 tracking-widest uppercase">FG Stock Cover — Burn-Down Projection</span>
              <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Daily depletion vs safety stock floor · stockout alert</p>
            </div>
            <span className="text-[8px] font-black bg-rose-50 text-rose-500 border border-rose-200 px-2 py-1 rounded uppercase">⚠ {coverDaysRemaining}d Remaining</span>
          </div>
          <div style={{ height: 240, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={fgBurndownData} barCategoryGap="25%" margin={{ top: 15, right: 24, left: -10, bottom: 10 }}>
                <defs>
                  <linearGradient id="burndownGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="safetyZoneGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 7, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} domain={[0, 2400]} />
                <Tooltip contentStyle={TT} formatter={(v: any, n: string) => [`${Number(v).toLocaleString()} units`, n]} />
                <Area type="monotone" dataKey="safetyStock" name="Safety Zone" stroke="none" fill="url(#safetyZoneGrad)" isAnimationActive={false} />
                <ReferenceLine y={invProfile.safetyStock * 100} stroke="#EF4444" strokeDasharray="4 2" strokeWidth={1.5}
                  label={{ value: `Safety Stock ${invProfile.safetyStock * 100}`, fill: '#EF4444', fontSize: 7, position: 'insideTopLeft', fontWeight: 'bold' }} />
                {coverDaysRemaining < 30 && (
                  <ReferenceLine x={`D${coverDaysRemaining}`} stroke="#F97316" strokeDasharray="3 3" strokeWidth={1.5}
                    label={{ value: `⚠ D${coverDaysRemaining}`, fill: '#F97316', fontSize: 7, position: 'top', fontWeight: 'bold' }} />
                )}
                <Area type="monotone" dataKey="stock" name="FG Stock" stroke={GOLD} strokeWidth={2.5} fill="url(#burndownGrad)" dot={false} isAnimationActive={false} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={6} wrapperStyle={centeredLegendStyle} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* P2: WIP Ridgeline Joyplot */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between" style={cardStyle}>
          <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black text-teal-600 tracking-widest uppercase">WIP Ridgeline Flow — Stage Pulse</span>
              <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 font-semibold">Independent baselines · each wave = one stage · coral glow = bottleneck alert</p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] font-black text-teal-600">5 Stages</span>
              <span className="flex items-center gap-1 text-[7.5px] font-black text-rose-400"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" /> Peaks = bottleneck</span>
            </div>
          </div>
          <div className="w-full">
            <JoyplotRidgeline data={joyplotData} />
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            {([
              { label: 'Raw Mat.', color: '#BDE8F5' },
              { label: 'Pre-Mach.', color: '#4988C4' },
              { label: 'Machining', color: '#1C4D8D' },
              { label: 'Assembly', color: '#7C3AED' },
              { label: 'QC Insp.', color: '#FFB090' },
            ] as const).map(s => (
              <span key={s.label} className="flex items-center gap-1 text-[7px] font-black text-slate-500 uppercase">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* P3: Cycle Time Scatter Distribution */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between w-full" style={cardStyle}>
        <div className="border-b border-slate-100 pb-3 mb-3 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase">Cycle Time Scatter — Run-Level Distribution</span>
            <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Every production run plotted · red dots = exceeded target · hover for batch details</p>
          </div>
          <div className="flex items-center gap-3 text-[8px] font-black uppercase">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> On-Target</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Exceeded</span>
          </div>
        </div>
        <div style={{ height: 220, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 15, right: 24, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" name="Day" type="number" domain={[0, 32]} tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} label={{ value: 'Day of Month', position: 'insideBottomRight', offset: -5, fontSize: 7, fill: '#94A3B8' }} />
              <YAxis dataKey="cycleTime" name="Cycle Time" type="number" domain={[1.5, 5.5]} tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}d`} />
              <ZAxis range={[28, 28]} />
              <Tooltip
                contentStyle={TT}
                cursor={{ strokeDasharray: '3 3', stroke: '#94A3B8' }}
                formatter={(v: any, name: string) => [name === 'cycleTime' ? `${v}d` : `Day ${v}`, name === 'cycleTime' ? 'Cycle Time' : 'Day']}
              />
              <ReferenceLine y={3.5} stroke="#EF4444" strokeDasharray="4 2" strokeWidth={1.5}
                label={{ value: 'Target 3.5d', fill: '#EF4444', fontSize: 7, position: 'insideTopRight', fontWeight: 'bold' }} />
              <Scatter
                name="On-Target"
                data={scatterData.filter(d => !d.exceeded)}
                fill="#4988C4"
                opacity={0.75}
              />
              <Scatter
                name="Exceeded"
                data={scatterData.filter(d => d.exceeded)}
                fill="#EF4444"
                opacity={0.9}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const FGWorkspace = () => {
    return (
    <div className="flex flex-col gap-6 w-full pb-8">
      <div className="grid grid-cols-2 gap-5 w-full">
        {/* FG Aging & Holding Cost Matrix (Drill-Down 2A - Left) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-5" style={cardStyle}>
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h4 className="text-[10px] font-black text-amber-600 tracking-widest uppercase">FG Aging &amp; Holding Cost Matrix</h4>
              <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Finished goods volume vs. holding cost capital allocation</p>
            </div>
            <span className="text-[8px] font-black bg-teal-50 text-teal-600 border border-teal-200 px-2 py-1 rounded uppercase">Dual Axis</span>
          </div>

          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={fgAgingData} barCategoryGap="25%" margin={{ top: 20, right: 10, left: -20, bottom: 10 }}>
                <defs>
                  <linearGradient id="fgTealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14B8A6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} label={{ value: 'FG Volume', angle: -90, position: 'insideLeft', offset: 20, fontSize: 7, fill: '#94A3B8' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={formatValuation} label={{ value: 'Holding Cost', angle: 90, position: 'insideRight', offset: 10, fontSize: 7, fill: '#94A3B8' }} />
                <Tooltip contentStyle={TT} formatter={(v: any, n: string) => [n === 'Holding Cost' ? formatValuation(v) : `${v} units`, n]} />
                <Bar yAxisId="left" dataKey="fgVolume" name="FG Volume" fill="url(#fgTealGrad)" maxBarSize={30} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="cost" name="Holding Cost" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 5, fill: '#F59E0B', stroke: 'white', strokeWidth: 1.5 }} isAnimationActive={false} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={6} wrapperStyle={centeredLegendStyle} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dispatch correlation chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-5" style={cardStyle}>
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-[10px] font-black text-slate-800 tracking-widest uppercase">FG Stock vs OTIF Shipment Schedule</h4>
            <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Outbound dispatch volume compared to inventory levels</p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dispatchCorr} margin={{ top: 15, right: 24, left: -20, bottom: 24 }}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#64748B', fontWeight: 800 }} axisLine={false} tickLine={false} interval={filters.trend === 'month' ? 4 : 0} />
                <YAxis yAxisId="l" tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT} />
                <ReferenceLine yAxisId="l" y={invProfile.safetyStock * 100} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Safety Stock', fill: '#EF4444', position: 'insideTopLeft', fontSize: 7, fontWeight: 'bold' }} />
                <Line yAxisId="l" type="monotone" dataKey="fgLevel" name="FG Stock" stroke={GOLD} strokeWidth={2.5} dot={{ r: 4.5, fill: GOLD, stroke: '#FFFFFF', strokeWidth: 1.5 }} />
                <Line yAxisId="r" type="monotone" dataKey="shipments" name="Shipments" stroke={ORANGE} strokeWidth={2.5} dot={{ r: 4.5, fill: ORANGE, stroke: '#FFFFFF', strokeWidth: 1.5 }} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={6} wrapperStyle={centeredLegendStyle} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const WIPWorkspace = () => (
    <div className="flex flex-col gap-6 w-full pb-8">
      {/* Dynamic WIP Timeline / Flow chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm" style={cardStyle}>
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
          <div>
            <h4 className="text-[10px] font-black text-teal-600 tracking-widest uppercase">WIP Volume vs. Queue Dwell Time (Timeline)</h4>
            <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
              WIP queue volume &amp; dwell time trend — {invProfile.label}
            </p>
          </div>
        </div>
        <div style={{ height: 260, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dynamicWipData} barCategoryGap="25%" margin={{ top: 20, right: 40, left: -10, bottom: 10 }}>
              <defs>
                <linearGradient id="wipTealGradLocal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14B8A6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} label={{ value: 'WIP Units', angle: -90, position: 'insideLeft', offset: 20, fontSize: 7, fill: '#94A3B8' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} label={{ value: 'Dwell (h)', angle: 90, position: 'insideRight', offset: 10, fontSize: 7, fill: '#94A3B8' }} />
              <Tooltip contentStyle={TT} formatter={(v: any, n: string) => [n === 'Avg Dwell Time' ? `${v}h` : `${v} units`, n]} />
              <ReferenceLine yAxisId="left" y={invProfile.maxBuffer} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.5}
                label={{ value: `Max Buffer Limit ${invProfile.maxBuffer}`, fill: '#EF4444', fontSize: 7, fontWeight: 'bold', position: 'insideTopRight' }} />
              <Bar yAxisId="left" dataKey="wipUnits" name="WIP Units" fill="url(#wipTealGradLocal)" maxBarSize={22} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" dataKey="avgDwellHours" name="Avg Dwell Time" stroke="#F5788B" strokeWidth={2.5} dot={{ r: 5, fill: '#F5788B', stroke: 'white', strokeWidth: 1.5 }} isAnimationActive={false} />
              <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={6} wrapperStyle={centeredLegendStyle} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* WIP Station Ledger */}
      <div className="w-full">
        {/* WIP Pipeline Aging */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm w-full" style={cardStyle}>
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h4 className="text-[10px] font-black text-slate-700 tracking-widest uppercase">WIP Pipeline Aging by Station</h4>
            <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
              Horizontal stacked segments — Fresh (&lt;24h) · Standard (24-48h) · Delayed (&gt;48h)
            </p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wipAging} layout="vertical" barCategoryGap="25%" margin={{ top: 10, right: 24, left: 10, bottom: 10 }}>
                <GradDefs />
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} unit=" units" />
                <YAxis dataKey="station" type="category" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 800 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT} />
                <Bar dataKey="fresh"    name="Fresh (<24h)"    fill={EMERALD} stackId="age" maxBarSize={22} />
                <Bar dataKey="standard" name="Standard (24-48h)" fill={AMBER}   stackId="age" maxBarSize={22} />
                <Bar dataKey="delayed"  name="Delayed (>48h)"  fill={RED}     stackId="age" radius={[0, 3, 3, 0]} maxBarSize={22} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={6} wrapperStyle={centeredLegendStyle} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const VelocityWorkspace = () => (
    <div className="flex flex-col gap-6 w-full pb-8">
      <div className="grid grid-cols-2 gap-8 w-full">
        {/* Processing vs Queue Time */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-5" style={cardStyle}>
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-[10px] font-black text-blue-600 tracking-widest uppercase">Processing vs Queue Time by Station</h4>
            <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
              Teal = machining/processing time · Orange = passive queue/wait time (hours)
            </p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stationTimeData} margin={{ top: 15, right: 24, left: -25, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="station" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 800 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT} />
                <Line type="monotone" dataKey="processing" name="Processing Time" stroke={TEAL} strokeWidth={2.5} dot={{ r: 4.5, fill: TEAL, stroke: '#FFFFFF', strokeWidth: 1.5 }} />
                <Line type="monotone" dataKey="queue" name="Queue Wait Time" stroke={ORANGE} strokeWidth={2.5} dot={{ r: 4.5, fill: ORANGE, stroke: '#FFFFFF', strokeWidth: 1.5 }} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={6} wrapperStyle={centeredLegendStyle} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Throughput ledger */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-5" style={cardStyle}>
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-[10px] font-black text-slate-700 tracking-widest uppercase">Throughput Ledger</h4>
            <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Slowest part numbers ranked by avg dwell time</p>
          </div>

          {filters.process === 'LW1' && (
            <div className="border border-red-200 rounded-xl p-3 bg-red-50 flex items-center justify-between shadow-sm animate-pulse">
              <div>
                <span className="text-[8px] font-black text-red-600 uppercase tracking-wide block">🚨 Bottleneck Alert</span>
                <p className="text-[11px] font-black text-red-700 mt-0.5">LW1 Laser Welder: 880 Units Queue (9.1h Dwell)</p>
              </div>
              <span className="text-[7px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded uppercase">Critical</span>
            </div>
          )}

          {filters.process === 'VMC1' && (
            <div className="border border-emerald-200 rounded-xl p-3 bg-emerald-50 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wide block">✅ Station Healthy</span>
                <p className="text-[11px] font-black text-emerald-700 mt-0.5">VMC1 Automated CNC: 320 Units Queue (1.8h Dwell)</p>
              </div>
              <span className="text-[7px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase">Healthy</span>
            </div>
          )}

          <div className="border border-slate-100 rounded-xl overflow-hidden flex-grow">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Part No</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Bottleneck</th>
                  <th className="p-3 text-right">Avg Dwell</th>
                </tr>
              </thead>
              <tbody>
                {slowParts.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-700">{r.partNo}</td>
                    <td className="p-3 text-slate-500 font-medium">{r.desc}</td>
                    <td className="p-3">
                      <span className="text-[8.5px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded uppercase">{r.station}</span>
                    </td>
                    <td className={`p-3 text-right font-black ${r.avgDays >= 15 ? 'text-rose-500' : r.avgDays >= 9 ? 'text-amber-500' : 'text-slate-600'}`}>
                      {r.avgDays}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-red-200 rounded-xl p-3 bg-[rgba(239,68,68,0.05)]">
              <span className="text-[8px] font-black text-red-500 uppercase tracking-wide">Worst Bottleneck</span>
              <p className="text-sm font-extrabold text-red-600 mt-0.5">
                {filters.process === 'LW1' || filters.process?.toLowerCase?.()?.includes('weld') || filters.process?.toLowerCase?.()?.includes('lw')
                  ? 'LW1'
                  : 'CL1'} — {invProfile.avgDwellTime}h queue
              </p>
            </div>
            <div className="border border-emerald-100 rounded-xl p-3 bg-emerald-50">
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-wide">Best Station</span>
              <p className="text-sm font-black text-emerald-600 mt-0.5">PACK — 1.1h queue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── RENDER SUMMARY LANDING PAGE ────────────────────────────────────────────
  if (activePillar === null) {
    return (
      <div className="w-full h-[calc(100vh-130px)] bg-[#F8F9FA] overflow-y-auto select-none p-6">
        <div className="w-full max-w-[1200px] mx-auto space-y-6">
          {/* Page Header */}
          <div className="border-b border-slate-200 pb-3 flex justify-between items-end">
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight uppercase">
                Inventory — Asset Flow &amp; Capital Velocity
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                Plant-wide volume, WIP pipeline, throughput and carrying cost portal
                {invProfile.label !== 'All Products' && (
                  <span style={{ color: TEAL, marginLeft: '6px', fontWeight: 800 }}>
                    · {invProfile.label}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* 2x2 Balanced Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Quadrant 1: Inventory Summary Index Card */}
            <div
              onClick={() => { if (q1Lock.isLocked) onChange(q1Lock.effectiveFilters); setActivePillar('SUMMARY'); }}
              className="bg-white rounded-2xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              style={{
                boxShadow: '0 12px 40px -10px rgba(245, 158, 11, 0.22), 0 1px 15px rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                ...lockedCardStyle(q1Lock.isLocked),
              }}
            >
              <CardLockHeader
                title="Inventory Summary"
                eyebrow="Asset flow & valuation indicators"
                metric={<span className="text-xs font-black text-slate-700">{invProfile.stockTurns}x turns</span>}
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
                    <circle cx="55" cy="55" r={R_avail} fill="transparent" stroke="#F1F5F9" strokeWidth="5" />
                    <circle cx="55" cy="55" r={R_perf} fill="transparent" stroke="#F1F5F9" strokeWidth="5" />
                    <circle cx="55" cy="55" r={R_qual} fill="transparent" stroke="#F1F5F9" strokeWidth="5" />
                    <circle cx="55" cy="55" r={R_avail} fill="transparent" stroke={GOLD} strokeWidth="5" strokeDasharray={C_avail} strokeDashoffset={dashoffsetAvail} strokeLinecap="round" />
                    <circle cx="55" cy="55" r={R_perf} fill="transparent" stroke={TEAL} strokeWidth="5" strokeDasharray={C_perf} strokeDashoffset={dashoffsetPerf} strokeLinecap="round" />
                    <circle cx="55" cy="55" r={R_qual} fill="transparent" stroke={ICE} strokeWidth="5" strokeDasharray={C_qual} strokeDashoffset={dashoffsetQual} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-black text-slate-800">{invProfile.stockTurns}x</span>
                    <span className="text-[6px] text-slate-400 font-bold uppercase tracking-wider">Turns</span>
                  </div>
                </div>

                {/* Vertical detail ledger */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GOLD }} />
                    <div>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase leading-none">FG Stock Turns</p>
                      <p className="text-xs font-black text-slate-700 mt-0.5">{invProfile.stockTurns}x <span className="text-[8px] text-slate-400 font-normal">/ 8x target</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TEAL }} />
                    <div>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase leading-none">Days of Cover</p>
                      <p className="text-xs font-black text-slate-700 mt-0.5">{invProfile.daysOfCover} Days <span className="text-[8px] text-slate-400 font-normal">/ 10d target</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ICE }} />
                    <div>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase leading-none">Active WIP</p>
                      <p className="text-xs font-black text-slate-700 mt-0.5">{invProfile.wipOnFloor.toLocaleString()} <span className="text-[8px] text-slate-400 font-normal">/ 2k target</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bars with shortfall indicators */}
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
                  { label: 'FG Stock Turns', val: invProfile.stockTurns, max: 12, color: GOLD, target: 8 },
                  { label: 'Days of Cover', val: invProfile.daysOfCover, max: 30, color: TEAL, target: 10, inverse: true },
                  { label: 'Active WIP', val: invProfile.wipOnFloor, max: 4000, color: ICE, target: 2000, inverse: true }
                ].map(({ label, val, max, color, target, inverse }) => {
                  const pct = Math.min((val / max) * 100, 100);
                  const targetPct = (target / max) * 100;
                  const isShortfall = inverse ? val > target : val < target;
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                        <span>{label}</span>
                        <span className="font-extrabold" style={{ color }}>{val}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                        {isShortfall && (
                          <div
                            className="absolute top-0 bottom-0 bg-red-400 animate-warning-pulse"
                            style={inverse
                              ? { left: `${targetPct}%`, right: 0 }
                              : { left: `${pct}%`, width: `${targetPct - pct}%` }
                            }
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

            {/* Quadrant 2: Finished Goods Coverage */}
            <div
              onClick={() => { if (q2Lock.isLocked) onChange(q2Lock.effectiveFilters); setActivePillar('FG'); }}
              className="rounded-2xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              onMouseEnter={() => setQ2Hovered(true)}
              onMouseLeave={() => setQ2Hovered(false)}
              style={{ ...cardStyle, transform: q2Hovered ? 'translateY(-4px)' : 'none', border: q2Hovered ? '1px solid rgba(20,184,166,0.45)' : cardStyle.border, background: q2Hovered ? 'radial-gradient(circle at center, rgba(20,184,166,0.05) 0%, rgba(255,255,255,0.92) 80%)' : cardStyle.background, boxShadow: q2Hovered ? '0 20px 48px -12px rgba(20,184,166,0.22), 0 4px 16px -4px rgba(20,184,166,0.12)' : cardStyle.boxShadow, ...lockedCardStyle(q2Lock.isLocked) }}
            >
              <CardLockHeader
                title="FG Stock — Burn-Down Projection"
                eyebrow="Daily depletion vs safety stock floor"
                metric={<span className="text-[8px] font-black text-rose-500 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">⚠ {coverDaysRemaining}d Cover</span>}
                isLocked={q2Lock.isLocked}
                effectiveFilters={q2Lock.effectiveFilters}
                globalFilters={filters}
                onToggleLock={q2Lock.toggle}
                onSync={q2Lock.unlock}
              />
              <div style={{ height: 180, width: '100%' }} className="mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fgBurndownData} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                    <defs>
                      <linearGradient id="burndownGradGW" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <ReferenceLine y={invProfile.safetyStock * 100} stroke={RED} strokeDasharray="4 2" strokeWidth={1.5} />
                    {coverDaysRemaining < 30 && <ReferenceLine x={`D${coverDaysRemaining}`} stroke="#F97316" strokeDasharray="3 3" strokeWidth={1} />}
                    <Area type="monotone" dataKey="stock" stroke={GOLD} strokeWidth={2} fill="url(#burndownGradGW)" dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase mt-4 pt-2 border-t border-slate-100">
                <span>RCA Diagnostics</span>
                <span className="text-amber-600">Open Workspace ↗</span>
              </div>
            </div>

            {/* Quadrant 3: WIP Coverage */}
            <div
              onClick={() => { if (q3Lock.isLocked) onChange(q3Lock.effectiveFilters); setActivePillar('WIP'); }}
              className="rounded-2xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              onMouseEnter={() => setQ3Hovered(true)}
              onMouseLeave={() => setQ3Hovered(false)}
              style={{
                ...cardStyle,
                transform: q3Hovered ? 'translateY(-4px)' : 'none',
                border: q3Hovered ? '1px solid rgba(20,184,166,0.45)' : (filters.process === 'LW1' ? '2px solid rgba(239, 68, 68, 0.6)' : filters.process === 'VMC1' ? '2px solid rgba(16, 185, 129, 0.6)' : cardStyle.border),
                boxShadow: q3Hovered ? '0 20px 48px -12px rgba(20,184,166,0.22), 0 4px 16px -4px rgba(20,184,166,0.12)' : (filters.process === 'LW1' ? '0 0 15px rgba(239, 68, 68, 0.25)' : filters.process === 'VMC1' ? '0 0 15px rgba(16, 185, 129, 0.25)' : cardStyle.boxShadow),
                background: q3Hovered ? 'radial-gradient(circle at center, rgba(20,184,166,0.05) 0%, rgba(255,255,255,0.92) 80%)' : cardStyle.background,
                ...lockedCardStyle(q3Lock.isLocked)
              }}
            >
              <CardLockHeader
                title="WIP Ridgeline Flow"
                eyebrow="Stage pulse · coral = bottleneck"
                metric={
                  filters.process === 'LW1' ? (
                    <span className="text-[9px] font-black text-rose-500 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">⚠ 880 Units</span>
                  ) : filters.process === 'VMC1' ? (
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">✓ 320 Units</span>
                  ) : (
                    <span className="text-xs font-black text-slate-700">5 Stages</span>
                  )
                }
                isLocked={q3Lock.isLocked}
                effectiveFilters={q3Lock.effectiveFilters}
                globalFilters={filters}
                onToggleLock={q3Lock.toggle}
                onSync={q3Lock.unlock}
              />
              <div className="w-full mt-2" style={{ minHeight: 120 }}>
                <JoyplotRidgeline data={joyplotData} compact />
              </div>
              <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase mt-4 pt-2 border-t border-slate-100">
                <span>RCA Diagnostics</span>
                <span className="text-amber-600">Open Workspace ↗</span>
              </div>
            </div>

            {/* Quadrant 4: Throughput Velocity */}
            <div
              onClick={() => { if (q4Lock.isLocked) onChange(q4Lock.effectiveFilters); setActivePillar('VELOCITY'); }}
              className="rounded-2xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              onMouseEnter={() => setQ4Hovered(true)}
              onMouseLeave={() => setQ4Hovered(false)}
              style={{ ...cardStyle, transform: q4Hovered ? 'translateY(-4px)' : 'none', border: q4Hovered ? '1px solid rgba(20,184,166,0.45)' : cardStyle.border, background: q4Hovered ? 'radial-gradient(circle at center, rgba(20,184,166,0.05) 0%, rgba(255,255,255,0.92) 80%)' : cardStyle.background, boxShadow: q4Hovered ? '0 20px 48px -12px rgba(20,184,166,0.22), 0 4px 16px -4px rgba(20,184,166,0.12)' : cardStyle.boxShadow, ...lockedCardStyle(q4Lock.isLocked) }}
            >
              <CardLockHeader
                title="Cycle Time Scatter"
                eyebrow="Run-level distribution · red = exceeded"
                metric={<span className="text-[8px] font-black text-rose-500">{scatterData.filter(d => d.exceeded).length} runs over target</span>}
                isLocked={q4Lock.isLocked}
                effectiveFilters={q4Lock.effectiveFilters}
                globalFilters={filters}
                onToggleLock={q4Lock.toggle}
                onSync={q4Lock.unlock}
              />
              <div style={{ height: 160, width: '100%' }} className="mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="day" type="number" domain={[0, 32]} tick={{ fontSize: 7, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="cycleTime" type="number" domain={[1.5, 5.5]} tick={{ fontSize: 7, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}d`} />
                    <ZAxis range={[20, 20]} />
                    <ReferenceLine y={3.5} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1.2} />
                    <Scatter data={scatterData.filter(d => !d.exceeded)} fill="#4988C4" opacity={0.7} />
                    <Scatter data={scatterData.filter(d => d.exceeded)}  fill="#EF4444" opacity={0.9} />
                  </ScatterChart>
                </ResponsiveContainer>
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

  // Active workspace drill layout (Split screen 25% / 75%)
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
              Inventory Overview
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-amber-600 font-extrabold uppercase">
              {drillLabel}
            </span>
          </div>
          <button
            onClick={() => setActivePillar(null)}
            className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors uppercase tracking-wider"
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
          {/* LEFT COLUMN: Pillar Selector — 25% width */}
          <div className="w-[25%] shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 px-1 mb-1">Pillar Selector</p>
            {PILLARS.map((p) => (
              <PillarTab key={p.id} pillar={p} isActive={activePillar === p.id} />
            ))}
          </div>

          {/* RIGHT COLUMN: Workspace details — 75% width, scrollable */}
          <div className="w-[75%] overflow-y-auto px-1 pl-2 pr-4">
            {activePillar === 'SUMMARY'  && <SummaryWorkspace />}
            {activePillar === 'FG'       && <FGWorkspace />}
            {activePillar === 'WIP'      && <WIPWorkspace />}
            {activePillar === 'VELOCITY' && <VelocityWorkspace />}
          </div>
        </div>

      </div>
    </div>
  );
}
