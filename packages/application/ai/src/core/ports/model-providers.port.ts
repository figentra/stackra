/**
 * Stackra file contract:
 * Purpose: the `ModelProviders` port, the token that collects the `ModelProviderDriver`s bound in a process (Bedrock,
 *          Anthropic, a local vLLM), so the service that answers `AgentModels` hands them to `resolveModel`.
 * Boundary: an abstract class that is its own token, keyed `ai.ModelProviders`. Only the token lives here: the provider
 *           drivers and the driver that lists them are the ai service's (OS ai), and each resolves its own credentials
 *           at run time. In `core`, not `contracts`, because it speaks `ModelProviderDriver`, a core type.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 2: provider drivers); ADR 0294 (decisions 4 and 16); ADR 0155 (no hosted
 *                     gateway); STA-1256 (OS ai SPEC Stackra gap 1).
 */
import { Port } from "@stackra/contracts";

import type { ModelProviderDriver } from "#core/types/model-provider-driver.type";

/**
 * Lists the bound provider drivers.
 *
 * @example
 * const model = resolveModel(choice, container.get(ModelProviders).drivers());
 */
export abstract class ModelProviders extends Port {
  /** Type-only port key, so `DriverName<ModelProviders>` narrows to this port's drivers. */
  declare readonly "~key": "ai.ModelProviders";

  /** Every bound provider driver, one per provider key; empty when none is bound. */
  abstract drivers(): readonly ModelProviderDriver[];
}
