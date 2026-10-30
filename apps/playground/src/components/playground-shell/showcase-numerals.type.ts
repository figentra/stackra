/**
 * Stackra file contract:
 * Purpose: `ShowcaseNumerals`, one of the digits the playground's Display menu offers.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); ADR 0192 (decision 2, as amended 2026-10-28).
 */
import type { SHOWCASE_NUMERALS } from "./showcase-numerals.constant";

/** One of the digits on offer. */
export type ShowcaseNumerals = (typeof SHOWCASE_NUMERALS)[number];
