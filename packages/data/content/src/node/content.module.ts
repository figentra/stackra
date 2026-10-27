/**
 * Stackra file contract:
 * Purpose: `ContentModule`, the root module of @stackra/content: what it shares with a host's modules,
 *          `CustomFieldService` and `RevisionService`, so a host service that keeps revisions (`HasRevisions`) or
 *          custom fields (`HasCustomFields`) injects them. The file exists because `exports` is the one thing gen
 *          cannot derive.
 * Boundary: the key is the package key (`content`), the namespace of the package's tables and permissions. No bindings
 *           list and no imports: gen discovers both services from `src/node/services/` and their edges from their
 *           constructor types, and runs the package's migrations (`content.custom_fields`,
 *           `content.custom_field_value_sets`, `content.revisions`) in each host that lists the package, found by
 *           their paths as every migration is.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 12, 15 and 16); ADR 0305 (an optional root module, written here for its
 *                     exports); ADR 0263 (gen writes the wiring); ADR 0321 (decisions 2 and 6); ADR 0116 (decision CT2).
 */
import { Module } from "@stackra/container";

import { CustomFieldService } from "#node/services/custom-field.service";
import { RevisionService } from "#node/services/revision.service";

/**
 * A host takes it by listing the package as a dependency; gen derives the host's module imports from its dependencies.
 *
 * @example
 * // services/content/package.json
 * { "dependencies": { "@stackra/content": "workspace:*" } }
 */
export class ContentModule extends Module({ exports: [CustomFieldService, RevisionService] }) {}
