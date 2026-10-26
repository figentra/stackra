/**
 * Stackra file contract:
 * Purpose: `buildMobileApps(requests, builder, options)`, the mobile build job: checks every request first (its entry
 *          against the mobile app schema, a tenant-started request's tenant, and that a white-label build under the
 *          platform's store accounts is cleared), then starts each build in order and answers the records.
 * Boundary: nothing is built unless every request passes, so a bad tenant entry never half-runs a batch. The entry of
 *           a tenant-started request comes from the OS, a trust boundary, so it is parsed here again. Whether the
 *           Apple guideline 4.2.6 and 4.3 checks are recorded is an OS setting the caller passes.
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (decisions 2, 3 and 8, enforcement: no tenant build under the platform's accounts
 *                     until the checks are recorded).
 */
import { MOBILE_APP_SCHEMA } from "#core/constants/mobile-app-schema.constant";
import { AppPublisher } from "#core/enums/app-publisher.enum";
import { MobileBuildTrigger } from "#core/enums/mobile-build-trigger.enum";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayRefusedError } from "#core/errors/runway-refused.error";
import { issuesOf } from "#core/functions/issues-of.function";
import type { MobileBuilder } from "#core/ports/mobile-builder.port";
import type { MobileBuildRecord } from "#core/types/mobile-build-record.type";
import type { MobileBuildRequest } from "#core/types/mobile-build-request.type";

/** `request` with its entry parsed, or the reason it cannot build. */
function checked(
  request: MobileBuildRequest,
  platformPublishingCleared: boolean,
): MobileBuildRequest {
  const source = `mobile build ${request.product}/${request.app}`;
  const parsed = MOBILE_APP_SCHEMA.safeParse(request.entry);
  if (!parsed.success) throw new RunwayInvalidError(source, issuesOf(parsed.error));
  if (request.trigger === MobileBuildTrigger.TenantEvent) {
    if (request.tenant === undefined)
      throw new RunwayInvalidError(source, [
        { path: "tenant", message: "A tenant-started build names its tenant" },
      ]);
    if (request.publisher === AppPublisher.Platform && !platformPublishingCleared)
      throw new RunwayRefusedError(
        "platform_publishing_not_cleared",
        `${source}: a white-label app is not published under the platform's store accounts until the Apple 4.2.6 and 4.3 checks are recorded`,
      );
  }
  return { ...request, entry: parsed.data };
}

/**
 * Checks every request, then builds each.
 *
 * @param requests - from `mobileBuildRequests` (a product merge) or a tenant event's handler.
 * @param builder - the build service.
 * @param options.platformPublishingCleared - true once the store-guideline checks for white-label apps under the
 *        platform's accounts are recorded (an OS setting).
 * @throws RunwayInvalidError for an entry that breaks the schema or a tenant request without a tenant.
 * @throws RunwayRefusedError for a white-label build under the platform's accounts before it is cleared.
 * @example
 * await buildMobileApps(mobileBuildRequests(root, sha), builder, { platformPublishingCleared: false });
 */
export async function buildMobileApps(
  requests: readonly MobileBuildRequest[],
  builder: MobileBuilder,
  options: { readonly platformPublishingCleared: boolean },
): Promise<MobileBuildRecord[]> {
  const ready = requests.map((request) => checked(request, options.platformPublishingCleared));
  const records: MobileBuildRecord[] = [];
  for (const request of ready) records.push(await builder.build(request));
  return records;
}
