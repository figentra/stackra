/**
 * Stackra file contract:
 * Purpose: `LAYOUT_RUNS`, each request's layout loader runs, so a layout's loader runs once per request however many
 *          matched routes below it need its data.
 * Boundary: internal; weakly keyed by the request, so a finished request's runs are collected with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: a layout's loader runs before any child's).
 */
import type { AnyClass } from "@stackra/container";

/** Request → layout class → its loader's data. */
export const LAYOUT_RUNS = new WeakMap<Request, Map<AnyClass, Promise<unknown>>>();
