import { PeriodId, ProductId, getTimeLabels } from './types';

export function resolveOeeData(period: PeriodId, product: ProductId, process: string): any {
  const tLabels = getTimeLabels(period);
  const isLW1 = process === 'LW1';
  const isVMC1 = process === 'VMC1';
  const isPACK = process === 'PACK';
  const isEOL = process === 'EOL';

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
