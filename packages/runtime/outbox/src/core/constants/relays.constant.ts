/**
 * Stackra file contract:
 * Purpose: `RELAYS`, the relay listeners of this process: listeners whose `handle` takes an `EventEnvelope`, so they
 *          receive every integration event the inbox claims, by its envelope only (the webhooks relay).
 * Boundary: process-wide and internal: written by `registerRelays` (gen's registrations), read by `InboxService#connect`.
 *           Never keyed by wire name: a relay takes every event; a typed subscription is a listener of the event class.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 4: typed events; a relay is the one all-events subscriber); ADR 0141 (decision
 *                     2: the envelope).
 */
import type { ListenerClass } from "@stackra/events";

/** The registered relay listener classes, in registration order. */
export const RELAYS = new Set<ListenerClass>();
