/**
 * Stackra file contract:
 * Purpose: the props the web `ChatLoader` indicators (dots, pulse, spinner and skeleton) take from the shared
 *          vocabulary: their size and the accessible name that announces the loading state.
 * Boundary: types only; web only. HeroUI Pro already names the accessible name `label`, so it is kept; the type
 *          refuses `aria-label`, which would override it. Every other prop is HeroUI Pro's own and passes through.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { Size } from "@stackra/ui/contracts";

/** Props of the `ChatLoader` indicators that the Stackra vocabulary names. */
export interface ChatLoaderContractProps {
  /** The accessible name announced as a status while loading. Left out, the loader is decorative and hidden. */
  readonly label?: string | undefined;
  /** The size of the indicator. Defaults to `md`. */
  readonly size?: Size | undefined;
}
