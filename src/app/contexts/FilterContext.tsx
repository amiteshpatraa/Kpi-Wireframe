import { createContext, useContext, useState, ReactNode } from 'react';

export interface Coordinate {
  x: number;
  y: number;
}

export type IsometricZoneCoords = Record<string, Coordinate[]>;

export interface CardPosition {
  id: string;
  top: number;
  left: number;
  width?: number;
}

export interface RadarHotspotPosition {
  id: number | string;
  top: number;
  left: number;
}

export interface ContainerSettings {
  aspectRatio: number;
  scaleMode: 'stretch' | 'contain' | 'cover';
  paddingY: number;
}

export interface MasterControlTowerLayout {
  cardCoords: Record<string, CardPosition>;
  radarCoords: Record<string, RadarHotspotPosition>;
  polygonCoords: IsometricZoneCoords;
  containerSettings: ContainerSettings;
}

export interface ZoneMetadata {
  id: string; // "zone1", "zone2", ...
  name: string; // "CNC Line A", etc.
  category: 'premachining' | 'postmachining' | 'logistics' | 'quality' | 'shipping';
  color: string; // "#0EA5E9" etc.
  workstations: string; // "VMC1, SF01, UC1" etc.
}

export const ZONE_METADATA: ZoneMetadata[] = [
  { id: 'zone1', name: 'OP-30', category: 'premachining', color: '#0EA5E9', workstations: 'VMC1, SF01, UC1' },
  { id: 'zone2', name: 'OP-40', category: 'premachining', color: '#0EA5E9', workstations: 'OP10, OP20' },
  { id: 'zone3', name: 'Heavy Machining Cell', category: 'premachining', color: '#0EA5E9', workstations: 'OP30, OP40, OP50' },
  { id: 'zone4', name: 'Tube Bending & Slitting Line', category: 'premachining', color: '#0EA5E9', workstations: 'SLGL, SB10' },
  { id: 'zone5', name: 'Brazing & Heat Prep', category: 'premachining', color: '#0EA5E9', workstations: 'BRZ, RSHP' },
  { id: 'zone6', name: 'Laser Welder LW1 Bay', category: 'postmachining', color: '#EC6530', workstations: 'LW1' },
  { id: 'zone7', name: 'LW2 & LW3 Bay', category: 'postmachining', color: '#EC6530', workstations: 'LW2, LW3' },
  { id: 'zone8', name: 'Chemical Cleaning Station', category: 'postmachining', color: '#EC6530', workstations: 'CL1 / CLNC' },
  { id: 'zone9', name: 'Leak Testing & Sub-Assembly', category: 'postmachining', color: '#EC6530', workstations: 'UC2, ALT10' },
  { id: 'zone10', name: 'Final Assembly & End-of-Line', category: 'postmachining', color: '#EC6530', workstations: 'EOL' },
  { id: 'zone11', name: 'Packaging & Bundling', category: 'postmachining', color: '#EC6530', workstations: 'PACK' },
  { id: 'zone12', name: 'Inward Raw Material Yard', category: 'logistics', color: '#10B981', workstations: 'Bottom-left storage' },
  { id: 'zone13', name: 'High-Bay Warehouse Racks', category: 'logistics', color: '#10B981', workstations: 'Warehouse Racks' },
  { id: 'zone14', name: 'Quality Metrology Lab', category: 'quality', color: '#8B5CF6', workstations: 'Quality Lab' },
  { id: 'zone15', name: 'Outbound Shipping Docks', category: 'shipping', color: '#F59E0B', workstations: 'Truck bays' },
];

export const defaultIsometricCoords: IsometricZoneCoords = {
  production: [
    { x: 32.1, y: 22.7 },
    { x: 51.2, y: 41.2 },
    { x: 25.4, y: 65.5 },
    { x: 7.5, y: 44.0 }
  ],
  warehouse: [
    { x: 56.0, y: 6.3 },
    { x: 71.2, y: 22.2 },
    { x: 55.1, y: 38.0 },
    { x: 38.6, y: 22.6 }
  ],
  quality: [
    { x: 18.8, y: 68.6 },
    { x: 35.7, y: 81.9 },
    { x: 22.4, y: 96.1 },
    { x: 5.8, y: 73.7 }
  ],
  process: [
    { x: 54.6, y: 44.9 },
    { x: 72.1, y: 62.5 },
    { x: 50.4, y: 89.6 },
    { x: 31.6, y: 66.3 }
  ],
  shipping: [
    { x: 66.3, y: 33.8 },
    { x: 88.1, y: 52.2 },
    { x: 78.4, y: 64.6 },
    { x: 57.6, y: 42.1 }
  ],
  material: [
    { x: 73.6, y: 63.3 },
    { x: 90.4, y: 78.7 },
    { x: 76.4, y: 98.4 },
    { x: 59.8, y: 80.1 }
  ]
};

export const default15ZoneCoords: IsometricZoneCoords = {
  zone1:  [{ x: 32.5, y: 56.8 }, { x: 53.0, y: 57.1 }, { x: 53.2, y: 78.0 }, { x: 31.6, y: 78.2 }],
  zone2:  [{ x: 53.7, y: 57.5 }, { x: 67.3, y: 57.5 }, { x: 67.5, y: 78.5 }, { x: 54.0, y: 78.3 }],
  zone3:  [{ x: 13.6, y: 57.0 }, { x: 27.6, y: 57.2 }, { x: 26.9, y: 76.9 }, { x: 11.3, y: 77.3 }],
  zone4:  [{ x: 15.9, y: 45.4 }, { x: 45.3, y: 45.7 }, { x: 45.7, y: 56.4 }, { x: 15.9, y: 56.0 }],
  zone5:  [{ x: 15.0, y: 66.2 }, { x: 30.4, y: 66.2 }, { x: 30.3, y: 73.0 }, { x: 15.0, y: 73.0 }],
  zone6:  [{ x: 20.9, y: 73.0 }, { x: 31.3, y: 73.4 }, { x: 30.3, y: 85.0 }, { x: 20.1, y: 85.7 }],
  zone7:  [{ x: 30.4, y: 73.1 }, { x: 42.7, y: 73.6 }, { x: 43.5, y: 85.9 }, { x: 30.4, y: 85.7 }],
  zone8:  [{ x: 29.2, y: 79.3 }, { x: 41.2, y: 79.2 }, { x: 40.6, y: 85.7 }, { x: 27.9, y: 85.3 }],
  zone9:  [{ x: 10.4, y: 85.8 }, { x: 20.7, y: 85.7 }, { x: 20.2, y: 93.0 }, { x: 9.4, y: 93.3 }],
  zone10: [{ x: 75.3, y: 34.0 }, { x: 82.9, y: 34.3 }, { x: 84.2, y: 48.8 }, { x: 75.9, y: 48.8 }],
  zone11: [{ x: 49.9, y: 17.5 }, { x: 71.9, y: 18.1 }, { x: 71.7, y: 32.3 }, { x: 49.8, y: 32.3 }],
  zone12: [{ x: 22.9, y: 18.0 }, { x: 37.5, y: 17.9 }, { x: 36.9, y: 32.1 }, { x: 22.9, y: 32.4 }],
  zone13: [{ x: 38.1, y: 18.2 }, { x: 49.6, y: 17.7 }, { x: 49.6, y: 32.3 }, { x: 37.6, y: 32.3 }],
  zone14: [{ x: 59.4, y: 33.2 }, { x: 75.6, y: 33.4 }, { x: 75.6, y: 46.0 }, { x: 59.4, y: 45.9 }],
  zone15: [{ x: 38.1, y: 17.2 }, { x: 74.9, y: 17.5 }, { x: 75.4, y: 32.3 }, { x: 38.4, y: 32.3 }],
};

export const defaultContainerSettings: ContainerSettings = {
  aspectRatio: 1.6,
  scaleMode: 'stretch',
  paddingY: 16,
};

export const defaultCardCoords: Record<string, CardPosition> = {
  premachiningCard: { id: 'premachiningCard', top: 57.5, left: 67.8, width: 270 },
  postmachiningCard: { id: 'postmachiningCard', top: 37.8, left: 0.9, width: 270 },
  atlasCommandCard: { id: 'atlasCommandCard', top: 2.8, left: 1.7, width: 240 },
};

export const defaultRadarCoords: Record<string, RadarHotspotPosition> = {
  '1': { id: 1, top: 38, left: 26 },
  '2': { id: 2, top: 23, left: 52 },
  '3': { id: 3, top: 80, left: 16 },
  '4': { id: 4, top: 60, left: 50 },
  '5': { id: 5, top: 33, left: 72 },
  '6': { id: 6, top: 75, left: 75 },
};

export const defaultMasterControlTowerLayout: MasterControlTowerLayout = {
  cardCoords: defaultCardCoords,
  radarCoords: defaultRadarCoords,
  polygonCoords: default15ZoneCoords,
  containerSettings: defaultContainerSettings,
};

export interface ThemeGradients {
  availabilityStart: string;
  availabilityEnd: string;
  performanceStart: string;
  performanceEnd: string;
  qualityStart: string;
  qualityEnd: string;
  oeeStart: string;
  oeeEnd: string;
}

export const defaultThemeGradients: ThemeGradients = {
  availabilityStart: '#293681',
  availabilityEnd: '#4274D9',
  performanceStart: '#4274D9',
  performanceEnd: '#95CCDD',
  qualityStart: '#95CCDD',
  qualityEnd: '#D0E7E6',
  oeeStart: '#293681',
  oeeEnd: '#D0E7E6',
};

export interface DeployedThemeConfig {
  isVariantBActive: boolean;
  themeGradients: ThemeGradients;
  hoverSync: boolean;
  ticksAndBreach: boolean;
  sparklines: boolean;
  glassmorphic: boolean;
}

const getInitialThemeConfig = (): DeployedThemeConfig => {
  try {
    const saved = localStorage.getItem('deployed_theme_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          isVariantBActive: typeof parsed.isVariantBActive === 'boolean' ? parsed.isVariantBActive : false,
          themeGradients: parsed.themeGradients || defaultThemeGradients,
          hoverSync: typeof parsed.hoverSync === 'boolean' ? parsed.hoverSync : true,
          ticksAndBreach: typeof parsed.ticksAndBreach === 'boolean' ? parsed.ticksAndBreach : true,
          sparklines: typeof parsed.sparklines === 'boolean' ? parsed.sparklines : true,
          glassmorphic: typeof parsed.glassmorphic === 'boolean' ? parsed.glassmorphic : true,
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse deployed_theme_config from localStorage:', e);
  }
  return {
    isVariantBActive: false,
    themeGradients: defaultThemeGradients,
    hoverSync: true,
    ticksAndBreach: true,
    sparklines: true,
    glassmorphic: true,
  };
};

const getInitialIsometricCoords = (): IsometricZoneCoords => {
  try {
    const saved = localStorage.getItem('calibrated_isometric_coords');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          production: parsed.production || defaultIsometricCoords.production,
          warehouse: parsed.warehouse || defaultIsometricCoords.warehouse,
          quality: parsed.quality || defaultIsometricCoords.quality,
          process: parsed.process || defaultIsometricCoords.process,
          shipping: parsed.shipping || defaultIsometricCoords.shipping,
          material: parsed.material || defaultIsometricCoords.material,
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse calibrated_isometric_coords from localStorage:', e);
  }
  return defaultIsometricCoords;
};

const getInitial15ZoneCoords = (): IsometricZoneCoords => {
  try {
    const saved = localStorage.getItem('calibrated_15_zone_coords');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const coords: IsometricZoneCoords = {};
        ZONE_METADATA.forEach(zone => {
          coords[zone.id] = parsed[zone.id] || default15ZoneCoords[zone.id];
        });
        return coords;
      }
    }
  } catch (e) {
    console.error('Failed to parse calibrated_15_zone_coords from localStorage:', e);
  }
  return default15ZoneCoords;
};

const getInitialMasterControlTowerLayout = (): MasterControlTowerLayout => {
  try {
    const saved = localStorage.getItem('master_control_tower_layout');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          cardCoords: { ...defaultCardCoords, ...(parsed.cardCoords || {}) },
          radarCoords: { ...defaultRadarCoords, ...(parsed.radarCoords || {}) },
          polygonCoords: { ...default15ZoneCoords, ...(parsed.polygonCoords || {}) },
          containerSettings: { ...defaultContainerSettings, ...(parsed.containerSettings || {}) },
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse master_control_tower_layout from localStorage:', e);
  }
  return defaultMasterControlTowerLayout;
};

interface FilterContextType {
  selectedMachine: string | null;
  selectedReason: string | null;
  selectedDefect: string | null;
  selectedShift: string;
  isVariantBActive: boolean;
  themeGradients: ThemeGradients;
  hoverSync: boolean;
  ticksAndBreach: boolean;
  sparklines: boolean;
  glassmorphic: boolean;
  calibratedIsometricCoords: IsometricZoneCoords;
  calibrated15ZoneCoords: IsometricZoneCoords;
  masterControlTowerLayout: MasterControlTowerLayout;
  setSelectedMachine: (machine: string | null) => void;
  setSelectedReason: (reason: string | null) => void;
  setSelectedDefect: (defect: string | null) => void;
  setSelectedShift: (shift: string) => void;
  setIsVariantBActive: (active: boolean) => void;
  setThemeGradients: (gradients: ThemeGradients) => void;
  setHoverSync: (val: boolean) => void;
  setTicksAndBreach: (val: boolean) => void;
  setSparklines: (val: boolean) => void;
  setGlassmorphic: (val: boolean) => void;
  setCalibratedIsometricCoords: (coords: IsometricZoneCoords) => void;
  setCalibrated15ZoneCoords: (coords: IsometricZoneCoords) => void;
  setMasterControlTowerLayout: (layout: MasterControlTowerLayout) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const initialConfig = getInitialThemeConfig();

  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [selectedDefect, setSelectedDefect] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<string>('All Shifts');
  const [isVariantBActive, setIsVariantBActive] = useState<boolean>(initialConfig.isVariantBActive);
  const [themeGradients, setThemeGradients] = useState<ThemeGradients>(initialConfig.themeGradients);
  const [hoverSync, setHoverSync] = useState<boolean>(initialConfig.hoverSync);
  const [ticksAndBreach, setTicksAndBreach] = useState<boolean>(initialConfig.ticksAndBreach);
  const [sparklines, setSparklines] = useState<boolean>(initialConfig.sparklines);
  const [glassmorphic, setGlassmorphic] = useState<boolean>(initialConfig.glassmorphic);
  const [calibratedIsometricCoords, setCalibratedIsometricCoordsState] = useState<IsometricZoneCoords>(getInitialIsometricCoords());
  const [calibrated15ZoneCoords, setCalibrated15ZoneCoordsState] = useState<IsometricZoneCoords>(getInitial15ZoneCoords());
  const [masterControlTowerLayout, setMasterControlTowerLayoutState] = useState<MasterControlTowerLayout>(getInitialMasterControlTowerLayout());

  const setCalibratedIsometricCoords = (coords: IsometricZoneCoords) => {
    setCalibratedIsometricCoordsState(coords);
    localStorage.setItem('calibrated_isometric_coords', JSON.stringify(coords));
  };

  const setCalibrated15ZoneCoords = (coords: IsometricZoneCoords) => {
    setCalibrated15ZoneCoordsState(coords);
    localStorage.setItem('calibrated_15_zone_coords', JSON.stringify(coords));
    // Keep synced inside master control tower layout as well
    setMasterControlTowerLayoutState(prev => {
      const updated = { ...prev, polygonCoords: coords };
      localStorage.setItem('master_control_tower_layout', JSON.stringify(updated));
      return updated;
    });
  };

  const setMasterControlTowerLayout = (layout: MasterControlTowerLayout) => {
    setMasterControlTowerLayoutState(layout);
    localStorage.setItem('master_control_tower_layout', JSON.stringify(layout));
    if (layout.polygonCoords) {
      setCalibrated15ZoneCoordsState(layout.polygonCoords);
      localStorage.setItem('calibrated_15_zone_coords', JSON.stringify(layout.polygonCoords));
    }
  };

  const clearFilters = () => {
    setSelectedMachine(null);
    setSelectedReason(null);
    setSelectedDefect(null);
  };

  return (
    <FilterContext.Provider
      value={{
        selectedMachine,
        selectedReason,
        selectedDefect,
        selectedShift,
        isVariantBActive,
        themeGradients,
        hoverSync,
        ticksAndBreach,
        sparklines,
        glassmorphic,
        calibratedIsometricCoords,
        calibrated15ZoneCoords,
        masterControlTowerLayout,
        setSelectedMachine,
        setSelectedReason,
        setSelectedDefect,
        setSelectedShift,
        setIsVariantBActive,
        setThemeGradients,
        setHoverSync,
        setTicksAndBreach,
        setSparklines,
        setGlassmorphic,
        setCalibratedIsometricCoords,
        setCalibrated15ZoneCoords,
        setMasterControlTowerLayout,
        clearFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};