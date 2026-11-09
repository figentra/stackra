/**
 * Stackra file contract:
 * Purpose: barrel test of the `./native` entry of @stackra/notifications: exactly the inbox and the push primer.
 * Boundary: test only. React Native does not load in vitest, so `@stackra/ui/native` is replaced by empty stand-ins;
 *           only the exports are checked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as native from "#native/index";

vi.mock("@stackra/ui/native", () => ({
  Alert: () => null,
  Button: () => null,
  Card: () => null,
  Icon: () => null,
  NotificationsPanel: () => null,
}));

describe("@stackra/notifications/native", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(native).sort()).toEqual(["NotificationInbox", "PushPrimer"]);
  });
});
