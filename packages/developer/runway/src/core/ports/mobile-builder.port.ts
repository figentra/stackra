/**
 * Stackra file contract:
 * Purpose: the `MobileBuilder` port: builds one mobile app from the OS mobile template's line and the app's entry, and
 *          answers the builder's reference to the builds it started.
 * Boundary: an abstract class that is its own token. The entry is checked before a builder sees it; the builder
 *           generates the app config from the template and the entry, and never takes a credential as an argument
 *           (the build service's own login is the job's).
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (decisions 1 to 3 and 8), ADR 0263 (ports resolve by type), ADR 0294 (decisions 16
 *                     and 17).
 */
import { Port } from "@stackra/contracts";

import type { MobileBuildRecord } from "#core/types/mobile-build-record.type";
import type { MobileBuildRequest } from "#core/types/mobile-build-request.type";

/** Where mobile apps are built. */
export abstract class MobileBuilder extends Port {
  /**
   * Starts the build of `request`.
   *
   * @param request - the checked build request.
   * @returns the builder's reference to what it started.
   */
  abstract build(request: MobileBuildRequest): Promise<MobileBuildRecord>;
}
