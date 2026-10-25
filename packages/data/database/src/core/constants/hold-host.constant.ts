/**
 * Stackra file contract:
 * Purpose: `HOLD_HOST`, the `HoldRegistry` the delete, purge and retention paths consult, since a `CrudService`
 *          subclass calls `super()` with no arguments and the ORM builds `HoldSubscriber` before the container.
 * Boundary: internal; written only by `connectHoldRegistry`. Unset, nothing is held. One registry per process, like
 *           `ACTIVE_DATABASE`.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment); ADR 0263 (classes are the only tokens).
 */
import type { HoldRegistry } from "#contracts/ports/hold-registry.port";

/** The connected registry, or undefined before `connectHoldRegistry`. */
export const HOLD_HOST: { registry: HoldRegistry | undefined } = { registry: undefined };
