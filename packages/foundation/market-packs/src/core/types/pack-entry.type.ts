/**
 * Stackra file contract:
 * Purpose: `PackEntry`, one dated value in a pack: its key, its JSON value, the days it is in force and, for a legal
 *          floor, the bound and the law that set it.
 * Boundary: a type only, an element of `MarketPack["entries"]`.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decisions 5 and 6).
 */
import type { MarketPack } from "#core/types/market-pack.type";

/** One dated value. */
export type PackEntry = MarketPack["entries"][number];
