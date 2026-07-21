import { PageId, PeriodId, ProductId, processes } from './types';
import { resolveOeeData } from './oeeDataStore';
import { resolveCopqData } from './copqDataStore';
import { resolveBprData } from './bprDataStore';
import { resolveOtifData } from './otifDataStore';
import { resolveInventoryData } from './inventoryDataStore';
import { resolveTraceabilityData } from './traceabilityDataStore';

export * from './types';
export {
  resolveOeeData,
  PILLARS,
  STATIONS_LIST,
  MONTHLY_MACHINE_DEFECTS,
  MACHINE_STATIONS,
  resolveMachineOeeData
} from './oeeDataStore';
export {
  resolveCopqData,
  PILLARS as COPQ_PILLARS,
  WARRANTY_CLAIMS
} from './copqDataStore';
export {
  resolveBprData,
  PILLARS as BPR_PILLARS,
  VENDOR_PROMISED_DAYS,
  resolvePromisedActualData,
  resolveAdherenceDataWithVolume
} from './bprDataStore';
export {
  resolveOtifData,
  PILLARS as OTIF_PILLARS,
  DELAY_BREAKDOWN
} from './otifDataStore';
export { resolveInventoryData } from './inventoryDataStore';
export {
  resolveTraceabilityData,
  SCANNER_PERFORMANCE,
  FAILURE_CATEGORIES,
  COMPLIANCE_LOG,
  BREACH_LINE_STACK,
  NODE_COLORS,
  resolveHeatmapData,
  resolveTimeMachineNodes,
  type ThreadNode
} from './traceabilityDataStore';

export function getDashboardData(
  page: string,
  period: string,
  product: string,
  process: string,
  shift?: string
): any {
  // Normalize Page ID
  let normPage: PageId = 'OEE';
  const pageUpper = (page || '').toUpperCase();
  if (pageUpper === 'OVERVIEW' || pageUpper === 'OEE') normPage = 'OEE';
  else if (pageUpper === 'COPQ') normPage = 'COPQ';
  else if (pageUpper === 'BPR') normPage = 'BPR';
  else if (pageUpper === 'OTIF') normPage = 'OTIF';
  else if (pageUpper === 'INVENTORY') normPage = 'INVENTORY';
  else if (pageUpper === 'TRACEABILITY') normPage = 'TRACEABILITY';

  // Normalize Period ID
  let normPeriod: PeriodId = 'YTD';
  const perUpper = (period || '').toUpperCase();
  if (perUpper === 'YTD' || perUpper === 'YEAR') normPeriod = 'YTD';
  else if (perUpper === 'YOY') normPeriod = 'YoY';
  else if (perUpper === 'QTD' || perUpper === 'QUARTER') normPeriod = 'QTD';
  else if (perUpper === 'MTD' || perUpper === 'MONTH') normPeriod = 'MTD';
  else if (perUpper === 'WTD' || perUpper === 'WEEK') normPeriod = 'WTD';
  else if (perUpper === 'CUSTOM') normPeriod = 'WTD';

  // Normalize Product ID
  let normProduct: ProductId = 'ALL';
  const prodUpper = (product || '').toUpperCase();
  if (prodUpper.includes('MATRIX')) normProduct = 'MATRIX';
  else if (prodUpper.includes('BANANA')) normProduct = 'BANANA';
  else if (prodUpper.includes('KIWI')) normProduct = 'KIWI';

  // Normalize Process/Machine ID
  let normProcess = 'ALL';
  const procUpper = (process || '').toUpperCase();
  if (!procUpper.includes('ALL') && procUpper.length > 0) {
    if (procUpper.includes('VMC1')) normProcess = 'VMC1';
    else if (procUpper.includes('LW1') || procUpper.includes('LW01')) normProcess = 'LW1';
    else if (procUpper.includes('PACK')) normProcess = 'PACK';
    else if (procUpper.includes('EOL')) normProcess = 'EOL';
    else {
      const matched = processes.find(p => procUpper.includes(p));
      if (matched) normProcess = matched;
    }
  }

  // Route query to page-specific sub-store resolver
  switch (normPage) {
    case 'OEE':
      return resolveOeeData(normPeriod, normProduct, normProcess);
    case 'COPQ':
      return resolveCopqData(normPeriod, normProduct, normProcess, shift);
    case 'BPR':
      return resolveBprData(normPeriod, normProduct, normProcess);
    case 'OTIF':
      return resolveOtifData(normPeriod, normProduct, normProcess);
    case 'INVENTORY':
      return resolveInventoryData(normPeriod, normProduct, normProcess);
    case 'TRACEABILITY':
      return resolveTraceabilityData(normPeriod, normProduct, normProcess);
    default:
      return resolveOeeData(normPeriod, normProduct, normProcess);
  }
}
