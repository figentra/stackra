/**
 * Stackra file contract:
 * Purpose: `useConsent(category?)`, the hook a banner, a settings page or a component's own hook reads and changes
 *          consent with: one category (`useConsent(ConsentCategory.Analytics)`) or all of them (`useConsent()`),
 *          re-rendering when the decision changes.
 * Boundary: reads the `ConsentLedger` of the nearest container through `useSyncExternalStore`. The server snapshot is
 *           "not loaded", so a server render and the hydration pass show no decision state and the stored decision is
 *           read only once the client has taken over (ADR 0298 decision 6). Throws outside a `ContainerProvider` or
 *           when the container does not bind the ledger, so a missing consent context is never a silent grant.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 to 3 and 6); ADR 0294 (decision 17); ADR 0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";
import { useSyncExternalStore } from "react";

import { ConsentLedger, ConsentStatus } from "#core/index";
import type { ConsentCategory } from "#core/index";
import type { CategoryConsent } from "#react/consent/category-consent.type";
import type { ConsentState } from "#react/consent/consent-state.type";

/** The server and hydration snapshot: nothing read yet. */
const NOT_LOADED = (): null => null;

/**
 * One category's consent.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `ConsentLedger`.
 * @example
 * const analytics = useConsent(ConsentCategory.Analytics);
 * if (analytics.isLoaded && analytics.status === ConsentStatus.Undecided) showBanner();
 */
export function useConsent(category: ConsentCategory): CategoryConsent;

/**
 * Every category's consent.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `ConsentLedger`.
 * @example
 * const consent = useConsent();
 * <Switch isSelected={consent.isGranted(category)} onSelectedChange={(on) => consent.set(category, on)} />
 */
export function useConsent(): ConsentState;

/** The implementation behind the overloads above. */
export function useConsent(category?: ConsentCategory): CategoryConsent | ConsentState {
  const ledger = useContainer().get(ConsentLedger);
  const read = (): number => ledger.revision;
  const revision = useSyncExternalStore(ledger.subscribe, read, NOT_LOADED);
  const isLoaded = revision !== null;
  // Until the client has read the decision, show what a server render shows: required granted, the rest undecided.
  const status = (of: ConsentCategory): ConsentStatus => {
    if (isLoaded) return ledger.status(of);
    return ledger.isRequired(of) ? ConsentStatus.Granted : ConsentStatus.Undecided;
  };
  if (category !== undefined)
    return {
      isLoaded,
      status: status(category),
      grant: () => ledger.set(category, true),
      deny: () => ledger.set(category, false),
      reset: () => ledger.reset(category),
    };
  return {
    isLoaded,
    status,
    isGranted: (of) => status(of) === ConsentStatus.Granted,
    set: (of, granted) => ledger.set(of, granted),
    reset: () => ledger.reset(),
  };
}
