/**
 * Stackra file contract:
 * Purpose: `VISIBILITY_HOST`, the resolver the reads take the `VisibilityFilter` driver and the running call's context
 *          from, since a `CrudService` subclass calls `super()` with no arguments and cannot inject them.
 * Boundary: internal; written only by `connectVisibilityFilter`. Unset, or set to a resolver that binds no
 *           `VisibilityFilter`, reads carry no visibility condition. One resolver per process, like `ACTIVE_DATABASE`.
 * Runtime: node
 * Governing contract: ADR 0333 (decision 4); ADR 0263 (classes are the only tokens).
 */
import type { Resolver } from "@stackra/actions";

/** The connected resolver, or undefined before `connectVisibilityFilter`. */
export const VISIBILITY_HOST: { resolver: Resolver | undefined } = { resolver: undefined };
