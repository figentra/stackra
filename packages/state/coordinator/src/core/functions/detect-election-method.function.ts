/**
 * Stackra file contract:
 * Purpose: `detectElectionMethod()`, the best method this realm supports: Web Locks, else a BroadcastChannel, else
 *          memory. `electLeader` calls it when no `method` option is given.
 * Boundary: feature detection on `globalThis` only; it opens nothing. Web Locks are missing outside a secure context
 *           and on older engines, both APIs on React Native.
 * Runtime: isomorphic
 * Governing contract: ADR 0084 (the coordinator row: Web Locks with a fallback).
 */
import { ElectionMethod } from "#core/enums/election-method.enum";

/** The first available of Web Locks, BroadcastChannel and memory. */
export function detectElectionMethod(): ElectionMethod {
  const locks = (globalThis as { navigator?: { locks?: { request?: unknown } } }).navigator?.locks;
  if (typeof locks?.request === "function") return ElectionMethod.WebLocks;
  if (typeof globalThis.BroadcastChannel === "function") return ElectionMethod.BroadcastChannel;
  return ElectionMethod.Memory;
}
