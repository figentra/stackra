/**
 * Stackra file contract:
 * Purpose: proves the web NotificationPreferences reads the scope's rows through the container's
 *          `NotificationPreferencesClient` into one group of named switches per topic, shows a locked channel
 *          disabled with the host's words, offers only the `channels` asked for (leaving out a topic with none of them), saves only the changed switches and
 *          announces it, shows the host's words in an alert when a save fails, offers a retry when the read fails,
 *          and keeps its switches named under `dir="rtl"`.
 * Boundary: unit tier, jsdom, the real @stackra/ui components and the `MemoryNotificationPreferencesClientDriver` of
 *           `./testing` bound in a container.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0260; ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { NotificationPreferencesClient } from "#contracts/ports/notification-preferences-client.port";
import type { NotificationPreferenceRow } from "#contracts/types/notification-preference-row.type";
import { NotificationPreferences } from "#react/notification-preferences/notification-preferences";
import { MemoryNotificationPreferencesClientDriver } from "#testing/drivers/memory-notification-preferences-client.driver";

const ROWS: readonly NotificationPreferenceRow[] = [
  {
    topic: "orders",
    label: "Order updates",
    description: "When an order is paid or shipped",
    channels: {
      mail: { isEnabled: true, isLocked: false },
      push: { isEnabled: false, isLocked: false },
    },
  },
  {
    topic: "security",
    label: "Security",
    channels: { mail: { isEnabled: true, isLocked: true } },
  },
];

const LABELS = {
  title: "Notifications",
  channels: {
    mail: "Email",
    sms: "Text message",
    whatsapp: "WhatsApp",
    push: "Push",
    in_app: "In the app",
    chat: "Chat",
    voice: "Voice call",
  },
  locked: "Always on",
  loading: "Loading preferences",
  loadFailed: "Your preferences could not be loaded.",
  retry: "Try again",
  empty: "There is nothing to set yet.",
  save: "Save preferences",
  saved: "Preferences saved",
  saveFailed: "Your preferences could not be saved.",
};

/** A container binding `driver` as the preferences port, and a wrapper that provides it. */
async function setUp(driver = new MemoryNotificationPreferencesClientDriver().seed("user", ROWS)) {
  const container = await Container.create([], {
    overrides: new Map([[NotificationPreferencesClient, driver]]),
  });
  const wrap = (children: ReactNode, dir: "ltr" | "rtl" = "ltr") => (
    <ContainerProvider container={container}>
      <div dir={dir}>{children}</div>
    </ContainerProvider>
  );
  return { driver, wrap };
}

/** The switch named `channel` in the group of `topic`. */
const toggle = async (topic: string, channel: string) =>
  within(await screen.findByRole("group", { name: topic })).getByRole("switch", { name: channel });

describe("NotificationPreferences (web)", () => {
  afterEach(cleanup);

  it("reads the rows into one group of named switches per topic", async () => {
    const { wrap } = await setUp();
    render(wrap(<NotificationPreferences labels={LABELS} />));
    expect(((await toggle("Order updates", "Email")) as HTMLInputElement).checked).toBe(true);
    expect(((await toggle("Order updates", "Push")) as HTMLInputElement).checked).toBe(false);
    expect(screen.getByText("When an order is paid or shipped")).toBeTruthy();
  });

  it("shows a locked channel disabled with the host's words", async () => {
    const { wrap } = await setUp();
    render(wrap(<NotificationPreferences labels={LABELS} />));
    const locked = (await toggle("Security", "Email")) as HTMLInputElement;
    expect(locked.disabled).toBe(true);
    expect(screen.getByText("Always on")).toBeTruthy();
  });

  it("offers only the channels asked for", async () => {
    const { wrap } = await setUp();
    render(wrap(<NotificationPreferences channels={["push"]} labels={LABELS} />));
    const group = await screen.findByRole("group", { name: "Order updates" });
    expect(within(group).getAllByRole("switch")).toHaveLength(1);
    expect(screen.queryByRole("group", { name: "Security" })).toBeNull();
  });

  it("saves only the changed switches and announces it", async () => {
    const { driver, wrap } = await setUp();
    render(wrap(<NotificationPreferences labels={LABELS} />));
    const push = await toggle("Order updates", "Push");
    push.focus();
    await act(async () => {
      fireEvent.click(push);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save preferences" }));
    });
    expect(driver.saves).toEqual([
      { scope: "user", changes: [{ topic: "orders", channel: "push", isEnabled: true }] },
    ]);
    expect((await screen.findByRole("status")).textContent).toBe("Preferences saved");
    expect(((await toggle("Order updates", "Push")) as HTMLInputElement).checked).toBe(true);
  });

  it("shows the host's words in an alert when a save fails", async () => {
    const { driver, wrap } = await setUp();
    vi.spyOn(driver, "set").mockRejectedValue(new Error("refused"));
    render(wrap(<NotificationPreferences labels={LABELS} />));
    const push = await toggle("Order updates", "Push");
    await act(async () => {
      fireEvent.click(push);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save preferences" }));
    });
    expect(await screen.findByText("Your preferences could not be saved.")).toBeTruthy();
  });

  it("offers a retry when the read fails", async () => {
    const { driver, wrap } = await setUp();
    const get = vi.spyOn(driver, "get").mockRejectedValueOnce(new Error("offline"));
    render(wrap(<NotificationPreferences labels={LABELS} />));
    expect(await screen.findByText("Your preferences could not be loaded.")).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    });
    expect(await toggle("Order updates", "Email")).toBeTruthy();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("keeps its switches named under dir=rtl", async () => {
    const { wrap } = await setUp();
    render(
      wrap(
        <NotificationPreferences
          labels={{ ...LABELS, channels: { ...LABELS.channels, mail: "البريد" } }}
        />,
        "rtl",
      ),
    );
    const mail = await toggle("Order updates", "البريد");
    expect(mail.closest("[dir='rtl']")).toBeTruthy();
  });
});
