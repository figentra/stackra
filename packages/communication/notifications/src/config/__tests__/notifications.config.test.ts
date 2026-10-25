/**
 * Stackra file contract:
 * Purpose: unit and type tests of `NotificationsConfig`: a configuration over `NotificationsOptions` keyed
 *          `notifications` (so gen's selector is `config:notifications.driver`), built with its defaults and a runway
 *          values layer, and refusing a driver this package does not ship.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 19, 20 and 26); ADR 0266 (decision 5).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { NotificationsConfig } from "#config/notifications.config";
import type { Notifier } from "#core/ports/notifier.port";

/** A host's override, under the plain name with the package class aliased. */
const BaseNotificationsConfig = NotificationsConfig;

class HostNotificationsConfig extends BaseNotificationsConfig {
  override driver: DriverName<Notifier> = "memory";
}

describe("NotificationsConfig", () => {
  it("is a configuration keyed notifications, an override inheriting the key", () => {
    expect(new NotificationsConfig()).toBeInstanceOf(Config);
    expect(configKey(NotificationsConfig, "notifications")).toBe("notifications");
    expect(configKey(HostNotificationsConfig, "notifications")).toBe("notifications");
  });

  it("types its fields on the class and builds with the memory driver", () => {
    const config = buildConfig(NotificationsConfig);
    expectTypeOf(config.driver).toEqualTypeOf<DriverName<Notifier>>();
    expect(config.driver).toBe("memory");
    expect(Object.isFrozen(config)).toBe(true);
    expect(buildConfig(HostNotificationsConfig).driver).toBe("memory");
  });

  it("refuses a driver this package does not ship", () => {
    // @ts-expect-error -- "smtp" is no driver this package ships; the runtime refusal is the subject
    expect(() => buildConfig(NotificationsConfig, { values: { driver: "smtp" } })).toThrow(
      ConfigInvalidError,
    );
  });
});
