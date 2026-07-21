import { cn } from './ui/utils';
import type { ReactNode } from 'react';

interface KpiCardProps {
  icon: ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  value: string;
  valueLabel: string;
  delta: string;
  deltaPositive: boolean;
  /** sparkData / sparkColor kept for API compatibility but no longer rendered */
  sparkData?: any;
  sparkColor?: string;
  className?: string;
  children?: ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
}

export function KpiCard({
  icon, iconBg, title, subtitle,
  value, valueLabel,
  delta, deltaPositive,
  className, children, expanded, onToggle,
}: KpiCardProps) {
  const isClickable = !!onToggle;

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden flex flex-col',
        'shadow-[0_8px_30px_rgba(0,0,0,0.04)]',
        'transition-all duration-200',
        isClickable && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)] hover:border-blue-200',
        className
      )}
      onClick={isClickable ? onToggle : undefined}
    >
      <div className={className?.includes('p-0') ? 'p-0' : 'p-6'}>
        {/* Top row: icon + title block + optional expand toggle */}
        <div className="flex items-start gap-3 mb-4">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            iconBg
          )}>
            {icon}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-sm font-bold text-slate-900 leading-snug truncate">{title}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{subtitle}</p>
          </div>
          {isClickable && (
            <div className={cn(
              'w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] shrink-0 mt-0.5 transition-transform duration-300',
              expanded && 'rotate-180'
            )}>▾</div>
          )}
        </div>

        {/* Metric value */}
        <div className="mt-1">
          <p className="text-[2rem] font-black text-slate-900 leading-none tracking-tight">{value}</p>
          <p className="text-[11px] text-slate-500 mt-1.5 font-medium">{valueLabel}</p>
        </div>

        {/* Status badge */}
        <div className="mt-3">
          <span className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap',
            deltaPositive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-600 border-red-200'
          )}>
            <span className={cn(
              'w-1.5 h-1.5 rounded-full inline-block',
              deltaPositive ? 'bg-emerald-500' : 'bg-red-500'
            )} />
            {delta}
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && children && (
        <div
          className="border-t border-slate-100 px-6 pb-6 pt-4 bg-slate-50/40"
          onClick={e => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** Legacy compat — no-op sparkline data generator */
export function makeSpark(base: number, length = 14, variance = 0.08): any[] {
  let v = base;
  return Array.from({ length }, (_, i) => {
    v = v + (Math.random() - 0.5) * base * variance;
    return { i, v: Math.max(0, v) };
  });
}

export function sparkFromProfile(_profile: string): any[] { return []; }
