import { useState, useCallback } from 'react';
import { type FilterState } from './TimeTrendFilter';

export interface CardLockState {
  isLocked: boolean;
  lockedFilters: FilterState | null;
}

export interface CardFilterLock {
  /** The filters this card should actually use (locked snapshot or global) */
  effectiveFilters: FilterState;
  isLocked: boolean;
  /** Lock the card at the current global filter state */
  lock: () => void;
  /** Unlock and re-sync with global filters */
  unlock: () => void;
  /** Toggle between locked and unlocked */
  toggle: () => void;
  /** The snapshot filters when locked, null if unlocked */
  lockedFilters: FilterState | null;
}

/**
 * useCardFilterLock — per-card filter isolation hook.
 *
 * Usage:
 *   const cardLock = useCardFilterLock(globalFilters);
 *   // pass cardLock.effectiveFilters to the chart instead of globalFilters
 *   // use cardLock.isLocked and cardLock.toggle for the pin icon
 */
export function useCardFilterLock(globalFilters: FilterState): CardFilterLock {
  const [lockedFilters, setLockedFilters] = useState<FilterState | null>(null);

  const lock = useCallback(() => {
    setLockedFilters(globalFilters);
  }, [globalFilters]);

  const unlock = useCallback(() => {
    setLockedFilters(null);
  }, []);

  const toggle = useCallback(() => {
    setLockedFilters(prev => (prev === null ? globalFilters : null));
  }, [globalFilters]);

  return {
    effectiveFilters: lockedFilters ?? globalFilters,
    isLocked: lockedFilters !== null,
    lock,
    unlock,
    toggle,
    lockedFilters,
  };
}

/**
 * usePageCardLocks — manages N card lock states for a page with N cards.
 * Returns an array of CardFilterLock objects in the same order.
 *
 * Usage:
 *   const locks = usePageCardLocks(globalFilters, 4);
 *   const q1Lock = locks[0];
 */
export function usePageCardLocks(globalFilters: FilterState, count: number): CardFilterLock[] {
  // Store locked snapshots as a fixed-length array (null = unlocked)
  const [lockedSnapshots, setLockedSnapshots] = useState<(FilterState | null)[]>(() =>
    Array(count).fill(null)
  );

  const makeCardLock = useCallback((index: number): CardFilterLock => {
    const lockedFilters = lockedSnapshots[index];
    return {
      effectiveFilters: lockedFilters ?? globalFilters,
      isLocked: lockedFilters !== null,
      lockedFilters,
      lock: () =>
        setLockedSnapshots(prev => {
          const next = [...prev];
          next[index] = globalFilters;
          return next;
        }),
      unlock: () =>
        setLockedSnapshots(prev => {
          const next = [...prev];
          next[index] = null;
          return next;
        }),
      toggle: () =>
        setLockedSnapshots(prev => {
          const next = [...prev];
          next[index] = next[index] === null ? globalFilters : null;
          return next;
        }),
    };
  }, [lockedSnapshots, globalFilters]);

  return Array.from({ length: count }, (_, i) => makeCardLock(i));
}

/**
 * areFiltersDifferent — utility to check if a locked filter snapshot
 * differs from current global filters (used to show sync indicator).
 */
export function areFiltersDifferent(a: FilterState, b: FilterState): boolean {
  return (
    a.trend !== b.trend ||
    a.subPeriod !== b.subPeriod ||
    a.product !== b.product ||
    a.process !== b.process ||
    a.machine !== b.machine ||
    a.shift !== b.shift ||
    a.line !== b.line
  );
}
