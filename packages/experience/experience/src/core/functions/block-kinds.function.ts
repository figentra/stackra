/**
 * Stackra file contract:
 * Purpose: `blockKinds(block)`, the document kinds a block class fits, as `Block({ kinds })` recorded them.
 * Boundary: pure; reads the kind registry. A class that is not a block fits no kind.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 6).
 */
import { type AnyClass, kindOf } from "@stackra/container";

import type { ExperienceKind } from "#contracts/enums/experience-kind.enum";

/**
 * The kinds `block` fits.
 *
 * @example
 * blockKinds(HeroSectionBlock); // ["page", "screen"]
 */
export function blockKinds(block: AnyClass): readonly ExperienceKind[] {
  const recorded = kindOf(block);
  return recorded?.kind === "block"
    ? ((recorded.options["kinds"] as readonly ExperienceKind[] | undefined) ?? [])
    : [];
}
