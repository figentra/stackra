/**
 * Stackra file contract:
 * Purpose: unit and type tests of `@Secret("NAME")`: it records the secret name per field (inherited fields too),
 *          installs no accessor, refuses a name that is not SCREAMING_SNAKE, refuses a configuration class (the field
 *          sits on the schema) and a class of no kind, and tsc refuses it on a field that is not a string.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (R6; 2026-10-23
 *                     item 2); ADR 0305 (rule 34).
 */
import { describe, expect, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { Config } from "#core/bases/config.base";
import { Secret } from "#core/decorators/secret.decorator";

class DeliveryOptions extends Schema {
  transport = "memory";

  @Secret("WEB_PUSH_VAPID_PRIVATE_KEY")
  webPushVapidPrivateKey!: string;
}

class TenantDeliveryOptions extends DeliveryOptions {
  @Secret("RESEND_TENANT_API_KEY")
  apiKey!: string;
}

describe("Secret", () => {
  it("records the secret name of each field, inherited fields included", () => {
    expect([...Secret.members(DeliveryOptions)]).toEqual([
      ["webPushVapidPrivateKey", "WEB_PUSH_VAPID_PRIVATE_KEY"],
    ]);
    expect(Object.fromEntries(Secret.members(TenantDeliveryOptions))).toEqual({
      webPushVapidPrivateKey: "WEB_PUSH_VAPID_PRIVATE_KEY",
      apiKey: "RESEND_TENANT_API_KEY",
    });
  });

  it("installs no accessor", () => {
    const options = new DeliveryOptions();
    expect(
      Object.getOwnPropertyDescriptor(DeliveryOptions.prototype, "webPushVapidPrivateKey"),
    ).toBeUndefined();
    expect(Object.getOwnPropertyDescriptor(options, "webPushVapidPrivateKey")?.writable).toBe(true);
  });

  it("refuses a name that is not SCREAMING_SNAKE", () => {
    expect(() => Secret("resendApiKey")).toThrow(TypeError);
    expect(() => Secret("RESEND__KEY")).toThrow(TypeError);
    expect(() => Secret("")).toThrow(TypeError);
  });

  it("refuses a configuration class and a class of no kind", () => {
    expect(() => {
      class Options extends Schema {
        key = "";
      }
      class KeyConfig extends Config({ schema: Options }) {
        @Secret("KEY")
        token = "";
      }
      return KeyConfig;
    }).toThrow(TypeError);
    expect(() => {
      class Plain {
        @Secret("KEY")
        key!: string;
      }
      return Plain;
    }).toThrow(TypeError);
  });

  it("marks string fields only", () => {
    expect(() => {
      class Wrong extends Schema {
        // @ts-expect-error -- @Secret marks a string field only
        @Secret("PORT")
        port = 1;
      }
      return Wrong;
    }).not.toThrow();
  });
});
