/**
 * Stackra file contract:
 * Purpose: `StarterRegion`, what an app's root runway says about where it runs: the region staging and production run
 *          in today and the root `regions` a typed answer resolves against.
 * Boundary: type only; `starterRegion` builds it.
 * Runtime: node
 * Governing contract: ADR 0515 (decision 3); ADR 0524 (amendment 2026-11-27, STA-2896).
 */
import type { RootRunway } from "@stackra/runway";

/** What the starter's root runway says about where the app runs. */
export type StarterRegion = {
  /** The region staging and production run in today, `undefined` when the runway names none. */
  readonly name: string | undefined;

  /** The root `regions`, for resolving a name against. */
  readonly regions: NonNullable<RootRunway["regions"]>;
};
