import { PeriodId, ProductId, getTimeLabels } from './types';

export interface ThreadNode {
  id: string;
  label: string;
  status: 'complete' | 'warning' | 'missing';
  ts: string;
  operator: string;
  batch: string;
  torque?: string;
  temp?: number;
  humidity?: number;
  vibration?: number;
  speed?: string;
  depth?: string;
  adjacent?: string;
  statusLabel?: string;
}

export const NODE_COLORS: Record<ThreadNode['status'], { fill: string; stroke: string; label: string }> = {
  complete: { fill: '#D1FAE5', stroke: '#FF8F00', label: 'Complete' },
  warning:  { fill: '#FEF3C7', stroke: '#FBC02D', label: 'Orphaned Metadata Warning' },
  missing:  { fill: '#FEE2E2', stroke: '#C62828', label: 'Orphaned / Missing' },
};

export const SCANNER_PERFORMANCE = [
  { device: 'SCN-01 (OP10)', firstScan: 99.1, attempts: 4820 },
  { device: 'SCN-02 (OP20)', firstScan: 97.4, attempts: 4610 },
  { device: 'SCN-03 (VMC1)', firstScan: 94.2, attempts: 4990 },
  { device: 'SCN-04 (CLNC)', firstScan: 91.8, attempts: 3870 },
  { device: 'SCN-05 (PACK)', firstScan: 88.3, attempts: 5200 },
];

export const FAILURE_CATEGORIES = [
  { cause: 'Smeared Barcode',   count: 312 },
  { cause: 'Network Timeout',   count: 189 },
  { cause: 'Low Ambient Light', count: 143 },
  { cause: 'Operator Speed',    count: 97  },
  { cause: 'Label Placement',   count: 74  },
];

export const COMPLIANCE_LOG = [
  { batch: 'BATCH-339C', line: 'Line 2', shift: 'Shift C', date: '2026-06-28', exposure: '$18,400', status: 'Unmapped' },
  { batch: 'BATCH-441B', line: 'Line 2', shift: 'Shift B', date: '2026-06-25', exposure: '$11,200', status: 'Partial'  },
  { batch: 'BATCH-882A', line: 'Line 3', shift: 'Shift C', date: '2026-06-20', exposure: '$7,600',  status: 'Partial'  },
  { batch: 'BATCH-102D', line: 'Line 1', shift: 'Shift A', date: '2026-06-15', exposure: '$3,100',  status: 'Warning'  },
];

export const BREACH_LINE_STACK = [
  { q: 'Q1', line1: 3100,  line2: 18400, line3: 7600  },
  { q: 'Q2', line1: 2800,  line2: 15200, line3: 6100  },
  { q: 'Q3', line1: 1900,  line2: 11800, line3: 4200  },
  { q: 'Q4', line1: 4200,  line2: 22100, line3: 9800  },
];

export const TRACEABILITY_LINES = ['Line 1', 'Line 2', 'Line 3'];
export const TRACEABILITY_SHIFTS = ['Shift A', 'Shift B', 'Shift C'];

export function resolveHeatmapData() {
  const arr: { line: string; shift: string; risk: number }[] = [];
  TRACEABILITY_LINES.forEach(l => TRACEABILITY_SHIFTS.forEach((s, si) => {
    const base = l === 'Line 2' ? 1.8 : l === 'Line 3' ? 0.9 : 0.5;
    arr.push({ line: l, shift: s, risk: +(base + si * 0.4 + 0.1).toFixed(2) });
  }));
  return arr;
}

export function resolveTimeMachineNodes(product: string, partSearch: string, isWeldWarning: boolean): ThreadNode[] {
  let baseNodes: ThreadNode[] = [
    { id: 'OP10', label: 'OP10\nTurning',   status: 'complete', ts: '08:02:15.110', operator: 'OP-441', batch: 'BAT-882A', torque: '45.0 Nm', temp: 24.2, humidity: 45, vibration: 0.12, speed: '1200 RPM', depth: '0.15 mm', adjacent: 'SN-881A', statusLabel: 'Verified Complete' },
    { id: 'OP20', label: 'OP20\nMilling',   status: 'complete', ts: '09:18:24.450', operator: 'OP-203', batch: 'BAT-882A', torque: '62.0 Nm', temp: 24.5, humidity: 44, vibration: 0.15, speed: '1400 RPM', depth: '0.20 mm', adjacent: 'SN-883A', statusLabel: 'Verified Complete' },
    { id: 'LW01', label: 'LW01\nWelding',   status: isWeldWarning ? 'warning' : 'complete', ts: '10:44:59.880', operator: 'OP-117', batch: 'BAT-882A', torque: '32.5 Nm', temp: 25.1, humidity: 46, vibration: 0.28, speed: '1800 RPM', depth: '—', adjacent: 'SN-880B', statusLabel: isWeldWarning ? 'Weld Spindle Under-Speed' : 'Verified Complete' },
    { id: 'PACK', label: 'PACK\nPackaging', status: 'complete', ts: '15:05:12.640', operator: 'OP-308', batch: 'BAT-882B', torque: '—', temp: 23.8, humidity: 42, vibration: 0.08, speed: '—', depth: '0.10 mm', adjacent: 'SN-885A', statusLabel: 'Verified Complete' },
  ];

  if (product === 'Matrix') {
    baseNodes = [
      { id: 'OP10', label: 'OP10\nCNC Turning', status: 'complete', ts: '08:12:05.420', operator: 'OP-042', batch: 'BAT-2891', torque: '42.5 Nm', temp: 24.2, humidity: 45, vibration: 0.12, speed: '1350 RPM', depth: '0.12 mm', adjacent: 'SN-901M', statusLabel: 'Verified Complete' },
      { id: 'VMC1', label: 'VMC1\nMachining',   status: 'complete', ts: '09:34:11.890', operator: 'OP-102', batch: 'BAT-2891', torque: '58.0 Nm', temp: 24.5, humidity: 44, vibration: 0.15, speed: '1500 RPM', depth: '0.18 mm', adjacent: 'SN-903M', statusLabel: 'Verified Complete' },
      { id: 'LW01', label: 'LW01\nLaser Weld',  status: 'warning', ts: '11:02:44.200', operator: 'OP-117', batch: 'BAT-2891', torque: '32.0 Nm', temp: 25.4, humidity: 48, vibration: 0.32, speed: '2100 RPM', depth: '—', adjacent: 'SN-905M', statusLabel: 'Weld Spindle Out-Of-Spec' },
      { id: 'PACK', label: 'PACK\nMatrix Pack', status: 'complete', ts: '14:22:15.330', operator: 'OP-308', batch: 'BAT-1102', torque: '—', temp: 23.8, humidity: 42, vibration: 0.08, speed: '—', depth: '0.08 mm', adjacent: 'SN-907M', statusLabel: 'Verified Complete' },
    ];
  } else if (product === 'Banana') {
    baseNodes = [
      { id: 'OP10', label: 'OP10\nExtrusion',   status: 'complete', ts: '07:44:12.180', operator: 'OP-220', batch: 'BAT-883C', torque: '39.0 Nm', temp: 23.9, humidity: 46, vibration: 0.13, speed: '1100 RPM', depth: '0.22 mm', adjacent: 'SN-102B', statusLabel: 'Verified Complete' },
      { id: 'UC1',  label: 'UC1\nUltrasonic',   status: 'missing',  ts: '09:12:05.410', operator: 'OP-099', batch: 'BAT-883C', torque: '—', temp: 24.3, humidity: 47, vibration: 0.18, speed: '—', depth: '—', adjacent: 'SN-104B', statusLabel: 'Data Capture Timeout' },
      { id: 'PACK', label: 'PACK\nSleeve Pack', status: 'complete', ts: '11:58:33.910', operator: 'OP-112', batch: 'BAT-884C', torque: '—', temp: 24.0, humidity: 44, vibration: 0.09, speed: '—', depth: '0.15 mm', adjacent: 'SN-106B', statusLabel: 'Verified Complete' },
    ];
  } else if (product === 'Kiwi') {
    baseNodes = [
      { id: 'OP10', label: 'OP10\nCore Cast',   status: 'complete', ts: '10:05:44.290', operator: 'OP-441', batch: 'BAT-900K', torque: '48.2 Nm', temp: 24.8, humidity: 42, vibration: 0.16, speed: '950 RPM', depth: '0.30 mm', adjacent: 'SN-332K', statusLabel: 'Verified Complete' },
      { id: 'OP20', label: 'OP20\nBoring',      status: 'complete', ts: '11:42:15.820', operator: 'OP-203', batch: 'BAT-900K', torque: '64.5 Nm', temp: 24.4, humidity: 43, vibration: 0.19, speed: '1250 RPM', depth: '0.25 mm', adjacent: 'SN-334K', statusLabel: 'Verified Complete' },
      { id: 'UC1',  label: 'UC1\nUltrasonic',   status: 'complete', ts: '13:05:49.120', operator: 'OP-102', batch: 'BAT-901K', torque: '—', temp: 25.0, humidity: 45, vibration: 0.22, speed: '—', depth: '—', adjacent: 'SN-336K', statusLabel: 'Verified Complete' },
      { id: 'PACK', label: 'PACK\nAssembly Pack', status: 'complete', ts: '16:11:02.040', operator: 'OP-308', batch: 'BAT-902K', torque: '—', temp: 23.9, humidity: 40, vibration: 0.08, speed: '—', depth: '0.12 mm', adjacent: 'SN-338K', statusLabel: 'Verified Complete' },
    ];
  }

  if (partSearch && partSearch !== 'SN-882A' && partSearch !== 'Matrix' && partSearch !== 'Banana' && partSearch !== 'Kiwi') {
    const hash = partSearch.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const isRose = hash % 3 === 0;
    const isMissing = hash % 5 === 0;
    baseNodes = [
      { id: 'OP10', label: 'OP10\nPre-Machining', status: 'complete', ts: '08:00:00.000', operator: `OP-${(hash % 900) + 100}`, batch: `BAT-${hash}`, torque: `${(40 + (hash % 10)).toFixed(1)} Nm`, temp: +(24.0 + (hash % 10) / 10).toFixed(1), humidity: 40 + (hash % 20), vibration: +(0.10 + (hash % 10) / 100).toFixed(2), speed: `${1000 + (hash % 500)} RPM`, depth: '0.15 mm', adjacent: `SN-${hash - 1}`, statusLabel: 'Verified Complete' },
      { id: 'OP20', label: 'OP20\nDrilling',      status: isRose ? 'warning' : 'complete', ts: '09:30:00.000', operator: `OP-${((hash + 5) % 900) + 100}`, batch: `BAT-${hash}`, torque: `${(50 + (hash % 15)).toFixed(1)} Nm`, temp: +(24.2 + (hash % 8) / 10).toFixed(1), humidity: 42 + (hash % 15), vibration: +(0.12 + (hash % 12) / 100).toFixed(2), speed: `${1200 + (hash % 600)} RPM`, depth: '0.20 mm', adjacent: `SN-${hash + 1}`, statusLabel: isRose ? 'Torque Limit Breach' : 'Verified Complete' },
      { id: 'UC1',  label: 'UC1\nAudit check',    status: isMissing ? 'missing' : 'complete', ts: '11:15:00.000', operator: `OP-${((hash + 10) % 900) + 100}`, batch: `BAT-${hash}`, torque: '—', temp: +(24.9 + (hash % 5) / 10).toFixed(1), humidity: 44 + (hash % 18), vibration: +(0.18 + (hash % 8) / 100).toFixed(2), speed: '—', depth: '—', adjacent: `SN-${hash + 2}`, statusLabel: isMissing ? 'Data Link Failure' : 'Verified Complete' },
      { id: 'PACK', label: 'PACK\nDispatch Pack', status: 'complete', ts: '14:45:00.000', operator: `OP-${((hash + 15) % 900) + 100}`, batch: `BAT-${hash + 1}`, torque: '—', temp: +(23.6 + (hash % 6) / 10).toFixed(1), humidity: 41 + (hash % 12), vibration: +(0.07 + (hash % 5) / 100).toFixed(2), speed: '—', depth: '0.12 mm', adjacent: `SN-${hash + 3}`, statusLabel: 'Verified Complete' },
    ];
  }

  return baseNodes;
}

export function resolveTraceabilityData(period: PeriodId, product: ProductId, process: string): any {
  const tLabels = getTimeLabels(period);
  const isLW1 = process === 'LW1';
  const isVMC1 = process === 'VMC1';

  let complianceIndex = 99.4;
  let nonComplianceRisk = 0.06;
  let firstScanSuccess = 94.2;
  let genealogyIntegrity = 98.8;
  let isWarning = false;
  let label = 'All Products & Processes';

  if (isLW1) {
    complianceIndex = 98.4;
    nonComplianceRisk = 0.15;
    firstScanSuccess = 78.2;
    genealogyIntegrity = 95.5;
    isWarning = true;
    label = 'LW01 (Laser Welder 1) Bottleneck';
  } else if (isVMC1) {
    complianceIndex = 99.9;
    nonComplianceRisk = 0.01;
    firstScanSuccess = 99.5;
    genealogyIntegrity = 99.8;
    label = 'VMC Machining Station';
  }

  const threadNodesList: ThreadNode[] = [
    { id: 'OP10', label: 'OP10\nTurning', status: 'complete', ts: '08:02', operator: 'OPR-441', batch: 'BATCH-882A', torque: '45 Nm' },
    { id: 'OP20', label: 'OP20\nMilling', status: 'complete', ts: '09:18', operator: 'OPR-203', batch: 'BATCH-882A', torque: '62 Nm' },
    { id: 'LW01', label: 'LW01\nWelding', status: isLW1 ? 'warning' : 'complete', ts: '10:44', operator: 'OPR-117', batch: 'BATCH-882A', torque: '—' },
    { id: 'VMC1', label: 'VMC1\nMachining', status: 'complete', ts: '12:15', operator: 'OPR-102', batch: 'BATCH-882A' },
    { id: 'CLNC', label: 'CLNC\nCleaning', status: 'complete', ts: '13:30', operator: 'OPR-441', batch: 'BATCH-882B' },
    { id: 'PACK', label: 'PACK\nPackaging', status: 'complete', ts: '15:05', operator: 'OPR-308', batch: 'BATCH-882B' },
  ];

  const complianceTrend = tLabels.map((name, i) => ({
    name,
    value: +(complianceIndex + Math.sin(i) * 0.2).toFixed(2),
    target: 99.9
  }));

  const serializationScans = tLabels.map((name, i) => ({
    name,
    value: Math.round(1200 + Math.cos(i) * 100),
    target: 1000
  }));

  const targetValue = isLW1 ? 95.0 : (product === 'MATRIX' ? 99.9 : (product === 'BANANA' ? 98.5 : 99.5));

  const scaleRisk = nonComplianceRisk / 0.06;
  const complianceRadar = tLabels.map((month, i) => {
    let risk = 0;
    if (period === 'YoY') {
      risk = +( (3.8 - (i / 15) * 3.4) * scaleRisk ).toFixed(2);
    } else if (period === 'MTD') {
      const day = i + 1;
      if (day === 12) {
        risk = +(3.2 * scaleRisk).toFixed(2);
      } else {
        risk = +( (0.3 + Math.abs(Math.sin(day * 0.9)) * 0.8) * scaleRisk ).toFixed(2);
      }
    } else {
      risk = +( (0.3 + Math.abs(Math.sin(i * 1.2)) * 1.8) * scaleRisk ).toFixed(2);
    }
    return {
      month,
      risk: Math.max(0, risk),
      target: 0.5,
    };
  });

  const successScale = firstScanSuccess / 94.2;
  const scanData = tLabels.map((name, i) => {
    let attempts = 0; let successes = 0;
    if (period === 'YoY') {
      const baseRate = 0.45 + (i / 15) * 0.544;
      attempts = 2000;
      successes = Math.round(attempts * baseRate * successScale);
    } else if (period === 'MTD') {
      const day = i + 1;
      attempts = 1200 + Math.round(Math.sin(day) * 50);
      if (day === 12) {
        successes = Math.round(attempts * 0.78);
      } else {
        successes = Math.round(attempts * 0.942 * successScale);
      }
    } else if (period === 'WTD') {
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

  const genealogyScale = genealogyIntegrity / 98.8;
  const genealogyData = tLabels.map((name, i) => {
    let completeness = 0;
    if (period === 'YoY') {
      completeness = +( (45.0 + (i / 15) * 54.4) * genealogyScale ).toFixed(1);
    } else if (period === 'MTD') {
      const day = i + 1;
      if (day === 12) {
        completeness = 78.0;
      } else {
        completeness = +( (97.5 + Math.sin(day * 0.4) * 1.5) * genealogyScale ).toFixed(1);
      }
    } else {
      completeness = +( (97.5 + Math.sin(i * 0.9) * 1.8) * genealogyScale ).toFixed(1);
    }

    return {
      name,
      completeness: Math.min(100, completeness),
    };
  });

  return {
    complianceIndex,
    nonComplianceRisk,
    firstScanSuccess,
    genealogyIntegrity,
    isWarning,
    isLW01: isLW1,
    label,
    threadNodesList,
    complianceTrend,
    serializationScans,
    complianceRadar,
    scanData,
    genealogyData,
    heatmap: resolveHeatmapData(),
    scannerPerf: SCANNER_PERFORMANCE,
    failureCategories: FAILURE_CATEGORIES,
    complianceLog: COMPLIANCE_LOG,
    breachLineStack: BREACH_LINE_STACK,
    targetValue,
    icon: 'GitCommit',
    gradient: ['#6366F1', '#818CF8'],
    trackWash: 'rgba(99,102,241,0.05)',
    glowShadow: 'rgba(99,102,241,0.2)'
  };
}
