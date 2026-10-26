/**
 * Stackra file contract:
 * Purpose: `CATEGORY_NAMES`, the package category names in `CATEGORIES` order, for lookups and messages.
 * Boundary: data only, derived from `CATEGORIES`.
 * Runtime: node
 * Governing contract: ADR 0127.
 */
import { CATEGORIES } from "#node/constants/categories.constant";

/** The category name list, for lookups and messages. */
export const CATEGORY_NAMES: readonly string[] = Object.freeze(CATEGORIES.map((c) => c.name));
