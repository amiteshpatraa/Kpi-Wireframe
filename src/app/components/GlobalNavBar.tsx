import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, User, Home, Cpu, Layers, AlertTriangle, Boxes, Truck, GitBranch, FlaskConical } from 'lucide-react';
import atlasLogo from '../../assets/image-1.png';
import type { PageId } from './Sidebar';

type NavTarget = PageId | 'executive';

const plants = [
  'Tata Toyo Radiator (Chakan)',
  'TTR Jamshedpur',
  'TTR Sri City',
  'TTR Sanand',
  'TTR Pithampur',
];

const navOptions = [
  { id: 'executive', label: 'Home/Executive Gateway', icon: Home, desc: 'Enterprise overview & live radar' },
  { id: 'overview', label: 'OEE Performance Index', icon: Cpu, desc: 'Availability, performance & quality' },
  { id: 'inventory', label: 'Inventory Pipeline', icon: Layers, desc: 'WIP, flow velocity & supply runway' },
  { id: 'bpr', label: 'Raw Material / BPR', icon: Boxes, desc: 'BPR execution & safe stock buffer' },
  { id: 'copq', label: 'COPQ', icon: AlertTriangle, desc: 'Cost of Poor Quality & defects caught' },
  { id: 'otif', label: 'OTIF Delivery', icon: Truck, desc: 'Shipment success & schedule adherence' },
  { id: 'traceability', label: 'Traceability', icon: GitBranch, desc: 'Genealogy tracking & digital thread' },
] as const;

interface GlobalNavBarProps {
  filters?: any;
  onChange?: (filters: any) => void;
  currentPage: PageId;
  onNavigate: (target: NavTarget) => void;
}

export function GlobalNavBar({ filters, onChange, currentPage, onNavigate }: GlobalNavBarProps) {
  const [now, setNow] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const activeOption = navOptions.find(opt => opt.id === currentPage) || navOptions.find(opt => opt.id === 'overview');
  const ActiveIcon = activeOption?.icon;

  return (
    <nav className="px-8 py-3 flex items-center justify-between z-50 sticky top-0" style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(203,213,225,0.55)', boxShadow: '0 1px 20px rgba(15,23,42,0.07), 0 0 0 0 transparent' }}>
      {/* Left: Brand & Dropdown Navigation */}
      <div className="flex items-center">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <img src={atlasLogo} alt="ATLAS" className="w-8 h-8 object-contain shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-widest text-slate-900 leading-tight">ATLAS</span>
            <span className="text-[8px] font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-none uppercase tracking-wider">Control Tower</span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-8 w-px bg-slate-200/80 mx-4" />

        {/* Dropdown Navigation */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(prev => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-sm group"
          >
            {ActiveIcon && <ActiveIcon className="w-3.5 h-3.5 text-slate-500" />}
            <span>{activeOption?.label || 'Select Page'}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-slate-600' : ''}`} />
          </button>

          {/* Dropdown Options */}
          {isOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Workspace Navigation</span>
              </div>
              <div className="max-h-[380px] overflow-y-auto py-1">
                {navOptions.map(option => {
                  const IconComponent = option.icon;
                  const isCurrent = currentPage === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        onNavigate(option.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-start gap-3 px-3.5 py-2.5 text-left transition-all hover:bg-slate-50 border-l-2 ${isCurrent
                        ? 'bg-blue-50/30 border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 mt-0.5 shrink-0 ${isCurrent ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold leading-tight">{option.label}</span>
                        <span className={`text-[10px] leading-tight mt-0.5 ${isCurrent ? 'text-blue-500/80 font-medium' : 'text-slate-400 font-normal'}`}>{option.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Group: Plant Filter + Time/User */}
      <div className="flex items-center gap-6">
        {/* Plant Filter */}
        {filters && onChange && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Select Plant</span>
            <div className="relative">
              <select
                value={filters.plant}
                onChange={e => onChange({ ...filters, plant: e.target.value })}
                className="appearance-none pl-2.5 pr-6 py-1.5 text-xs border rounded-lg text-slate-700 font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                style={{ background: 'rgba(248,250,252,0.9)', border: '1px solid rgba(203,213,225,0.7)', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}
              >
                {plants.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Time + User */}
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900 tabular-nums">{timeStr}</p>
            <p className="text-xs text-slate-500">{dateStr}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </nav>
  );
}
