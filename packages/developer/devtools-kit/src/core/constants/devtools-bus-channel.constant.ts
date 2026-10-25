/**
 * Stackra file contract:
 * Purpose: `DEVTOOLS_BUS_CHANNEL`, the stream channel on which the kit reports every event the in-process bus
 *          delivers, so a host can filter the bus timeline from the channels packages emit on.
 * Boundary: a constant only.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decisions 2 and 3: events in the panel and the dev console).
 */

/** The channel of the bus timeline; each payload is a `DevtoolsBusOccurrence`. */
export const DEVTOOLS_BUS_CHANNEL = "bus";
