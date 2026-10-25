/**
 * Stackra file contract:
 * Purpose: `INTEGRATION_STATE`, what an Integration instance carries beside its fields: the runtime it was built with
 *          and its managed client once built (or the fake a test gave it).
 * Boundary: internal; kept beside the instance, never on it, so an author's field never collides with it and the
 *           client never serialises with the instance.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13).
 */
import type { IntegrationRuntime } from "#core/services/integration-runtime.service";
import type { IntegrationApi } from "#core/types/integration-api.type";

/** Integration instance to its runtime and client. */
export const INTEGRATION_STATE = new WeakMap<
  object,
  { runtime?: IntegrationRuntime; api?: IntegrationApi }
>();
