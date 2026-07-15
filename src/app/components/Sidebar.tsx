import { FileText, BarChart3, Shield, Package, Wrench, ChevronsLeft, ChevronsRight, LayoutDashboard, AlertTriangle, Boxes, Truck, GitBranch } from 'lucide-react';
import { cn } from './ui/utils';
import atlasLogo from '../../assets/image-1.png';

export type PageId = 'overview' | 'summary' | 'production' | 'quality' | 'copq' | 'bpr' | 'otif' | 'inventory' | 'traceability' | 'maintenance';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const navItems: { page: PageId; icon: React.ElementType; label: string }[] = [
  { page: 'overview',    icon: LayoutDashboard, label: 'Overview' },
  { page: 'summary',     icon: FileText,  label: 'Summary' },
  // { page: 'production',  icon: BarChart3, label: 'Production' },
  // { page: 'quality',     icon: Shield,    label: 'Quality' },
  { page: 'copq',        icon: AlertTriangle, label: 'COPQ' },
  { page: 'bpr',         icon: Boxes,     label: 'BPR' },
  { page: 'otif',        icon: Truck,     label: 'OTIF' },
  { page: 'inventory',     icon: Package,    label: 'Inventory' },
  { page: 'traceability',  icon: GitBranch,  label: 'Traceability' },
  // { page: 'maintenance', icon: Wrench,    label: 'Maintenance Console' },
];


export function Sidebar({ currentPage, onNavigate, isOpen, toggleSidebar }: SidebarProps) {
  return (
    <aside className={cn(
      'bg-white border-r border-slate-100 h-screen fixed top-0 left-0 shadow-xl shadow-slate-200/30 transition-all duration-300 flex flex-col z-30',
      isOpen ? 'w-64' : 'w-20'
    )}>
      <div className="p-5 flex-1 overflow-y-auto">
        {/* Brand */}
        <div className={cn('mb-8', isOpen ? 'px-1' : 'flex justify-center')}>
          {isOpen ? (
            <div className="flex items-center gap-3">
              <img src={atlasLogo} alt="ATLAS" className="w-12 h-12 object-contain shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-slate-900 leading-tight">Manufacturing</p>
                <p className="text-[11px] font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">Control Tower</p>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">Powered by Atlas Platform</p>
              </div>
            </div>
          ) : (
            <img src={atlasLogo} alt="ATLAS" className="w-10 h-10 object-contain" />
          )}
        </div>

        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                title={isOpen ? '' : item.label}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all text-left group',
                  !isOpen && 'justify-center',
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-400/25'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon
                  className={cn('shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-white' : 'text-slate-400')}
                  style={{ width: '1.05rem', height: '1.05rem' }}
                />
                {isOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center py-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all"
        >
          {isOpen ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
