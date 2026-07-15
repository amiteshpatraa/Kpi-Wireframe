import { Pin, PinOff, RefreshCw } from 'lucide-react';
import { type FilterState } from './TimeTrendFilter';
import { FilterTagPills } from './FilterTagPills';
import { areFiltersDifferent } from './useCardFilterLock';

interface CardLockHeaderProps {
  /** Slug label above the title (e.g., "Pillar 1") */
  eyebrow?: string;
  /** Main card title */
  title: string;
  /** Large metric shown top-right */
  metric?: React.ReactNode;
  /** Whether this card is currently locked */
  isLocked: boolean;
  /** The filters the card is currently rendering with */
  effectiveFilters: FilterState;
  /** The current global filter state */
  globalFilters: FilterState;
  /** Toggle lock/unlock */
  onToggleLock: () => void;
  /** Called when user clicks "Sync" — should clear the lock */
  onSync: () => void;
}

/**
 * CardLockHeader — standardized top section for every summary quadrant card.
 *
 * Renders:
 *  - Eyebrow label (optional)
 *  - Title
 *  - Active filter tag pills
 *  - Pin / lock icon button (top-right)
 *  - Sync CTA when card is locked and differs from global filters
 */
export function CardLockHeader({
  eyebrow,
  title,
  metric,
  isLocked,
  effectiveFilters,
  globalFilters,
  onToggleLock,
  onSync,
}: CardLockHeaderProps) {
  const showSyncCta =
    isLocked && areFiltersDifferent(effectiveFilters, globalFilters);

  return (
    <div className="shrink-0">
      {/* ── Top Row ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-grow min-w-0">
          {eyebrow && (
            <span className="text-[9px] font-black uppercase tracking-wider block text-slate-400 leading-none mb-0.5">
              {eyebrow}
            </span>
          )}
          <h3 className="text-slate-800 text-sm font-black uppercase leading-tight truncate">
            {title}
          </h3>
        </div>

        {/* ── Right side: metric + pin button ── */}
        <div className="flex items-center gap-2 shrink-0">
          {metric && <div className="text-right">{metric}</div>}

          {/* Pin / lock icon */}
          <button
            onClick={e => { e.stopPropagation(); onToggleLock(); }}
            title={isLocked ? 'Click to unlock and sync with global filters' : 'Click to lock this card\'s filter state'}
            style={{
              padding: '4px',
              borderRadius: '8px',
              border: isLocked
                ? '1px solid rgba(245,158,11,0.4)'
                : '1px solid rgba(226,232,240,0.8)',
              background: isLocked ? 'rgba(245,158,11,0.06)' : '#F8FAFC',
              color: isLocked ? '#D97706' : '#94A3B8',
              transition: 'all 0.15s ease',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isLocked ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* ── Filter Tag Pills ─────────────────────────────────────── */}
      <FilterTagPills filters={effectiveFilters} showBaseline />

      {/* ── Sync CTA (only when locked + differs) ─────────────────── */}
      {showSyncCta && (
        <button
          onClick={e => { e.stopPropagation(); onSync(); }}
          style={{
            marginTop: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '8px',
            fontWeight: 700,
            color: '#0D9488',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <RefreshCw style={{ width: '9px', height: '9px' }} />
          *Isolated · Click to Sync
        </button>
      )}
    </div>
  );
}

/**
 * Locked card border glow style helper.
 * Merge this into the card's `style` prop when `isLocked === true`.
 */
export function lockedCardStyle(isLocked: boolean): React.CSSProperties {
  if (!isLocked) return {};
  return {
    boxShadow: '0 0 0 1.5px rgba(245,158,11,0.35), 0 8px 24px -6px rgba(245,158,11,0.14)',
    borderColor: 'rgba(245,158,11,0.35)',
  };
}
