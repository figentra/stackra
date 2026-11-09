/**
 * Stackra file contract:
 * Purpose: `VersioningConfig`, the API's dated versions (key `versioning`): the `YYYY-MM-DD` dates the service serves,
 *          which `serveVersioned` reads for every call of a member that declares this package.
 * Boundary: a configuration class over `VersioningOptions` with no env map; runway's `config.versioning` layer sets it
 *           per environment. How long an old version stays served is a setting (`VersionSupportSource`), not config.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0118.
 */
import { Config } from "@stackra/config";

import { VersioningOptions } from "#core/schemas/versioning-options.schema";

/**
 * The service's served versions.
 *
 * @example
 * // runway.yaml: config.versioning.supported: ["2026-10-01", "2027-03-01"]
 * container.get(VersioningConfig).supported;
 */
export class VersioningConfig extends Config({ schema: VersioningOptions }) {}
