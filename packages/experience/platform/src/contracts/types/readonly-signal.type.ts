/**
 * Stackra file contract:
 * Purpose: `ReadonlySignal<T>`, a live value a capability hands out: read it, or subscribe to it with `useSignal`
 *          (`useSignal(platform.network.isOnline)`). Only the driver that owns it writes it.
 * Boundary: a type only, the read half of `@stackra/state`'s `Signal`, so `useSignal` takes it as it is.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decisions 2 and 6: signals); ADR 0250.
 */
import type { Signal } from "@stackra/state/react";

/** A value to read and subscribe to, never to write. */
export type ReadonlySignal<T> = Pick<Signal<T>, "get" | "subscribe">;
