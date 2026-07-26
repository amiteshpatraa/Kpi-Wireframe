import { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronsLeft, ChevronsRight, Calendar, Filter, Layers, Activity } from 'lucide-react';
import { cn } from './ui/utils';
import { FilterState, TimeTrend } from './TimeTrendFilter';

interface SidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

/* ─── Static Dropdown Option Lists ─── */
const productOptions = ['All','Matrix', 'Banana', 'Kiwi'];

const plantOptions = [
  { group: 'Mother Plant', values: ['Tata Toyo Radiator Ltd. (Chakan)'] },
  { group: 'Satellite Plants', values: ['TTR Jamshedpur', 'TTR Lucknow', 'TTR Sri City', 'TTR Sanand', 'TTR Pantnagar', 'TTR Hosur'] },
  { group: 'Warehouses', values: ['TTR Pithampur', 'TTR United Kingdom'] }
];

const processOptions = ['All',
    'UC1', 'SF01', 'LW1', 'CL1', 'LW2', 'LW3', 'BRZ', 'SHBL', 
  'RSHP', 'ALT10', 'VMC1', 'SLGL', 'VMC2', 'UC2', 'EOL','PACK',
];

const subOptionsMap = {
  ytd: [
    { value: 'ytd', label: 'Year to Date' }
  ],
  qtd: [
    { value: 'qtd', label: 'Quarter to Date' },
    { value: 'qoq', label: 'Quarter on Quarter (QoQ)' }
  ],
  mtd: [
    { value: 'mtd', label: 'Month to Date' },
    { value: 'mom', label: 'Month on Month (MoM)' }
  ],
  wtd: [
    { value: 'wtd', label: 'Week to Date' },
    { value: 'wow', label: 'Week on Week (WoW)' }
  ]
} as const;

export function FixedLeftFilterSidebar({ filters, onChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // checkbox states
  const [localCheckboxes, setLocalCheckboxes] = useState({
    bu: true,
    plant: filters.plant !== 'All Plants',
    product: filters.product !== 'All Products',
    process: filters.process !== 'All Processes',
  });

  const [opSections, setOpSections] = useState({
    premachining: filters.opSections?.premachining !== false,
   
    postMachining: filters.opSections?.postMachining !== false,
  });

  // Single select values for the conditional dropdowns
  const [selectedProduct, setSelectedProduct] = useState(filters.product !== 'All Products' && filters.product ? filters.product : 'Matrix');
  const [selectedPlant, setSelectedPlant] = useState(filters.plant !== 'All Plants' && filters.plant ? filters.plant : 'Tata Toyo Radiator Ltd. (Chakan)');
  const [selectedProcess, setSelectedProcess] = useState(filters.process !== 'All Processes' && filters.process ? filters.process : 'UC1');

  const toggleFilter = (key: keyof typeof localCheckboxes) => {
    const updated = !localCheckboxes[key];
    setLocalCheckboxes(f => ({ ...f, [key]: updated }));

    const resetValues = {
      bu: 'All BUs',
      plant: 'All Plants',
      product: 'All Products',
      process: 'All Processes',
    };
    const activeValues = {
      bu: 'All BUs',
      plant: selectedPlant,
      product: selectedProduct,
      process: selectedProcess,
    };

    onChange({
      ...filters,
      [key]: updated ? activeValues[key] : resetValues[key]
    });
  };

  const currentPeriod =
    filters.trend === 'year' ? 'ytd' :
      filters.trend === 'month' ? 'mtd' :
        filters.trend === 'week' ? 'wtd' :
          filters.trend === 'quarter' ? 'qtd' : 'custom';

  const handlePeriodChange = (val: 'ytd' | 'mtd' | 'wtd' | 'qtd' | 'custom') => {
    const trendMap: Record<string, TimeTrend> = {
      ytd: 'year',
      mtd: 'month',
      wtd: 'week',
      qtd: 'quarter',
      custom: 'custom'
    };
    const defaultSubMap: Record<string, any> = {
      ytd: 'ytd',
      mtd: 'mtd',
      wtd: 'wtd',
      qtd: 'qtd',
      custom: null
    };
    onChange({
      ...filters,
      trend: trendMap[val],
      subPeriod: defaultSubMap[val],
      sidebarPeriodSelected: true
    });
  };

  return (
    <div className="relative flex shrink-0 z-30 h-full max-h-full">

      {/* 0. Collapsed Utility Strip */}
      <div 
        onClick={() => setIsCollapsed(false)}
        className={cn(
          'flex flex-col items-center justify-between h-full py-5 cursor-pointer transition-all duration-200 ease-in-out hover:bg-slate-50/80',
          isCollapsed ? 'w-12 opacity-100 border-r' : 'w-0 opacity-0 overflow-hidden border-r-0'
        )}
        style={{ background: isCollapsed ? 'rgba(255,255,255,0.88)' : undefined, backdropFilter: isCollapsed ? 'blur(16px)' : undefined, WebkitBackdropFilter: isCollapsed ? 'blur(16px)' : undefined, borderRight: isCollapsed ? '1px solid rgba(203,213,225,0.6)' : undefined, boxShadow: isCollapsed ? '2px 0 16px rgba(15,23,42,0.04)' : undefined }}
      >
        <div className="flex flex-col items-center gap-8 min-w-[48px]">
          <Activity className="w-5 h-5 text-blue-600 shrink-0" strokeWidth={2.5} />
          <div className="flex flex-col items-center gap-6 shrink-0">
            <Calendar className="w-4 h-4 text-slate-400" />
            <Filter className="w-4 h-4 text-slate-400" />
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div className="min-w-[48px] flex justify-center shrink-0">
          <ChevronsRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* 1. Collapsible Sidebar Body Panel */}
      <div
        className={cn(
          'border-r flex flex-col h-full transition-all duration-200 ease-in-out',
          isCollapsed ? 'w-0 overflow-hidden opacity-0 border-r-0' : 'w-72 opacity-100'
        )}
        style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRight: '1px solid rgba(203,213,225,0.55)', boxShadow: '4px 0 28px rgba(15,23,42,0.04)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 whitespace-nowrap min-w-[288px]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-slate-900">Filters & Period</span>
          </div>
          <button onClick={() => setIsCollapsed(true)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700">
            <ChevronsLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Filters Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7 min-w-[288px]">
          
          {/* Period Selectors */}
          <section>
            <h3 className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-[0.08em] mb-3">Period</h3>
            <div className="space-y-2">
              {([['ytd', 'YTD — Year to Date'], ['mtd', 'MTD — Month to Date'], ['wtd', 'WTD — Week to Date'], ['qtd', 'QTD — Quarter to Date'], ['custom', 'Custom Range']] as const).map(([val, label]) => {
                const isActive = !!filters.sidebarPeriodSelected && (currentPeriod === val);
                const subOptions = val !== 'custom' ? subOptionsMap[val] : null;

                return (
                  <div key={val} className="flex flex-col">
                    {/* Primary Option Row */}
                    <div
                      onClick={() => handlePeriodChange(val)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all',
                        isActive
                          ? 'bg-blue-500/5 border-[#E2E8F0]'
                          : 'bg-transparent border-[#E2E8F0] hover:border-slate-300'
                      )}
                    >
                      <input
                        type="radio"
                        name="period"
                        value={val}
                        checked={isActive}
                        readOnly
                        className="accent-blue-500 cursor-pointer"
                      />
                      <span className={cn("text-[11px] font-medium", isActive ? "text-blue-700 font-bold" : "text-[#334155]")}>{label}</span>
                    </div>

                    {/* Expandable Sub-Options Accordion */}
                    {subOptions && (
                      <div
                        className={cn(
                          'grid transition-all duration-200 ease-in-out',
                          isActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="pl-7 pr-1 pt-2 pb-1">
                            <div className="flex bg-[#F1F5F9] p-0.5 rounded-lg w-full">
                              {subOptions.map((subOpt) => {
                                const isSubActive = filters.subPeriod === subOpt.value;
                                return (
                                  <button
                                    key={subOpt.value}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onChange({ ...filters, subPeriod: subOpt.value, sidebarPeriodSelected: true });
                                    }}
                                    className={cn(
                                      'flex-1 text-[10px] font-bold py-1.5 px-2 rounded-md transition-all duration-200 text-center',
                                      isSubActive
                                        ? 'bg-white text-blue-600 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02)]'
                                        : 'text-[#475569] hover:text-slate-900 bg-transparent'
                                    )}
                                  >
                                    {subOpt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Local Checkboxes with Linked Conditional Dropdowns */}
          <section>
            <h3 className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-[0.08em] mb-3">Filters</h3>
            <div className="space-y-2">
              {(Object.keys(localCheckboxes) as (keyof typeof localCheckboxes)[]).map(key => {
                const labels: Record<keyof typeof localCheckboxes, string> = {
                  bu: 'BU (Business Unit)',
                  plant: 'Plant',
                  product: 'Product',
                  process: 'Process',
                };
                const checked = localCheckboxes[key];
                
                return (
                  <div key={key} className="flex flex-col gap-1.5">
                    {/* Checkbox Container */}
                    <label className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all',
                      checked
                        ? 'bg-emerald-500/5 border-[#E2E8F0]'
                        : 'bg-transparent border-[#E2E8F0] hover:border-slate-300'
                    )}>
                      <input
                        type="checkbox" checked={checked}
                        onChange={() => toggleFilter(key)}
                        className="accent-emerald-500 w-3.5 h-3.5"
                      />
                      <span className={cn("text-[11px] font-medium", checked ? "text-emerald-700 font-bold" : "text-[#334155]")}>{labels[key]}</span>
                    </label>

                    {/* Conditional Nested Single-Select Dropdowns */}
                    {checked && key === 'product' && (
                      <div className="relative pl-6 animate-fade-in">
                        <select
                          value={selectedProduct}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedProduct(val);
                            onChange({ ...filters, product: val });
                          }}
                          className="w-full appearance-none pl-3 pr-8 py-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold cursor-pointer hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          {productOptions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    )}

                    {checked && key === 'plant' && (
                      <div className="relative pl-6 animate-fade-in">
                        <select
                          value={selectedPlant}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedPlant(val);
                            onChange({ ...filters, plant: val });
                          }}
                          className="w-full appearance-none pl-3 pr-8 py-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold cursor-pointer hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          {plantOptions.map(g => (
                            <optgroup key={g.group} label={g.group} className="font-bold text-slate-500 bg-white">
                              {g.values.map(p => <option key={p} value={p} className="font-semibold text-slate-700">{p}</option>)}
                            </optgroup>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    )}

                    {checked && key === 'process' && (
                      <div className="relative pl-6 animate-fade-in">
                        <select
                          value={selectedProcess}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedProcess(val);
                            onChange({ ...filters, process: val });
                          }}
                          className="w-full appearance-none pl-3 pr-8 py-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold cursor-pointer hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          {processOptions.map(pr => <option key={pr} value={pr}>{pr}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Sections ── */}
          <section>
            <h3 className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-[0.08em] mb-3">Sections</h3>
            <div className="space-y-2">
              {(Object.keys(opSections) as (keyof typeof opSections)[]).map(key => {
                const labels: Record<keyof typeof opSections, string> = {
                  premachining: 'Premachining',
                  
                  postMachining: 'Postmachining',
                };
                const checked = opSections[key];
                return (
                  <label key={key} className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all',
                    checked
                      ? 'bg-blue-500/5 border-[#E2E8F0]'
                      : 'bg-transparent border-[#E2E8F0] hover:border-slate-300'
                  )}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const updated = { ...opSections, [key]: !checked };
                        setOpSections(updated);
                        onChange({
                          ...filters,
                          opSections: updated
                        });
                      }}
                      className="accent-blue-500 w-3.5 h-3.5"
                    />
                    <span className={cn("text-[11px] font-medium", checked ? "text-blue-700 font-bold" : "text-[#334155]")}>{labels[key]}</span>
                  </label>
                );
              })}
            </div>
          </section>

        </div>
      </div>

    </div>
  );
}
