import { PeriodId, ProductId, getTimeLabels } from './types';

function getSeedRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

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

  if (period === 'QTD') {
    const qtdAvails = [89.5, 85.8, 88.4, 86.5];
    const qtdPerfs  = [94.0, 90.2, 92.5, 91.0];
    const qtdQuals  = [96.6, 95.4, 97.1, 95.3];

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
      const dayNum = parseInt(name);
      const waveAvail = Math.sin(dayNum * 0.9) * 1.5 + Math.cos(dayNum * 1.7) * 1.0;
      const pseudoRand = (getSeedRandom(dayNum) - 0.5) * 2;
      const randAvail = pseudoRand * 1.0;

      let uptime = 88.0 + waveAvail + randAvail;

      if (dayNum === 5) {
        uptime = 81.5;
      } else if (dayNum === 13) {
        uptime = 35.0;
      } else if (dayNum === 22) {
        uptime = 82.0;
      } else if ([1, 8, 15, 29].includes(dayNum)) {
        // Monday warmup drop (8% from standard peak)
        uptime = 82.0 + waveAvail + randAvail;
      } else if ([6, 20, 27].includes(dayNum)) {
        // Friday
        uptime = 88.0 + waveAvail + randAvail;
      } else if ([2, 3, 4, 9, 10, 11, 16, 17, 18, 23, 24, 25, 30, 31].includes(dayNum)) {
        // Mid-week peak stability
        uptime = 90.0 + waveAvail + randAvail;
      } else {
        // Other days (e.g. Day 12, 19, 26)
        uptime = 88.0 + waveAvail + randAvail;
      }

      return {
        name,
        avg_avail: +Math.min(100, Math.max(0, uptime * scale)).toFixed(1),
        downtime: (dayNum === 13) ? 270 : Math.round((100 - uptime) * 0.2)
      };
    });

    monthlyPerformance = tLabels.map((name, i) => {
      const dayNum = parseInt(name);
      const wavePerf = Math.cos(dayNum * 0.9) * 1.5 + Math.sin(dayNum * 1.7) * 1.0;
      const pseudoRand = (getSeedRandom(dayNum + 10) - 0.5) * 2;
      const randPerf = pseudoRand * 1.0;

      let rate = 90.0 + wavePerf + randPerf;

      if (dayNum === 5) {
        rate = 62.0;
      } else if (dayNum === 13) {
        rate = 52.0;
      } else if (dayNum === 22) {
        rate = 76.0;
      } else if ([1, 8, 15, 29].includes(dayNum)) {
        // Monday warmup drop (8% from standard peak)
        rate = 85.0 + wavePerf + randPerf;
      } else if ([6, 20, 27].includes(dayNum)) {
        // Friday tooling wear drop (4% from mid-week peak)
        rate = 89.0 + wavePerf + randPerf;
      } else if ([2, 3, 4, 9, 10, 11, 16, 17, 18, 23, 24, 25, 30, 31].includes(dayNum)) {
        // Mid-week peak stability
        rate = 93.0 + wavePerf + randPerf;
      } else {
        // Other days
        rate = 90.0 + wavePerf + randPerf;
      }

      return {
        name,
        actualVolume: Math.round(1200 * (rate / 100)),
        avg_perf: +Math.min(100, Math.max(0, rate * scale)).toFixed(1)
      };
    });

    monthlyQuality = tLabels.map((name, i) => {
      const dayNum = parseInt(name);
      const waveQual = Math.sin(dayNum * 0.45) * 0.8 + Math.cos(dayNum * 1.2) * 0.5;
      const pseudoRand = (getSeedRandom(dayNum + 20) - 0.5) * 2;
      const randQual = pseudoRand * 0.5;

      let fpy = 97.0 + waveQual + randQual;
      let scrapPct = 1.2;

      if (dayNum === 5) {
        fpy = 85.0;
      } else if (dayNum === 15) {
        // Downstream Quality Recalibration (replaces Sunday Day 14 quality drop)
        fpy = 72.0;
      } else if (dayNum === 22) {
        fpy = 68.5;
        scrapPct = 8.5; // Rejections spike
      }

      return {
        name,
        avg_fpy: +Math.min(100, Math.max(0, fpy * scale)).toFixed(1),
        scrapPct
      };
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
    const ytdAvails = [89.5, 85.8, 88.4, 86.5];
    const ytdPerfs  = [94.0, 90.2, 92.5, 91.0];
    const ytdQuals  = [96.6, 95.4, 97.1, 95.3];

    monthlyAvailability = tLabels.map((name, i) => {
      const uptime = ytdAvails[i % 4];
      return { name, avg_avail: +(uptime * scale).toFixed(1), downtime: Math.round((100 - uptime) * 0.2) };
    });
    monthlyPerformance = tLabels.map((name, i) => {
      const rate = ytdPerfs[i % 4];
      return { name, actualVolume: Math.round(1200 * (rate / 100)), avg_perf: +(rate * scale).toFixed(1) };
    });
    monthlyQuality = tLabels.map((name, i) => {
      const fpy = ytdQuals[i % 4];
      return { name, avg_fpy: +(fpy * scale).toFixed(1), scrapPct: 1.2 };
    });
  }

  const monthlyOee = tLabels.map((name, i) => {
    const dayNum = parseInt(name);
    if (period === 'MTD' && dayNum === 5) {
      return { name, value: 54.2 };
    }
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
    const dayNum = parseInt(name);
    const isIncident = (period === 'MTD' && dayNum === 13);
    return {
      name,
      breakdown: isIncident ? 270 : (isLW1 ? 480 : 180 + Math.round(Math.cos(i) * 30)),
      mttr: isIncident ? 270 : (isLW1 ? 45 : 22 + (i % 3)),
      mtbf: isIncident ? 4 : (isLW1 ? 18 : 36 - (i % 4))
    };
  });

  const cycleTaktStationData = tLabels.map((name, i) => {
    const dayNum = parseInt(name);
    const isIncident = (period === 'MTD' && dayNum === 13);
    return {
      name,
      setup: isIncident ? 60 : (isLW1 ? 25 : 12 + (i % 2)),
      processing: isIncident ? 80 : (isLW1 ? 35 : 28 - (i % 3)),
      limit: 45
    };
  });

  const monthlyOutputPerManData = tLabels.map((name, i) => {
    const dayNum = parseInt(name);
    const isIncident = (period === 'MTD' && dayNum === 13);
    return {
      name,
      actual: isIncident ? 45 : (isLW1 ? 90 : 120 + Math.round(Math.sin(i) * 10))
    };
  });

  const monthlyReworkData = tLabels.map((name, i) => {
    let planned = 250;
    let rework = 10;

    if (period === 'QTD') {
      const plans = [60, 52, 58, 55];
      const reworks = [14, 8, 10, 8];
      planned = plans[i % 4];
      rework = reworks[i % 4];
    } else if (period === 'MTD') {
      const dayNum = parseInt(name);
      if (dayNum === 15) {
        planned = 18;
        rework = 12;
      } else if (dayNum === 13) {
        planned = 8;
        rework = 6;
      } else {
        planned = 18 + Math.round(Math.sin(dayNum) * 3);
        rework = 1 + Math.round(Math.cos(dayNum) * 0.8 + 0.5);
      }
    } else if (period === 'WTD') {
      planned = [18, 22, 19, 21, 20][i % 5];
      rework = [2, 3, 1, 4, 2][i % 5];
    } else {
      const plans = [60, 52, 58, 55];
      const reworks = [14, 8, 10, 8];
      planned = plans[i % 4];
      rework = reworks[i % 4];
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

    if (period === 'QTD') {
      const burrsList = [10, 14, 11, 12];
      const blowList  = [4, 7, 5, 5];
      const gapsList  = [2, 3, 2, 3];

      burrs = burrsList[i % 4];
      blowHoles = blowList[i % 4];
      gaps = gapsList[i % 4];
    } else if (period === 'MTD') {
      const dayNum = parseInt(name);
      if (dayNum === 22) {
        burrs = 8;
        blowHoles = 32;
        gaps = 4;
      } else if (dayNum === 13) {
        burrs = 25;
        blowHoles = 15;
        gaps = 8;
      } else {
        burrs = 1 + Math.round(Math.sin(dayNum) * 0.5 + 0.5);
        blowHoles = Math.round(Math.cos(dayNum) * 0.4 + 0.4);
        gaps = Math.round(Math.sin(dayNum * 1.5) * 0.2 + 0.2);
      }
    } else if (period === 'WTD') {
      burrs = [1, 2, 1, 3, 2][i % 5];
      blowHoles = [0, 1, 0, 1, 0][i % 5];
      gaps = [0, 0, 1, 0, 0][i % 5];
    } else {
      const burrsList = [10, 14, 11, 12];
      const blowList  = [4, 7, 5, 5];
      const gapsList  = [2, 3, 2, 3];

      burrs = burrsList[i % 4];
      blowHoles = blowList[i % 4];
      gaps = gapsList[i % 4];
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

  // Calculate dynamic average values for MTD period to propagate cleanly to Level 0/1/2 views
  if (period === 'MTD' && monthlyAvailability.length > 0) {
    availVal = +(monthlyAvailability.reduce((sum, item) => sum + item.avg_avail, 0) / monthlyAvailability.length).toFixed(1);
    perfVal = +(monthlyPerformance.reduce((sum, item) => sum + item.avg_perf, 0) / monthlyPerformance.length).toFixed(1);
    qualVal = +(monthlyQuality.reduce((sum, item) => sum + item.avg_fpy, 0) / monthlyQuality.length).toFixed(1);
    oeeVal = +(monthlyOee.reduce((sum, item) => sum + item.value, 0) / monthlyOee.length).toFixed(1);
  }

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
    glowShadow: 'rgba(37,99,235,0.2)',
    stationsList: STATIONS_LIST,
    monthlyMachineDefects: MONTHLY_MACHINE_DEFECTS
  };
}

export const PILLARS = [
  {
    id: 'OEE' as const,
    label: 'OEE Overview',
    value: 67,
    target: 80,
    color: '#6366F1',
  },
  {
    id: 'AVAILABILITY' as const,
    label: 'Availability Index',
    value: 85,
    target: 85,
    color: '#00B574',
  },
  {
    id: 'PERFORMANCE' as const,
    label: 'Performance Index',
    value: 80,
    target: 80,
    color: '#FFA000',
  },
  {
    id: 'QUALITY' as const,
    label: 'Quality Index',
    value: 99,
    target: 99,
    color: '#F5788B',
  },
] as const;

export type ActivePillar = typeof PILLARS[number]['id'] | null;

export const STATIONS_LIST = [
  { name: 'UC01', type: 'auto', limit: 33 }, { name: 'SPFL', type: 'auto', limit: 33 },
  { name: 'LW01', type: 'auto', limit: 33 }, { name: 'CLNC', type: 'auto', limit: 33 },
  { name: 'LW02', type: 'auto', limit: 33 }, { name: 'LW03', type: 'auto', limit: 33 },
  { name: 'BRZN', type: 'auto', limit: 33 }, { name: 'VMC1', type: 'auto', limit: 33 },
  { name: 'VMC2', type: 'auto', limit: 33 }, { name: 'UC02', type: 'auto', limit: 33 },
  { name: 'EOL', type: 'manual', limit: 45 }, { name: 'PACK', type: 'manual', limit: 45 },
  { name: 'ALT1', type: 'manual', limit: 45 }, { name: 'LW04', type: 'manual', limit: 45 },
  { name: 'VMC3', type: 'manual', limit: 45 }, { name: 'UC03', type: 'manual', limit: 45 },
];

export const MONTHLY_MACHINE_DEFECTS: Record<string, { machine: string; defects: number }[]> = {
  Jan: [{ machine: 'MCH-029', defects: 35 }, { machine: 'MCH-052', defects: 15 }],
  Feb: [{ machine: 'MCH-029', defects: 42 }, { machine: 'MCH-052', defects: 18 }],
  Mar: [{ machine: 'MCH-029', defects: 38 }, { machine: 'MCH-052', defects: 12 }],
  Apr: [{ machine: 'MCH-029', defects: 55 }, { machine: 'MCH-052', defects: 25 }],
  May: [{ machine: 'MCH-029', defects: 48 }, { machine: 'MCH-052', defects: 30 }],
  Jun: [{ machine: 'MCH-029', defects: 65 }, { machine: 'MCH-052', defects: 42 }, { machine: 'MCH-070', defects: 18 }],
  Jul: [{ machine: 'MCH-029', defects: 58 }, { machine: 'MCH-052', defects: 38 }],
  Aug: [{ machine: 'MCH-029', defects: 50 }, { machine: 'MCH-052', defects: 28 }],
  Sep: [{ machine: 'MCH-029', defects: 78 }, { machine: 'MCH-052', defects: 44 }, { machine: 'MCH-070', defects: 22 }],
  Oct: [{ machine: 'MCH-029', defects: 45 }, { machine: 'MCH-052', defects: 20 }],
  Nov: [{ machine: 'MCH-029', defects: 39 }, { machine: 'MCH-052', defects: 16 }],
  Dec: [{ machine: 'MCH-029', defects: 41 }, { machine: 'MCH-052', defects: 18 }],
};

export interface MachineStationConfig {
  name: string;
  section: 'premachining' | 'postMachining';
  baseAvail: number;
  basePerf: number;
  baseQual: number;
}

export const MACHINE_STATIONS: MachineStationConfig[] = [
  { name: 'UC01', section: 'premachining', baseAvail: 88, basePerf: 84, baseQual: 98 },
  { name: 'SPFL', section: 'premachining', baseAvail: 86, basePerf: 82, baseQual: 99 },
  { name: 'LW01', section: 'premachining', baseAvail: 89, basePerf: 85, baseQual: 98 },
  { name: 'CLNC', section: 'premachining', baseAvail: 92, basePerf: 87, baseQual: 99 },
  { name: 'LW02', section: 'premachining', baseAvail: 82, basePerf: 78, baseQual: 97 },
  { name: 'LW03', section: 'premachining', baseAvail: 84, basePerf: 80, baseQual: 98 },
  { name: 'BRZN', section: 'premachining', baseAvail: 87, basePerf: 83, baseQual: 99 },
  { name: 'VMC1', section: 'premachining', baseAvail: 85, basePerf: 81, baseQual: 97 },
  { name: 'VMC2', section: 'postMachining', baseAvail: 83, basePerf: 79, baseQual: 96 },
  { name: 'UC02', section: 'postMachining', baseAvail: 84, basePerf: 82, baseQual: 98 },
  { name: 'EOL', section: 'postMachining', baseAvail: 94, basePerf: 90, baseQual: 99 },
  { name: 'PACK', section: 'postMachining', baseAvail: 91, basePerf: 88, baseQual: 97 },
  { name: 'ALT1', section: 'postMachining', baseAvail: 93, basePerf: 89, baseQual: 99 },
  { name: 'LW04', section: 'postMachining', baseAvail: 92, basePerf: 87, baseQual: 98 },
  { name: 'VMC3', section: 'postMachining', baseAvail: 88, basePerf: 85, baseQual: 96 },
  { name: 'UC03', section: 'postMachining', baseAvail: 89, basePerf: 86, baseQual: 97 },
];

export function resolveMachineOeeData(filters: {
  opSections?: { premachining?: boolean; postMachining?: boolean };
  shift?: string;
  plant?: string;
  trend?: string;
}) {
  const filteredStations = MACHINE_STATIONS.filter((st) => {
    if (!filters.opSections) return true;
    if (st.section === 'premachining' && !filters.opSections.premachining) return false;
    if (st.section === 'postMachining' && !filters.opSections.postMachining) return false;
    return true;
  });

  let shiftSeed = 0;
  if (filters.shift === 'Shift A') shiftSeed = 1.2;
  if (filters.shift === 'Shift B') shiftSeed = -0.8;
  if (filters.shift === 'Shift C') shiftSeed = -2.1;

  let plantSeed = 0;
  if (filters.plant && filters.plant !== 'All Plants') {
    let hash = 0;
    for (let i = 0; i < filters.plant.length; i++) hash += filters.plant.charCodeAt(i);
    plantSeed = (hash % 5) - 2;
  }

  let periodSeed = 0;
  if (filters.trend === 'year') periodSeed = 1.5;
  if (filters.trend === 'quarter') periodSeed = -0.5;
  if (filters.trend === 'week') periodSeed = 2.2;

  return filteredStations.map((st) => {
    const idx = st.name.charCodeAt(0) + st.name.charCodeAt(1);
    const randomOffset = Math.sin(idx) * 2;

    const availability = Math.min(100, Math.max(50, +(st.baseAvail + shiftSeed + plantSeed + periodSeed + randomOffset).toFixed(1)));
    const performance = Math.min(100, Math.max(50, +(st.basePerf + shiftSeed * 0.8 + plantSeed * 1.2 + periodSeed * 0.5 + randomOffset * 0.7).toFixed(1)));
    const quality = Math.min(100, Math.max(50, +(st.baseQual + shiftSeed * 0.2 + plantSeed * 0.4 + periodSeed * 0.1 + randomOffset * 0.3).toFixed(1)));

    const oee = +((availability * performance * quality) / 10000).toFixed(1);

    return {
      name: st.name,
      uptime: availability,
      actualVolume: performance,
      yieldPass: quality,
      overallOee: oee,
      capacity: 100,
    };
  });
}

