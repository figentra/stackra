/**
 * Stackra file contract:
 * Purpose: `StoreClass<S>`, a store class as the kind base returns it and as the test helpers take it: constructed with
 *          the client storage its persisted state goes to, or with nothing for an in-memory store.
 * Boundary: a type only, one construct signature, so `class X extends Store({ persist })` resolves one base type and a
 *           consumer's declaration emit can name it (ADR 0294 decision 25).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25).
 */
import type { Store } from "#core/bases/store.base";
import type { StoreStorage } from "#core/types/store-storage.type";

/** A store class whose instances are `S`. */
export type StoreClass<S extends Store = Store> = new (storage?: StoreStorage) => S;
