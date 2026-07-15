import { createContext, useContext, useState, ReactNode } from 'react';

export interface Coordinate {
  x: number;
  y: number;
}

export type IsometricZoneCoords = Record<string, Coordinate[]>;

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

  const setCalibratedIsometricCoords = (coords: IsometricZoneCoords) => {
    setCalibratedIsometricCoordsState(coords);
    localStorage.setItem('calibrated_isometric_coords', JSON.stringify(coords));
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