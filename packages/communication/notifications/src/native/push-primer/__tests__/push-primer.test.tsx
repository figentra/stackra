/**
 * Stackra file contract:
 * Purpose: proves the native PushPrimer shows the host's words as a heading and two buttons, asks the container's
 *          `PushRegistration` with the trigger and idempotency key and reports its answer, reports `prompt` for "not
 *          now" without asking, shows the host's words in an alert when the registration fails, lays the sheet and
 *          the inline card out differently, and renders under `dir="rtl"`.
 * Boundary: unit tier, jsdom. React Native does not render in vitest, so `@stackra/ui/native` is replaced by DOM
 *           stand-ins that keep the parts' roles (the title a heading, the buttons buttons, the alert an alert); the
 *           `MemoryPushRegistrationDriver` of `./testing` and its container are real.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0260; ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { PushRegistration } from "#contracts/ports/push-registration.port";
import { PushPrimer } from "#native/push-primer/push-primer";
import { MemoryPushRegistrationDriver } from "#testing/drivers/memory-push-registration.driver";

/** What the stand-ins receive. */
interface StandInProps {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly title?: string;
  readonly isDisabled?: boolean;
  readonly isLoading?: boolean;
  readonly onPress?: () => void;
}

vi.mock("@stackra/ui/native", async () => {
  const { createElement } = await import("react");
  const part =
    (tag: string, extra: Record<string, unknown> = {}) =>
    ({ children, className }: StandInProps) =>
      createElement(tag, { className, ...extra }, children);
  return {
    Card: Object.assign(part("section", { "data-part": "card" }), {
      Header: part("header"),
      Title: part("h2"),
      Description: part("p"),
      Footer: part("footer", { "data-part": "footer" }),
    }),
    Icon: () => null,
    Alert: ({ title }: StandInProps) => createElement("div", { role: "alert" }, title),
    Button: ({ children, isDisabled, isLoading, onPress }: StandInProps) =>
      createElement(
        "button",
        { type: "button", disabled: isDisabled === true || isLoading === true, onClick: onPress },
        children,
      ),
  };
});

const LABELS = {
  title: "Stay in the loop",
  description: "We'll tell you when an order is ready.",
  enable: "Turn on notifications",
  later: "Not now",
  failed: "Notifications could not be turned on. Try again.",
};

/** A container binding `driver` as the registration port, and a wrapper that provides it. */
async function setUp(driver = new MemoryPushRegistrationDriver()) {
  const container = await Container.create([], {
    overrides: new Map([[PushRegistration, driver]]),
  });
  const wrap = (children: ReactNode, dir: "ltr" | "rtl" = "ltr") => (
    <ContainerProvider container={container}>
      <div dir={dir}>{children}</div>
    </ContainerProvider>
  );
  return { driver, wrap };
}

describe("PushPrimer (native)", () => {
  afterEach(cleanup);

  it("shows the host's words as a heading and two buttons", async () => {
    const { wrap } = await setUp();
    render(wrap(<PushPrimer trigger="onboarding" labels={LABELS} />));
    expect(screen.getByRole("heading", { name: "Stay in the loop" })).toBeTruthy();
    expect(screen.getByText("We'll tell you when an order is ready.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Turn on notifications" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Not now" })).toBeTruthy();
  });

  it("asks the port with the trigger and key and reports its answer", async () => {
    const { driver, wrap } = await setUp();
    const onPermission = vi.fn();
    render(
      wrap(
        <PushPrimer
          trigger="onboarding"
          idempotencyKey="step-3"
          onPermission={onPermission}
          labels={LABELS}
        />,
      ),
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Turn on notifications" }));
    });
    expect(onPermission).toHaveBeenCalledWith("granted");
    expect(driver.registrations).toEqual([{ trigger: "onboarding", idempotencyKey: "step-3" }]);
  });

  it("reports a refusal as the port answers it", async () => {
    const { wrap } = await setUp(new MemoryPushRegistrationDriver().answers("denied"));
    const onPermission = vi.fn();
    render(wrap(<PushPrimer trigger="settings" onPermission={onPermission} labels={LABELS} />));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Turn on notifications" }));
    });
    expect(onPermission).toHaveBeenCalledWith("denied");
  });

  it("reports prompt for not now without asking", async () => {
    const { driver, wrap } = await setUp();
    const spy = vi.spyOn(driver, "register");
    const onPermission = vi.fn();
    render(wrap(<PushPrimer trigger="onboarding" onPermission={onPermission} labels={LABELS} />));
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(onPermission).toHaveBeenCalledWith("prompt");
    expect(spy).not.toHaveBeenCalled();
  });

  it("shows the host's words in an alert when the registration fails", async () => {
    const { driver, wrap } = await setUp();
    vi.spyOn(driver, "register").mockRejectedValue(new Error("offline"));
    const onPermission = vi.fn();
    render(wrap(<PushPrimer trigger="onboarding" onPermission={onPermission} labels={LABELS} />));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Turn on notifications" }));
    });
    expect((await screen.findByRole("alert")).textContent).toBe(LABELS.failed);
    expect(onPermission).not.toHaveBeenCalled();
    expect(
      (screen.getByRole("button", { name: "Turn on notifications" }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it("lays the sheet and the inline card out differently", async () => {
    const { wrap } = await setUp();
    const { container, rerender } = render(
      wrap(<PushPrimer trigger="onboarding" labels={LABELS} />),
    );
    expect(container.querySelector("[data-part='footer']")?.className).toContain("flex-col");
    rerender(wrap(<PushPrimer trigger="onboarding" variant="inline" labels={LABELS} />));
    expect(container.querySelector("[data-part='footer']")?.className).toContain("flex-row");
  });

  it("renders under dir=rtl", async () => {
    const { wrap } = await setUp();
    render(
      wrap(
        <PushPrimer trigger="onboarding" labels={{ ...LABELS, title: "ابقَ على اطلاع" }} />,
        "rtl",
      ),
    );
    const heading = screen.getByRole("heading", { name: "ابقَ على اطلاع" });
    expect(heading.closest("[dir='rtl']")).toBeTruthy();
  });
});
