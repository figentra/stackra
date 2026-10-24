/**
 * Stackra file contract:
 * Purpose: `useFlag(ref)`, the hook a component, a generated navigation or a block reads one flag with: the value the
 *          `FlagReader` of the nearest container holds, re-rendering when the reader's values change.
 * Boundary: reads through `useSyncExternalStore`, so a render never sees a torn value and the server render uses the
 *           same read. Throws outside a `ContainerProvider` or when the container does not bind `FlagReader`, so a
 *           missing flags context is never a silent default. Builds no reader and asks no provider.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 3); ADR 0294 (decision 17); ADR 0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";
import { useSyncExternalStore } from "react";

import { FlagReader } from "#core/index";
import type { FlagRef } from "#core/index";

/**
 * The current value of `ref`.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `FlagReader`.
 * @example
 * const yearlyFirst = useFlag(Flags.web.pricing_yearly_first);
 */
export function useFlag(ref: FlagRef): boolean {
  const reader = useContainer().get(FlagReader);
  const read = (): boolean => reader.get(ref);
  return useSyncExternalStore(reader.subscribe, read, read);
}
