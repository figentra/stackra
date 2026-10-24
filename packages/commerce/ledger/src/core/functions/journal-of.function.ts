/**
 * Stackra file contract:
 * Purpose: `journalOf(Model)`, the class token of `Journal<Model>`: a class that injects `Journal<LedgerEntry>` has the
 *          dependency `journalOf(LedgerEntry)` in the generated wiring, as `Repository<M>` has `repositoryOf(M)`.
 * Boundary: one token per model, made on first use and reused, because classes are the only DI tokens. The token is a
 *           `Journal<Model>` subclass that names its model and takes `Locks`, so the container builds it like any
 *           binding with the deps `[Locks]`.
 * Runtime: node
 * Governing contract: ADR 0145 and ADR 0263 as amended by ADR 0294 (classes are the only tokens); ADR 0305 (rule 5).
 */
import type { AnyClass } from "@stackra/container";
import type { Locks } from "@stackra/locking";

import { Journal } from "#core/services/journal.service";

/** The token made for each model. */
const TOKENS = new WeakMap<object, unknown>();

/**
 * The journal token of `model`.
 *
 * @example
 * { provide: PostgresLoyaltyLedgerDriver, deps: [journalOf(LedgerEntry)] }
 */
export function journalOf<M extends object>(model: AnyClass<M>): new (locks: Locks) => Journal<M> {
  const known = TOKENS.get(model);
  if (known !== undefined) return known as new (locks: Locks) => Journal<M>;
  const token = class extends Journal<M> {
    protected readonly model: AnyClass<M> = model;
  };
  Object.defineProperty(token, "name", { value: `${model.name}Journal` });
  TOKENS.set(model, token);
  return token;
}
