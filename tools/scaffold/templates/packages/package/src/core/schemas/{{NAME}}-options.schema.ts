/**
 * Stackra file contract:
 * Purpose: `{{PASCAL}}Options`, the fields of `{{PASCAL}}Config`: whether the package's bindings are active.
 * Boundary: a shape class: fields, types and defaults only. A host overrides a field in its own
 *           `src/config/{{NAME}}.config.ts`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0146 (configuration layers).
 */
import { Schema } from "@stackra/validation";

/** The options of `{{PASCAL}}Config`. */
export class {{PASCAL}}Options extends Schema {
  /** Whether the package's bindings are active; a host turns them off without removing the module. */
  enabled = true;
}
