/**
 * Stackra file contract:
 * Purpose: `runtimeOnlyFieldsOf(root)`, the configuration fields a repository's runway files may never set: the
 *          `env` rows mapped to a safety-critical variable (`runtimeOnlyFields`) in every manifest its runway files
 *          configure (`stackraManifests`). `runway validate` and `stackra validate --repository` hand them to
 *          `checkRuntimeOnlyConfig` (STA-2844).
 * Boundary: reads files only. A repository without a root runway has no members to configure: its fields are read from
 *           the root's own dependencies and workspace packages.
 * Runtime: node
 * Governing contract: ADR 0296 (amendment 2026-11-26); STA-2844.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { runtimeOnlyFields } from "#core/functions/runtime-only-fields.function";
import type { RuntimeOnlyField } from "#core/types/runtime-only-field.type";
import { readRunways } from "#node/functions/read-runways.function";
import { stackraManifests } from "#node/functions/stackra-manifests.function";

/**
 * The runtime-only fields of the repository at `root`.
 *
 * @param root - the repository root.
 * @example
 * checkRuntimeOnlyConfig(service, runtimeOnlyFieldsOf(root));
 */
export function runtimeOnlyFieldsOf(root: string): RuntimeOnlyField[] {
  const members = existsSync(join(root, "runway.yaml")) ? readRunways(root).members : [];
  return runtimeOnlyFields(stackraManifests(root, members));
}
