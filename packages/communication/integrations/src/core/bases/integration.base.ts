/**
 * Stackra file contract:
 * Purpose: `Integration({ provider, category, levels, auth, ... })`, the kind base of a provider description: static,
 *          one per listing, the same for every scope and user. Its `@Secret` fields are platform secrets, and its
 *          `api` is the managed client with the platform's own credentials. The interface of the same name is its
 *          instance side.
 * Boundary: called only (ADR 0305 rule 2): an integration needs its description, so a bare `extends Integration` fails
 *           to compile. The options are checked when the class is declared and kept in the kind registry. The
 *           container builds it with the `IntegrationRuntime` (constructor injection through `super()`); the client is
 *           made on first use and kept beside the instance, never on it. Its `@Secret` fields stay unset on the
 *           instance: the client reads them blind from the secret store at call time.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1, 3, 4, 6 to 15); ADR 0305 (rules 2 and 43); ADR 0294 (decisions 16, 17, 25).
 */
import { createKind } from "@stackra/container";

import { INTEGRATION_STATE } from "#core/constants/integration-state.constant";
import { readIntegrationOptions } from "#core/functions/read-integration-options.function";
import type { IntegrationRuntime } from "#core/services/integration-runtime.service";
import type { IntegrationApi } from "#core/types/integration-api.type";
import type { IntegrationClass } from "#core/types/integration-class.type";
import type { IntegrationOptions } from "#core/types/integration-options.type";

/** The instance side every integration shares. */
export interface Integration {
  /** Type-only kind brand, so a class of another kind cannot stand in for an integration. */
  readonly "~kind": "integration";

  /** The managed client with the platform's own credentials. */
  readonly api: IntegrationApi;
}

/** The runtime base. Not exported: authors extend `Integration({ ... })`. */
class IntegrationBase {
  declare readonly "~kind": "integration";

  /**
   * @param runtime - the runtime the container injects; a test may leave it out and give a fake client.
   */
  constructor(runtime?: IntegrationRuntime) {
    INTEGRATION_STATE.set(this, runtime === undefined ? {} : { runtime });
  }

  /**
   * The managed client with the platform's own credentials, made on first use.
   *
   * @throws TypeError when the instance was built without a runtime and no fake client was given.
   */
  get api(): IntegrationApi {
    const state = INTEGRATION_STATE.get(this) ?? {};
    if (state.api !== undefined) return state.api;
    if (state.runtime === undefined)
      throw new TypeError(
        `${this.constructor.name} was built without an IntegrationRuntime: the container injects one, and a test gives a fake client with withIntegrationApi`,
      );
    const api = state.runtime.client(this as unknown as Integration);
    INTEGRATION_STATE.set(this, { ...state, api });
    return api;
  }
}

/**
 * The integration kind base.
 *
 * @example
 * export class ResendIntegration extends Integration({
 *   provider: "resend",
 *   category: IntegrationCategory.Email,
 *   levels: [ConnectionLevel.Scope],
 *   auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiKey}" },
 *   baseUrl: "https://api.resend.com",
 *   rateLimits: [{ requests: 10, per: "1s", by: RateLimitScope.Credential }],
 *   retry: { idempotencyHeader: "Idempotency-Key" },
 * }) {
 *   @Secret("RESEND_API_KEY")
 *   apiKey!: string;
 * }
 */
export const Integration = createKind("integration", IntegrationBase, readIntegrationOptions) as (
  options: IntegrationOptions,
) => IntegrationClass;
