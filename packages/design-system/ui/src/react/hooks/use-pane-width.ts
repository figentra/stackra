/**
 * Stackra file contract:
 * Purpose: `usePaneWidth`, the one width engine of every resizable pane (`Sidebar`, `SidePanel`, `SplitView`): a
 *          controlled or uncontrolled width, clamped to its bounds and rounded to whole pixels, read from and kept in
 *          local storage under `<storageKey>:width`, and reported through `onWidthChange`.
 * Boundary: state only; the strip that drags it is `useResizeHandle`, and each pane draws its own strip and ARIA.
 * Runtime: browser
 * Governing contract: ADR 0305; WAI-ARIA window splitter pattern; STA-1371 (shared pane engine, owner approval
 *          2026-10-29).
 */
import { useCallback, useState } from "react";

import { readStored } from "#core/functions/read-stored.function";
import { writeStored } from "#core/functions/write-stored.function";
import type { PaneWidthOptions } from "#react/hooks/pane-width-options.type";

/** A pane's width now and the setter that clamps, keeps and reports a new one. */
interface PaneWidth {
  /** The clamped width in pixels. */
  readonly width: number;
  /** Clamps `next`, keeps it and reports it. */
  readonly setWidth: (next: number) => void;
}

/** Owns one pane's width. */
export function usePaneWidth({
  width,
  defaultWidth,
  minWidth,
  maxWidth,
  onWidthChange,
  storageKey,
}: PaneWidthOptions): PaneWidth {
  const key = storageKey === undefined ? undefined : `${storageKey}:width`;
  const [own, setOwn] = useState(() => {
    const stored = Number(readStored(key));
    return Number.isFinite(stored) && stored > 0 ? stored : defaultWidth;
  });
  const clamp = useCallback(
    (next: number) => Math.round(Math.min(maxWidth, Math.max(minWidth, next))),
    [minWidth, maxWidth],
  );
  const setWidth = useCallback(
    (next: number) => {
      const value = clamp(next);
      setOwn(value);
      writeStored(key, String(value));
      onWidthChange?.(value);
    },
    [clamp, key, onWidthChange],
  );
  return { width: clamp(width ?? own), setWidth };
}
