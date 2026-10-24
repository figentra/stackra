/**
 * Stackra file contract:
 * Purpose: `integrationOptionsOf`, the options an Integration class was declared with, read from the kind registry.
 * Boundary: internal; the managed client, the runtime and the stores read the description through it, never through
 *           a static on the class.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25: the kind registry); ADR 0308 (rule 1).
 */
import { kindOf } from "@stackra/container";

import type { IntegrationOptions } from "#core/types/integration-options.type";

/**
 * The checked options of `type`, `multiple` defaulted.
 *
 * @throws TypeError when `type` does not extend `Integration({ ... })`.
 * @example
 * integrationOptionsOf(ResendIntegration).provider; // "resend"
 */
export function integrationOptionsOf(
  type: object,
): IntegrationOptions & { readonly multiple: boolean } {
  const record = kindOf(type);
  if (record?.kind !== "integration")
    throw new TypeError(
      `${(type as { name?: string }).name ?? "The class"} does not extend Integration({ ... })`,
    );
  return record.options as unknown as IntegrationOptions & { readonly multiple: boolean };
}
