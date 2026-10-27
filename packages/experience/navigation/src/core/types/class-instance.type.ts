/**
 * Stackra file contract:
 * Purpose: `ClassInstance<C>`, the instance type of route, layout or other kind class `C`.
 * Boundary: a type only. It stands in for `InstanceType`, which answers `any` for a kind class: a class that keeps its
 *           kind base's `abstract new (...args: never[])` constructor does not match `InstanceType`'s
 *           `(...args: any)`, because `any` is not assignable to `never`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25).
 */
import type { AnyClass } from "@stackra/container";

/** The instance type of class `C`. */
export type ClassInstance<C> = C extends AnyClass<infer I> ? I : never;
