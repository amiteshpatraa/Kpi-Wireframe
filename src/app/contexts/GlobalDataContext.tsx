import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { FilterState } from '../components/TimeTrendFilter';
import { masterDb } from '../components/mockData';

// ══════════════════════════════════════════════════════════════════════════════
// Short-key → Long-key mapping (matches etl_pipeline.py compact export)
// ══════════════════════════════════════════════════════════════════════════════
const KEY_MAP: Record<string, string> = {
  Y: 'Year', Q: 'Quarter', M: 'Month', W: 'Week', D: 'Day', H: 'Hour', S: 'Shift',
  L: 'Line_ID', X: 'Section_Type', I: 'Station_ID', N: 'Machine_ID', P: 'Product_Type',
  a: 'Planned_Qty', b: 'Actual_Qty', c: 'Inspected_Qty', d: 'OK_Qty',
  e: 'Defect_Qty', f: 'Rework_Qty', g: 'Rejection_Qty', h: 'Supplier_Defect_Qty', i: 'In_House_Defect_Qty',
  j: 'Source_Attribution', k: 'Defect_Category', l: 'Defect_Type', m: 'Escape_Count',
  n: 'Operating_Time_Mins', o: 'Planned_Downtime_Mins', p: 'Unplanned_Downtime_Mins', q: 'Downtime_Reason',
  r: 'Station_Cycle_Time_Sec', s: 'Takt_Time_Target_Line',
  t: 'WIP_Fresh_Qty', u: 'WIP_Standard_Qty', v: 'WIP_Delayed_Qty', w: 'WIP_Total_Qty', x: 'WIP_Buffer_Limit_Line',
  y: 'Days_of_Supply',
  z: 'Failure_Count',
  A: 'Total_Repair_Minutes', B: 'Stockout_Stoppage_Minutes',
  C: 'Cost_of_Goods_Sold_USD', E: 'Total_Rework_Loss_USD', F: 'Total_Scrap_Loss_USD', G: 'Total_Defect_Escapes_USD',
  da: 'Defect_ID', dn: 'Defect_Name', ds: 'Severity',
};

/** Expand a single compact row to full key names */
function expandRow(row: any): any {
  const expanded: any = {
    // Constant fields (not stored in JSON to save space)
    Plant_Name: 'Tata Toyo Radiator (Chakan)',
    Plant_ID: 'PLT-001',
    Business_Unit: 'BU-Automotive',
    Timestamp: '', // Will be derived below
  };
  for (const [short, long] of Object.entries(KEY_MAP)) {
    if (row[short] !== undefined) {
      expanded[long] = row[short];
    }
  }
  // Derive Timestamp from Year/Month/Day/Hour for any component that needs it
  expanded.Timestamp = `${expanded.Year}-${expanded.Month}-${expanded.Day} ${expanded.Hour}`;
  return expanded;
}

function mapMasterDbRow(row: any): any {
  return {
    Plant_Name: row.plantLocation || 'Tata Toyo Radiator (Chakan)',
    Plant_ID: 'PLT-001',
    Business_Unit: 'BU-Automotive',
    Year: row.year,
    Quarter: row.quarter,
    Month: row.month,
    Week: row.week,
    Day: row.day,
    Hour: row.hour,
    Shift: row.shift,
    Line_ID: row.lineId,
    Section_Type: row.sectionType,
    Station_ID: row.stationId,
    Machine_ID: row.machineId,
    Product_Type: row.productType,
    Planned_Qty: row.plannedQty,
    Actual_Qty: row.actualQty,
    Inspected_Qty: row.inspectedQty,
    OK_Qty: row.okQty,
    Defect_Qty: row.defectQty,
    Rework_Qty: row.reworkQty,
    Rejection_Qty: row.rejectionQty,
    Supplier_Defect_Qty: row.sourceAttribution === 'Supplier Raw Material' ? row.defectQty : 0,
    In_House_Defect_Qty: row.sourceAttribution === 'In-House Process' ? row.defectQty : 0,
    Source_Attribution: row.sourceAttribution,
    Defect_Category: row.defectCategory,
    Defect_Type: row.defectType,
    Escape_Count: row.escapeCount,
    Operating_Time_Mins: row.operatingTime,
    Planned_Downtime_Mins: row.plannedDowntime,
    Unplanned_Downtime_Mins: row.unplannedDowntime,
    Downtime_Reason: 'None',
    Station_Cycle_Time_Sec: 40,
    Takt_Time_Target_Line: 45,
    WIP_Fresh_Qty: Math.round(row.wipQty * 0.6),
    WIP_Standard_Qty: Math.round(row.wipQty * 0.3),
    WIP_Delayed_Qty: Math.round(row.wipQty * 0.1),
    WIP_Total_Qty: row.wipQty,
    WIP_Buffer_Limit_Line: 200,
    Days_of_Supply: row.daysOfSupply,
    Failure_Count: row.unplannedDowntime > 0 ? 1 : 0,
    Timestamp: `${row.year}-${row.month}-${row.day} ${row.hour}`,
  };
}

interface GlobalDataContextType {
  data: any[];
  isLoading: boolean;
  getFilteredData: (filters: FilterState) => any[];
}

const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined);

export const GlobalDataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.time('[DataLoad] Fetch + expand');
    fetch('/data.json')
      .then(res => res.json())
      .then((jsonData: any[]) => {
        console.timeLog('[DataLoad] Fetch + expand', `Fetched ${jsonData.length} rows, expanding keys...`);
        const expanded = jsonData.map(expandRow);
        console.timeEnd('[DataLoad] Fetch + expand');
        setData(expanded);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching master database, falling back to local generated database:", err);
        const mappedFallback = masterDb.map(mapMasterDbRow);
        setData(mappedFallback);
        setIsLoading(false);
      });
  }, []);

  const getFilteredData = useCallback((filters: FilterState) => {
    if (!data.length) return [];

    let plantScale = 1.0;
    if (filters.plant && filters.plant !== 'All Plants' && filters.plant !== 'Tata Toyo Radiator (Chakan)') {
      let hash = 0;
      for (let i = 0; i < filters.plant.length; i++) {
        hash += filters.plant.charCodeAt(i);
      }
      plantScale = 0.6 + (hash % 9) * 0.1;
    }
    
    const filtered = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Line filter
      if (filters.line && filters.line !== 'All Lines') {
        if (row.Line_ID !== filters.line) continue;
      }
      
      // Shift filter
      if (filters.shift && filters.shift !== 'All Shifts') {
        if (row.Shift !== filters.shift) continue;
      }
      
      // Product filter
      if (filters.product && filters.product !== 'All Products') {
        if (row.Product_Type !== filters.product) continue;
      }
      
      // Process/Station filter
      if (filters.process && filters.process !== 'All Processes') {
        if (row.Station_ID !== filters.process) continue;
      }
      
      // Machine filter
      if (filters.machine && filters.machine !== 'All Machines') {
        if (row.Machine_ID !== filters.machine) continue;
      }

      if (plantScale !== 1.0) {
        const clone = { ...row };
        clone.Plant_Name = filters.plant;
        clone.Planned_Qty = Math.round((row.Planned_Qty || 0) * plantScale);
        clone.Actual_Qty = Math.round((row.Actual_Qty || 0) * plantScale);
        clone.Inspected_Qty = Math.round((row.Inspected_Qty || 0) * plantScale);
        clone.OK_Qty = Math.round((row.OK_Qty || 0) * plantScale);
        clone.Defect_Qty = Math.round((row.Defect_Qty || 0) * plantScale);
        clone.Rework_Qty = Math.round((row.Rework_Qty || 0) * plantScale);
        clone.Rejection_Qty = Math.round((row.Rejection_Qty || 0) * plantScale);
        filtered.push(clone);
      } else {
        filtered.push(row);
      }
    }
    return filtered;
  }, [data]);

  return (
    <GlobalDataContext.Provider value={{ data, isLoading, getFilteredData }}>
      {children}
    </GlobalDataContext.Provider>
  );
};

export const useGlobalData = () => {
  const context = useContext(GlobalDataContext);
  if (context === undefined) {
    throw new Error('useGlobalData must be used within a GlobalDataProvider');
  }
  return context;
};
