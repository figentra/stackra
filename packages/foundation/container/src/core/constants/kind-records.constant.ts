/**
 * Stackra file contract:
 * Purpose: `KIND_RECORDS`, the kind registry: the kind and options of every kind base and called form, keyed by the
 *          class. It is what the container, `createDecorator` and the testing module read instead of reflect-metadata.
 * Boundary: process state written only by `registerKind` and read only by `kindOf`; a WeakMap, so a class that is no
 *           longer referenced is not kept alive by it. Not exported from the entry. It lives on `globalThis` under a
 *           `Symbol.for` key, so two installed copies of this package (a React peer variant, a second version) share
 *           one registry: a kind registered through one copy is seen by a decorator from the other.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25); ADR 0227 2026-10-24 note (no runtime reflection).
 */
import type { KindRecord } from "#core/types/kind-record.type";

/** The process-wide key every copy of this package reads the registry from. */
const KEY = Symbol.for("@stackra/container/kind-records");

/** Class to its own kind record; an unregistered class inherits the record of its nearest registered ancestor. */
export const KIND_RECORDS = ((globalThis as Record<symbol, unknown>)[KEY] ??= new WeakMap<
  object,
  KindRecord
>()) as WeakMap<object, KindRecord>;
