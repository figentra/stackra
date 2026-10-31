/**
 * Stackra file contract:
 * Purpose: `specCheckTier(context)`, the tier rule of the lane check: a declared tier below the one the diff computes
 *          is a problem naming the paths that raised it. A branch with no spec declares `trivial`.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0502 (spec tiers and approval stops); ADR 0120; ADR 0362. Loaded by plain Node from source
 *                     by core's `tools/scripts` wrappers, so it imports values by relative `.ts` paths and uses
 *                     erasable TypeScript only (ADR 0421 decision 2).
 */
import { SPEC_TIERS } from "../constants/spec-tiers.constant.ts";

/**
 * Problems of a declared tier against the computed one.
 *
 * @param context - the declared tier (`undefined`: no spec, so trivial), the computed tier and its reasons.
 * @example
 * specCheckTier({ declared: "small", computed: "feature", reasons: ["a migration: x"] });
 */
export function specCheckTier(context: {
  declared?: string | undefined;
  computed: string;
  reasons?: readonly string[];
}): string[] {
  const declared = context.declared ?? "trivial";
  if (SPEC_TIERS.indexOf(declared) >= SPEC_TIERS.indexOf(context.computed)) return [];
  return [
    `tier: the diff needs at least ${context.computed} (${(context.reasons ?? []).join("; ")}), but the ${
      context.declared === undefined ? "branch has no spec (trivial)" : `spec declares ${declared}`
    } (ADR 0502)`,
  ];
}
