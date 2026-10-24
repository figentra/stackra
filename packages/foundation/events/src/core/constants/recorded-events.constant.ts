/**
 * Stackra file contract:
 * Purpose: `RECORDED_EVENTS`, the events an aggregate recorded and the unit of work has not taken yet, kept off the
 *          aggregate itself.
 * Boundary: a WeakMap keyed by the aggregate, so a model holds no constructor-made state (the ORM builds a loaded row
 *           without running its constructor) and a dropped aggregate drops its events. Written by `recordEvent`,
 *           emptied by `takeRecordedEvents`. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 27).
 */
import type { Event } from "#core/bases/event.base";

/** Aggregate to the events it recorded, in order. */
export const RECORDED_EVENTS = new WeakMap<object, Event[]>();
