/**
 * Stackra file contract:
 * Purpose: `useFlagCheck()` on native, whether a flag is on for the viewer, as a function `ContextMenu` filters entries
 *          with; a new function, and so a re-render, whenever the flag values change.
 * Boundary: internal; reads the container's `FlagReader` when it binds one, else each flag's declared default. The web
 *           entry has its own copy, because entries import `.` only, never each other.
 * Runtime: react-native
 * Governing contract: ADR 0214 (gate-filtered navigation); ADR 0294 (decision 15).
 */
import { useContainer } from "@stackra/container/react";
import type { FlagRef } from "@stackra/feature-flags";
import { FlagReader } from "@stackra/feature-flags";
import { useCallback, useEffect, useState } from "react";

/**
 * The viewer's flag check.
 *
 * @example
 * const isOn = useFlagCheck();
 */
export function useFlagCheck(): (flag: FlagRef) => boolean {
  const container = useContainer();
  const reader = container.has(FlagReader) ? container.get(FlagReader) : null;
  const [version, setVersion] = useState(0);
  useEffect(() => reader?.subscribe(() => setVersion((current) => current + 1)), [reader]);
  return useCallback(
    (flag: FlagRef) => (reader === null ? flag.default : reader.get(flag)),
    // oxlint-disable-next-line react/exhaustive-deps -- reason: `version` renews the check when a flag value changes
    [reader, version],
  );
}
