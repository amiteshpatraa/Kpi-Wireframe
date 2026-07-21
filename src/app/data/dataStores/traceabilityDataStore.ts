import { PeriodId, ProductId, getTimeLabels } from './types';

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

  const threadNodesList = [
    { id: 'OP10', label: 'OP10\nTurning', status: 'complete' as const, ts: '08:02', operator: 'OPR-441', batch: 'BATCH-882A', torque: '45 Nm' },
    { id: 'OP20', label: 'OP20\nMilling', status: 'complete' as const, ts: '09:18', operator: 'OPR-203', batch: 'BATCH-882A', torque: '62 Nm' },
    { id: 'LW01', label: 'LW01\nWelding', status: isLW1 ? ('warning' as const) : ('complete' as const), ts: '10:44', operator: 'OPR-117', batch: 'BATCH-882A', torque: '—' },
    { id: 'VMC1', label: 'VMC1\nMachining', status: 'complete' as const, ts: '12:15', operator: 'OPR-102', batch: 'BATCH-882A' },
    { id: 'CLNC', label: 'CLNC\nCleaning', status: 'complete' as const, ts: '13:30', operator: 'OPR-441', batch: 'BATCH-882B' },
    { id: 'PACK', label: 'PACK\nPackaging', status: 'complete' as const, ts: '15:05', operator: 'OPR-308', batch: 'BATCH-882B' },
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
    targetValue,
    icon: 'GitCommit',
    gradient: ['#6366F1', '#818CF8'],
    trackWash: 'rgba(99,102,241,0.05)',
    glowShadow: 'rgba(99,102,241,0.2)'
  };
}
