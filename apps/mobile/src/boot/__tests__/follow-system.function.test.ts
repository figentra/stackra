/**
 * Stackra file contract:
 * Purpose: proves `followSystem` creates the configured Android channels and turns the App Tracking Transparency
 *          answer into the consent ledger's tracking refusal: refused unless granted on iOS, never refused off iOS.
 * Boundary: the function alone; the channel helper is a spy and the system settings a fixed answer, so no native
 *           module loads.
 * Runtime: node
 * Governing contract: ADR 0298 (2026-10-29 note); ADR 0255 (2026-10-29 note); ADR 0022 (test placement).
 */
import { ConsentLedger } from "@stackra/consent";
import { Container } from "@stackra/container";
import { PushConfig } from "@stackra/platform";
import { SystemSettings } from "@stackra/platform/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { followSystem } from "../follow-system.function";

const { createNotificationChannels } = vi.hoisted(() => ({
  createNotificationChannels: vi.fn(async () => undefined),
}));
vi.mock("@stackra/platform/native", () => ({ createNotificationChannels }));

/** A container whose tracking answer is `tracking`, with a spied ledger. */
async function containerWith(tracking: string | null) {
  const ledger = { setAppTrackingDenied: vi.fn() };
  const container = await Container.create([], {
    overrides: new Map<object, object>([
      [PushConfig, new PushConfig()],
      [SystemSettings, { tracking: async () => tracking }],
      [ConsentLedger, ledger],
    ]),
  });
  return { container, ledger };
}

describe("followSystem", () => {
  beforeEach(() => createNotificationChannels.mockClear());

  it("creates the configured channels", async () => {
    const { container } = await containerWith(null);
    await followSystem(container);
    expect(createNotificationChannels).toHaveBeenCalledWith(
      container.get(PushConfig).androidChannels,
      expect.any(Function),
    );
  });

  it.each([
    ["granted", false],
    ["denied", true],
    ["prompt", true],
    [null, false],
  ])("reads tracking %s as refused: %s", async (tracking, refused) => {
    const { container, ledger } = await containerWith(tracking);
    await followSystem(container);
    expect(ledger.setAppTrackingDenied).toHaveBeenCalledWith(refused);
  });
});
