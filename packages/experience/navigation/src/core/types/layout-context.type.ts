/**
 * Stackra file contract:
 * Purpose: `LayoutContext<T>`, what a layout's `loader(ctx)` receives, written `LayoutContext<this>`: the same context a
 *          route gets, without layout data of its own.
 * Boundary: a type only; an alias, so a layout may write either name.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */
import type { RouteContext } from "#core/types/route-context.type";

/** The context of layout instance `T`. */
export type LayoutContext<T> = RouteContext<T>;
