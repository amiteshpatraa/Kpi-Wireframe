import { PeriodId, ProductId, T, getTimeLabels } from './types';

export function resolveBprData(period: PeriodId, product: ProductId, process: string): any {
  const tLabels = getTimeLabels(period);
  const isLW1 = process === 'LW1';

  let penetrationIndex = 88.0;
  let rawCoverage = 4.2;
  let supplierAdherence = 92.4;
  let demandAdherence = 97.8;
  let targetCoverage = 5.0;
  let isWarning = false;
  let label = 'All SKUs';

  if (product === 'MATRIX') {
    penetrationIndex = 94.2;
    rawCoverage = 4.1;
    supplierAdherence = 96.5;
    demandAdherence = 98.2;
    targetCoverage = 4.0;
    label = 'Matrix (Precision CNC)';
  } else if (product === 'BANANA') {
    penetrationIndex = 78.5;
    rawCoverage = 12.5;
    supplierAdherence = 89.2;
    demandAdherence = 91.5;
    targetCoverage = 10.0;
    isWarning = true;
    label = 'Banana (High-Volume Extrusion)';
  } else if (product === 'KIWI') {
    penetrationIndex = 88.0;
    rawCoverage = 4.2;
    supplierAdherence = 92.4;
    demandAdherence = 97.8;
    targetCoverage = 5.0;
    label = 'Kiwi (Custom Brass Core)';
  }

  if (isLW1) {
    penetrationIndex = 62.0;
    rawCoverage = 1.2;
    supplierAdherence = 81.4;
    demandAdherence = 88.5;
    targetCoverage = 3.5;
    isWarning = true;
    label = 'LW1 Welder Bottleneck';
  } else if (process === 'PACK' || process === 'EOL') {
    penetrationIndex = 76.2;
    rawCoverage = 2.8;
    supplierAdherence = 85.6;
    demandAdherence = 92.4;
    targetCoverage = 4.0;
    isWarning = true;
    label = `Assembly (${process})`;
  }

  const scale = penetrationIndex / 88.0;

  const scheduleAdherenceData = tLabels.map((name, i) => {
    let supplier = 90;
    let demand = 95;
    if (period === 'MTD') {
      const day = i + 1;
      if (day === 12) {
        supplier = 30;
        demand = 55;
      } else {
        supplier = 90 + Math.sin(day) * 4;
        demand = 95 + Math.cos(day) * 2;
      }
    } else {
      supplier = [92, 94, 88, 95, 91, 93, 92][i % 7];
      demand = [97, 98, 96, 99, 97, 98, 97][i % 7];
    }
    return {
      name,
      supplier: +(supplier * scale).toFixed(1),
      demand: +(demand * scale).toFixed(1)
    };
  });

  const bufferPenetrationStepData = tLabels.map((name, i) => {
    let criticalVal = 15;
    let warningVal = 30;
    let safeVal = 70;
    let value = 75;

    if (period === 'MTD') {
      const day = i + 1;
      if (day === 12) {
        value = 8;
      } else {
        value = 75 + Math.sin(day) * 5;
      }
    } else {
      value = 75 + Math.sin(i) * 5;
    }

    return {
      name,
      critical: criticalVal,
      warning: warningVal,
      safe: safeVal,
      overstock: 100,
      value: Math.round(value * scale)
    };
  });

  const partLevelVolatilityScatter = Array.from({ length: 20 }, (_, idx) => {
    const seed1 = Math.sin(idx + 1) * 1000;
    const seed2 = Math.cos(idx + 1) * 1000;
    const rand1 = seed1 - Math.floor(seed1);
    const rand2 = seed2 - Math.floor(seed2);

    const baseVolatility = isLW1 ? 25 : 15;
    const volatility = Math.round(baseVolatility + rand1 * 25);

    const baseLeadTime = isLW1 ? 12 : 6;
    const leadTime = Math.round(baseLeadTime + rand2 * 14);

    let health = 'low';
    if (volatility > 22 && leadTime > 11) {
      health = 'high';
    } else if (volatility > 15 || leadTime > 8) {
      health = 'med';
    }

    return {
      name: `SKU-${idx + 101}`,
      volatility,
      leadTime,
      health
    };
  });

  const shortageDistribution = isLW1 
    ? [
        { name: '0 Days Cover (Critical)', count: 8, color: T.red },
        { name: '1-3 Days (Warning)', count: 4, color: T.amber },
        { name: '4-7 Days (Safe)', count: 0, color: T.green },
        { name: '8+ Days (Optimal)', count: 0, color: T.blue },
      ]
    : [
        { name: '0 Days Cover (Critical)', count: 1, color: T.red },
        { name: '1-3 Days (Warning)', count: 3, color: T.amber },
        { name: '4-7 Days (Safe)', count: 8, color: T.green },
        { name: '8+ Days (Optimal)', count: 12, color: T.blue },
      ];

  const donutData = [
    { name: 'Overstock', value: isLW1 ? 0 : 15, color: '#3B82F6', zone: 'overstock' },
    { name: 'Optimal/Safe', value: isLW1 ? 0 : 60, color: '#10B981', zone: 'optimal' },
    { name: 'Warning/Reorder', value: isLW1 ? 10 : 20, color: '#F59E0B', zone: 'warning' },
    { name: 'Critical Stockout', value: isLW1 ? 90 : 5, color: '#EF4444', zone: 'critical' }
  ];

  const bufferPenetrationStackedData = bufferPenetrationStepData.map(item => {
    const total = item.overstock || 100;
    const crit = +((item.critical / total) * 100).toFixed(1);
    const warn = +(((item.warning - item.critical) / total) * 100).toFixed(1);
    const opt = +(((item.safe - item.warning) / total) * 100).toFixed(1);
    const over = +(((item.overstock - item.safe) / total) * 100).toFixed(1);
    return {
      name: item.name,
      critical: crit,
      warning: warn,
      optimal: opt,
      overstock: over
    };
  });

  let replenishmentLedger = [
    { part: '2002254-00-E06', desc: 'Matrix Core (MCU Side)', stock: 55, cover: '0.8d', action: 'Halt & check for Pedestal Missing', urgency: 'critical', zone: 'critical', station: 'LW-1' },
    { part: '2002254-00-E08', desc: 'Matrix Plate (Sticker)', stock: 320, cover: '2.1d', action: 'Inspect for incomplete QR sticker', urgency: 'warning', zone: 'warning', station: 'ALT' },
    { part: '2002254-00-E10', desc: 'Matrix Block (Laser)', stock: 1400, cover: '8.4d', action: 'Check laser grade variation', urgency: 'normal', zone: 'optimal', station: 'OP50 Q-GATE' },
    { part: '2002254-00-E12', desc: 'Matrix Core (Brazed)', stock: 2200, cover: '14.2d', action: 'Release standard replenishment', urgency: 'normal', zone: 'overstock', station: 'Brazing' }
  ];

  if (isLW1) {
    replenishmentLedger = [
      { part: '2002254-00-E06', desc: 'Matrix Core (MCU Side)', stock: 45, cover: '0.2d', action: 'Urgent batch containment for Pedestal Missing', urgency: 'critical', zone: 'critical', station: 'LW-1' },
      { part: '2002254-00-E08', desc: 'Matrix Plate (Sticker)', stock: 120, cover: '0.0d', action: 'Expedite run & scan QR Sticker alignment', urgency: 'critical', zone: 'critical', station: 'LW-1' },
      { part: '2002254-00-E10', desc: 'Matrix Block (Laser)', stock: 80, cover: '0.4d', action: 'Recalibrate laser marking intensity grades', urgency: 'critical', zone: 'critical', station: 'LW-1' }
    ];
  }

  const vendorDelayData = isLW1 
    ? [
        { vendor: 'Krupp Steel Forge', delayDays: 4.2, color: T.red, machine: 'LW-1' },
        { vendor: 'Acme Castings', delayDays: 2.8, color: T.amber, machine: 'LW-1' },
        { vendor: 'SealTech Components', delayDays: 1.5, color: T.green, machine: 'LW-1' }
      ]
    : [
        { vendor: 'Acme Castings', delayDays: 3.2, color: T.amber, machine: 'OP50-01' },
        { vendor: 'Krupp Steel Forge', delayDays: 1.8, color: T.green, machine: 'OP10-01' },
        { vendor: 'SealTech Components', delayDays: 4.5, color: T.red, machine: 'Brazing' }
      ];

  const turnsPct = Math.min(100, penetrationIndex);
  const coverPct = Math.min(100, supplierAdherence);
  const wipPct = Math.min(100, demandAdherence);

  const targetValue = isLW1 ? 80 : (product === 'MATRIX' ? 95 : (product === 'BANANA' ? 85 : 90));

  const replenishmentBacklogData = [
    { supplier: 'Krupp Steel Forge',  minorDelay: 12, moderateDelay: 8,  criticalDelay: 5  },
    { supplier: 'Acme Castings',      minorDelay: 4,  moderateDelay: 2,  criticalDelay: 0  },
    { supplier: 'SealTech Components', minorDelay: 15, moderateDelay: 10, criticalDelay: 8  },
    { supplier: 'SteelCorp India',    minorDelay: 2,  moderateDelay: 0,  criticalDelay: 0  }
  ];

  return {
    penetrationIndex,
    rawCoverage,
    supplierAdherence,
    demandAdherence,
    targetCoverage,
    isWarning,
    label,
    timeLabels: tLabels,
    scheduleAdherenceData,
    bufferPenetrationStepData,
    partLevelVolatilityScatter,
    shortageDistribution,
    donutData,
    bufferPenetrationStackedData,
    replenishmentLedger,
    vendorDelayData,
    replenishmentBacklogData,
    turnsPct,
    coverPct,
    wipPct,
    dashoffsetAvail: 130 * (1 - turnsPct / 100),
    dashoffsetPerf: 130 * (1 - coverPct / 100),
    dashoffsetQual: 130 * (1 - wipPct / 100),
    targetValue,
    icon: 'Layers',
    gradient: ['#0EA5E9', '#0284C7'],
    trackWash: 'rgba(14,165,233,0.05)',
    glowShadow: 'rgba(14,165,233,0.2)'
  };
}
