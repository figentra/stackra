/**
 * Stackra file contract:
 * Purpose: `EncoreEndpoint`, one endpoint of a service's generated Encore app as `encoreEndpoints` reads it from the
 *          manifest and the member's classes: an action or query adapter (`EncoreCallEndpoint`) or a raw controller
 *          (`EncoreControllerEndpoint`).
 * Boundary: a type only. `emitEncoreApi` prints the adapters from these rows and `emitEncoreWiringTest` calls them, so
 *           the two never disagree on which endpoints exist.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 (decision 2: the generated Encore app); ADR 0182 (decision 3: the thin Encore wiring
 *                     suite); STA-2063; STA-2838.
 */
import type { EncoreCallEndpoint } from "#core/types/encore-call-endpoint.type";
import type { EncoreControllerEndpoint } from "#core/types/encore-controller-endpoint.type";

/** One endpoint of the generated Encore app. */
export type EncoreEndpoint = EncoreCallEndpoint | EncoreControllerEndpoint;
