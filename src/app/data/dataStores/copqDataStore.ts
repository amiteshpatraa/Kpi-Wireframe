import { PeriodId, ProductId, getTimeLabels } from './types';

export function resolveCopqData(period: PeriodId, product: ProductId, process: string, shift?: string): any {
  const tLabels = getTimeLabels(period);
  const isLW1 = process === 'LW1';
  const isVMC1 = process === 'VMC1';
  const isPACK = process === 'PACK';
  const isEOL = process === 'EOL';

  let ytdLoss = 2125000;
  if (period === 'QTD') {
    ytdLoss = 1250000;
  } else if (period === 'MTD') {
    ytdLoss = 2100000;
  } else if (period === 'WTD') {
    ytdLoss = 150000;
  }

  const productScale = product === 'MATRIX' ? 0.6 : (product === 'BANANA' ? 0.25 : (product === 'KIWI' ? 0.4 : 1.0));
  const processScale = isLW1 ? 1.05 : (isVMC1 ? 0.65 : (isPACK || isEOL ? 0.15 : 1.0));
  ytdLoss = Math.round(ytdLoss * productScale * processScale);

  let fpy = 94.2;
  let supplierPpm = 1250;
  let monthlyWarningLimit = 341000;
  let label = 'All Products';

  if (product === 'MATRIX') {
    fpy = 98.2;
    supplierPpm = 450;
    monthlyWarningLimit = 380000;
    label = 'Matrix (Precision CNC)';
  } else if (product === 'BANANA') {
    fpy = 91.5;
    supplierPpm = 1850;
    monthlyWarningLimit = 114000;
    label = 'Banana (High-Volume Extrusion)';
  } else if (product === 'KIWI') {
    fpy = 94.5;
    supplierPpm = 920;
    monthlyWarningLimit = 228000;
    label = 'Kiwi (Custom Brass Core)';
  }

  if (isLW1) {
    fpy = 89.2;
    supplierPpm = 2200;
    monthlyWarningLimit = 456000;
    label = 'LW1 Welder Bottleneck';
  } else if (isVMC1) {
    fpy = 96.5;
    supplierPpm = 1100;
    monthlyWarningLimit = 304000;
    label = 'VMC Machining';
  } else if (isEOL || isPACK) {
    fpy = 99.1;
    supplierPpm = 280;
    monthlyWarningLimit = 91000;
    label = 'Inspection / Assembly';
  }

  const scale = (ytdLoss / 2125000) * 7.58;

  const internalFailureData = tLabels.map((name, i) => {
    let sAScrap = 0, sARework = 0;
    let sBScrap = 0, sBRework = 0;
    let sCScrap = 0, sCRework = 0;

    if (period === 'MTD') {
      const day = i + 1;
      if (day === 12) {
        sAScrap = 400000; sARework = 80000;
        sBScrap = 380000; sBRework = 60000;
        sCScrap = 220000; sCRework = 60000;
      } else {
        const baseScrap = 18000 + Math.sin(day * 0.8) * 8000;
        const baseRework = 12000 + Math.cos(day) * 4000;
        sAScrap = Math.round(baseScrap * 0.33); sARework = Math.round(baseRework * 0.33);
        sBScrap = Math.round(baseScrap * 0.34); sBRework = Math.round(baseRework * 0.34);
        sCScrap = Math.round(baseScrap * 0.33); sCRework = Math.round(baseRework * 0.33);
      }
    } else {
      const baseScrap = [6400, 3100, 4700, 42500][i % 4] * 0.45;
      const baseRework = [6400, 3100, 4700, 42500][i % 4] * 0.55;
      sAScrap = Math.round(baseScrap * scale * 0.33); sARework = Math.round(baseRework * scale * 0.33);
      sBScrap = Math.round(baseScrap * scale * 0.34); sBRework = Math.round(baseRework * scale * 0.34);
      sCScrap = Math.round(baseScrap * scale * 0.33); sCRework = Math.round(baseRework * scale * 0.33);
    }

    return {
      name,
      shiftA: sAScrap + sARework,
      shiftB: sBScrap + sBRework,
      shiftC: sCScrap + sCRework,
      totalLoss: sAScrap + sARework + sBScrap + sBRework + sCScrap + sCRework
    };
  });

  const defectTaxonomyPareto = [
    { category: 'Dimensional Out of Tolerance', cost: isLW1 ? 65000 : 42000, count: isLW1 ? 140 : 85 },
    { category: 'Surface Finish Defects', cost: isLW1 ? 32000 : 28000, count: isLW1 ? 95 : 70 },
    { category: 'Assembly Placement Error', cost: 18000, count: 45 },
    { category: 'Material Inclusion/Void', cost: 12000, count: 20 },
    { category: 'Packaging/Labeling Issue', cost: 4000, count: 15 }
  ];

  const defectTaxonomyGrid = [
    { id: 'DEF-001', name: 'Weld Penetration Failure', category: 'Assembly', severity: 'Critical', occurred: isLW1 ? 14 : 3, action: 'Adjusted laser focus' },
    { id: 'DEF-002', name: 'Porosity in Weld Joint', category: 'Assembly', severity: 'High', occurred: isLW1 ? 22 : 5, action: 'Purged gas line' },
    { id: 'DEF-003', name: 'Micro-cracking in weld seam', category: 'Material', severity: 'High', occurred: isLW1 ? 8 : 1, action: 'Extended cooling delay' },
    { id: 'DEF-004', name: 'Scratched Surface Pedestal', category: 'Surface Finish', severity: 'Low', occurred: 18, action: 'Polished buffer pad' },
    { id: 'DEF-005', name: 'Out-of-round hole boring', category: 'Dimensional', severity: 'Medium', occurred: 6, action: 'Replaced tool insert' }
  ];

  const externalFailureBulletData = tLabels.map((name, i) => ({
    name,
    actual: isLW1 ? 8500 : 4200 + Math.sin(i) * 500,
    target: 5000,
    budget: 10000
  }));

  const preventionAppraisalData = tLabels.map((name, i) => ({
    name,
    prevention: isLW1 ? 2800 : 1800 + Math.sin(i) * 200,
    appraisal: isLW1 ? 3600 : 2500 + Math.cos(i) * 300
  }));

  const supplierQualityMatrix = [
    { supplier: 'SteelCorp India', partsDefective: isLW1 ? 850 : 240, ppm: isLW1 ? 2800 : 850, status: 'warning' },
    { supplier: 'Precision Tubes Chakan', partsDefective: 45, ppm: 180, status: 'safe' },
    { supplier: 'Bajaj Fasteners', partsDefective: isLW1 ? 320 : 120, ppm: isLW1 ? 1600 : 600, status: 'warning' }
  ];

  const summaryTrendData = tLabels.map((name, i) => ({
    name,
    internal: isLW1 ? 18000 : 12000 + Math.sin(i) * 1000,
    external: isLW1 ? 8500 : 4200 + Math.cos(i) * 500,
    prevention: isLW1 ? 6400 : 4300 + Math.sin(i) * 300
  }));

  const targetValue = isLW1 ? 300000 : (product === 'MATRIX' ? 100000 : (product === 'BANANA' ? 250000 : 150000));

  const result = {
    ytdLoss,
    fpy,
    supplierPpm,
    monthlyWarningLimit,
    label,
    tLabels,
    internalFailureData,
    defectTaxonomyPareto,
    defectTaxonomyGrid,
    externalFailureBulletData,
    preventionAppraisalData,
    supplierQualityMatrix,
    summaryTrendData,
    warrantyClaimsTable: WARRANTY_CLAIMS,
    targetValue,
    icon: 'TrendingDown',
    gradient: ['#7C3AED', '#6D28D9'],
    trackWash: 'rgba(124,58,237,0.05)',
    glowShadow: 'rgba(124,58,237,0.2)'
  };

  if (shift) {
    const cloned = { ...result };
    cloned.internalFailureData = result.internalFailureData.map((d: any) => {
      let loss = d.totalLoss;
      if (shift === 'Shift A') {
        loss = d.shiftA;
      } else if (shift === 'Shift B') {
        loss = d.shiftB;
      } else if (shift === 'Shift C') {
        loss = d.shiftC;
      }
      return {
        name: d.name,
        totalLoss: loss
      };
    });
    return cloned;
  }

  return result;
}

export const PILLARS = [
  {
    id: 'INTERNAL' as const,
    label: 'Internal Failures',
    value: '$1.42M',
    target: '$1.20M',
    color: '#7C3AED',
  },
  {
    id: 'EXTERNAL' as const,
    label: 'External Failures',
    value: '$485K',
    target: '$350K',
    color: '#EF4444',
  },
  {
    id: 'PREVENTION' as const,
    label: 'Prevention & Appraisal',
    value: '$220K',
    target: '$250K',
    color: '#10B981',
  },
  {
    id: 'QUALITY' as const,
    label: 'First Pass Yield (FPY)',
    value: '94.2%',
    target: '98.5%',
    color: '#3B82F6',
  },
] as const;

export type ActiveCopqPillar = typeof PILLARS[number]['id'] | null;

export const WARRANTY_CLAIMS = [
  { claimId: 'CLM-9021', sku: '2002254-00-E06', customer: 'Tesla Fremont', cost: '$18,400', defect: 'Laser Weld Porosity', status: 'Approved' },
  { claimId: 'CLM-9022', sku: '2002254-00-E08', customer: 'Rivian Normal', cost: '$11,200', defect: 'Sticker Alignment Missing', status: 'Under Review' },
  { claimId: 'CLM-9023', sku: '2002254-00-E10', customer: 'Lucid Casa Grande', cost: '$7,600', defect: 'O-ring Micro-Crack', status: 'Approved' },
  { claimId: 'CLM-9024', sku: '2002254-00-E12', customer: 'GM Factory ZERO', cost: '$3,100', defect: 'Surface Scratch', status: 'Rejected' },
];

