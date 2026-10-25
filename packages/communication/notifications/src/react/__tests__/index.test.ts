/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: the template's `useMail` value and `MailProps` type are
 *          exported, nothing else is (the renderer stays internal).
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { Notification } from "#core/index";
import * as react from "#react/index";
import type { MailProps } from "#react/index";

describe("@stackra/notifications/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual(["useMail"]);
  });

  it("exports MailProps as a type", () => {
    abstract class Silent implements Notification {
      declare readonly "~kind": "notification";
      abstract recipients(event: { id: string }): [];
    }
    expectTypeOf<MailProps<typeof Silent>>().toEqualTypeOf<Readonly<{ id: string }>>();
  });
});
