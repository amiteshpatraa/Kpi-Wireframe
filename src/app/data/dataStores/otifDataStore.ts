import { PeriodId, ProductId, getTimeLabels } from './types';

export const PILLARS = [
  {
    id: 'DISPATCH' as const,
    label: 'Dispatch Adherence',
    value: 94,
    target: 98,
    color: '#F5788B',
  },
  {
    id: 'PRODUCTION' as const,
    label: 'Production Plan vs Actual',
    value: 92,
    target: 95,
    color: '#FF8F00',
  },
  {
    id: 'READINESS' as const,
    label: 'Material Readiness',
    value: 96,
    target: 99,
    color: '#FBC02D',
  },
  {
    id: 'DELIVERY' as const,
    label: 'Delivery On-Time',
    value: 91,
    target: 95,
    color: '#6366F1',
  },
] as const;

export type ActiveOtifPillar = typeof PILLARS[number]['id'] | null;

export const DELAY_BREAKDOWN = [
  { cause: 'Supplier Raw Material Delay', count: 42, color: '#F5788B' },
  { cause: 'Machine Downtime / Bottleneck', count: 28, color: '#FF8F00' },
  { cause: 'Quality Inspection Hold', count: 18, color: '#FBC02D' },
  { cause: 'Logistics / Transit Delay', count: 12, color: '#6366F1' },
];

export function resolveOtifData(period: PeriodId, product: ProductId, process: string): any {
  const tLabels = getTimeLabels(period);
  const isLW1 = process === 'LW1';

  let otifVal = isLW1 ? 90.5 : 93.9;
  let adherenceVal = isLW1 ? 88.0 : 91.5;

  if (period === 'YoY') {
    otifVal = 94.5;
    adherenceVal = 92.5;
  } else if (period === 'MTD') {
    otifVal = 91.2;
    adherenceVal = 89.0;
  }

  const otifTrend = tLabels.map((name, i) => {
    let val = otifVal + Math.sin(i) * 1.5;
    if (period === 'MTD' && i === 11) {
      val = 78.0;
    }
    return {
      name,
      value: +val.toFixed(1),
      target: 95.0
    };
  });

  const prodMult = product === 'MATRIX' ? 0.95 : product === 'BANANA' ? 1.05 : product === 'KIWI' ? 1.00 : 1.0;

  const weeklyOutputData = Array.from({ length: 12 }, (_, i) => {
    const weekName = `W${i + 1}`;
    const basePlanned = 240;
    let baseActual = 240 + Math.sin(i * 1.5) * 30 + Math.cos(i) * 15;
    
    if (isLW1) {
      baseActual = baseActual * 0.85;
    }
    baseActual = baseActual * prodMult;
    
    return {
      name: weekName,
      planned: basePlanned,
      actual: Math.round(baseActual)
    };
  });

  const baseStages = [
    { stage: 'Order Entry', hours: 4.2 },
    { stage: 'Scheduling',  hours: 6.5 },
    { stage: 'Production',  hours: 24.8 },
    { stage: 'Inspection',  hours: 3.1 },
    { stage: 'Transit',     hours: 14.8 },
    { stage: 'Delivery',    hours: 2.5 }
  ];

  const supplyChainStageData = baseStages.map(s => {
    let hours = s.hours;
    if (isLW1 && s.stage === 'Production') {
      hours = hours * 1.4;
    }
    return {
      stage: s.stage,
      hours: +(hours * (prodMult * 0.5 + 0.5)).toFixed(1)
    };
  });

  const targetValue = isLW1 ? 90 : (product === 'MATRIX' ? 97 : (product === 'BANANA' ? 92 : 95));

  const otifSummaryData = tLabels.map((name, i) => {
    const scheduled = 1000 + Math.round(Math.sin(i) * 200);
    const delivered = scheduled - Math.round(Math.abs(Math.cos(i) * 100));
    const pct = Number(((delivered / scheduled) * 100).toFixed(1));
    return { name, scheduled, delivered, pct };
  });

  const dispatchAdherenceData = tLabels.map((name, i) => {
    const onTime = 300 + Math.round(Math.sin(i) * 50);
    const delayed = 10 + Math.round(Math.cos(i) * 20);
    return { name, onTime, delayed };
  });

  const productionPlanActualData = tLabels.map((name, i) => {
    const plan = 1200 + Math.round(Math.cos(i) * 80);
    const actual = plan - 50 + Math.round(Math.sin(i * 1.2) * 150);
    const variance = Number((((actual - plan) / plan) * 100).toFixed(1));
    const adherence = Math.min(100, Math.max(60, Math.round(95 + (actual - plan) / plan * 8)));
    return { name, plan, actual, variance, adherence };
  });

  const materialReadinessData = tLabels.map((name, i) => {
    const raw = 320 + Math.round(Math.sin(i) * 40);
    const wip = 210 + Math.round(Math.cos(i * 1.3) * 30);
    return { name, raw, wip };
  });

  const weeklyProdDetails = Array.from({ length: 12 }, (_, i) => {
    const pMachined = 100 + Math.round(Math.sin(i) * 20);
    const pAssembled = 120 + Math.round(Math.cos(i) * 20);
    const pFabricated = 80 + Math.round(Math.sin(i * 1.5) * 15);
    const aMachined = pMachined - 10 + Math.round(Math.cos(i) * 15);
    const aAssembled = pAssembled + (i % 2 === 0 ? 10 : -15);
    const aFabricated = pFabricated - 5 + Math.round(Math.sin(i) * 10);

    return {
      week: `W${i + 1}`,
      machiningPlanned: pMachined,
      machiningActual: aMachined,
      assemblyPlanned: pAssembled,
      assemblyActual: aAssembled,
      fabricationPlanned: pFabricated,
      fabricationActual: aFabricated,
      totalPlanned: pMachined + pAssembled + pFabricated,
      totalActual: aMachined + aAssembled + aFabricated,
      status: aMachined + aAssembled + aFabricated >= pMachined + pAssembled + pFabricated ? 'ON_TRACK' : 'BEHIND'
    };
  });

  return {
    otifVal,
    adherenceVal,
    otifTrend,
    weeklyOutputData,
    supplyChainStageData,
    otifSummaryData,
    dispatchAdherenceData,
    productionPlanActualData,
    materialReadinessData,
    delayBreakdownData: DELAY_BREAKDOWN,
    weeklyProdDetails,
    targetValue,
    icon: 'Truck',
    gradient: ['#F5788B', '#FFAE6E'],
    trackWash: 'rgba(245,120,139,0.05)',
    glowShadow: 'rgba(245,120,139,0.2)'
  };
}
