/**
 * Stackra file contract:
 * Purpose: `Queues`, the stand-in for the `#stackra/queues` enum gen writes in an app from the queues its jobs name:
 *          here the one `support` queue of the "Events and background jobs" guide.
 * Boundary: data only; an app imports `Queues` from `#stackra/queues` and never writes this file.
 * Runtime: isomorphic
 * Governing contract: ADR 0148; ADR 0294 (decision 15: gen writes the registries); STA-2852.
 */
import { queues } from "@stackra/queue";

/** The guide's queues: `Queues.Support` is `"support"`. */
export const Queues = queues(["support"] as const);
