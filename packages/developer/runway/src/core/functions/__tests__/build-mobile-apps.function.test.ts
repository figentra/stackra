/**
 * Stackra file contract:
 * Purpose: unit tests of `buildMobileApps`: checked requests build in order; a tenant entry that breaks the schema, a
 *          tenant request without its tenant, and a white-label build under the platform's accounts before it is
 *          cleared are refused before anything builds; a merchant-published white-label build needs no clearance.
 * Boundary: test only; the builder is a fake that records each request.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0439 (decision 8 and enforcement).
 */
import { describe, expect, it } from "@stackra/testing";

import { AppPublisher } from "#core/enums/app-publisher.enum";
import { MobileBuildTrigger } from "#core/enums/mobile-build-trigger.enum";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayRefusedError } from "#core/errors/runway-refused.error";
import { PRODUCT_ROOT, STAFF_APP } from "#core/functions/__tests__/fixtures/product-root.fixture";
import { buildMobileApps } from "#core/functions/build-mobile-apps.function";
import { mobileBuildRequests } from "#core/functions/mobile-build-requests.function";
import { MobileBuilder } from "#core/ports/mobile-builder.port";
import type { MobileBuildRecord } from "#core/types/mobile-build-record.type";
import type { MobileBuildRequest } from "#core/types/mobile-build-request.type";

/** A builder that records each request. */
class FakeBuilder extends MobileBuilder {
  readonly built: string[] = [];

  override async build(request: MobileBuildRequest): Promise<MobileBuildRecord> {
    this.built.push(request.app);
    return { app: request.app, reference: `build-${request.app}` };
  }
}

/** A white-label request from a tenant event. */
const WHITE_LABEL: MobileBuildRequest = {
  product: "commerce",
  app: "shopper",
  entry: STAFF_APP as MobileBuildRequest["entry"],
  trigger: MobileBuildTrigger.TenantEvent,
  tenant: "tenant-1",
  publisher: AppPublisher.Platform,
};

describe("buildMobileApps", () => {
  it("builds every checked request in order", async () => {
    const builder = new FakeBuilder();

    const records = await buildMobileApps(
      mobileBuildRequests(PRODUCT_ROOT, "d".repeat(40)),
      builder,
      {
        platformPublishingCleared: false,
      },
    );

    expect(records).toEqual([{ app: "staff", reference: "build-staff" }]);
  });

  it("refuses a bad tenant entry and a tenant request without its tenant, building nothing", async () => {
    const builder = new FakeBuilder();
    const bad = {
      ...WHITE_LABEL,
      entry: { ...STAFF_APP, template: "mobile" },
    } as MobileBuildRequest;
    const { tenant: _tenant, ...noTenant } = WHITE_LABEL;
    const options = { platformPublishingCleared: true };

    await expect(buildMobileApps([WHITE_LABEL, bad], builder, options)).rejects.toBeInstanceOf(
      RunwayInvalidError,
    );
    await expect(buildMobileApps([noTenant], builder, options)).rejects.toBeInstanceOf(
      RunwayInvalidError,
    );
    expect(builder.built).toEqual([]);
  });

  it("refuses a white-label build under the platform's accounts until cleared", async () => {
    const builder = new FakeBuilder();

    await expect(
      buildMobileApps([WHITE_LABEL], builder, { platformPublishingCleared: false }),
    ).rejects.toBeInstanceOf(RunwayRefusedError);
    expect(
      await buildMobileApps([{ ...WHITE_LABEL, publisher: AppPublisher.Merchant }], builder, {
        platformPublishingCleared: false,
      }),
    ).toEqual([{ app: "shopper", reference: "build-shopper" }]);
  });
});
