/**
 * Stackra file contract:
 * Purpose: `instantiate`, which turns a schema's parsed output into an instance of its shape class, for `validate` and
 *          `X.create`.
 * Boundary: sets the prototype and copies the parsed fields; the constructor does not run, so no initializer resets a
 *           parsed value (`useDefineForClassFields`, ADR 0294 decision 25), as the ORM builds a loaded row. Nested
 *           shapes stay the plain objects the schema returned. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 25 and 27).
 */
import type { AnyClass } from "@stackra/container";

/**
 * An instance of `type` holding the fields of `data`.
 *
 * @example
 * instantiate(OrderView, OrderView$.parse(raw)) instanceof OrderView; // true
 */
export function instantiate<T extends object>(type: AnyClass<T>, data: unknown): T {
  return Object.assign(Object.create(type.prototype as object) as T, data);
}
