/**
 * Stackra file contract:
 * Purpose: unit and type tests of `NotificationsOptions`: a shape whose initializers equal the shipped schema's
 *          defaults, with `driver` typed as a `Notifier` driver name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 4, 19 and 26).
 */
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { NOTIFICATIONS_CONFIG_SCHEMA } from "#core/constants/notifications-config-schema.constant";
import type { Notifier } from "#core/ports/notifier.port";
import { NotificationsOptions } from "#core/schemas/notifications-options.schema";

describe("NotificationsOptions", () => {
  it("is a shape whose defaults equal the shipped schema's", () => {
    const options = new NotificationsOptions();
    expect(options).toBeInstanceOf(Schema);
    expect({ ...options }).toEqual(NOTIFICATIONS_CONFIG_SCHEMA.parse({}));
  });

  it("types driver as a Notifier driver name", () => {
    expectTypeOf<NotificationsOptions["driver"]>().toEqualTypeOf<DriverName<Notifier>>();
  });
});
