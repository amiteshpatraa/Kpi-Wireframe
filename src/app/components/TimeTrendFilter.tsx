import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Calendar, Pencil } from 'lucide-react';
import { cn } from './ui/utils';

export type TimeTrend = 'year' | 'quarter' | 'month' | 'week' | 'custom';

export interface FilterState {
  trend: TimeTrend;
  subPeriod?: 'ytd' | 'yoy' | 'qtd' | 'qoq' | 'mtd' | 'mom' | 'wtd' | 'wow' | null;
  shift: string;
  line: string;
  product: string;
  plant: string;
  process: string;
  machine: string;
  selectedDate: Date;
  opSections: {
    premachining: boolean;
    machining: boolean;
    postMachining: boolean;
  };
  sidebarPeriodSelected?: boolean;
}

interface TimeTrendFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  className?: string;
}

const trendOptions: { value: TimeTrend; label: string }[] = [
  { value: 'year',    label: 'Year' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'month',   label: 'Month' },
  { value: 'week',    label: 'Week' },
  { value: 'custom',  label: 'Custom' },
];

const shifts = ['All Shifts', 'Shift A', 'Shift B', 'Shift C'];
const lines  = ['All Lines', 'Line 01', 'Line 02', 'Line 03'];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

/* ── Inline Custom Select Dropdown ── */
function FilterSelect({ value, options, onChange, label }: {
  value: string; options: string[]; onChange: (v: string) => void; label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="appearance-none pl-2.5 pr-6 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

/* ── Main Consolidated Filter Bar Component ── */
export function TimeTrendFilter({ filters, onChange, className }: TimeTrendFilterProps) {
  const [calOpen, setCalOpen] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formattedDate = filters.selectedDate.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className={cn(
      'bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-center gap-4 shadow-sm relative z-40',
      className
    )}>
      {/* 1. Timeframe Segmented Control */}
      <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1 shrink-0">
        {trendOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => {
              const defaultSubMap: Record<string, any> = {
                year: 'ytd',
                quarter: 'qtd',
                month: 'mtd',
                week: 'wtd',
                custom: null
              };
              onChange({
                ...filters,
                trend: opt.value,
                subPeriod: defaultSubMap[opt.value],
                sidebarPeriodSelected: true
              });
            }}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-bold transition-all duration-150 whitespace-nowrap',
              filters.trend === opt.value
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 2. Custom Calendar Date Picker */}
      <div className="relative shrink-0" ref={calRef}>
        <button
          onClick={() => setCalOpen(v => !v)}
          className={cn(
            'flex items-center gap-2 px-5 py-2 text-sm border border-slate-200 rounded-full font-bold shadow-sm transition-all bg-white hover:border-blue-400 focus:outline-none whitespace-nowrap',
            calOpen && 'border-blue-400 text-blue-700 ring-2 ring-blue-50'
          )}
        >
          <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="text-slate-800 font-bold">{formattedDate}</span>
          <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform duration-200', calOpen && 'rotate-180')} />
        </button>

        {calOpen && (
          <CalendarPopover
            selected={filters.selectedDate}
            onSelect={d => onChange({ ...filters, selectedDate: d, trend: 'custom', sidebarPeriodSelected: true })}
            onClose={() => setCalOpen(false)}
          />
        )}
      </div>

      <div className="h-5 w-px bg-slate-200 shrink-0" />

      {/* 3. Consolidated Dropdown Filters */}
      <FilterSelect label="Shift" value={filters.shift} options={shifts} onChange={v => onChange({ ...filters, shift: v })} />
      <FilterSelect label="Line" value={filters.line} options={lines} onChange={v => onChange({ ...filters, line: v })} />
    </div>
  );
}

/* ── Calendar popover logic ── */
function buildGridDays(year: number, month: number): Date[] {
  const start = new Date(year, month, 1);
  let startDay = start.getDay();
  let offset = startDay - 1;
  if (offset < 0) offset = 6;
  start.setDate(start.getDate() - offset);
  
  const dates: Date[] = [];
  for (let i = 0; i < 42; i++) {
    dates.push(new Date(start));
    start.setDate(start.getDate() + 1);
  }
  return dates;
}

function CalendarPopover({ selected, onSelect, onClose }: {
  selected: Date; onSelect: (d: Date) => void; onClose: () => void;
}) {
  const [viewDate, setViewDate] = useState(new Date(selected));
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const days = buildGridDays(year, month);

  const handlePrev = () => {
    if (viewMode === 'days') {
      setViewDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'months') {
      setViewDate(new Date(year - 1, month, 1));
    } else {
      setViewDate(new Date(year - 10, month, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'days') {
      setViewDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'months') {
      setViewDate(new Date(year + 1, month, 1));
    } else {
      setViewDate(new Date(year + 10, month, 1));
    }
  };

  const selectMonth = (mIdx: number) => {
    setViewDate(new Date(year, mIdx, 1));
    setViewMode('days');
  };

  const selectYear = (yVal: number) => {
    setViewDate(new Date(yVal, month, 1));
    setViewMode('months');
  };

  return (
    <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl p-4 w-72 shadow-[0_10px_40px_rgba(0,0,0,0.06)] animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
        <button
          onClick={handlePrev}
          className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => viewMode !== 'days' && setViewMode('months')}
            className="text-xs font-bold text-slate-700 hover:bg-slate-50 px-2 py-1 rounded-lg uppercase tracking-wider"
          >
            {MONTHS[month].slice(0, 3)}
          </button>
          <button
            onClick={() => setViewMode('years')}
            className="text-xs font-bold text-slate-700 hover:bg-slate-50 px-2 py-1 rounded-lg"
          >
            {year}
          </button>
        </div>

        <button
          onClick={handleNext}
          className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="min-h-[195px] flex flex-col justify-between">
        {viewMode === 'days' && (
          <>
            <div className="grid grid-cols-7 text-center mb-1">
              {WEEKDAYS.map(w => (
                <span key={w} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-0.5">
                  {w.slice(0, 1)}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {days.map((d, i) => {
                const isSelected = d.toDateString() === selected.toDateString();
                const isCurrentMonth = d.getMonth() === month;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      onSelect(d);
                      onClose();
                    }}
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer",
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-400/30"
                        : isCurrentMonth
                          ? "text-slate-700 hover:bg-slate-100"
                          : "text-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {viewMode === 'months' && (
          <div className="grid grid-cols-3 gap-2 py-2">
            {MONTHS.map((m, idx) => {
              const isSelected = idx === month;
              return (
                <button
                  key={m}
                  onClick={() => selectMonth(idx)}
                  className={cn(
                    "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                    isSelected
                      ? "bg-blue-600 text-white shadow-md shadow-blue-400/30"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-800"
                  )}
                >
                  {m.slice(0, 3)}
                </button>
              );
            })}
          </div>
        )}

        {viewMode === 'years' && (
          <>
            <div className="grid grid-cols-3 gap-2 py-2">
              {Array.from({ length: 9 }, (_, idx) => year - 4 + idx).map(yVal => {
                const isSelected = yVal === year;
                return (
                  <button
                    key={yVal}
                    onClick={() => selectYear(yVal)}
                    className={cn(
                      "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-400/30"
                        : "bg-slate-50 text-slate-755 hover:bg-slate-100 hover:text-slate-800"
                    )}
                  >
                    {yVal}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-5 mt-3">
              <button
                onClick={() => setViewMode('days')}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer px-1 py-1"
              >
                Back to Days
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function useDefaultFilters(): FilterState {
  return {
    trend: 'month',
    subPeriod: 'mtd',
    shift: 'All Shifts',
    line: 'All Lines',
    product: 'Matrix',
    plant: 'Tata Toyo Radiator (Chakan)',
    process: 'SLGL',
    machine: 'All Machines',
    selectedDate: new Date(),
    opSections: {
      premachining: true,
      machining: true,
      postMachining: true,
    },
    sidebarPeriodSelected: false
  };
}
