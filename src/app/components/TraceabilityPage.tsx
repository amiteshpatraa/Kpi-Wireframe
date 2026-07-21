import { useState, useMemo, useEffect } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend,
} from 'recharts';
import { type FilterState } from './TimeTrendFilter';
import {
  ArrowLeft,
  ArrowRight,
  GitBranch,
  ScanLine,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Fingerprint,
  GitCommit,
  QrCode,
  Search,
  Thermometer,
  Droplets,
  Activity,
  Cpu,
  Users,
  Boxes,
  Database,
  Timer,
} from 'lucide-react';
import { CardLockHeader, lockedCardStyle } from './CardLockHeader';
import { usePageCardLocks } from './useCardFilterLock';
import { getDashboardData } from '../data/dashboardDataStore';

interface TraceabilityPageProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

type TraceabilityView = 'SUMMARY_CARD' | 'SPLIT_SCREEN';
type PillarId = 'COMPLIANCE' | 'ACQUISITION' | 'THREAD';

// ─── palette constants ───────────────────────────────────────────────────────
const BEIGE   = '#F5F5DC';
const AMBER   = '#FBC02D';
const ORANGE  = '#FF8F00';
const CRIMSON = '#C62828';
const SLATE   = '#64748B';

// Re-map semantic colors to match the user's warm corporate palette
const CYAN    = '#FBC02D';  // Amber
const COBALT  = '#FF8F00';  // Orange
const EMERALD = '#FF8F00';  // Orange
const MINT    = '#F5F5DC';  // Beige
const VIOLET  = '#FF8F00';  // Orange
const MAGENTA = '#C62828';  // Crimson
const RED     = '#C62828';  // Crimson
const CORAL   = '#C62828';  // Crimson

const lines  = ['Line 1','Line 2','Line 3'];
const shifts = ['Shift A','Shift B','Shift C'];

const riskColor = (v: number) =>
  v >= 2.0 ? '#C62828' : v >= 1.2 ? '#FF8F00' : '#FBC02D';

// ─── Digital Thread Node component ──────────────────────────────────────────
interface ThreadNode {
  id: string;
  label: string;
  status: 'complete' | 'warning' | 'missing';
  ts: string;
  operator: string;
  batch: string;
  torque?: string;
}

const NODE_COLORS: Record<ThreadNode['status'], { fill: string; stroke: string; label: string }> = {
  complete: { fill: '#D1FAE5', stroke: EMERALD, label: 'Complete' },
  warning:  { fill: '#FEF3C7', stroke: AMBER,   label: 'Orphaned Metadata Warning' },
  missing:  { fill: '#FEE2E2', stroke: RED,     label: 'Orphaned / Missing' },
};

function DigitalThreadViz({ nodes, onNodeClick, selectedNode }: {
  nodes: ThreadNode[];
  onNodeClick: (n: ThreadNode) => void;
  selectedNode: ThreadNode | null;
}) {
  const W = 720; const H = 160;
  const nodeR = 28;
  const step  = W / (nodes.length + 1);
  const cy    = H / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full select-none">
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={SLATE} />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Connector lines */}
      {nodes.map((n, i) => {
        if (i === nodes.length - 1) return null;
        const x1 = step * (i + 1) + nodeR;
        const x2 = step * (i + 2) - nodeR;
        return (
          <line key={`l-${i}`}
            x1={x1} y1={cy} x2={x2} y2={cy}
            stroke={SLATE} strokeWidth={1.5} strokeDasharray="4 2"
            markerEnd="url(#arr)" />
        );
      })}

      {/* Nodes */}
      {nodes.map((n, i) => {
        const cx  = step * (i + 1);
        const col = NODE_COLORS[n.status];
        const sel = selectedNode?.id === n.id;
        return (
          <g key={n.id} onClick={() => onNodeClick(n)} className="cursor-pointer">
            <circle cx={cx} cy={cy} r={nodeR + (sel ? 4 : 0)}
              fill={col.fill} stroke={col.stroke}
              strokeWidth={sel ? 3 : 1.5}
              filter={sel ? 'url(#glow)' : undefined}
              className="transition-all duration-200"
            />
            {n.status === 'complete' && (
              <text x={cx} y={cy - 6} textAnchor="middle" fontSize={14} fill={EMERALD}>✓</text>
            )}
            {n.status === 'warning' && (
              <text x={cx} y={cy - 6} textAnchor="middle" fontSize={14} fill={AMBER}>⚠</text>
            )}
            {n.status === 'missing' && (
              <text x={cx} y={cy - 6} textAnchor="middle" fontSize={14} fill={RED}>✗</text>
            )}
            <text x={cx} y={cy + 7} textAnchor="middle" fontSize={7.5} fontWeight={800} fill={col.stroke}>
              {n.id}
            </text>
            <text x={cx} y={cy + nodeR + 14} textAnchor="middle" fontSize={7} fill={SLATE} fontWeight={600}>
              {n.label.split('\n')[1]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function TraceabilityPage({ filters, onChange }: TraceabilityPageProps) {
  const [currentView, setCurrentView] = useState<TraceabilityView>('SUMMARY_CARD');
  const [activePillar, setActivePillar] = useState<PillarId>('COMPLIANCE');
  const [selectedNode, setSelectedNode] = useState<ThreadNode | null>(null);
  const [q2Hovered, setQ2Hovered] = useState(false);
  const [q3Hovered, setQ3Hovered] = useState(false);
  const [q4Hovered, setQ4Hovered] = useState(false);

  // Time Machine Diagnostic States
  const [partSearch, setPartSearch] = useState('SN-882A');
  const [activeTimeIndex, setActiveTimeIndex] = useState(0);
  // Per-card local filter locks: [Q1, Q2, Q3]
  const [q1Lock, q2Lock, q3Lock, q4Lock] = usePageCardLocks(filters, 4);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const TT = {
    background: '#0F172A', border: '1px solid #1E3A5F', borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,.4)', fontSize: '10px', fontWeight: 600, color: '#E0F2FE',
  };

  const GradDefs = () => (
    <defs>
      <linearGradient id="cyanGrad"    x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor={AMBER}    stopOpacity={.9} />
        <stop offset="100%" stopColor={BEIGE}  stopOpacity={.3} />
      </linearGradient>
      <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor={ORANGE} stopOpacity={.9} />
        <stop offset="100%" stopColor={AMBER}    stopOpacity={.2} />
      </linearGradient>
      <linearGradient id="violetGrad"  x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor={CRIMSON}  stopOpacity={.85}/>
        <stop offset="100%" stopColor={ORANGE} stopOpacity={.2} />
      </linearGradient>
      <linearGradient id="redGrad"     x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor={CRIMSON}     stopOpacity={1}  />
        <stop offset="100%" stopColor={ORANGE}   stopOpacity={.7} />
      </linearGradient>
      <linearGradient id="amberGrad"   x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor={AMBER}   stopOpacity={1}  />
        <stop offset="100%" stopColor={BEIGE} stopOpacity={.7} />
      </linearGradient>
      <linearGradient id="gNeonCyanCobalt" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor={AMBER} />
        <stop offset="100%" stopColor={ORANGE} />
      </linearGradient>
      <linearGradient id="amberGoldGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#FBC02D" />
        <stop offset="100%" stopColor="#FF8F00" />
      </linearGradient>
      <linearGradient id="orangeCrimsonGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#FF8F00" />
        <stop offset="100%" stopColor="#C62828" />
      </linearGradient>
      <linearGradient id="creamAmberGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#F5F5DC" />
        <stop offset="100%" stopColor="#FBC02D" />
      </linearGradient>
    </defs>
  );

  // ── DYNAMIC TRACEABILITY PROFILE ENGINE ─────────────────────────────────────
  const traceProfile = useMemo(() => {
    return getDashboardData('TRACEABILITY', filters.subPeriod || filters.trend, filters.product, filters.process);
  }, [filters.subPeriod, filters.trend, filters.product, filters.process]);

  // ── DYNAMIC DIGITAL THREAD NODES LIST ──────────────────────────────────────
  const threadNodesList = useMemo(() => {
    return [
      { id: 'OP10', label: 'OP10\nTurning',   status: 'complete' as const, ts: '08:02', operator: 'OPR-441', batch: 'BATCH-882A', torque: '45 Nm' },
      { id: 'OP20', label: 'OP20\nMilling',   status: 'complete' as const, ts: '09:18', operator: 'OPR-203', batch: 'BATCH-882A', torque: '62 Nm' },
      { id: 'LW01', label: 'LW01\nWelding',   status: traceProfile.isLW01 ? ('warning' as const) : ('complete' as const), ts: '10:44', operator: 'OPR-117', batch: 'BATCH-882A', torque: '—' },
      { id: 'VMC1', label: 'VMC1\nMachining', status: 'complete' as const, ts: '12:15', operator: 'OPR-102', batch: 'BATCH-882A' },
      { id: 'CLNC', label: 'CLNC\nCleaning',  status: 'complete' as const, ts: '13:30', operator: 'OPR-441', batch: 'BATCH-882B' },
      { id: 'PACK', label: 'PACK\nPackaging', status: 'complete' as const, ts: '15:05', operator: 'OPR-308', batch: 'BATCH-882B' },
    ];
  }, [traceProfile.isLW01]);

  const timeMachineNodes = useMemo(() => {
    const prod = filters.product;
    const isWeldWarning = traceProfile.isLW01;

    let baseNodes = [
      { id: 'OP10', label: 'OP10\nTurning',   status: 'complete' as const, ts: '08:02:15.110', operator: 'OP-441', batch: 'BAT-882A', torque: '45.0 Nm', temp: 24.2, humidity: 45, vibration: 0.12, speed: '1200 RPM', depth: '0.15 mm', adjacent: 'SN-881A', statusLabel: 'Verified Complete' },
      { id: 'OP20', label: 'OP20\nMilling',   status: 'complete' as const, ts: '09:18:24.450', operator: 'OP-203', batch: 'BAT-882A', torque: '62.0 Nm', temp: 24.5, humidity: 44, vibration: 0.15, speed: '1400 RPM', depth: '0.20 mm', adjacent: 'SN-883A', statusLabel: 'Verified Complete' },
      { id: 'LW01', label: 'LW01\nWelding',   status: isWeldWarning ? ('warning' as const) : ('complete' as const), ts: '10:44:59.880', operator: 'OP-117', batch: 'BAT-882A', torque: '32.5 Nm', temp: 25.1, humidity: 46, vibration: 0.28, speed: '1800 RPM', depth: '—', adjacent: 'SN-880B', statusLabel: isWeldWarning ? 'Weld Spindle Under-Speed' : 'Verified Complete' },
      { id: 'PACK', label: 'PACK\nPackaging', status: 'complete' as const, ts: '15:05:12.640', operator: 'OP-308', batch: 'BAT-882B', torque: '—', temp: 23.8, humidity: 42, vibration: 0.08, speed: '—', depth: '0.10 mm', adjacent: 'SN-885A', statusLabel: 'Verified Complete' },
    ];

    if (prod === 'Matrix') {
      baseNodes = [
        { id: 'OP10', label: 'OP10\nCNC Turning', status: 'complete' as const, ts: '08:12:05.420', operator: 'OP-042', batch: 'BAT-2891', torque: '42.5 Nm', temp: 24.2, humidity: 45, vibration: 0.12, speed: '1350 RPM', depth: '0.12 mm', adjacent: 'SN-901M', statusLabel: 'Verified Complete' },
        { id: 'VMC1', label: 'VMC1\nMachining',   status: 'complete' as const, ts: '09:34:11.890', operator: 'OP-102', batch: 'BAT-2891', torque: '58.0 Nm', temp: 24.5, humidity: 44, vibration: 0.15, speed: '1500 RPM', depth: '0.18 mm', adjacent: 'SN-903M', statusLabel: 'Verified Complete' },
        { id: 'LW01', label: 'LW01\nLaser Weld',  status: 'warning' as const, ts: '11:02:44.200', operator: 'OP-117', batch: 'BAT-2891', torque: '32.0 Nm', temp: 25.4, humidity: 48, vibration: 0.32, speed: '2100 RPM', depth: '—', adjacent: 'SN-905M', statusLabel: 'Weld Spindle Out-Of-Spec' },
        { id: 'PACK', label: 'PACK\nMatrix Pack', status: 'complete' as const, ts: '14:22:15.330', operator: 'OP-308', batch: 'BAT-1102', torque: '—', temp: 23.8, humidity: 42, vibration: 0.08, speed: '—', depth: '0.08 mm', adjacent: 'SN-907M', statusLabel: 'Verified Complete' },
      ];
    } else if (prod === 'Banana') {
      baseNodes = [
        { id: 'OP10', label: 'OP10\nExtrusion',   status: 'complete' as const, ts: '07:44:12.180', operator: 'OP-220', batch: 'BAT-883C', torque: '39.0 Nm', temp: 23.9, humidity: 46, vibration: 0.13, speed: '1100 RPM', depth: '0.22 mm', adjacent: 'SN-102B', statusLabel: 'Verified Complete' },
        { id: 'UC1',  label: 'UC1\nUltrasonic',   status: 'missing' as const,  ts: '09:12:05.410', operator: 'OP-099', batch: 'BAT-883C', torque: '—', temp: 24.3, humidity: 47, vibration: 0.18, speed: '—', depth: '—', adjacent: 'SN-104B', statusLabel: 'Data Capture Timeout' },
        { id: 'PACK', label: 'PACK\nSleeve Pack', status: 'complete' as const, ts: '11:58:33.910', operator: 'OP-112', batch: 'BAT-884C', torque: '—', temp: 24.0, humidity: 44, vibration: 0.09, speed: '—', depth: '0.15 mm', adjacent: 'SN-106B', statusLabel: 'Verified Complete' },
      ];
    } else if (prod === 'Kiwi') {
      baseNodes = [
        { id: 'OP10', label: 'OP10\nCore Cast',   status: 'complete' as const, ts: '10:05:44.290', operator: 'OP-441', batch: 'BAT-900K', torque: '48.2 Nm', temp: 24.8, humidity: 42, vibration: 0.16, speed: '950 RPM', depth: '0.30 mm', adjacent: 'SN-332K', statusLabel: 'Verified Complete' },
        { id: 'OP20', label: 'OP20\nBoring',      status: 'complete' as const, ts: '11:42:15.820', operator: 'OP-203', batch: 'BAT-900K', torque: '64.5 Nm', temp: 24.4, humidity: 43, vibration: 0.19, speed: '1250 RPM', depth: '0.25 mm', adjacent: 'SN-334K', statusLabel: 'Verified Complete' },
        { id: 'UC1',  label: 'UC1\nUltrasonic',   status: 'complete' as const, ts: '13:05:49.120', operator: 'OP-102', batch: 'BAT-901K', torque: '—', temp: 25.0, humidity: 45, vibration: 0.22, speed: '—', depth: '—', adjacent: 'SN-336K', statusLabel: 'Verified Complete' },
        { id: 'PACK', label: 'PACK\nAssembly Pack', status: 'complete' as const, ts: '16:11:02.040', operator: 'OP-308', batch: 'BAT-902K', torque: '—', temp: 23.9, humidity: 40, vibration: 0.08, speed: '—', depth: '0.12 mm', adjacent: 'SN-338K', statusLabel: 'Verified Complete' },
      ];
    }

    if (partSearch && partSearch !== 'SN-882A' && partSearch !== 'Matrix' && partSearch !== 'Banana' && partSearch !== 'Kiwi') {
      const hash = partSearch.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const isRose = hash % 3 === 0;
      const isMissing = hash % 5 === 0;
      baseNodes = [
        { id: 'OP10', label: 'OP10\nPre-Machining', status: 'complete' as const, ts: '08:00:00.000', operator: `OP-${(hash % 900) + 100}`, batch: `BAT-${hash}`, torque: `${(40 + (hash % 10)).toFixed(1)} Nm`, temp: +(24.0 + (hash % 10) / 10).toFixed(1), humidity: 40 + (hash % 20), vibration: +(0.10 + (hash % 10) / 100).toFixed(2), speed: `${1000 + (hash % 500)} RPM`, depth: '0.15 mm', adjacent: `SN-${hash - 1}`, statusLabel: 'Verified Complete' },
        { id: 'OP20', label: 'OP20\nDrilling',      status: isRose ? ('warning' as const) : 'complete' as const, ts: '09:30:00.000', operator: `OP-${((hash + 5) % 900) + 100}`, batch: `BAT-${hash}`, torque: `${(50 + (hash % 15)).toFixed(1)} Nm`, temp: +(24.2 + (hash % 8) / 10).toFixed(1), humidity: 42 + (hash % 15), vibration: +(0.12 + (hash % 12) / 100).toFixed(2), speed: `${1200 + (hash % 600)} RPM`, depth: '0.20 mm', adjacent: `SN-${hash + 1}`, statusLabel: isRose ? 'Torque Limit Breach' : 'Verified Complete' },
        { id: 'UC1',  label: 'UC1\nAudit check',    status: isMissing ? ('missing' as const) : 'complete' as const, ts: '11:15:00.000', operator: `OP-${((hash + 10) % 900) + 100}`, batch: `BAT-${hash}`, torque: '—', temp: +(24.9 + (hash % 5) / 10).toFixed(1), humidity: 44 + (hash % 18), vibration: +(0.18 + (hash % 8) / 100).toFixed(2), speed: '—', depth: '—', adjacent: `SN-${hash + 2}`, statusLabel: isMissing ? 'Data Link Failure' : 'Verified Complete' },
        { id: 'PACK', label: 'PACK\nDispatch Pack', status: 'complete' as const, ts: '14:45:00.000', operator: `OP-${((hash + 15) % 900) + 100}`, batch: `BAT-${hash + 1}`, torque: '—', temp: +(23.6 + (hash % 6) / 10).toFixed(1), humidity: 41 + (hash % 12), vibration: +(0.07 + (hash % 5) / 100).toFixed(2), speed: '—', depth: '0.12 mm', adjacent: `SN-${hash + 3}`, statusLabel: 'Verified Complete' },
      ];
    }

    return baseNodes;
  }, [filters.product, partSearch, traceProfile.isLW01]);

  useEffect(() => {
    const proc = filters.process;
    if (proc && proc !== 'All Processes') {
      const idx = timeMachineNodes.findIndex(n => n.id.toLowerCase().includes(proc.toLowerCase()) || n.label.toLowerCase().includes(proc.toLowerCase()));
      if (idx !== -1) {
        setActiveTimeIndex(idx);
      }
    }
  }, [filters.process, timeMachineNodes]);

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

  // ── DYNAMIC RADAR COMPLIANCE RISK DATA ────────────────────────────────────
  const complianceRadar = useMemo(() => {
    const scale = traceProfile.nonComplianceRisk / 0.06;
    return timeLabels.map((month, i) => {
      let risk = 0;
      const trend = filters.trend;
      const sub = filters.subPeriod;
      if (trend === 'year' && sub === 'yoy') {
        // Long-term BPR improvement curve logic mapped to risk
        risk = +( (3.8 - (i / 15) * 3.4) * scale ).toFixed(2);
      } else if (trend === 'month') {
        const day = i + 1;
        if (day === 12) {
          risk = +(3.2 * scale).toFixed(2);
        } else {
          risk = +( (0.3 + Math.abs(Math.sin(day * 0.9)) * 0.8) * scale ).toFixed(2);
        }
      } else {
        risk = +( (0.3 + Math.abs(Math.sin(i * 1.2)) * 1.8) * scale ).toFixed(2);
      }
      return {
        month,
        risk: Math.max(0, risk),
        target: 0.5,
      };
    });
  }, [timeLabels, filters.trend, filters.subPeriod, traceProfile]);

  // ── DYNAMIC SCAN DATA (Neon Cyan Line vs Cobalt Blue Area) ────────────────
  const scanData = useMemo(() => {
    const successScale = traceProfile.firstScanSuccess / 94.2;
    return timeLabels.map((name, i) => {
      let attempts = 0; let successes = 0;
      const trend = filters.trend;
      const sub = filters.subPeriod;

      if (trend === 'year' && sub === 'yoy') {
        // Serialization climbs from 45% in 2011 to 99.4% in 2026
        const baseRate = 0.45 + (i / 15) * 0.544;
        attempts = 2000;
        successes = Math.round(attempts * baseRate * successScale);
      } else if (trend === 'month') {
        const day = i + 1;
        attempts = 1200 + Math.round(Math.sin(day) * 50);
        if (day === 12) {
          successes = Math.round(attempts * 0.78); // dramatic drop to 78% on Day 12
        } else {
          successes = Math.round(attempts * 0.942 * successScale);
        }
      } else if (trend === 'week') {
        attempts = 1100 + Math.round(Math.cos(i) * 30);
        successes = Math.round(attempts * 0.945 * successScale);
      } else {
        attempts =  1200 + Math.round(Math.sin(i) * 80);
        successes = Math.round((1150 + Math.sin(i) * 60) * successScale);
      }

      return {
        name,
        attempts,
        successes: Math.min(attempts, successes),
      };
    });
  }, [timeLabels, filters.trend, filters.subPeriod, traceProfile]);

  // ── DYNAMIC GENEALOGY DATA ────────────────────────────────────────────────
  const genealogyData = useMemo(() => {
    const scale = traceProfile.genealogyIntegrity / 98.8;
    return timeLabels.map((name, i) => {
      let completeness = 0;
      const trend = filters.trend;
      const sub = filters.subPeriod;

      if (trend === 'year' && sub === 'yoy') {
        completeness = +( (45.0 + (i / 15) * 54.4) * scale ).toFixed(1);
      } else if (trend === 'month') {
        const day = i + 1;
        if (day === 12) {
          completeness = 78.0;
        } else {
          completeness = +( (97.5 + Math.sin(day * 0.4) * 1.5) * scale ).toFixed(1);
        }
      } else {
        completeness = +( (97.5 + Math.sin(i * 0.9) * 1.8) * scale ).toFixed(1);
      }

      return {
        name,
        completeness: Math.min(100, completeness),
      };
    });
  }, [timeLabels, filters.trend, filters.subPeriod, traceProfile]);

  // Concentric Radial Progress Ring parameters
  const r1 = 40;
  const c1 = 2 * Math.PI * r1;
  const offset1 = c1 * (1 - traceProfile.complianceIndex / 100);

  const r2 = 30;
  const c2 = 2 * Math.PI * r2;
  const offset2 = c2 * (1 - traceProfile.genealogyIntegrity / 100);

  const r3 = 20;
  const c3 = 2 * Math.PI * r3;
  const offset3 = c3 * (1 - traceProfile.firstScanSuccess / 100);

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

  const heatmap = useMemo(() => {
    const arr: { line: string; shift: string; risk: number }[] = [];
    lines.forEach(l => shifts.forEach((s, si) => {
      const base = l === 'Line 2' ? 1.8 : l === 'Line 3' ? 0.9 : 0.5;
      arr.push({ line: l, shift: s, risk: +(base + si * 0.4 + 0.1).toFixed(2) });
    }));
    return arr;
  }, []);

  const scannerPerf = [
    { device: 'SCN-01 (OP10)', firstScan: 99.1, attempts: 4820 },
    { device: 'SCN-02 (OP20)', firstScan: 97.4, attempts: 4610 },
    { device: 'SCN-03 (VMC1)', firstScan: 94.2, attempts: 4990 },
    { device: 'SCN-04 (CLNC)', firstScan: 91.8, attempts: 3870 },
    { device: 'SCN-05 (PACK)', firstScan: 88.3, attempts: 5200 },
  ];

  const failureCategories = [
    { cause: 'Smeared Barcode',   count: 312 },
    { cause: 'Network Timeout',   count: 189 },
    { cause: 'Low Ambient Light', count: 143 },
    { cause: 'Operator Speed',    count: 97  },
    { cause: 'Label Placement',   count: 74  },
  ];

  const complianceLog = [
    { batch: 'BATCH-339C', line: 'Line 2', shift: 'Shift C', date: '2026-06-28', exposure: '$18,400', status: 'Unmapped' },
    { batch: 'BATCH-441B', line: 'Line 2', shift: 'Shift B', date: '2026-06-25', exposure: '$11,200', status: 'Partial'  },
    { batch: 'BATCH-882A', line: 'Line 3', shift: 'Shift C', date: '2026-06-20', exposure: '$7,600',  status: 'Partial'  },
    { batch: 'BATCH-102D', line: 'Line 1', shift: 'Shift A', date: '2026-06-15', exposure: '$3,100',  status: 'Warning'  },
  ];

  const breachLineStack = [
    { q: 'Q1', line1: 3100,  line2: 18400, line3: 7600  },
    { q: 'Q2', line1: 2800,  line2: 15200, line3: 6100  },
    { q: 'Q3', line1: 1900,  line2: 11800, line3: 4200  },
    { q: 'Q4', line1: 4200,  line2: 22100, line3: 9800  },
  ];

  const R_avail = 38;
  const R_perf = 28;
  const C_avail = 2 * Math.PI * R_avail;
  const C_perf = 2 * Math.PI * R_perf;

  const turnsPct = Math.min(100, traceProfile.complianceIndex);
  const coverPct = Math.min(100, traceProfile.genealogyIntegrity);

  const dashoffsetAvail = C_avail * (1 - turnsPct / 100);
  const dashoffsetPerf = C_perf * (1 - coverPct / 100);

  return (
    <div className="w-full h-[calc(100vh-130px)] bg-[#F8F9FA] overflow-y-auto select-none p-8 flex flex-col gap-6"
      style={{ fontFamily: '"Plus Jakarta Sans","Inter",sans-serif' }}>

      {/* ── BREADCRUMB HEADER ─────────────────────────────────────────────── */}
      {currentView === 'SUMMARY_CARD' ? (
        <div className="shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-tight uppercase">
              Traceability — Data Integrity &amp; Digital Genealogy
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
              Digital thread completeness · scanner performance · non-compliance risk portal
              {traceProfile.label !== 'All Products & Processes' && (
                <span className="ml-2 font-black text-violet-600">· {traceProfile.label}</span>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="cursor-pointer hover:text-slate-800 uppercase"
              onClick={() => setCurrentView('SUMMARY_CARD')}>Traceability Overview</span>
            <span>&gt;</span>
            <span className="text-violet-600 font-extrabold uppercase">Pillars</span>
            <span>&gt;</span>
            <span className="text-violet-600 font-extrabold uppercase">
              {activePillar === 'COMPLIANCE' ? 'Compliance Risk Map' : 'Digital Thread Timeline'}
            </span>
          </div>
          <button onClick={() => { setCurrentView('SUMMARY_CARD'); setSelectedNode(null); }}
            className="flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-slate-900
                       bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl border border-slate-200
                       transition-colors uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" />
            Back to Traceability Summary
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          LEVEL 0 — SUMMARY BALANCED GRID
      ══════════════════════════════════════════════════════════════════════ */}
      {currentView === 'SUMMARY_CARD' && (
        <div className="flex-grow flex flex-col gap-6 w-full max-w-7xl mx-auto py-1">
          {/* Synthetic KPI Summary Row */}
          <div className="grid grid-cols-4 gap-6 w-full shrink-0">
            <div style={card} className="p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col">
                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Total Traced Lots</span>
                <span className="text-base font-black mt-1" style={{ color: '#C62828' }}>124,805</span>
                <span className="text-[7px] font-semibold text-emerald-600 mt-0.5">+12.4% vs last Q</span>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100 shrink-0">
                <Database className="w-4 h-4" style={{ color: '#FF8F00' }} />
              </div>
            </div>
            <div style={card} className="p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col">
                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Genealogy matching rate</span>
                <span className="text-base font-black mt-1" style={{ color: '#FF8F00' }}>99.2%</span>
                <span className="text-[7px] font-semibold text-emerald-600 mt-0.5">Target: 98.0%</span>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100 shrink-0">
                <ScanLine className="w-4 h-4" style={{ color: '#FF8F00' }} />
              </div>
            </div>
            <div style={card} className="p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col">
                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Quarantined Lots</span>
                <span className="text-base font-black mt-1" style={{ color: '#C62828' }}>2</span>
                <span className="text-[7px] font-semibold text-rose-600 mt-0.5">Line 3 containment</span>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-100 shrink-0">
                <ShieldAlert className="w-4 h-4" style={{ color: '#C62828' }} />
              </div>
            </div>
            <div style={card} className="p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col">
                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">Gateways online</span>
                <span className="text-base font-black mt-1" style={{ color: '#FBC02D' }}>14 / 14</span>
                <span className="text-[7px] font-semibold text-emerald-600 mt-0.5">100% terminals up</span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 shrink-0">
                <Cpu className="w-4 h-4" style={{ color: '#FBC02D' }} />
              </div>
            </div>
          </div>

          {/* 2x2 Balanced Cards Grid */}
          <div className="flex-grow grid grid-cols-2 gap-6 w-full">

          {/* Quadrant 1 (Top-Left): Traceability Summary Index Card */}
          <div
            onClick={() => {
              if (q1Lock.isLocked) onChange(q1Lock.effectiveFilters);
              setCurrentView('SPLIT_SCREEN');
              setActivePillar('COMPLIANCE');
            }}
            className="hover:scale-[1.002] transition-all duration-300 flex flex-col justify-between"
            style={{
              ...card,
              padding: '24px',
              boxShadow: traceProfile.isWarning
                ? '0 12px 40px -10px rgba(198, 40, 40, 0.22), 0 1px 15px rgba(198, 40, 40, 0.12)'
                : '0 12px 40px -10px rgba(251, 192, 45, 0.22), 0 1px 15px rgba(251, 192, 45, 0.12)',
              border: traceProfile.isWarning
                ? '1px solid rgba(198, 40, 40, 0.45)'
                : '1px solid rgba(251, 192, 45, 0.45)',
              cursor: 'pointer',
              ...lockedCardStyle(q1Lock.isLocked),
            }}
          >
            <CardLockHeader
              eyebrow="Overall compliance summary"
              title="Traceability Compliance Index"
              isLocked={q1Lock.isLocked}
              effectiveFilters={q1Lock.effectiveFilters}
              globalFilters={filters}
              onToggleLock={q1Lock.toggle}
              onSync={q1Lock.unlock}
            />

            <div className="flex items-center gap-8 my-auto">
              {/* Radial rings */}
              <div className="relative flex items-center justify-center w-[180px] h-[180px] shrink-0 select-none">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="amberGoldGradGauge" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#FBC02D" />
                      <stop offset="100%" stopColor="#FF8F00" />
                    </linearGradient>
                    <linearGradient id="orangeCrimsonGradGauge" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#FF8F00" />
                      <stop offset="100%" stopColor="#C62828" />
                    </linearGradient>
                    <linearGradient id="creamAmberGradGauge" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F5F5DC" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#FBC02D" stopOpacity={0.25} />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r={R_avail} fill="transparent" stroke="url(#creamAmberGradGauge)" strokeWidth="8" />
                  <circle cx="50" cy="50" r={R_perf} fill="transparent" stroke="url(#creamAmberGradGauge)" strokeWidth="8" />
                  <circle cx="50" cy="50" r={R_avail} fill="transparent" stroke="url(#orangeCrimsonGradGauge)" strokeWidth="8" strokeDasharray={C_avail} strokeDashoffset={dashoffsetAvail} strokeLinecap="round" />
                  <circle cx="50" cy="50" r={R_perf} fill="transparent" stroke="url(#amberGoldGradGauge)" strokeWidth="8" strokeDasharray={C_perf} strokeDashoffset={dashoffsetPerf} strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-[26px] font-black text-slate-800" style={{ color: '#C62828' }}>{traceProfile.complianceIndex}%</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-1">COMPLIANCE</span>
                </div>
              </div>

              <div className="flex-grow flex flex-col gap-2.5">
                {[
                  { label: 'Compliance Index', value: `${traceProfile.complianceIndex}%`, target: '100%', color: traceProfile.isWarning ? RED : VIOLET },
                  { label: 'Genealogy Integrity', value: `${traceProfile.genealogyIntegrity}%`, target: '98%', color: EMERALD },
                  { label: 'Non-Compliance Risk', value: `${traceProfile.nonComplianceRisk}%`, target: '0.5%', color: RED },
                ].map((m) => (
                  <div key={m.label} className="flex flex-col">
                    <div className="flex justify-between items-baseline text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                        {m.label}
                      </span>
                      <span>{m.value} <span className="text-slate-400 font-medium">/ {m.target}</span></span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full rounded-full" style={{ width: m.label === 'Non-Compliance Risk' ? '20%' : m.value, backgroundColor: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-1 text-[8.5px] font-bold text-slate-400 uppercase tracking-wide">
              <span>Primary Integrity Index</span>
              <span className="text-violet-600 flex items-center gap-1">Analyze workspace <ArrowRight className="w-3 h-3" /></span>
            </div>
          </div>

          {/* Quadrant 2 (Top-Right): Compliance & Risk Index radar */}
          <div
            onClick={() => {
              if (q2Lock.isLocked) onChange(q2Lock.effectiveFilters);
              setCurrentView('SPLIT_SCREEN');
              setActivePillar('COMPLIANCE');
            }}
            className="transition-all duration-300 flex flex-col justify-between"
            onMouseEnter={() => setQ2Hovered(true)}
            onMouseLeave={() => setQ2Hovered(false)}
            style={{ ...card, padding: '24px', cursor: 'pointer', transform: q2Hovered ? 'translateY(-4px)' : 'none', border: q2Hovered ? '1px solid rgba(251,192,45,0.5)' : card.border, background: q2Hovered ? 'radial-gradient(circle at center, rgba(251,192,45,0.06) 0%, rgba(255,255,255,0.92) 80%)' : card.background, boxShadow: q2Hovered ? '0 20px 48px -12px rgba(251,192,45,0.25), 0 4px 16px -4px rgba(251,192,45,0.14)' : card.boxShadow, ...lockedCardStyle(q2Lock.isLocked) }}
          >
            <CardLockHeader
              eyebrow="Pillar 1"
              title="Compliance & Risk Index"
              metric={
                <div className="text-right">
                  <span className="text-rose-500 text-lg font-black">{traceProfile.nonComplianceRisk}%</span>
                  <span className="block text-[8px] text-slate-400 font-semibold uppercase">Risk Score</span>
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
                <RadarChart data={complianceRadar} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="month" tick={{ fontSize: 8, fill: SLATE, fontWeight: 700 }} />
                  <Radar name="Risk %" dataKey="risk" stroke={RED} strokeWidth={2} fill={RED} fillOpacity={0.18} dot={{ r: 2.5, fill: RED }} />
                  <Radar name="Target Limit" dataKey="target" stroke={EMERALD} strokeWidth={1.5} fill={EMERALD} fillOpacity={0.08} strokeDasharray="4 2" />
                  <Tooltip contentStyle={TT} />
                  <Legend {...commonLegendProps} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quadrant 3 (Bottom-Left): Data Acquisition & Scanning Success */}
          <div
            onClick={() => {
              if (q3Lock.isLocked) onChange(q3Lock.effectiveFilters);
              setCurrentView('SPLIT_SCREEN');
              setActivePillar('ACQUISITION');
            }}
            className="transition-all duration-300 flex flex-col justify-between"
            onMouseEnter={() => setQ3Hovered(true)}
            onMouseLeave={() => setQ3Hovered(false)}
            style={{ ...card, padding: '24px', cursor: 'pointer', transform: q3Hovered ? 'translateY(-4px)' : 'none', border: q3Hovered ? '1px solid rgba(251,192,45,0.5)' : card.border, background: q3Hovered ? 'radial-gradient(circle at center, rgba(251,192,45,0.06) 0%, rgba(255,255,255,0.92) 80%)' : card.background, boxShadow: q3Hovered ? '0 20px 48px -12px rgba(251,192,45,0.25), 0 4px 16px -4px rgba(251,192,45,0.14)' : card.boxShadow, ...lockedCardStyle(q3Lock.isLocked) }}
          >
            <CardLockHeader
              eyebrow="Pillar 3"
              title="Data Acquisition & Scanning"
              metric={
                <div className="text-right">
                  <span className="text-cyan-500 text-lg font-black">{traceProfile.firstScanSuccess}%</span>
                  <span className="block text-[8px] text-slate-400 font-semibold uppercase">First Scan Success</span>
                </div>
              }
              isLocked={q3Lock.isLocked}
              effectiveFilters={q3Lock.effectiveFilters}
              globalFilters={filters}
              onToggleLock={q3Lock.toggle}
              onSync={q3Lock.unlock}
            />

            <div className="flex-grow" style={{ minHeight: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scanData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <GradDefs />
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 7, fill: SLATE, fontWeight: 800 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 7, fill: SLATE }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TT} />
                  <Area type="monotone" dataKey="attempts" name="First-Scan Attempts" stroke={CYAN} strokeWidth={2} strokeDasharray="4 2" fill="none" dot={false} />
                  <Area type="monotone" dataKey="successes" name="Successful Reads" stroke={COBALT} strokeWidth={2} fill="url(#cyanGrad)" />
                  <Legend {...commonLegendProps} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quadrant 4 (Bottom-Right): Genealogy Integrity / Digital Thread */}
          <div
            onClick={() => {
              if (q4Lock.isLocked) onChange(q4Lock.effectiveFilters);
              setCurrentView('SPLIT_SCREEN');
              setActivePillar('THREAD');
            }}
            className="transition-all duration-300 flex flex-col justify-between"
            onMouseEnter={() => setQ4Hovered(true)}
            onMouseLeave={() => setQ4Hovered(false)}
            style={{ ...card, padding: '24px', cursor: 'pointer', transform: q4Hovered ? 'translateY(-4px)' : 'none', border: q4Hovered ? '1px solid rgba(251,192,45,0.5)' : card.border, background: q4Hovered ? 'radial-gradient(circle at center, rgba(251,192,45,0.06) 0%, rgba(255,255,255,0.92) 80%)' : card.background, boxShadow: q4Hovered ? '0 20px 48px -12px rgba(251,192,45,0.25), 0 4px 16px -4px rgba(251,192,45,0.14)' : card.boxShadow, ...lockedCardStyle(q4Lock.isLocked) }}
          >
            <CardLockHeader
              eyebrow="Pillar 4"
              title="Genealogy Integrity Step-Line"
              metric={
                <div className="text-right">
                  <span className="text-violet-600 text-lg font-black">{traceProfile.genealogyIntegrity}%</span>
                  <span className="block text-[8px] text-slate-400 font-semibold uppercase">Thread Integrity</span>
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
                <AreaChart data={genealogyData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <GradDefs />
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 7, fill: SLATE, fontWeight: 800 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 7, fill: SLATE }} axisLine={false} tickLine={false} domain={[40, 100]} />
                  <Tooltip contentStyle={TT} />
                  <ReferenceLine y={98} stroke={RED} strokeDasharray="4 2" strokeWidth={1.5}
                    label={{ value: 'Target 98%', fill: RED, fontSize: 7, position: 'insideTopLeft' }} />
                  <Area type="stepAfter" dataKey="completeness" name="Completeness %"
                    stroke={VIOLET} strokeWidth={2.5} fill="url(#violetGrad)" />
                  <Legend {...commonLegendProps} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════════════════════
          LEVEL 1 — 25% / 75% SPLIT-SCREEN VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {currentView === 'SPLIT_SCREEN' && (
        <div className="flex-grow flex gap-6 max-w-7xl mx-auto w-full h-[calc(100vh-175px)] overflow-hidden">

          {/* LEFT COLUMN: Pillar Selector (25% Width) */}
          <div className="w-[25%] flex flex-col gap-4 overflow-y-auto pr-1 select-none">
            {[
              { id: 'COMPLIANCE' as PillarId, name: '1. Compliance Risk Map', val: `${traceProfile.nonComplianceRisk}%`, icon: ShieldAlert, color: RED, bg: 'bg-rose-50' },
              { id: 'ACQUISITION' as PillarId, name: '2. Data Acquisition', val: `${traceProfile.firstScanSuccess}%`, icon: ScanLine, color: CYAN, bg: 'bg-cyan-50' },
              { id: 'THREAD' as PillarId, name: '3. Digital Thread Timeline', val: `${traceProfile.genealogyIntegrity}%`, icon: GitCommit, color: VIOLET, bg: 'bg-violet-50' }
            ].map((cardItem) => {
              const isActive = activePillar === cardItem.id;
              return (
                <div
                  key={cardItem.id}
                  onClick={() => {
                    setActivePillar(cardItem.id);
                    setSelectedNode(null);
                  }}
                  style={{
                    background: isActive ? 'rgba(99, 102, 241, 0.03)' : '#FFFFFF',
                    border: isActive ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(226,232,240,0.9)',
                    borderLeft: isActive ? '3px solid #6366F1' : '1px solid rgba(226,232,240,0.9)',
                    borderRadius: '16px',
                    padding: '16px',
                    opacity: isActive ? 1 : 0.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.05)' : '0 10px 30px -6px rgba(15,23,42,0.05)'
                  }}
                  className="group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border ${cardItem.bg}`}>
                        <cardItem.icon className="w-3.5 h-3.5" style={{ color: cardItem.color }} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                        {cardItem.name}
                      </span>
                    </div>
                    <span className="text-slate-800 text-xs font-black">{cardItem.val}</span>
                  </div>

                  {cardItem.id === 'COMPLIANCE' && (
                    <div style={{ height: '35px' }} className="mt-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={complianceRadar} cx="50%" cy="50%" outerRadius="80%">
                          <Radar dataKey="risk" stroke={RED} fill={RED} fillOpacity={0.15} dot={false} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {cardItem.id === 'ACQUISITION' && (
                    <div style={{ height: '35px' }} className="mt-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={scanData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <Area type="monotone" dataKey="successes" stroke={COBALT} strokeWidth={1} fill="none" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {cardItem.id === 'THREAD' && (
                    <div style={{ height: '35px' }} className="mt-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={genealogyData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <Area type="stepAfter" dataKey="completeness" stroke={VIOLET} strokeWidth={1} fill="none" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: Stacked 1-Column Workspace (75% Width) */}
          <div className="w-[75%] overflow-y-auto flex flex-col gap-6 pl-2 pr-4">

            {/* A. Compliance Risk Workspace */}
            {activePillar === 'COMPLIANCE' && (
              <div className="flex flex-col gap-6 py-1 w-full">
                {/* Heatmap line shift grid */}
                <div style={{ ...card, padding: '24px' }} className="flex flex-col gap-5">
                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-xs font-black text-rose-500 tracking-widest uppercase">Non-Compliance Risk Heatmap</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Risk ratio by production line × shift — red = high risk, green = compliant</p>
                  </div>

                  <div className="flex flex-col gap-3 justify-center">
                    <div className="grid grid-cols-4 gap-3 px-1">
                      <div />
                      {shifts.map(s => (
                        <span key={s} className="text-[9px] font-black text-slate-400 uppercase text-center">{s}</span>
                      ))}
                    </div>

                    {lines.map(l => (
                      <div key={l} className="grid grid-cols-4 gap-3 items-center">
                        <span className="text-[9px] font-black text-slate-600 uppercase">{l}</span>
                        {shifts.map(s => {
                          const cell = heatmap.find(h => h.line === l && h.shift === s);
                          const bg   = riskColor(cell?.risk ?? 0);
                          return (
                            <div key={s} className="rounded-2xl p-4 flex flex-col items-center justify-center border"
                              style={{ background: bg + '22', borderColor: bg }}>
                              <span className="text-xs font-black" style={{ color: bg }}>{cell?.risk}%</span>
                              <span className="text-[7px] font-bold text-slate-400 mt-0.5 uppercase">Risk</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}

                    <div className="flex items-center gap-4 justify-center mt-2 border-t border-slate-100 pt-3">
                      {[['Low (<1.0%)', EMERALD], ['Medium (1-2%)', AMBER], ['High (>2%)', RED]].map(([l, c]) => (
                        <span key={l} className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: c as string }} />
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stacked bar: quarterly breach exposure */}
                <div style={{ ...card, padding: '24px' }}>
                  <div className="border-b border-slate-100 pb-4 mb-4">
                    <h4 className="text-xs font-black text-slate-800 tracking-widest uppercase">Quarterly Exposure by Line</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 font-semibold">Exposure values per line across quarters</p>
                  </div>
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={breachLineStack} barCategoryGap="25%" margin={{ top: 2, right: 4, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="q" tick={{ fontSize: 7, fill: SLATE, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 7, fill: SLATE }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={TT} formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                        <Bar dataKey="line1" name="Line 1" stackId="brk" fill={EMERALD} maxBarSize={28} />
                        <Bar dataKey="line2" name="Line 2" stackId="brk" fill={RED} maxBarSize={28} />
                        <Bar dataKey="line3" name="Line 3" stackId="brk" fill={AMBER} radius={[3,3,0,0]} maxBarSize={28} />
                        <Legend {...commonLegendProps} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Breach Log table */}
                <div style={{ ...card, padding: '24px' }} className="flex flex-col gap-4">
                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-xs font-black text-slate-800 tracking-widest uppercase">Compliance Breach Log</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Estimated financial exposure of unmapped/partial batches</p>
                  </div>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                          <th className="p-3">Batch ID</th>
                          <th className="p-3">Line</th>
                          <th className="p-3">Shift</th>
                          <th className="p-3 text-right">Exposure</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {complianceLog.map((r, i) => {
                          const statusStyles: Record<string, string> = {
                            'Unmapped': 'text-rose-600 bg-rose-50 border-rose-200',
                            'Partial':  'text-amber-600 bg-amber-50 border-amber-200',
                            'Warning':  'text-orange-600 bg-orange-50 border-orange-200',
                          };
                          return (
                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                              <td className="p-3 font-bold text-slate-700">{r.batch}</td>
                              <td className="p-3 text-slate-500 font-medium">{r.line}</td>
                              <td className="p-3 text-slate-500 font-medium">{r.shift}</td>
                              <td className="p-3 text-right font-black text-rose-600">{r.exposure}</td>
                              <td className="p-3">
                                <span className={`text-[8px] font-black border px-2 py-0.5 rounded-md uppercase ${statusStyles[r.status]}`}>{r.status}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex justify-between items-center">
                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider">Total Exposure Value</span>
                    <span className="text-base font-black text-rose-600">$40,300</span>
                  </div>
                </div>
              </div>
            )}

            {/* B. Data Acquisition Workspace */}
            {activePillar === 'ACQUISITION' && (
              <div className="flex flex-col gap-6 py-1 w-full">

                {/* Scanner First-Scan Success Rates */}
                <div style={{ ...card, padding: '24px' }} className="flex flex-col gap-5">
                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-xs font-black text-cyan-500 tracking-widest uppercase">Scanner First-Scan Success Rates</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Barcode reader performance by station — first-attempt read success rate</p>
                  </div>
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scannerPerf} layout="vertical" barCategoryGap="25%" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                        <XAxis type="number" domain={[80, 100]} tick={{ fontSize: 7, fill: SLATE }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
                        <YAxis type="category" dataKey="device" tick={{ fontSize: 8, fill: SLATE, fontWeight: 700 }} axisLine={false} tickLine={false} width={110} />
                        <Tooltip contentStyle={TT} formatter={(v: number) => [`${v}%`, 'First Scan Rate']} />
                        <Bar dataKey="firstScan" name="First-Scan Success %" radius={[0, 4, 4, 0]} maxBarSize={28}>
                          {scannerPerf.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.firstScan >= 96 ? EMERALD : entry.firstScan >= 92 ? COBALT : AMBER} />
                          ))}
                        </Bar>
                        <Legend {...commonLegendProps} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Data Failure Mode Analysis */}
                <div style={{ ...card, padding: '24px' }}>
                  <div className="border-b border-slate-100 pb-4 mb-4">
                    <h4 className="text-xs font-black text-slate-800 tracking-widest uppercase">Data Failure Mode Analysis</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Categorized scan failure root causes — ranked by frequency</p>
                  </div>
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={failureCategories} barCategoryGap="25%" margin={{ top: 5, right: 20, left: -10, bottom: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="cause" tick={{ fontSize: 7.5, fill: SLATE, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 7, fill: SLATE }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TT} formatter={(v: number) => [v, 'Failures']} />
                        <Bar dataKey="count" name="Failure Count" radius={[4, 4, 0, 0]}>
                          {failureCategories.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={[RED, CORAL, AMBER, VIOLET, CYAN][index % 5]} />
                          ))}
                        </Bar>
                        <Legend {...commonLegendProps} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}

            {/* C. Digital Thread Timeline Workspace */}

            {activePillar === 'THREAD' && (() => {
              const activeNode = timeMachineNodes[activeTimeIndex] || timeMachineNodes[0];
              return (
                <div className="flex flex-col gap-6 py-1 w-full">
                  <div style={{ ...card, padding: '24px' }}>
                    
                    {/* Header with Search and Information */}
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                      <div>
                        <h4 className="text-xs font-black text-violet-600 tracking-widest uppercase flex items-center gap-1.5">
                          <Fingerprint className="w-4 h-4 animate-pulse" />
                          Digital Genealogy Time Machine
                        </h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                          Forensic shop-floor reconstruction · Second-by-second telemetry playback
                        </p>
                      </div>
                      
                      {/* Search Bar input */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Search Part SN:</span>
                        <div className="relative">
                          <input
                            type="text"
                            value={partSearch}
                            onChange={(e) => {
                              setPartSearch(e.target.value);
                              setActiveTimeIndex(0);
                            }}
                            placeholder="e.g. SN-882A"
                            className="bg-slate-50 border border-slate-200 text-slate-800 text-[10px] font-black uppercase rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:border-violet-500 transition-colors w-[130px]"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>

                    {/* Split Layout Container */}
                    <div className="flex gap-6 w-full min-h-[320px]">
                      
                      {/* A. Left Column: Vertical Timeline Track (30% Width) */}
                      <div className="w-[30%] border-r border-slate-100 pr-6 flex gap-4 select-none">
                        
                        {/* Interactive vertical slider */}
                        <div className="relative flex flex-col items-center justify-between py-8 h-[220px] w-8">
                          <div className="absolute top-8 bottom-8 w-1 bg-slate-100 rounded-full" />
                          
                          {/* Glow Active Track Line */}
                          <div
                            className="absolute w-1 bg-indigo-500 rounded-full transition-all duration-300"
                            style={{
                              top: '32px',
                              height: `${(activeTimeIndex / (timeMachineNodes.length - 1)) * 156}px`,
                            }}
                          />
                          
                          {/* Slider range input rotated vertical */}
                          <input
                            type="range"
                            min={0}
                            max={timeMachineNodes.length - 1}
                            value={activeTimeIndex}
                            onChange={(e) => setActiveTimeIndex(Number(e.target.value))}
                            style={{
                              writingMode: 'vertical-lr',
                              direction: 'rtl',
                              height: '160px',
                              width: '24px',
                              opacity: 0,
                              cursor: 'pointer',
                              zIndex: 20
                            }}
                            className="absolute inset-y-8 left-0"
                          />

                          {/* Render custom slider thumb overlay */}
                          <div
                            className="absolute w-4 h-4 bg-indigo-600 border-2 border-white rounded-full shadow-md z-10 transition-all duration-300 pointer-events-none"
                            style={{
                              top: `calc(32px + ${(activeTimeIndex / (timeMachineNodes.length - 1)) * 156}px - 8px)`
                            }}
                          />
                        </div>

                        {/* Stations Vertical List */}
                        <div className="flex-grow flex flex-col justify-between py-6 h-[220px]">
                          {timeMachineNodes.map((node, idx) => {
                            const isActive = idx === activeTimeIndex;
                            const isComplete = node.status === 'complete';
                            const isWarning = node.status === 'warning';
                            const isMissing = node.status === 'missing';
                            
                            // styling based on status
                            const bgColor = isComplete ? '#D1FAE5' : isWarning ? '#FFE4E6' : '#FFE4E6';
                            const borderColor = isComplete ? '#0D9488' : isWarning ? '#F43F5E' : '#EF4444';
                            const textColor = isComplete ? '#065F46' : isWarning ? '#991B1B' : '#991B1B';

                            return (
                              <div
                                key={node.id}
                                onClick={() => setActiveTimeIndex(idx)}
                                className="flex items-center gap-3 cursor-pointer group transition-all duration-200"
                              >
                                {/* Circle node squircles */}
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-200 ${
                                    isActive
                                      ? 'ring-2 ring-violet-500 ring-offset-2 scale-110 shadow-lg'
                                      : 'opacity-80 group-hover:opacity-100 group-hover:scale-105'
                                  }`}
                                  style={{
                                    backgroundColor: bgColor,
                                    borderColor: isActive ? '#6366F1' : borderColor,
                                  }}
                                >
                                  <span className="text-[10px] font-black" style={{ color: isActive ? '#6366F1' : textColor }}>{node.id}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className={`text-[10px] font-black uppercase leading-tight ${isActive ? 'text-violet-600' : 'text-slate-700'}`}>
                                    {node.label.replace('\n', ' ')}
                                  </span>
                                  <span className="text-[8px] font-bold text-slate-400 leading-none">{node.ts}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* B. Right Column: Telemetry Snapshot (70% Width) */}
                      <div className="w-[70%] flex flex-col gap-4">
                        
                        {/* Selected Node Header */}
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase bg-violet-100 text-violet-700 border border-violet-200 rounded px-2 py-0.5">
                              {activeNode.id}
                            </span>
                            <span className="text-[11px] font-black text-slate-700 uppercase">
                              {activeNode.label.replace('\n', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[8.5px] font-black text-slate-400 uppercase">Timestamp:</span>
                            <span className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 rounded px-2 py-0.5 flex items-center gap-1">
                              <Timer className="w-3 h-3 text-slate-400" />
                              {activeNode.ts}
                            </span>
                            <span className="text-[8.5px] font-black px-2 py-0.5 rounded border uppercase ml-2"
                              style={{
                                color: activeNode.status === 'complete' ? '#0F766E' : '#BE123C',
                                backgroundColor: activeNode.status === 'complete' ? '#F0FDF4' : '#FFF1F2',
                                borderColor: activeNode.status === 'complete' ? '#86EFAC' : '#FECDD3',
                              }}
                            >
                              {activeNode.statusLabel}
                            </span>
                          </div>
                        </div>

                        {/* Snapshot 3-Section Grid */}
                        <div className="grid grid-cols-3 gap-4">
                          
                          {/* 1. Environmental IoT */}
                          <div className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-4 shadow-sm transition-all duration-200 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 border-b border-slate-50 pb-2 mb-3">
                                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Environmental IoT</span>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1 text-slate-400">
                                    <Thermometer className="w-3 h-3" />
                                    <span className="text-[8.5px] font-bold uppercase">Ambient Temp</span>
                                  </div>
                                  <span className="text-[11px] font-black text-slate-700">{activeNode.temp} °C</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1 text-slate-400">
                                    <Droplets className="w-3 h-3" />
                                    <span className="text-[8.5px] font-bold uppercase">Humidity</span>
                                  </div>
                                  <span className="text-[11px] font-black text-slate-700">{activeNode.humidity}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1 text-slate-400">
                                    <Cpu className="w-3 h-3" />
                                    <span className="text-[8.5px] font-bold uppercase">Vibration</span>
                                  </div>
                                  <span className="text-[11px] font-black text-slate-700">{activeNode.vibration} G</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 pt-2 border-t border-slate-50">
                              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: '82%' }} />
                              </div>
                            </div>
                          </div>

                          {/* 2. Machine Process Parameters */}
                          <div className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-4 shadow-sm transition-all duration-200 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 border-b border-slate-50 pb-2 mb-3">
                                <Cpu className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Process Parameters</span>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[8.5px] font-bold text-slate-400 uppercase">Milling Torque</span>
                                  <span className={`text-[11px] font-black ${activeNode.torque.includes('—') ? 'text-slate-400' : 'text-slate-700'}`}>{activeNode.torque}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[8.5px] font-bold text-slate-400 uppercase">Spindle Speed</span>
                                  <span className={`text-[11px] font-black ${activeNode.speed.includes('—') ? 'text-slate-400' : 'text-slate-700'}`}>{activeNode.speed}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[8.5px] font-bold text-slate-400 uppercase">Laser Depth</span>
                                  <span className={`text-[11px] font-black ${activeNode.depth.includes('—') ? 'text-slate-400' : 'text-slate-700'}`}>{activeNode.depth}</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 pt-2 border-t border-slate-50">
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${activeNode.status === 'complete' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                {activeNode.status === 'complete' ? 'Tolerances: PASS' : 'Alert: OUT OF SPEC'}
                              </span>
                            </div>
                          </div>

                          {/* 3. Labor & Batch Context */}
                          <div className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-4 shadow-sm transition-all duration-200 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 border-b border-slate-50 pb-2 mb-3">
                                <Users className="w-3.5 h-3.5 text-violet-500" />
                                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Labor & Batch</span>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[8.5px] font-bold text-slate-400 uppercase">Operator ID</span>
                                  <span className="text-[11px] font-black text-slate-700">{activeNode.operator}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[8.5px] font-bold text-slate-400 uppercase">Batch Bins</span>
                                  <span className="text-[10px] font-black text-slate-700 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">{activeNode.batch}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[8.5px] font-bold text-slate-400 uppercase">Parallel Run</span>
                                  <span className="text-[10px] font-black text-violet-600">{activeNode.adjacent}</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 pt-2 border-t border-slate-50 flex justify-between items-center">
                              <span className="text-[7.5px] font-black text-slate-400 uppercase">Shift B (Active)</span>
                              <Database className="w-3 h-3 text-slate-300" />
                            </div>
                          </div>

                        </div>

                        {/* Telemetry Gap alert details */}
                        {activeNode.status !== 'complete' && (
                          <div className="mt-2 flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl p-4 shadow-sm">
                            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 animate-bounce" />
                            <div>
                              <p className="text-[10px] font-black text-rose-800 uppercase tracking-wider">Forensic Alert — Telemetry Breach / Gap</p>
                              <p className="text-[9.5px] font-bold text-rose-700 mt-0.5">
                                {activeNode.status === 'warning'
                                  ? 'Welding spindle warning — spindle speed exceeded safe threshold during batch melt cycle.'
                                  : 'Missing packet — critical sensor failure detected during data transmission on ultrasonic station.'}
                              </p>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>

                  </div>
                </div>
              );
            })()}

          </div>

        </div>
      )}

    </div>
  );
}
