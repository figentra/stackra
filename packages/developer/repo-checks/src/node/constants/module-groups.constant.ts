/**
 * Stackra file contract:
 * Purpose: `MODULE_GROUPS`, the groups of a module: `src/modules/<key>/` in a service, `src/node/` in a package (ADR 0294
 *          decision 13). `.change.ts` is the one suffix with two homes (rule R1).
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 13, rule R1).
 */
import { structureGroups } from "#node/functions/structure-groups.function";

/**
 * The groups of a module: `src/modules/<key>/` in a service, `src/node/` in a package (ADR 0294 decision 13). A group
 * folder appears with its first file. `.change.ts` is the one suffix with two homes (rule R1).
 */
export const MODULE_GROUPS = structureGroups(
  [
    ["", ["module", "settings"], "the module file, its one settings group and `README.md`"],
    ["models", ["model", "state-machine", "bucket", "projection"], "persisted models"],
    ["actions", ["action"], "write operations"],
    ["queries", ["query"], "read operations"],
    ["schemas", ["schema", "change"], "shapes shared by two files; dated response changes"],
    ["enums", ["enum"], "`Enum.of` enums"],
    ["errors", ["error"], "Refusal classes"],
    ["events", ["event", "change"], "events and their versions"],
    ["listeners", ["listener"], "event handlers"],
    ["workflows", ["workflow", "signal"], "durable runs and the signals they wait for"],
    [
      "access",
      ["permissions", "policy", "role", "entitlement", "precondition", "flag"],
      "who may do what, and when",
    ],
    ["services", ["service", "repository"], "services; a repository only for named reads"],
    ["drivers", ["driver"], "port implementations"],
    ["extensions", ["extension-point", "extension", "interceptor"], "extension points and wraps"],
    ["raw", ["controller"], "raw endpoints, in a service only (ADR 0130 decision 3)"],
    [
      "resources/<model>",
      ["resource", "widget", "document", "notification", "mail"],
      "one model's admin surface",
    ],
    ["database/migrations", ["migration"], "`NNNN-<name>.migration.ts`, numbered per module"],
    ["database/factories", ["factory"], "`<model>.factory.ts`"],
    ["database/seeders", ["seeder"], "minimal, demo and test seeders"],
    ["ai", ["prompt", "skill", "facts"], "prompts, skills and facts"],
    ["functions", ["function"], "plain functions"],
    ["constants", ["constant"], "module-level constants"],
    ["types", ["type"], "types two or more files import"],
  ],
  "0294 d13",
);
