export type PageId = 'OEE' | 'COPQ' | 'BPR' | 'OTIF' | 'INVENTORY' | 'TRACEABILITY';
export type PeriodId = 'YTD' | 'YoY' | 'QTD' | 'MTD' | 'WTD';
export type ProductId = 'ALL' | 'MATRIX' | 'BANANA' | 'KIWI';

export interface Coordinate {
  x: number;
  y: number;
}

export const dashboardData: Record<string, Record<string, Record<string, Record<string, any>>>> = {};

// Constant lists
const pages: PageId[] = ['OEE', 'COPQ', 'BPR', 'OTIF', 'INVENTORY', 'TRACEABILITY'];
const products: ProductId[] = ['ALL', 'MATRIX', 'BANANA', 'KIWI'];
const periods: PeriodId[] = ['YTD', 'YoY', 'QTD', 'MTD', 'WTD'];
const processes = [
  'ALL', 'VMC1', 'PACK', 'UC1', 'SF01', 'LW1', 'CL1', 'LW2', 'LW3', 'BRZ', 
  'SB10', 'RSHP', 'ALT10', 'OP10', 'OP20', 'SLGL', 'OP30', 'OP40', 'OP50', 'UC2', 'EOL'
];

// Helper to resolve time labels based on period
function getTimeLabels(period: PeriodId): string[] {
  if (period === 'YoY') {
    return Array.from({ length: 16 }, (_, i) => String(2011 + i));
  }
  if (period === 'QTD') {
    return ['Apr', 'May', 'Jun', 'Jul'];
  }
  if (period === 'MTD') {
    return Array.from({ length: 31 }, (_, i) => String(i + 1));
  }
  if (period === 'WTD') {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  }
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
}

// Main generation function called at startup
function resolveDashboardData(page: PageId, period: PeriodId, product: ProductId, process: string): any {
  const tLabels = getTimeLabels(period);
  const isLW1 = process === 'LW1';
  const isVMC1 = process === 'VMC1';
  const isPACK = process === 'PACK';
  const isEOL = process === 'EOL';

  // Base colors
  const T = {
    red: '#EF4444',
    amber: '#F59E0B',
    green: '#10B981',
    blue: '#3B82F6',
    rose: '#EC4899',
    purple: '#8B5CF6'
  };

  // Resolve by page
  if (page === 'OEE') {
    // 1. Primary KPI values and targets (LW1 override vs baselines)
    let oeeVal = 75;
    let availVal = 82;
    let perfVal = 78;
    let qualVal = 85;

    let availTarget = 82;
    let perfTarget = 80;
    let qualTarget = 85;

    if (isLW1) {
      oeeVal = 53;
      availVal = 80;
      perfVal = 77;
      qualVal = 84;
    } else if (isVMC1) {
      oeeVal = 67;
      availVal = 62;
      perfVal = 85;
      qualVal = 85;
    } else if (isPACK || isEOL) {
      oeeVal = 72;
      availVal = 85;
      perfVal = 68;
      qualVal = 82;
    } else {
      // Product mapping
      if (product === 'MATRIX') {
        oeeVal = 68;
        availVal = 64;
        perfVal = 84;
        qualVal = 85;
      } else if (product === 'BANANA') {
        oeeVal = 60;
        availVal = 83;
        perfVal = 74;
        qualVal = 68;
      } else if (product === 'KIWI') {
        oeeVal = 65;
        availVal = 76;
        perfVal = 72;
        qualVal = 78;
      }
    }

    // Historical chart arrays scaling with OEE values
    const scale = oeeVal / 75;

    let monthlyAvailability: any[] = [];
    let monthlyPerformance: any[] = [];
    let monthlyQuality: any[] = [];

    if (period === 'YoY') {
      monthlyAvailability = tLabels.map((name, i) => {
        const rawAvail = 78.0 + 7.0 * (i / 15) + (i < 15 ? Math.sin(i) * 1.5 : 0);
        return { name, avg_avail: +(rawAvail * scale).toFixed(1), downtime: Math.round((100 - rawAvail) * 0.2) };
      });
      monthlyPerformance = tLabels.map((name, i) => {
        const rawPerf = 82.0 + 8.0 * (i / 15) + (i < 15 ? Math.cos(i) * 1.5 : 0);
        return { name, actualVolume: Math.round(1200 * (rawPerf / 100)), avg_perf: +(rawPerf * scale).toFixed(1) };
      });
      monthlyQuality = tLabels.map((name, i) => {
        const rawQual = 90.7 + 7.3 * (i / 15) + (i < 15 ? Math.sin(i * 1.5) * 1.0 : 0);
        return { name, avg_fpy: +(rawQual * scale).toFixed(1), scrapPct: 1.2 };
      });
    } else if (period === 'QTD') {
      const ytdAvails = [84.5, 87.2, 81.0, 89.5, 85.8, 88.4, 86.5];
      const ytdPerfs  = [91.0, 93.5, 86.4, 94.0, 90.2, 92.5, 91.0];
      const ytdQuals  = [92.6, 96.3, 91.6, 96.6, 95.4, 97.1, 95.3];

      const qtdAvails = ytdAvails.slice(3);
      const qtdPerfs  = ytdPerfs.slice(3);
      const qtdQuals  = ytdQuals.slice(3);

      monthlyAvailability = tLabels.map((name, i) => {
        const uptime = qtdAvails[i] || 82;
        return { name, avg_avail: +(uptime * scale).toFixed(1), downtime: Math.round((100 - uptime) * 0.2) };
      });
      monthlyPerformance = tLabels.map((name, i) => {
        const rate = qtdPerfs[i] || 78;
        return { name, actualVolume: Math.round(1200 * (rate / 100)), avg_perf: +(rate * scale).toFixed(1) };
      });
      monthlyQuality = tLabels.map((name, i) => {
        const fpy = qtdQuals[i] || 85;
        return { name, avg_fpy: +(fpy * scale).toFixed(1), scrapPct: 1.2 };
      });
    } else if (period === 'MTD') {
      monthlyAvailability = tLabels.map((name, i) => {
        const day = i + 1;
        const uptime = (day === 12) ? 55.0 : 83.0 + Math.sin(day) * 1.5;
        return { name, avg_avail: +(uptime * scale).toFixed(1), downtime: (day === 12) ? 180 : Math.round((100 - uptime) * 0.2) };
      });
      monthlyPerformance = tLabels.map((name, i) => {
        const day = i + 1;
        const rate = (day === 12) ? 60.0 : 90.0 + Math.cos(day) * 1.5;
        return { name, actualVolume: Math.round(1200 * (rate / 100)), avg_perf: +(rate * scale).toFixed(1) };
      });
      monthlyQuality = tLabels.map((name, i) => {
        const day = i + 1;
        const fpy = (day === 12) ? 90.9 : 96.0 + Math.sin(day * 0.5) * 1.0;
        return { name, avg_fpy: +(fpy * scale).toFixed(1), scrapPct: (day === 12) ? 8.5 : 1.2 };
      });
    } else if (period === 'WTD') {
      const wtdAvails = [83.0, 85.0, 82.0, 87.0, 86.5];
      const wtdPerfs  = [90.0, 91.5, 89.0, 92.0, 91.0];
      const wtdQuals  = [99.3, 98.4, 100.0, 98.0, 95.3];

      monthlyAvailability = tLabels.map((name, i) => {
        const uptime = wtdAvails[i] || 82;
        return { name, avg_avail: +(uptime * scale).toFixed(1), downtime: Math.round((100 - uptime) * 0.2) };
      });
      monthlyPerformance = tLabels.map((name, i) => {
        const rate = wtdPerfs[i] || 78;
        return { name, actualVolume: Math.round(1200 * (rate / 100)), avg_perf: +(rate * scale).toFixed(1) };
      });
      monthlyQuality = tLabels.map((name, i) => {
        const fpy = wtdQuals[i] || 85;
        return { name, avg_fpy: +(fpy * scale).toFixed(1), scrapPct: 1.2 };
      });
    } else {
      const ytdAvails = [84.5, 87.2, 81.0, 89.5, 85.8, 88.4, 86.5];
      const ytdPerfs  = [91.0, 93.5, 86.4, 94.0, 90.2, 92.5, 91.0];
      const ytdQuals  = [92.6, 96.3, 91.6, 96.6, 95.4, 97.1, 95.3];

      monthlyAvailability = tLabels.map((name, i) => {
        const uptime = ytdAvails[i % 7];
        return { name, avg_avail: +(uptime * scale).toFixed(1), downtime: Math.round((100 - uptime) * 0.2) };
      });
      monthlyPerformance = tLabels.map((name, i) => {
        const rate = ytdPerfs[i % 7];
        return { name, actualVolume: Math.round(1200 * (rate / 100)), avg_perf: +(rate * scale).toFixed(1) };
      });
      monthlyQuality = tLabels.map((name, i) => {
        const fpy = ytdQuals[i % 7];
        return { name, avg_fpy: +(fpy * scale).toFixed(1), scrapPct: 1.2 };
      });
    }

    const monthlyOee = tLabels.map((name, i) => {
      const a = monthlyAvailability[i]?.avg_avail || 80;
      const p = monthlyPerformance[i]?.avg_perf || 80;
      const q = monthlyQuality[i]?.avg_fpy || 80;
      return { name, value: +((a * p * q) / 10000).toFixed(1) };
    });

    const setupPmMonthlyData = tLabels.map((name, i) => ({
      name,
      planned: 240,
      actual: isLW1 ? 380 : 250 + Math.round(Math.sin(i) * 20)
    }));

    const unplannedDowntimeTrendData = tLabels.map((name, i) => {
      const isDay12 = (period === 'MTD' && i === 11);
      return {
        name,
        breakdown: isDay12 ? 480 : (isLW1 ? 480 : 180 + Math.round(Math.cos(i) * 30)),
        mttr: isDay12 ? 90 : (isLW1 ? 45 : 22 + (i % 3)),
        mtbf: isDay12 ? 5 : (isLW1 ? 18 : 36 - (i % 4))
      };
    });

    const cycleTaktStationData = tLabels.map((name, i) => {
      const isDay12 = (period === 'MTD' && i === 11);
      return {
        name,
        setup: isDay12 ? 60 : (isLW1 ? 25 : 12 + (i % 2)),
        processing: isDay12 ? 80 : (isLW1 ? 35 : 28 - (i % 3)),
        limit: 45
      };
    });

    const monthlyOutputPerManData = tLabels.map((name, i) => {
      const isDay12 = (period === 'MTD' && i === 11);
      return {
        name,
        actual: isDay12 ? 20 : (isLW1 ? 90 : 120 + Math.round(Math.sin(i) * 10))
      };
    });

    const monthlyReworkData = tLabels.map((name, i) => {
      let planned = 250;
      let rework = 10;

      if (period === 'YoY') {
        const plans = [200, 220, 250, 280, 310, 360, 400, 450, 470, 490, 500, 520, 540, 560, 580, 600];
        const reworks = [120, 110, 100, 90, 85, 75, 70, 60, 55, 50, 45, 38, 32, 26, 20, 15];
        planned = plans[i % plans.length];
        rework = reworks[i % reworks.length];
      } else if (period === 'QTD') {
        const plans = [60, 52, 58, 55];
        const reworks = [14, 8, 10, 8];
        planned = plans[i % plans.length];
        rework = reworks[i % reworks.length];
      } else if (period === 'MTD') {
        const day = i + 1;
        if (day === 12) {
          planned = 8;
          rework = 6;
        } else {
          planned = 18 + Math.round(Math.sin(day) * 3);
          rework = 1 + Math.round(Math.cos(day) * 0.8 + 0.5);
        }
      } else if (period === 'WTD') {
        planned = [18, 22, 19, 21, 20][i % 5];
        rework = [2, 3, 1, 4, 2][i % 5];
      } else {
        const plans = [50, 55, 48, 60, 52, 58, 55];
        const reworks = [8, 12, 6, 14, 8, 10, 8];
        planned = plans[i % plans.length];
        rework = reworks[i % reworks.length];
      }

      const scale = isLW1 ? 1.2 : (isVMC1 ? 0.9 : 1.0);
      return {
        name,
        planned: Math.round(planned * scale),
        rework: Math.round(rework * scale),
        value: Math.round(rework * scale)
      };
    });

    const monthlyInHouseRejectionsData = tLabels.map((name, i) => {
      let burrs = 12;
      let blowHoles = 5;
      let gaps = 3;

      if (period === 'YoY') {
        const burrsList = [300, 280, 250, 210, 180, 150, 130, 110, 90, 75, 58, 42, 32, 22, 15, 12];
        const blowList  = [150, 130, 110, 100, 90,  75,  60,  50,  40, 35, 28, 22, 16, 11, 8,  5];
        const gapsList  = [80,  70,  60,  50,  40,  35,  30,  25,  20, 18, 15, 12, 9,  6,  4,  3];

        burrs = burrsList[i % burrsList.length];
        blowHoles = blowList[i % blowList.length];
        gaps = gapsList[i % gapsList.length];
      } else if (period === 'QTD') {
        const burrsList = [10, 14, 11, 12];
        const blowList  = [4, 7, 5, 5];
        const gapsList  = [2, 3, 2, 3];

        burrs = burrsList[i % burrsList.length];
        blowHoles = blowList[i % blowList.length];
        gaps = gapsList[i % gapsList.length];
      } else if (period === 'MTD') {
        const day = i + 1;
        if (day === 12) {
          burrs = 25;
          blowHoles = 15;
          gaps = 8;
        } else {
          burrs = 1 + Math.round(Math.sin(day) * 0.5 + 0.5);
          blowHoles = Math.round(Math.cos(day) * 0.4 + 0.4);
          gaps = Math.round(Math.sin(day * 1.5) * 0.2 + 0.2);
        }
      } else if (period === 'WTD') {
        burrs = [1, 2, 1, 3, 2][i % 5];
        blowHoles = [0, 1, 0, 1, 0][i % 5];
        gaps = [0, 0, 1, 0, 0][i % 5];
      } else {
        const burrsList = [15, 12, 18, 10, 14, 11, 12];
        const blowList  = [8,  5,  10, 4,  7,  5,  5];
        const gapsList  = [4,  3,  5,  2,  3,  2,  3];

        burrs = burrsList[i % burrsList.length];
        blowHoles = blowList[i % blowList.length];
        gaps = gapsList[i % gapsList.length];
      }

      const scale = isLW1 ? 1.3 : (isVMC1 ? 0.8 : 1.0);
      return {
        name,
        burrs: Math.round(burrs * scale),
        blowHoles: Math.round(blowHoles * scale),
        gaps: Math.round(gaps * scale),
        value: Math.round((burrs + blowHoles + gaps) * scale)
      };
    });

    const targetValue = isLW1 ? 70 : (product === 'MATRIX' ? 85 : (product === 'BANANA' ? 75 : 80));

    return {
      tLabels,
      availAvg: availVal,
      perfAvg: perfVal,
      qualAvg: qualVal,
      availTarget,
      perfTarget,
      qualTarget,
      monthlyAvailability,
      monthlyPerformance,
      monthlyQuality,
      monthlyOee,
      oeeVal,
      availVal,
      perfVal,
      qualVal,
      setupPmMonthlyData,
      unplannedDowntimeTrendData,
      cycleTaktStationData,
      monthlyOutputPerManData,
      monthlyReworkData,
      monthlyInHouseRejectionsData,
      targetValue,
      icon: 'Clock',
      gradient: ['#2563EB', '#1D4ED8'],
      trackWash: 'rgba(37,99,235,0.05)',
      glowShadow: 'rgba(37,99,235,0.2)'
    };
  }

  if (page === 'COPQ') {
    // Dynamic loss based on period
    let ytdLoss = 2125000;
    if (period === 'YoY') {
      ytdLoss = 18500000;
    } else if (period === 'QTD') {
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
        const baseScrap = [1500, 5200, 2900, 6400, 3100, 4700, 42500][i % 7] * 0.45;
        const baseRework = [1500, 5200, 2900, 6400, 3100, 4700, 42500][i % 7] * 0.55;
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

    return {
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
      targetValue,
      icon: 'TrendingDown',
      gradient: ['#7C3AED', '#6D28D9'],
      trackWash: 'rgba(124,58,237,0.05)',
      glowShadow: 'rgba(124,58,237,0.2)'
    };
  }

  if (page === 'BPR') {
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

    const cfdData = tLabels.map((name, i) => {
      let stock = 120;
      if (period === 'MTD' && i + 1 === 12) {
        stock = 8;
      } else {
        stock = 80 + Math.sin(i) * 20;
      }
      return {
        name,
        stock: Math.round(stock * scale),
        safe: 70,
        limit: 15
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
      { part: 'PART-111', desc: 'Valves', stock: 55, cover: '0.8d', action: 'Trigger expedite notice', urgency: 'critical', zone: 'critical', station: 'LW1' },
      { part: 'PART-339', desc: 'Fasteners', stock: 320, cover: '2.1d', action: 'Review supplier transit route', urgency: 'warning', zone: 'warning', station: 'LW1' },
      { part: 'PART-882', desc: 'Engine Gaskets', stock: 1400, cover: '8.4d', action: 'Replenishment order standard release', urgency: 'normal', zone: 'optimal', station: 'SF01' }
    ];

    if (isLW1) {
      replenishmentLedger = [
        { part: 'PART-339', desc: 'Cap Screws', stock: 120, cover: '0.0d', action: 'Trigger Express Airfreight', urgency: 'critical', zone: 'critical', station: 'LW1' },
        { part: 'PART-111', desc: 'Valves', stock: 45, cover: '0.2d', action: 'Initiate Hot-list production run', urgency: 'critical', zone: 'critical', station: 'LW1' },
        { part: 'PART-654', desc: 'Brackets', stock: 80, cover: '0.4d', action: 'Diverting stock from warehouse B', urgency: 'critical', zone: 'critical', station: 'LW1' }
      ];
    }

    const vendorDelayData = isLW1 
      ? [
          { vendor: 'Krupp Steel Forge', delayDays: 4.2, color: T.red, machine: 'LW1' },
          { vendor: 'Acme Castings', delayDays: 2.8, color: T.amber, machine: 'LW1' },
          { vendor: 'SealTech Components', delayDays: 1.5, color: T.green, machine: 'LW1' }
        ]
      : [
          { vendor: 'Acme Castings', delayDays: 3.2, color: T.amber, machine: 'VMC1' },
          { vendor: 'Krupp Steel Forge', delayDays: 1.8, color: T.green, machine: 'OP10' },
          { vendor: 'SealTech Components', delayDays: 4.5, color: T.red, machine: 'SF01' }
        ];

    const turnsPct = Math.min(100, penetrationIndex);
    const coverPct = Math.min(100, supplierAdherence);
    const wipPct = Math.min(100, demandAdherence);

    const targetValue = isLW1 ? 80 : (product === 'MATRIX' ? 95 : (product === 'BANANA' ? 85 : 90));

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
      cfdData,
      shortageDistribution,
      donutData,
      bufferPenetrationStackedData,
      replenishmentLedger,
      vendorDelayData,
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

  if (page === 'OTIF') {
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

  if (page === 'INVENTORY') {
    let valuation = product === 'MATRIX' ? 13500000 : 18000000;
    let daysOfCover = isLW1 ? 6.2 : (product === 'MATRIX' ? 8 : 14);
    let stockTurns = isLW1 ? 12.5 : (product === 'MATRIX' ? 10.2 : 6.8);
    let wipOnFloor = isLW1 ? 880 : (product === 'MATRIX' ? 950 : 2405);
    let safetyStock = product === 'MATRIX' ? 8 : 10;
    let wipQueue = isLW1 ? 880 : 520;
    let avgDwellTime = isLW1 ? 9.1 : 6.5;
    let maxBuffer = 500;
    let label = product === 'MATRIX' ? 'Matrix (Precision CNC)' : 'All Products';

    const inventoryTrend = tLabels.map((name, i) => {
      let val = wipOnFloor + Math.cos(i) * 150;
      if (period === 'MTD' && i === 11) {
        val = val * 2;
      }
      return {
        name,
        value: Math.round(val),
        target: 2000
      };
    });

    const baseStations = [
      { name: 'UC1',   wipUnits: 320,  section: 'premachining' },
      { name: 'SF01',  wipUnits: 280,  section: 'machining'    },
      { name: 'LW2',   wipUnits: 190,  section: 'postMachining'},
      { name: 'LW3',   wipUnits: 210,  section: 'postMachining'},
      { name: 'BRZ',   wipUnits: 380,  section: 'machining'    },
      { name: 'SB10',  wipUnits: 150,  section: 'premachining' },
      { name: 'RSHP',  wipUnits: 240,  section: 'machining'    },
      { name: 'ALT10', wipUnits: 110,  section: 'postMachining'},
      { name: 'OP10',  wipUnits: 180,  section: 'premachining' },
      { name: 'OP20',  wipUnits: 140,  section: 'premachining' },
      { name: 'SLGL',  wipUnits: 220,  section: 'premachining' },
      { name: 'OP30',  wipUnits: 310,  section: 'machining'    },
      { name: 'OP40',  wipUnits: 270,  section: 'machining'    },
      { name: 'OP50',  wipUnits: 390,  section: 'postMachining'},
      { name: 'UC2',   wipUnits: 130,  section: 'postMachining'},
      { name: 'EOL',   wipUnits: 95,   section: 'postMachining'},
      { name: 'CL1',   wipUnits: 680,  section: 'postMachining'},
      { name: 'PACK',  wipUnits: 520,  section: 'postMachining'},
      { name: 'VMC1',  wipUnits: 380,  section: 'machining'    },
      { name: 'LW1',   wipUnits: isLW1 ? 880 : 290, section: 'postMachining' }
    ];

    const prodMult = product === 'MATRIX' ? 0.42 : product === 'BANANA' ? 0.61 : product === 'KIWI' ? 0.55 : 1.0;
    const periodMult = period === 'YoY' ? 1.35 : period === 'MTD' ? 1.10 : period === 'QTD' ? 0.95 : period === 'WTD' ? 0.85 : 1.0;

    const wipStationQueueData = baseStations.map((s, idx) => {
      const noise = 1 + Math.sin(idx * 1.3) * 0.12;
      return {
        name: s.name,
        wipUnits: Math.max(20, Math.round(s.wipUnits * prodMult * periodMult * noise)),
        section: s.section
      };
    });

    const baseAging = [
      { station: 'UC1',   fresh: 180, standard: 90,  delayed: 50,  section: 'premachining' },
      { station: 'SF01',  fresh: 160, standard: 220, delayed: 130, section: 'machining'    },
      { station: 'LW1',   fresh: isLW1 ? 400 : 200, standard: isLW1 ? 250 : 55, delayed: isLW1 ? 230 : 35, section: 'postMachining' },
      { station: 'CL1',   fresh: 80,  standard: 260, delayed: 340, section: 'postMachining' },
      { station: 'VMC1',  fresh: 300, standard: 100, delayed: 30,  section: 'machining'    },
      { station: 'PACK',  fresh: 160, standard: 20,  delayed: 10,  section: 'postMachining' },
      { station: 'BRZ',   fresh: 120, standard: 80,  delayed: 40,  section: 'machining'    },
      { station: 'SB10',  fresh: 90,  standard: 40,  delayed: 20,  section: 'premachining' },
      { station: 'RSHP',  fresh: 140, standard: 60,  delayed: 30,  section: 'machining'    },
      { station: 'ALT10', fresh: 80,  standard: 30,  delayed: 15,  section: 'postMachining' },
      { station: 'LW2',   fresh: 100, standard: 60,  delayed: 30,  section: 'postMachining' },
      { station: 'LW3',   fresh: 110, standard: 70,  delayed: 30,  section: 'postMachining' },
      { station: 'OP10',  fresh: 120, standard: 40,  delayed: 20,  section: 'premachining' },
      { station: 'OP20',  fresh: 80,  standard: 40,  delayed: 20,  section: 'premachining' },
      { station: 'SLGL',  fresh: 130, standard: 60,  delayed: 30,  section: 'premachining' },
      { station: 'OP30',  fresh: 190, standard: 90,  delayed: 30,  section: 'machining'    },
      { station: 'OP40',  fresh: 150, standard: 90,  delayed: 30,  section: 'machining'    },
      { station: 'OP50',  fresh: 220, standard: 110, delayed: 60,  section: 'postMachining' },
      { station: 'UC2',   fresh: 80,  standard: 30,  delayed: 20,  section: 'postMachining' },
      { station: 'EOL',   fresh: 60,  standard: 25,  delayed: 10,  section: 'postMachining' }
    ];

    const wipPipelineAgingData = baseAging.map(a => {
      return {
        station: a.station,
        fresh: Math.round(a.fresh * prodMult * periodMult),
        standard: Math.round(a.standard * prodMult * periodMult),
        delayed: Math.round(a.delayed * prodMult * periodMult),
        section: a.section
      };
    });

    const baseTime = [
      { station: 'UC1',   processing: 4.2, queue: 1.8, section: 'premachining' },
      { station: 'SF01',  processing: 3.8, queue: 6.5, section: 'machining'    },
      { station: 'LW1',   processing: 5.1, queue: isLW1 ? 14.8 : 2.2, section: 'postMachining' },
      { station: 'CL1',   processing: 3.4, queue: 9.1, section: 'postMachining' },
      { station: 'VMC1',  processing: 6.2, queue: 3.4, section: 'machining'    },
      { station: 'PACK',  processing: 2.8, queue: 1.1, section: 'postMachining' },
      { station: 'BRZ',   processing: 4.5, queue: 3.2, section: 'machining'    },
      { station: 'SB10',  processing: 3.0, queue: 2.5, section: 'premachining' },
      { station: 'RSHP',  processing: 3.2, queue: 2.8, section: 'machining'    },
      { station: 'ALT10', processing: 2.6, queue: 2.1, section: 'postMachining' },
      { station: 'LW2',   processing: 3.5, queue: 2.0, section: 'postMachining' },
      { station: 'LW3',   processing: 3.8, queue: 2.2, section: 'postMachining' },
      { station: 'OP10',  processing: 2.4, queue: 1.5, section: 'premachining' },
      { station: 'OP20',  processing: 2.8, queue: 1.6, section: 'premachining' },
      { station: 'SLGL',  processing: 3.1, queue: 2.3, section: 'premachining' },
      { station: 'OP30',  processing: 4.0, queue: 3.0, section: 'machining'    },
      { station: 'OP40',  processing: 3.6, queue: 2.7, section: 'machining'    },
      { station: 'OP50',  processing: 4.2, queue: 3.5, section: 'postMachining' },
      { station: 'UC2',   processing: 2.9, queue: 1.8, section: 'postMachining' },
      { station: 'EOL',   processing: 2.2, queue: 1.2, section: 'postMachining' }
    ];

    const processingVsQueueTimeData = baseTime.map(s => {
      return {
        station: s.station,
        processing: +(s.processing * (prodMult * 0.6 + 0.4)).toFixed(1),
        queue: +(s.queue * (periodMult * 0.8 + 0.2)).toFixed(1),
        section: s.section
      };
    });

    const targetValue = isLW1 ? 8 : (product === 'MATRIX' ? 10 : (product === 'BANANA' ? 18 : 14));

    return {
      valuation,
      daysOfCover,
      stockTurns,
      wipOnFloor,
      safetyStock,
      wipQueue,
      avgDwellTime,
      maxBuffer,
      label,
      inventoryTrend,
      wipStationQueueData,
      wipPipelineAgingData,
      processingVsQueueTimeData,
      targetValue,
      icon: 'Boxes',
      gradient: ['#10B981', '#059669'],
      trackWash: 'rgba(16,185,129,0.05)',
      glowShadow: 'rgba(16,185,129,0.2)'
    };
  }

  if (page === 'TRACEABILITY') {
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

  return {};
}

// Populate the nested dictionary at module load
for (const pg of pages) {
  dashboardData[pg] = {};
  for (const prod of products) {
    dashboardData[pg][prod] = {};
    for (const proc of processes) {
      dashboardData[pg][prod][proc] = {};
      for (const per of periods) {
        dashboardData[pg][prod][proc][per] = resolveDashboardData(pg, per, prod, proc);
      }
    }
  }
}

// Exportable query function normalizes filters and retrieves resolved data
export function getDashboardData(page: string, period: string, product: string, process: string, shift?: string): any {
  // Normalize Page ID
  let normPage: PageId = 'OEE';
  const pageUpper = page.toUpperCase();
  if (pageUpper === 'OVERVIEW' || pageUpper === 'OEE') normPage = 'OEE';
  else if (pageUpper === 'COPQ') normPage = 'COPQ';
  else if (pageUpper === 'BPR') normPage = 'BPR';
  else if (pageUpper === 'OTIF') normPage = 'OTIF';
  else if (pageUpper === 'INVENTORY') normPage = 'INVENTORY';
  else if (pageUpper === 'TRACEABILITY') normPage = 'TRACEABILITY';

  // Normalize Period ID
  let normPeriod: PeriodId = 'YTD';
  const perUpper = period.toUpperCase();
  if (perUpper === 'YTD' || perUpper === 'YEAR') normPeriod = 'YTD';
  else if (perUpper === 'YOY') normPeriod = 'YoY';
  else if (perUpper === 'QTD' || perUpper === 'QUARTER') normPeriod = 'QTD';
  else if (perUpper === 'MTD' || perUpper === 'MONTH') normPeriod = 'MTD';
  else if (perUpper === 'WTD' || perUpper === 'WEEK') normPeriod = 'WTD';
  else if (perUpper === 'CUSTOM') normPeriod = 'WTD';

  // Normalize Product ID
  let normProduct: ProductId = 'ALL';
  const prodUpper = product.toUpperCase();
  if (prodUpper.includes('MATRIX')) normProduct = 'MATRIX';
  else if (prodUpper.includes('BANANA')) normProduct = 'BANANA';
  else if (prodUpper.includes('KIWI')) normProduct = 'KIWI';

  // Normalize Process/Machine ID
  let normProcess = 'ALL';
  const procUpper = process.toUpperCase();
  if (!procUpper.includes('ALL') && procUpper.length > 0) {
    // Handle VMC1 machining mappings
    if (procUpper.includes('VMC1')) normProcess = 'VMC1';
    else if (procUpper.includes('LW1') || procUpper.includes('LW01')) normProcess = 'LW1';
    else if (procUpper.includes('PACK')) normProcess = 'PACK';
    else if (procUpper.includes('EOL')) normProcess = 'EOL';
    else {
      // Find matches in valid list
      const matched = processes.find(p => procUpper.includes(p));
      if (matched) normProcess = matched;
    }
  }

  // Dictionary Lookup
  const pgData = dashboardData[normPage] || dashboardData['OEE'];
  const prodData = pgData[normProduct] || pgData['ALL'];
  const procData = prodData[normProcess] || prodData['ALL'];
  const finalData = procData[normPeriod] || procData['YTD'];

  // Consolidate shift details for COPQ dynamic single-bar filtering
  if (normPage === 'COPQ' && finalData.internalFailureData) {
    const cloned = { ...finalData };
    cloned.internalFailureData = finalData.internalFailureData.map((d: any) => {
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

  return finalData;
}
