/**
 * Stackra file contract:
 * Purpose: `IntegrationClass<I>`, what `Integration({ ... })` returns and what a store, a registration or a test names:
 *          a class the container builds with the `IntegrationRuntime`.
 * Boundary: a type only (ADR 0294 decision 25: each factory returns an exported, named class type). The runtime is
 *           optional, so a test may build an integration with no runtime and give it a fake client.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25); ADR 0308 (rule 1).
 */
import type { Integration } from "#core/bases/integration.base";
import type { IntegrationRuntime } from "#core/services/integration-runtime.service";

/** An integration class. */
export type IntegrationClass<I extends Integration = Integration> = new (
  runtime?: IntegrationRuntime,
) => I;
