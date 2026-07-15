import { TimeTrend, FilterState as BaseFilterState } from './TimeTrendFilter';

/* ─── 1. EXTENDED FILTER & SCHEMA INTERFACES ─── */

export interface FilterState extends BaseFilterState {
  product?: string;
  plant?: string;
  process?: string;
  opSections?: {
    premachining: boolean;
    machining: boolean;
    postMachining: boolean;
  };
}

/* ─── Query Result Record Interfaces (consumed by all dashboard charts) ─── */

export interface OEERecord {
  label: string;
  target: number;
  oee: number;
  a: number; // Availability
  p: number; // Performance
  q: number; // Quality
}

export interface PlanActualRecord {
  label: string;
  planned: number;
  actual: number;
  target: number;
  rate: number;
}

export interface CycleRecord {
  station: string;
  cycle: number;
  anomaly: boolean;
}

export interface WIPBufferRecord {
  station: string;
  current: number;
  buffer: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface WIPFlowRecord {
  station: string;
  fresh: number;
  standard: number;
  critical: number;
}

export interface DowntimeRecord {
  day: string;
  p: number; // Planned PM
  u: number; // Unplanned Breakdown
}

export interface ParetoRecord {
  cause: string;
  min: number;
}

export interface MaterialCoverageRecord {
  daysOfSupply: number;
  zeroInventory: number;
  upto1Day: number;
  upto2Days: number;
  upto3Days: number;
  over3Days: number;
}

export interface DowntimeTrendRecord {
  label: string;
  planned: number;
  unplanned: number;
  target: number;
}

export interface DefectRecord {
  label: string;
  target: number;
  ppm: number;
  inhouse: number;
  rework: number;
  complaints: number;
}

// The unified 6-Dimension transaction schema
export interface PlantTransaction {
  // Dimension 1: Temporal
  timestamp: Date;
  year: number;
  quarter: string;
  month: string;
  week: string;
  day: string;
  hour: string;

  // Dimension 2: Organizational Hierarchy
  businessUnit: string;
  plantLocation: string;
  shift: string;
  lineId: string;
  sectionType: string;
  stationId: string;
  machineId: string;
  productType: string;

  // Dimension 3: Volumetric Production
  plannedQty: number;
  actualQty: number;
  inspectedQty: number;
  okQty: number;

  // Dimension 4: Quality & Defects
  defectQty: number;
  reworkQty: number;
  rejectionQty: number;
  sourceAttribution: 'In-House Process' | 'Supplier Raw Material';
  defectCategory: 'Machining' | 'Welding' | 'Assembly' | 'Surface Damage' | 'Process Residue';
  defectType: string;
  escapeCount: number;

  // Dimension 5: Equipment Reliability
  operatingTime: number;
  plannedDowntime: number;
  unplannedDowntime: number;
  pmTaskStatus: 'Completed' | 'Overdue';
  mtbfHours: number;
  mttrMinutes: number;

  // Dimension 6: Inventory & Materials
  wipQty: number;
  wipAgingHrs: number;
  daysOfSupply: number;
  erpAccuracyDiff: number;
  stockoutStatus: 'Normal' | 'Caution' | 'Critical Shortage';
}

/* ─── 2. DOMAIN CONSTANTS ─── */
const YEARS_NUM = [2018,2019,2020,2021, 2022,2023, 2024, 2025, 2026];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const YEARS = YEARS_NUM.map(String);
const SHIFTS = ['Shift A', 'Shift B', 'Shift C'];
const LINES = ['Line 01', 'Line 02', 'Line 03'];
const PLANTS = [
  'Tata Toyo Radiator (Chakan)',
  'TTR Jamshedpur',
  'TTR Sri City',
  'TTR Sanand',
  'TTR Pithampur',
];
const STATIONS = ['UC01', 'SPFL', 'LW01', 'CLNC', 'LW02',  'LW03', 
  'BRZN', 'SHBL', 'RSHP', 'ALT1',  'VMC1',
  'SLGL', 'VMC2', 'UC02','TSTL', 'EOL',  'PACK'];

/* ─── 3. MASTER TRANSACTION SEED GENERATOR ─── */

/**
 * Deterministic pseudo-random number (avoids Math.random() so data is stable
 * across re-renders — seeded by position index).
 */
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function generateMasterDatabase(): PlantTransaction[] {
  const database: PlantTransaction[] = [];
  const baseDate = new Date('2024-01-01');
  let rowIndex = 0;

  YEARS_NUM.forEach((yr) => {
    MONTHS.forEach((m, mIdx) => {
      const q = QUARTERS[Math.floor(mIdx / 3)];

      DAYS.forEach((dy, dIdx) => {
        PLANTS.forEach((pl) => {
          LINES.forEach((ln) => {
            SHIFTS.forEach((sf) => {
              STATIONS.forEach((st) => {
                rowIndex++;
                const rng = (offset = 0) => seededRand(rowIndex * 31 + offset);

                // Map stations to physical section types
                const premachiningStations = ['UC01', 'SPFL', 'LW01', 'CLNC', 'LW02', 'LW03', 'BRZN', 'SHBL', 'RSHP', 'ALT1', 'VMC1'];
                const section = premachiningStations.includes(st) ? 'Premachining' : 'Post-Machining';

                // Base planned target per shift
                let planned = 500;
                if (ln === 'Line 02') planned = 550;

                // Structural yield variances
                let yieldFactor = 0.94;
                if (ln === 'Line 01') yieldFactor = 0.81;   // Constrained line
                if (sf === 'Shift B') yieldFactor += 0.02;  // Best shift
                if (sf === 'Shift C') yieldFactor -= 0.05;  // Night-shift fatigue

                // Seasonal overhaul dips (April, August)
                if (m === 'Apr' || m === 'Aug') yieldFactor -= 0.04;

                const actualFraction = yieldFactor + Math.sin(mIdx * 0.7) * 0.03;
                const actual = Math.round(planned * actualFraction);
                const inspected = actual;

                const defectRate = Math.max(0.01, 1 - yieldFactor + (rng(1) - 0.5) * 0.02);
                const defects = Math.round(inspected * defectRate);
                const rework = Math.round(defects * 0.75);
                const reject = defects - rework;
                const ok = inspected - defects;

                // Downtime (minutes per shift)
                let unplannedDt = Math.round(30 + Math.sin(mIdx * 0.8) * 15);
                if (ln === 'Line 01') unplannedDt = Math.round(unplannedDt * 2.2);
                if (sf === 'Shift C') unplannedDt = Math.round(unplannedDt * 1.4);
                if (sf === 'Shift B') unplannedDt = Math.max(8, Math.round(unplannedDt * 0.7));
                unplannedDt = Math.min(unplannedDt, 420);

                const daysOfSupply = ln === 'Line 02'
                  ? 4
                  : Math.round(10 + Math.sin(dIdx * 0.5) * 4);

                const defCat: PlantTransaction['defectCategory'] =
                  section === 'Premachining' ? 'Welding' : 'Assembly';

                const defType =
                  section === 'Premachining' ? 'Blow holes' : 'Excess Paste';

                database.push({
                  timestamp: new Date(baseDate.getTime() + (mIdx * 30 + dIdx) * 24 * 3600 * 1000),
                  year: yr,
                  quarter: q,
                  month: m,
                  week: `W${Math.floor(mIdx * 4.3) + 1}`,
                  day: dy,
                  hour: '10:00',

                  businessUnit: 'Cold Plate',
                  plantLocation: pl,
                  shift: sf,
                  lineId: ln,
                  sectionType: section,
                  stationId: st,
                  machineId: `${st}-01`,
                  productType: rng(2) > 0.4 ? 'Coldplate' : 'Banana_Kiwi',

                  plannedQty: planned,
                  actualQty: actual,
                  inspectedQty: inspected,
                  okQty: ok,

                  defectQty: defects,
                  reworkQty: rework,
                  rejectionQty: reject,
                  sourceAttribution: rng(3) > 0.15 ? 'In-House Process' : 'Supplier Raw Material',
                  defectCategory: defCat,
                  defectType: defType,
                  escapeCount: rng(4) > 0.9 ? 1 : 0,

                  operatingTime: Math.max(0, 420 - unplannedDt),
                  plannedDowntime: 60,
                  unplannedDowntime: unplannedDt,
                  pmTaskStatus: rng(5) > 0.05 ? 'Completed' : 'Overdue',
                  mtbfHours: 120,
                  mttrMinutes: 42,

                  wipQty: Math.round(150 + Math.sin(dIdx) * 35),
                  wipAgingHrs: 12.8,
                  daysOfSupply,
                  erpAccuracyDiff: 99.4,
                  stockoutStatus: daysOfSupply < 5 ? 'Critical Shortage' : 'Normal',
                });
              });
            });
          });
        });
      });
    });
  });

  return database;
}

// Instantiate the master relational database emulator once at module load
export const masterDb = generateMasterDatabase();

/* ─── 4. DATABASE QUERY AGGREGATORS (SQL-Like functions) ─── */

/**
 * Filter helper — applies all 6 active filter dimensions to a record set.
 */
function applyFilters(records: PlantTransaction[], filters: FilterState): PlantTransaction[] {
  const opSecs = filters.opSections;
  return records.filter(r => {
    if (filters.line !== 'All Lines' && r.lineId !== filters.line) return false;
    if (filters.shift !== 'All Shifts' && r.shift !== filters.shift) return false;
    if (filters.plant && r.plantLocation !== filters.plant) return false;
    if (filters.product && r.productType !== filters.product) return false;
    if (filters.process && r.stationId !== filters.process) return false;
    if (opSecs) {
      if (!opSecs.premachining && r.sectionType === 'Premachining') return false;
      if (!opSecs.postMachining && r.sectionType === 'Post-Machining') return false;
    }
    return true;
  });
}

/**
 * Resolves X-Axis label array based on the selected time trend dimension.
 */
function getLabelsForTrend(trend: string): string[] {
  if (trend === 'year') return YEARS;
  if (trend === 'quarter') return QUARTERS;
  if (trend === 'month') return MONTHS;
  return DAYS;
}

/**
 * Matches a transaction row to a given time-trend label bucket.
 */
function matchesTrend(r: PlantTransaction, trend: string, lbl: string): boolean {
  if (trend === 'year') return String(r.year) === lbl;
  if (trend === 'quarter') return r.quarter === lbl;
  if (trend === 'month') return r.month === lbl;
  return r.day === lbl;
}

/* ── OEE Performance Trend ── */
export function getOEEData(filters: FilterState): OEERecord[] {
  const filtered = applyFilters(masterDb, filters);
  const labels = getLabelsForTrend(filters.trend);

  return labels.map(lbl => {
    const subset = filtered.filter(r => matchesTrend(r, filters.trend, lbl));
    if (subset.length === 0) return { label: lbl, target: 80, oee: 0, a: 0, p: 0, q: 0 };

    const totalPlanned  = subset.reduce((acc, r) => acc + r.plannedQty,       0);
    const totalActual   = subset.reduce((acc, r) => acc + r.actualQty,        0);
    const totalDefects  = subset.reduce((acc, r) => acc + r.defectQty,        0);
    const totalRunTime  = subset.reduce((acc, r) => acc + r.operatingTime,    0);
    const totalDownTime = subset.reduce((acc, r) => acc + r.unplannedDowntime, 0);

    const aRate = Math.round((totalRunTime / Math.max(1, totalRunTime + totalDownTime)) * 100);
    const pRate = Math.round((totalActual   / Math.max(1, totalPlanned))               * 100);
    const qRate = Math.round(((totalActual - totalDefects) / Math.max(1, totalActual)) * 100);
    const oeeScore = Math.round((aRate * pRate * qRate) / 10000);

    return {
      label: lbl,
      target: 80,
      oee: Math.min(100, Math.max(30, oeeScore)),
      a: Math.min(100, aRate),
      p: Math.min(100, pRate),
      q: Math.min(100, qRate),
    };
  });
}

/* ── Throughput & Schedule Adherence ── */
export function getThroughputAdherenceData(filters: FilterState): PlanActualRecord[] {
  const filtered = applyFilters(masterDb, filters);
  const labels = getLabelsForTrend(filters.trend);

  return labels.map(lbl => {
    const subset = filtered.filter(r => matchesTrend(r, filters.trend, lbl));
    const n = Math.max(1, subset.length);

    const planned = Math.round(subset.reduce((acc, r) => acc + r.plannedQty, 0) / n);
    const actual  = Math.round(subset.reduce((acc, r) => acc + r.actualQty,  0) / n);
    const rate    = Math.round((actual / Math.max(1, planned)) * 100);

    return { label: lbl, planned, actual, target: planned, rate };
  });
}

/* ── Cycle Time vs Takt ── */
export function getCycleTimeData(filters: FilterState): CycleRecord[] {
  const filtered = applyFilters(masterDb, filters);

  return STATIONS.map(st => {
    const subset = filtered.filter(r => r.stationId === st);
    const n = Math.max(1, subset.length);
    const avgRunTime = subset.reduce((acc, r) => acc + r.operatingTime, 0) / n;
    // Scale operating time (minutes/shift) to a per-unit cycle-time approximation (seconds)
    const avgCycle = Math.round(avgRunTime * 0.15 + 35);
    return {
      station: st,
      cycle: avgCycle,
      anomaly: avgCycle > 45,
    };
  });
}

/* ── WIP Station Buffer ── */
export function getWIPBufferData(filters: FilterState): WIPBufferRecord[] {
  const filtered = applyFilters(masterDb, filters);

  return STATIONS.map(st => {
    const subset = filtered.filter(r => r.stationId === st);
    const n = Math.max(1, subset.length);
    const current = Math.round(subset.reduce((acc, r) => acc + r.wipQty, 0) / n);
    const status: WIPBufferRecord['status'] =
      current > 240 ? 'critical' : current > 200 ? 'warning' : 'normal';

    return { station: st, current, buffer: 200, status };
  });
}

/* ── WIP Flow & Aging ── */
export function getWIPFlowData(filters: FilterState): WIPFlowRecord[] {
  const filtered = applyFilters(masterDb, filters);

  return STATIONS.map(st => {
    const subset = filtered.filter(r => r.stationId === st);
    const n = Math.max(1, subset.length);
    const totalWIP = Math.round(subset.reduce((acc, r) => acc + r.wipQty, 0) / n);

    return {
      station: st,
      fresh:    Math.round(totalWIP * 0.65),
      standard: Math.round(totalWIP * 0.25),
      critical: Math.round(totalWIP * 0.10),
    };
  });
}

/* ── 14-Day Downtime Trend ── */
export function getDowntimeTrendData(filters: FilterState): DowntimeTrendRecord[] {
  const filtered = applyFilters(masterDb, filters);
  const labels = getLabelsForTrend(filters.trend);

  return labels.map(lbl => {
    const subset = filtered.filter(r => matchesTrend(r, filters.trend, lbl));
    const n = Math.max(1, subset.length);

    // Convert from total minutes → hours for display
    const planned   = Math.round(subset.reduce((acc, r) => acc + r.plannedDowntime,   0) / n * 0.1);
    const unplanned = Math.round(subset.reduce((acc, r) => acc + r.unplannedDowntime, 0) / n * 0.1);

    return { label: lbl, planned, unplanned, target: 10 };
  });
}

/* ── Downtime Pareto ── */
export function getDowntimePareto(filters: FilterState): ParetoRecord[] {
  const filtered = applyFilters(masterDb, filters);

  // Each pareto cause gets a distinct weight drawn from real downtime aggregates
  const causes: { cause: string; weight: number }[] = [
    { cause: 'Changeover',  weight: 2.10 },
    { cause: 'PM',          weight: 1.55 },
    { cause: 'Tooling',     weight: 1.20 },
    { cause: 'Trials',      weight: 0.90 },
    { cause: 'No Op.',      weight: 0.65 },
    { cause: 'Electrical',  weight: 0.58 },
    { cause: 'Robot Mod',   weight: 0.35 },
    { cause: 'Wk Startup',  weight: 0.28 },
    { cause: 'No Plan',     weight: 0.18 },
    { cause: 'Meeting',     weight: 0.10 },
  ];

  const baseUnplanned = filtered.reduce((acc, r) => acc + r.unplannedDowntime, 0);

  return causes.map(c => ({
    cause: c.cause,
    min: Math.round(baseUnplanned * c.weight * 0.008 + 200),
  }));
}

/* ── Raw Material Coverage ── */
export function getRawMaterialCoverage(filters: FilterState): MaterialCoverageRecord {
  const filtered = applyFilters(masterDb, filters);
  const n = Math.max(1, filtered.length);
  const avgDays = Math.round(filtered.reduce((acc, r) => acc + r.daysOfSupply, 0) / n);

  return {
    daysOfSupply: avgDays,
    zeroInventory: avgDays < 5  ? 8 : 3,
    upto1Day:      0,
    upto2Days:     avgDays < 10 ? 3 : 1,
    upto3Days:     0,
    over3Days:     avgDays < 5  ? 24 : 32,
  };
}

/* ── Quality / Defect Metrics ── */
export function getDefectData(filters: FilterState): DefectRecord[] {
  const filtered = applyFilters(masterDb, filters);
  const labels = getLabelsForTrend(filters.trend);

  return labels.map(lbl => {
    const subset = filtered.filter(r => matchesTrend(r, filters.trend, lbl));

    const totalDefects = subset.reduce((acc, r) => acc + r.defectQty,  0);
    const totalActual  = subset.reduce((acc, r) => acc + r.actualQty,  0);
    const ppm = Math.round((totalDefects / Math.max(1, totalActual)) * 1_000_000 * 0.15 + 120);

    return {
      label: lbl,
      target:     200,
      ppm,
      inhouse:    Math.round(ppm * 0.45),
      rework:     Math.round(ppm * 0.35),
      complaints: Math.round(ppm * 0.15),
    };
  });
}

/* ─── 5. STATIC DEFAULT EXPORTS FOR BACKWARD COMPATIBILITY ─── */
const defaultState: FilterState = {
  trend: 'month',
  shift: 'All Shifts',
  line: 'All Lines',
  selectedDate: new Date(),
};

export const oeeYearly    = getOEEData({ ...defaultState, trend: 'year'    });
export const oeeQuarterly = getOEEData({ ...defaultState, trend: 'quarter' });
export const oeeMonthly   = getOEEData({ ...defaultState, trend: 'month'   });
export const oeeWeekly    = getOEEData({ ...defaultState, trend: 'week'    });

export const scheduleYearly    = getThroughputAdherenceData({ ...defaultState, trend: 'year'    });
export const scheduleQuarterly = getThroughputAdherenceData({ ...defaultState, trend: 'quarter' });
export const scheduleMonthly   = getThroughputAdherenceData({ ...defaultState, trend: 'month'   });
export const scheduleWeekly    = getThroughputAdherenceData({ ...defaultState, trend: 'week'    });

export const downtimeMonthly = getDowntimeTrendData({ ...defaultState, trend: 'month' });
export const defectMonthly   = getDefectData({        ...defaultState, trend: 'month' });

/* ─── Quality Page Schema & Generator (Groups 1 - 6) ─── */

export interface QualityTransaction {
  // Group 1: Temporal & Contextual Keys
  timestamp: Date;
  label: string; // Mapped to Year, Quarter, Month, or Day depending on trend
  shift: string;
  lineId: string;
  productType: string;

  // Group 2: Location & Machine Keys
  sectionType: string;
  qGateStationId: string;
  machineId: string;

  // Group 3: Volumetric Yield Inputs (Quantitative Core)
  inspectedQty: number;
  okQty: number;
  reworkQty: number;
  rejectionQty: number;

  // Group 4: Defect Attribution & Ownership
  sourceAttribution: 'In-House Process' | 'Supplier Raw Material';
  supplierName: string | null;

  // Group 5: Defect Taxonomy (Categorical Classification)
  defectCategory: 'Machining' | 'Welding' | 'Assembly' | 'Surface Damage' | 'Process Residue';
  defectType: string;

  // Group 6: Inspection & Filtration Metrics
  inspectionMethod: string;
  escapeCount: number;
}

// Domain Constants


/**
 * Generates highly realistic, filter-responsive transactional datasets 
 * for Groups 1-6 to support deep quality drill-down pathways.
 */
export function getQualityTransactions(filters: any): QualityTransaction[] {
  const { trend, line, shift, product, plant, opSections } = filters;
  
  const preCheck = opSections?.premachining !== false;
  const postCheck = opSections?.postMachining !== false;

  let labels = DAYS;
  if (trend === 'year' || trend === 'custom') labels = YEARS;
  else if (trend === 'quarter') labels = QUARTERS;
  else if (trend === 'month') labels = MONTHS;

  const dataset: QualityTransaction[] = [];
  const baseDate = new Date('2026-01-01');

  labels.forEach((lbl, idx) => {
    STATIONS.forEach((st) => {
      // Group 2 Mapping: Align stations to operating sections
      const premachiningStations = ['UC01', 'SPFL', 'LW01', 'CLNC', 'LW02', 'LW03', 'BRZN', 'SHBL', 'RSHP', 'ALT1', 'VMC1'];
      const section = premachiningStations.includes(st) ? 'Premachining' : 'Post-Machining';

      // Bypass inactive sections based on sidebar checklist toggles
      if (opSections) {
        if (!preCheck && section === 'Premachining') return;
        if (!postCheck && section === 'Post-Machining') return;
      }

      // Group 3 Base Calculations (Volumetric)
      let inspected = 250;
      if (line === 'Line 02') inspected = 280; // Scale volume

    // 1. Base yield and constraint factors
      let firstPassYieldRate = 0.94; // 94% FTR baseline
      
      // April Maintenance Overhaul / Shift C Fatigue variables
      if (trend === 'month' && lbl === 'Apr') firstPassYieldRate -= 0.12; 
      if (shift === 'Shift C') firstPassYieldRate -= 0.05;
      if (line === 'Line 01') firstPassYieldRate -= 0.10; // Instability on Line 01
      if (product === 'Banana_Kiwi') firstPassYieldRate -= 0.04; // Complex assembly tax

      // Apply synthetic high-variance sine-curve modulation
      const finalFpyRate = Math.max(0.40, Math.min(0.99, firstPassYieldRate + Math.sin(idx * 0.9) * 0.04));

      const okQty = Math.round(inspected * finalFpyRate);
      const defectQty = inspected - okQty;
      const reworkQty = Math.round(defectQty * 0.75); // 75% salvaged through rework
      const rejectionQty = defectQty - reworkQty; // The remaining are scrapped

      // 2. Group 4: Defect Taxonomy & Attribution Mapping
      const isSupplierIssue = Math.random() < 0.12 || (plant && plant.includes('Sri City') && Math.random() > 0.6);
      const source: 'In-House Process' | 'Supplier Raw Material' = isSupplierIssue ? 'Supplier Raw Material' : 'In-House Process';
      
      let category: 'Machining' | 'Welding' | 'Assembly' | 'Surface Damage' | 'Process Residue' = 'Machining';
      let defect = 'Burr';

      if (section === 'Premachining') {
        category = 'Welding';
        defect = Math.random() > 0.5 ? 'Blow holes' : 'Pedestal Gap';
      } else if (section === 'Post-Machining') {
        category = 'Assembly';
        defect = Math.random() > 0.5 ? 'Excess Paste' : 'Scratch';
      }

      // Group 6: Escapes (Caught at final firewall only)
      const escape = Math.random() > 0.94 ? 1 : 0;

      dataset.push({
        timestamp: new Date(baseDate.getTime() + idx * 30 * 24 * 3600 * 1000),
        label: lbl,
        shift: shift || 'All Shifts',
        lineId: line || 'All Lines',
        productType: product || 'Coldplate',
        sectionType: section,
        qGateStationId: st,
        machineId: `${st}-01`,
        inspectedQty: inspected,
        okQty,
        reworkQty,
        rejectionQty,
        sourceAttribution: source,
        supplierName: source === 'Supplier Raw Material' ? 'TTR Castings Ltd' : null,
        defectCategory: category,
        defectType: defect,
        inspectionMethod: st === 'AOI' ? 'AOI Camera' : st === 'CMM' ? 'CMM Probe' : 'Visual Inspection',
        escapeCount: escape,
      });
    });
  });

  return dataset;
}