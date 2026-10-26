/**
 * Stackra file contract:
 * Purpose: `StackraManifest`, the type of a member's committed `stackra.manifest.json`: its locked identities and the
 *          contract a host, a conformance test and `stackra gen --check` read.
 * Boundary: a type only, for reading the file (`json as StackraManifest`). The header and the identity fields of the
 *           sections every consumer reads are typed; each entry and the other sections stay open, because gen writes
 *           the file and each target adds sections as it lands. Enum-valued fields are typed `string`, since a JSON
 *           import widens them.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 20 and 22: the committed manifest locks identities), ADR 0295.
 */
import type { Json } from "#core/types/json.type";

/** A member's `stackra.manifest.json`, written by `stackra gen` and committed at the member root. */
export type StackraManifest = {
  /** The generated-file notice gen writes at the top. */
  readonly $comment?: string;
  /** The member key, derived from the package name (`loyalty_kit`). */
  readonly member: string;
  /** The package name (`@acme/loyalty-kit`). */
  readonly package: string;
  /** The manifest format version. */
  readonly version: string;
  /** `app` for an app member; absent for a service and a package. */
  readonly kind?: string;
  /** The member's `ApiArea` code. */
  readonly area?: string;
  /** An app's `Target` codes. */
  readonly targets?: readonly string[];
  /** The member's modules, with their exported classes and module dependencies. */
  readonly modules?: readonly {
    readonly key: string;
    readonly class?: string;
    readonly from?: string;
    readonly exports?: readonly string[];
    readonly dependsOn: readonly string[];
    readonly [field: string]: unknown;
  }[];
  /** The locked actions and queries. */
  readonly actions?: readonly {
    /** The locked identity, `<module>.<model>.<verb>@<major>`. */
    readonly key: string;
    /** `action` or `query`. */
    readonly kind: string;
    readonly module: string;
    readonly class: string;
    readonly permission: string;
    /** `L0` to `L4`. */
    readonly risk: string;
    readonly actors?: readonly string[];
    readonly [field: string]: unknown;
  }[];
  /** The locked events, by wire name. */
  readonly events?: readonly {
    /** The wire name, `<module>.<name>.v<n>`; a domain event, which carries no `version`, has no `.v<n>`. */
    readonly name: string;
    readonly module: string;
    readonly class: string;
    readonly kind: string;
    readonly version?: number;
    readonly [field: string]: unknown;
  }[];
  /** The derived permissions and their risk levels. */
  readonly permissions?: readonly {
    readonly key: string;
    readonly risk: string;
    readonly [field: string]: unknown;
  }[];
  /** The refusal codes the member can return. */
  readonly errors?: readonly {
    /** The refusal code, derived from the class name. */
    readonly code: string;
    readonly kind: string;
    readonly [field: string]: unknown;
  }[];
  /** The member's models, their tables and public id prefixes. */
  readonly models?: readonly {
    readonly key: string;
    readonly table: string;
    /** The public id prefix. */
    readonly publicId: string;
    readonly traits: readonly string[];
    readonly [field: string]: unknown;
  }[];
  /** The drivers the member binds to ports. */
  readonly drivers?: readonly {
    readonly port: string;
    /** The port key, `<member>.<Port>`. */
    readonly key: string;
    readonly [field: string]: unknown;
  }[];
  /** JSON Schemas of the member's shapes, by module-qualified name. */
  readonly schemas?: Json;
  /** The sections other targets add (`ui`, `settings`, `migrations`, `infra`, …). */
  readonly [section: string]: unknown;
};
