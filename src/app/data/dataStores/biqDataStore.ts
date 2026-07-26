import { PeriodId, ProductId, getTimeLabels } from './types';

// ── BIQ DATA STORE — Built-In Quality ────────────────────────────────────────
// Metrics: FTR %, Process Capability (Cpk), Scrap ₹L, Warranty ₹L,
//          Supplier PPM, LPA Audit Compliance %

export function resolveBiqData(period: PeriodId, product: ProductId, process: string, shift?: string): any {
  const tLabels = getTimeLabels(period);
  const isLW1  = process === 'LW1';
  const isVMC1 = process === 'VMC1';
  const isPACK = process === 'PACK';
  const isEOL  = process === 'EOL';

  // ── KPI Scalars ───────────────────────────────────────────────────────────
  let ftr = 94.2;          // First Time Right %
  let cpk = 1.28;          // Process Capability Index
  let lpaCompliance = 97.5; // Layered Process Audit %
  let supplierPpm = 1250;
  let label = 'All Products';

  if (product === 'MATRIX') {
    ftr = 98.2; cpk = 1.55; lpaCompliance = 99.1; supplierPpm = 450;
    label = 'Matrix (Precision CNC)';
  } else if (product === 'BANANA') {
    ftr = 91.5; cpk = 1.10; lpaCompliance = 95.4; supplierPpm = 1850;
    label = 'Banana (High-Volume Extrusion)';
  } else if (product === 'KIWI') {
    ftr = 94.5; cpk = 1.33; lpaCompliance = 97.8; supplierPpm = 920;
    label = 'Kiwi (Custom Brass Core)';
  }

  if (isLW1) {
    ftr = 89.2; cpk = 0.98; lpaCompliance = 93.0; supplierPpm = 2200;
    label = 'LW1 Welder Bottleneck';
  } else if (isVMC1) {
    ftr = 96.5; cpk = 1.42; lpaCompliance = 98.2; supplierPpm = 1100;
    label = 'VMC Machining';
  } else if (isEOL || isPACK) {
    ftr = 99.1; cpk = 1.68; lpaCompliance = 99.5; supplierPpm = 280;
    label = 'Inspection / Assembly';
  }

  // ── Process Quality & Capability (FTR % + Cpk) ───────────────────────────
  // Quadrant 2 / Tab 1 data
  const ftrCpkTrend = tLabels.map((name, i) => {
    const baseFtr = ftr + Math.sin(i * 0.6) * 2.5;
    const baseCpk = cpk + Math.cos(i * 0.5) * 0.08;
    return {
      name,
      ftr: +Math.min(100, Math.max(80, baseFtr)).toFixed(1),
      cpk: +Math.max(0.7, baseCpk).toFixed(2),
      cpkTarget: 1.33,
    };
  });

  // ── Internal & Customer Quality (Scrap + Warranty Defect Volume) ─────────
  // Quadrant 3 / Tab 2 data
  const scrapWarrantyTrend = tLabels.map((name, i) => {
    const baseScrap = (isLW1 ? 160 : 120) + Math.sin(i * 0.8) * 25;
    const baseWarranty = (isLW1 ? 52 : 38) + Math.cos(i) * 10;
    // Day 12 spike for anomaly realism
    const scrapMult = (period === 'MTD' && i === 11) ? 2.2 : 1;
    return {
      name,
      scrap: Math.round(baseScrap * scrapMult),    // Scrap Parts Count
      warranty: Math.round(baseWarranty),          // Warranty Claim Occurrences
    };
  });

  // ── Incoming Quality & Compliance (LPA % + Supplier PPM) ─────────────────
  // Quadrant 4 / Tab 3 data
  const lpaSupplierTrend = tLabels.map((name, i) => {
    const baseLpa = lpaCompliance + Math.cos(i * 0.4) * 1.2;
    const basePpm = supplierPpm + Math.sin(i * 0.7) * 150;
    return {
      name,
      lpa: +Math.min(100, Math.max(85, baseLpa)).toFixed(1),
      ppm: Math.max(50, Math.round(basePpm)),
      ppmTarget: 500,
    };
  });

  // ── Tab 1: SPC Control Chart (Cp / Cpk Tolerance) ────────────────────────
  const spcChartData = tLabels.map((name, i) => {
    const value = cpk + Math.sin(i * 0.55) * 0.12;
    return {
      name,
      value: +value.toFixed(3),
      usl: 1.67,
      lsl: 0.0,
      ucl: cpk + 0.15,
      lcl: cpk - 0.15,
      target: 1.33,
    };
  });

  // ── Tab 1: Station-Level FTR Loss Matrix ─────────────────────────────────
  const ftrStationMatrix = [
    { station: 'LW1',  section: 'Premachining', ftr: isLW1 ? 89.2 : 91.5, target: 97.0, defects: isLW1 ? 82 : 34, severity: 'critical' },
    { station: 'UC1',  section: 'Premachining', ftr: 95.8, target: 97.0, defects: 18, severity: 'warning' },
    { station: 'BRZ',  section: 'Premachining', ftr: 97.2, target: 97.0, defects: 10, severity: 'ok' },
    { station: 'VMC1', section: 'Premachining', ftr: isVMC1 ? 96.5 : 98.1, target: 97.0, defects: isVMC1 ? 14 : 7, severity: 'ok' },
    { station: 'SLGL', section: 'Post-Machining', ftr: 93.4, target: 97.0, defects: 28, severity: 'warning' },
    { station: 'EOL',  section: 'Post-Machining', ftr: isPACK || isEOL ? 99.1 : 98.8, target: 97.0, defects: 4, severity: 'ok' },
    { station: 'PACK', section: 'Post-Machining', ftr: isPACK ? 99.3 : 99.0, target: 97.0, defects: 3, severity: 'ok' },
  ];

  // ── Tab 2: Defect Taxonomy Pareto ────────────────────────────────────────
  const defectPareto = [
    { category: 'Weld Porosity / Blow Holes', count: isLW1 ? 140 : 58, cost: isLW1 ? 8.2 : 3.4 },
    { category: 'Dimensional OOT',            count: isLW1 ? 95  : 42, cost: isLW1 ? 5.1 : 2.1 },
    { category: 'Surface Finish Defects',      count: 38, cost: 1.8 },
    { category: 'Assembly Placement Error',    count: 22, cost: 1.1 },
    { category: 'Labeling / Packaging',        count: 12, cost: 0.4 },
  ];

  // ── Tab 2: Warranty Claims Ledger ─────────────────────────────────────────
  const warrantyClaimsTable = WARRANTY_CLAIMS;

  // ── Tab 3: Supplier PPM Scorecard ────────────────────────────────────────
  const supplierPpmScorecard = [
    { supplier: 'SteelCorp India',         material: 'Steel Rods',       ppm: isLW1 ? 2800 : 850,  status: isLW1 ? 'critical' : 'warning',  lots: 24 },
    { supplier: 'Precision Tubes Chakan',  material: 'Copper Tubes',     ppm: 180,                   status: 'ok',                            lots: 18 },
    { supplier: 'Bajaj Fasteners',         material: 'Fasteners',        ppm: isLW1 ? 1600 : 600,  status: isLW1 ? 'warning' : 'ok',        lots: 32 },
    { supplier: 'TTR Castings Ltd',        material: 'Aluminium Fins',   ppm: 320,                   status: 'ok',                            lots: 15 },
  ];

  // ── Tab 3: LPA Audit Compliance & Open CARs ──────────────────────────────
  const lpaAuditLog = [
    { auditId: 'LPA-2024-041', station: 'LW1',  date: 'Jul 18', score: 91.2, openCars: 3, status: 'At Risk' },
    { auditId: 'LPA-2024-042', station: 'UC1',  date: 'Jul 19', score: 98.5, openCars: 0, status: 'Pass' },
    { auditId: 'LPA-2024-043', station: 'SLGL', date: 'Jul 20', score: 95.0, openCars: 1, status: 'Watch' },
    { auditId: 'LPA-2024-044', station: 'EOL',  date: 'Jul 21', score: 99.8, openCars: 0, status: 'Pass' },
    { auditId: 'LPA-2024-045', station: 'VMC1', date: 'Jul 22', score: 97.3, openCars: 1, status: 'Pass' },
  ];

  // ── Shift filter slice (mirrors legacy copq behavior) ─────────────────────
  let internalFailureData = scrapWarrantyTrend.map((d, idx) => ({
    name: d.name,
    shiftA: +(d.scrap * 0.34).toFixed(1),
    shiftB: +(d.scrap * 0.35).toFixed(1),
    shiftC: +(d.scrap * 0.31).toFixed(1),
    totalLoss: d.scrap,
  }));

  const targetValue = isLW1 ? 95 : (product === 'MATRIX' ? 99 : (product === 'BANANA' ? 93 : 97));

  const result = {
    // KPI scalars
    ftr,
    cpk,
    lpaCompliance,
    supplierPpm,
    label,
    tLabels,
    targetValue,
    // Chart data
    ftrCpkTrend,
    scrapWarrantyTrend,
    lpaSupplierTrend,
    spcChartData,
    ftrStationMatrix,
    defectPareto,
    warrantyClaimsTable,
    supplierPpmScorecard,
    lpaAuditLog,
    internalFailureData,
    // Legacy compat keys expected by getDashboardData consumers
    ytdLoss: Math.round(scrapWarrantyTrend.reduce((a, d) => a + d.scrap + d.warranty, 0) * 100000),
    fpy: ftr,
    monthlyWarningLimit: 15, // ₹ Lakhs
    summaryTrendData: scrapWarrantyTrend.map(d => ({
      name: d.name,
      internal: d.scrap,
      external: d.warranty,
      prevention: 1.5,
    })),
    defectTaxonomyPareto: defectPareto.map(d => ({ category: d.category, cost: Math.round(d.cost * 100000), count: d.count })),
    defectTaxonomyGrid: ftrStationMatrix.map(s => ({ id: s.station, name: `FTR Loss @ ${s.station}`, category: s.section, severity: s.severity === 'critical' ? 'Critical' : s.severity === 'warning' ? 'High' : 'Low', occurred: s.defects, action: 'Under review' })),
    externalFailureBulletData: lpaSupplierTrend.map(d => ({ name: d.name, actual: d.ppm, target: 500, budget: 1000 })),
    preventionAppraisalData: ftrCpkTrend.map(d => ({ name: d.name, prevention: d.cpk * 1000, appraisal: 2500 })),
    supplierQualityMatrix: supplierPpmScorecard.map(s => ({ supplier: s.supplier, partsDefective: Math.round(s.ppm / 10), ppm: s.ppm, status: s.status === 'critical' ? 'critical' : s.status === 'ok' ? 'safe' : 'warning' })),
    // Style tokens
    icon: 'ShieldCheck',
    gradient: ['#7C3AED', '#5D1C6A'],
    trackWash: 'rgba(124,58,237,0.05)',
    glowShadow: 'rgba(93,28,106,0.25)',
  };

  if (shift) {
    const cloned = { ...result };
    cloned.internalFailureData = result.internalFailureData.map((d: any) => {
      let loss = d.totalLoss;
      if (shift === 'Shift A') loss = d.shiftA;
      else if (shift === 'Shift B') loss = d.shiftB;
      else if (shift === 'Shift C') loss = d.shiftC;
      return { name: d.name, totalLoss: loss };
    });
    return cloned;
  }

  return result;
}

// ── BIQ Pillar Definitions ────────────────────────────────────────────────────
export const BIQ_PILLARS = [
  {
    id: 'PROCESS_QUALITY' as const,
    label: 'Process Quality & Capability',
    subtitle: 'FTR % & Cpk Index',
    value: '94.2% FTR',
    target: '97.0%',
    color: '#7C3AED',
  },
  {
    id: 'INTERNAL_QUALITY' as const,
    label: 'Internal & Customer Quality',
    subtitle: 'Scrap & Warranty Units',
    value: '165 Units',
    target: '120 Units',
    color: '#EC6530',
  },
  {
    id: 'INCOMING_COMPLIANCE' as const,
    label: 'Incoming Quality & Compliance',
    subtitle: 'Supplier PPM & LPA Audit',
    value: '1,250 PPM',
    target: '500 PPM',
    color: '#0EA5E9',
  },
] as const;

export type ActiveBiqPillar = typeof BIQ_PILLARS[number]['id'] | null;

// ── Warranty Claims Ledger (shared with legacy pages) ─────────────────────────
export const WARRANTY_CLAIMS = [
  { claimId: 'CLM-9021', sku: '2002254-00-E06', customer: 'Tesla Fremont',     defectiveUnits: '152 Units', costLakhs: 12.5, defect: 'Laser Weld Porosity',      status: 'Approved' },
  { claimId: 'CLM-9022', sku: '2002254-00-E08', customer: 'Rivian Normal',      defectiveUnits: '93 Units',  costLakhs: 8.2,  defect: 'Sticker Alignment Missing', status: 'Under Review' },
  { claimId: 'CLM-9023', sku: '2002254-00-E10', customer: 'Lucid Casa Grande',  defectiveUnits: '64 Units',  costLakhs: 5.4,  defect: 'O-ring Micro-Crack',        status: 'Approved' },
  { claimId: 'CLM-9024', sku: '2002254-00-E12', customer: 'GM Factory ZERO',    defectiveUnits: '26 Units',  costLakhs: 2.1,  defect: 'Surface Scratch',           status: 'Rejected' },
];
