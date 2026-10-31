/**
 * Stackra file contract:
 * Purpose: `specTierOf(text)`, the tier a spec declares in its `**Tier**:` header, lower-cased.
 * Boundary: pure; `undefined` for a spec that declares none (an older spec) or names no known tier.
 * Runtime: node
 * Governing contract: ADR 0502 (spec tiers and approval stops); ADR 0120; ADR 0362. Loaded by plain Node from source
 *                     by core's `tools/scripts` wrappers, so it imports values by relative `.ts` paths and uses
 *                     erasable TypeScript only (ADR 0421 decision 2).
 */
import { SPEC_TIERS } from "../constants/spec-tiers.constant.ts";
import { specStrip } from "./spec-strip.function.ts";

/**
 * The declared tier of `text`.
 *
 * @param text - the spec.md text.
 * @example
 * specTierOf("**Tier**: feature"); // "feature"
 */
export function specTierOf(text: string): string | undefined {
  const tier = /^\*\*Tier\*\*:\s*([A-Za-z]+)/m.exec(specStrip(text))?.[1]?.toLowerCase();
  return tier !== undefined && SPEC_TIERS.includes(tier) ? tier : undefined;
}
