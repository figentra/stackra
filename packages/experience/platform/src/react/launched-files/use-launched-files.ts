/**
 * Stackra file contract:
 * Purpose: `useLaunchedFiles()`, the files the operating system handed to the app at its latest launch (the PWA's
 *          `launchQueue`), re-rendering when a new launch brings new ones.
 * Boundary: reads the platform's `fileHandling` facet; only the latest launch is kept. A target without file handling
 *           returns an empty list, so the page shows its empty state.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2); ADR 0255 (file handlers).
 */
import { useSignal } from "@stackra/state/react";

import { usePlatform } from "#react/platform/use-platform";

/**
 * The files of the latest launch.
 *
 * @example
 * const files = useLaunchedFiles();
 * if (files.length === 0) return <EmptyView ... />;
 */
export function useLaunchedFiles(): readonly File[] {
  return useSignal(usePlatform().fileHandling.launched);
}
