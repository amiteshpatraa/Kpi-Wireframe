import { X } from 'lucide-react';
import { FilterState } from './TimeTrendFilter';

interface CardFilterChipsProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function CardFilterChips({ filters, onChange }: CardFilterChipsProps) {
  const activeFilters: {key: string; label: string}[] = [];
  
  if (filters.shift !== 'All Shifts') activeFilters.push({ key: 'shift', label: `Shift: ${filters.shift}` });
  if (filters.line !== 'All Lines') activeFilters.push({ key: 'line', label: `Line: ${filters.line}` });
  if (filters.plant !== 'All Plants' && filters.plant !== 'Tata Toyo Radiator (Chakan)') activeFilters.push({ key: 'plant', label: `Plant: ${filters.plant}` });
  if (filters.product !== 'All Products' && filters.product !== 'Coldplate') activeFilters.push({ key: 'product', label: `Product: ${filters.product}` });
  if (filters.process && filters.process !== 'All Processes') activeFilters.push({ key: 'process', label: `Scope: ${filters.process}` });
  if (filters.machine && filters.machine !== 'All Machines') activeFilters.push({ key: 'machine', label: `Asset: ${filters.machine}` });

  if (activeFilters.length === 0) return null;

  const removeFilter = (key: string) => {
    let defaultValue = 'All';
    if (key === 'shift') defaultValue = 'All Shifts';
    if (key === 'line') defaultValue = 'All Lines';
    if (key === 'plant') defaultValue = 'Tata Toyo Radiator (Chakan)';
    if (key === 'product') defaultValue = 'Coldplate';
    if (key === 'process') defaultValue = 'All Processes';
    if (key === 'machine') defaultValue = 'All Machines';
    
    onChange({ ...filters, [key]: defaultValue });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {activeFilters.map(f => (
        <div key={f.key} className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-md text-[10px] font-bold">
          {f.label}
          <button 
            onClick={() => removeFilter(f.key)} 
            className="hover:bg-blue-200 text-blue-500 hover:text-blue-700 rounded-full p-0.5 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
