/**
 * Stackra file contract:
 * Purpose: `runtimeOnlyFields(manifests)`, the configuration fields only the runtime environment may set, read from
 *          `stackra.manifest.json` documents: every `env` row (gen, ADR 0173 amendment 2026-11-04) whose variable is in
 *          `SAFETY_CRITICAL_VARIABLES` of @stackra/config names its config key and field. `checkRuntimeOnlyConfig`
 *          refuses a runway `config` block that sets one (STA-2844).
 * Boundary: pure; a manifest or row of another shape is skipped, never thrown on. Each field appears once.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (amendment 2026-11-26); ADR 0173 (amendment 2026-11-04: env rows); STA-2844.
 */
import { SAFETY_CRITICAL_VARIABLES } from "@stackra/config";

import type { RuntimeOnlyField } from "#core/types/runtime-only-field.type";

/**
 * The runtime-only fields the manifests declare.
 *
 * @param manifests - parsed `stackra.manifest.json` documents (a member's, each installed package's).
 * @example
 * runtimeOnlyFields([outboxManifest]);
 * // [{ config: "outbox.relay_inbox", field: "environment", variable: "STACKRA_ENVIRONMENT" }]
 */
export function runtimeOnlyFields(manifests: readonly unknown[]): RuntimeOnlyField[] {
  const found = new Map<string, RuntimeOnlyField>();
  for (const manifest of manifests) {
    const rows = (manifest as { env?: unknown } | null)?.env;
    if (!Array.isArray(rows)) continue;
    for (const row of rows as { name?: unknown; config?: unknown; field?: unknown }[]) {
      const { name, config, field } = row ?? {};
      if (typeof name !== "string" || typeof config !== "string" || typeof field !== "string")
        continue;
      if (!SAFETY_CRITICAL_VARIABLES.includes(name)) continue;
      found.set(`${config}\u0000${field}`, { config, field, variable: name });
    }
  }
  return [...found.values()];
}
