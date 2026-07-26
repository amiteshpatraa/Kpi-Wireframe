import { PeriodId, ProductId, getTimeLabels } from './types';

export function resolveInventoryData(period: PeriodId, product: ProductId, process: string): any {
  const tLabels = getTimeLabels(period);
  const isLW1 = process === 'LW1';

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
    { name: 'SF01',  wipUnits: 280,  section: 'premachining' },
    { name: 'LW2',   wipUnits: 190,  section: 'postMachining'},
    { name: 'LW3',   wipUnits: 210,  section: 'postMachining'},
    { name: 'BRZ',   wipUnits: 380,  section: 'premachining' },
    { name: 'SB10',  wipUnits: 150,  section: 'premachining' },
    { name: 'RSHP',  wipUnits: 240,  section: 'premachining' },
    { name: 'ALT10', wipUnits: 110,  section: 'postMachining'},
    { name: 'OP10',  wipUnits: 180,  section: 'premachining' },
    { name: 'OP20',  wipUnits: 140,  section: 'premachining' },
    { name: 'SLGL',  wipUnits: 220,  section: 'premachining' },
    { name: 'OP30',  wipUnits: 310,  section: 'premachining' },
    { name: 'OP40',  wipUnits: 270,  section: 'premachining' },
    { name: 'OP50',  wipUnits: 390,  section: 'postMachining'},
    { name: 'UC2',   wipUnits: 130,  section: 'postMachining'},
    { name: 'EOL',   wipUnits: 95,   section: 'postMachining'},
    { name: 'CL1',   wipUnits: 680,  section: 'postMachining'},
    { name: 'PACK',  wipUnits: 520,  section: 'postMachining'},
    { name: 'VMC1',  wipUnits: 380,  section: 'premachining' },
    { name: 'LW1',   wipUnits: isLW1 ? 880 : 290, section: 'postMachining' }
  ];

  const prodMult = product === 'MATRIX' ? 0.42 : product === 'BANANA' ? 0.61 : product === 'KIWI' ? 0.55 : 1.0;
  const periodMult = period === 'MTD' ? 1.10 : period === 'QTD' ? 0.95 : period === 'WTD' ? 0.85 : 1.0;

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
    { station: 'SF01',  fresh: 160, standard: 220, delayed: 130, section: 'premachining' },
    { station: 'LW1',   fresh: isLW1 ? 400 : 200, standard: isLW1 ? 250 : 55, delayed: isLW1 ? 230 : 35, section: 'postMachining' },
    { station: 'CL1',   fresh: 80,  standard: 260, delayed: 340, section: 'postMachining' },
    { station: 'VMC1',  fresh: 300, standard: 100, delayed: 30,  section: 'premachining' },
    { station: 'PACK',  fresh: 160, standard: 20,  delayed: 10,  section: 'postMachining' },
    { station: 'BRZ',   fresh: 120, standard: 80,  delayed: 40,  section: 'premachining' },
    { station: 'SB10',  fresh: 90,  standard: 40,  delayed: 20,  section: 'premachining' },
    { station: 'RSHP',  fresh: 140, standard: 60,  delayed: 30,  section: 'premachining' },
    { station: 'ALT10', fresh: 80,  standard: 30,  delayed: 15,  section: 'postMachining' },
    { station: 'LW2',   fresh: 100, standard: 60,  delayed: 30,  section: 'postMachining' },
    { station: 'LW3',   fresh: 110, standard: 70,  delayed: 30,  section: 'postMachining' },
    { station: 'OP10',  fresh: 120, standard: 40,  delayed: 20,  section: 'premachining' },
    { station: 'OP20',  fresh: 80,  standard: 40,  delayed: 20,  section: 'premachining' },
    { station: 'SLGL',  fresh: 130, standard: 60,  delayed: 30,  section: 'premachining' },
    { station: 'OP30',  fresh: 190, standard: 90,  delayed: 30,  section: 'premachining' },
    { station: 'OP40',  fresh: 150, standard: 90,  delayed: 30,  section: 'premachining' },
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
    { station: 'SF01',  processing: 3.8, queue: 6.5, section: 'premachining' },
    { station: 'LW1',   processing: 5.1, queue: isLW1 ? 14.8 : 2.2, section: 'postMachining' },
    { station: 'CL1',   processing: 3.4, queue: 9.1, section: 'postMachining' },
    { station: 'VMC1',  processing: 6.2, queue: 3.4, section: 'premachining' },
    { station: 'PACK',  processing: 2.8, queue: 1.1, section: 'postMachining' },
    { station: 'BRZ',   processing: 4.5, queue: 3.2, section: 'premachining' },
    { station: 'SB10',  processing: 3.0, queue: 2.5, section: 'premachining' },
    { station: 'RSHP',  processing: 3.2, queue: 2.8, section: 'premachining' },
    { station: 'ALT10', processing: 2.6, queue: 2.1, section: 'postMachining' },
    { station: 'LW2',   processing: 3.5, queue: 2.0, section: 'postMachining' },
    { station: 'LW3',   processing: 3.8, queue: 2.2, section: 'postMachining' },
    { station: 'OP10',  processing: 2.4, queue: 1.5, section: 'premachining' },
    { station: 'OP20',  processing: 2.8, queue: 1.6, section: 'premachining' },
    { station: 'SLGL',  processing: 3.1, queue: 2.3, section: 'premachining' },
    { station: 'OP30',  processing: 4.0, queue: 3.0, section: 'premachining' },
    { station: 'OP40',  processing: 3.6, queue: 2.7, section: 'premachining' },
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
