import { PeriodId, ProductId, getTimeLabels } from './types';

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

  return {
    otifVal,
    adherenceVal,
    otifTrend,
    weeklyOutputData,
    supplyChainStageData,
    targetValue,
    icon: 'Truck',
    gradient: ['#F5788B', '#FFAE6E'],
    trackWash: 'rgba(245,120,139,0.05)',
    glowShadow: 'rgba(245,120,139,0.2)'
  };
}
