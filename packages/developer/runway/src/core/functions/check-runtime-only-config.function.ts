/**
 * Stackra file contract:
 * Purpose: `checkRuntimeOnlyConfig(document, fields)`, the runway half of STA-2844: a runway `config` block (a member's
 *          `environments.<name>.config`, the root's `environments.<name>.defaults.service.config`, or any other `config`
 *          map of config key to field values) may never set a field only the runtime environment may set
 *          (`runtimeOnlyFields`): the running environment comes from `STACKRA_ENVIRONMENT` and the platform, never from
 *          the values layer, so a runway file cannot make a deployment run as `dev`; the dev sign-in's key set
 *          (`STACKRA_DEV_ISSUER_KEYS`) is runtime-only the same way (STA-2795). `buildConfig` refuses the same value at
 *          boot; this check refuses it before a deploy.
 * Boundary: pure; walks the parsed document and returns every finding instead of throwing, for `runway validate` and
 *           `stackra validate --repository` to print with the file. A finding names the path and the variable, never
 *           the value.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1, amended 2026-11-26: safety-critical keys come from the runtime only);
 *                     STA-2844.
 */
import type { RunwayIssue } from "#core/types/runway-issue.type";
import type { RuntimeOnlyField } from "#core/types/runtime-only-field.type";

/** A plain object, not an array. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Every runtime-only field a `config` block of `document` sets; `[]` when none does.
 *
 * @param document - a parsed runway document (root or member).
 * @param fields - the runtime-only fields, from `runtimeOnlyFields`.
 * @example
 * checkRuntimeOnlyConfig(service, fields);
 * // [{ path: "environments.production.config.outbox.relay_inbox.environment", message: "is read from STACKRA_ENVIRONMENT …" }]
 */
export function checkRuntimeOnlyConfig(
  document: unknown,
  fields: readonly RuntimeOnlyField[],
): RunwayIssue[] {
  if (fields.length === 0) return [];
  const issues: RunwayIssue[] = [];
  const walk = (node: unknown, path: readonly string[]): void => {
    if (!isRecord(node)) return;
    for (const [key, value] of Object.entries(node)) {
      if (key === "config" && isRecord(value))
        for (const { config, field, variable } of fields) {
          const block = value[config];
          if (isRecord(block) && Object.hasOwn(block, field))
            issues.push({
              path: [...path, key, config, field].join("."),
              message:
                `is read from ${variable} in the runtime environment only, never set as a runway config value ` +
                `(it is safety-critical): remove it; only the runtime sets ${variable} (the running environment ` +
                "may also come from the platform's report)",
            });
        }
      walk(value, [...path, key]);
    }
  };
  walk(document, []);
  return issues;
}
