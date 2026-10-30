/**
 * Stackra file contract:
 * Purpose: `HeroDoc`, the vendored docs of one HeroUI component page (`vendor/heroui/<platform>/<slug>.json`).
 * Boundary: a type only, in its own file (ADR 0305).
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */
import type { HeroPart } from "./hero-part.type.ts";
import type { HeroRow } from "./hero-row.type.ts";

/** The vendored docs of one HeroUI component page. */
export interface HeroDoc {
  readonly slug: string;
  readonly platform: "react" | "native";
  readonly source: string;
  readonly parts: readonly HeroPart[];
  readonly hooks: readonly { name: string; signature: string; returns: readonly HeroRow[] }[];
  readonly slots: readonly { name: string; description: string }[];
  readonly a11y?: string;
}
