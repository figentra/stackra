/**
 * Stackra file contract:
 * Purpose: unit tests of `AppLockGate`: off by default it only renders the app; on, it prompts at launch, shows the
 *          unlock button after a cancel, covers the app in the app switcher, locks again after `lockAfter` in the
 *          background but not after a shorter trip, and never locks a phone that cannot authenticate.
 * Boundary: test only. React Native does not render in vitest, so react-native is replaced by stand-ins that render
 *           plain DOM and record the AppState listener; the lock is the memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (2026-10-29 note).
 */
// @vitest-environment jsdom
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import type { Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { Duration } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { AppLockConfig } from "#config/app-lock.config";
import { AppLock } from "#contracts/ports/app-lock.port";
import { MemoryAppLockDriver } from "#core/drivers/memory-app-lock.driver";
import { AppLockGate } from "#native/components/app-lock-gate";

const appState = vi.hoisted(() => ({
  currentState: "active",
  listeners: [] as ((state: string) => void)[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  type Props = Record<string, unknown> & { children?: ReactNode };
  return {
    AppState: {
      get currentState() {
        return appState.currentState;
      },
      addEventListener: (_event: string, listener: (state: string) => void) => {
        appState.listeners.push(listener);
        return { remove: () => appState.listeners.splice(appState.listeners.indexOf(listener), 1) };
      },
    },
    StyleSheet: { create: (styles: object) => styles, absoluteFill: {} },
    View: ({ testID, children }: Props) =>
      createElement("div", { "data-testid": testID }, children),
    Pressable: ({ onPress, children }: Props) =>
      createElement("button", { type: "button", onClick: onPress as () => void }, children),
    Text: ({ children }: Props) => createElement("span", null, children),
  };
});

/** The app lock on, five minutes in the background before it locks again. */
class OnAppLockConfig extends AppLockConfig {
  override isEnabled = true;
}

/** Moves the app to `state`, as the OS reports it. */
function move(state: string): void {
  act(() => appState.listeners.forEach((listener) => listener(state)));
}

/** Renders the gate over a container with `config` and `lock`. */
async function mount(config: AppLockConfig, lock: MemoryAppLockDriver): Promise<void> {
  const container = await Container.create([], {
    overrides: new Map<Token, object>([
      [AppLockConfig, config],
      [AppLock, lock],
    ]),
  });
  render(
    <ContainerProvider container={container}>
      <AppLockGate
        roleName={null}
        reason="Unlock"
        unlockLabel="Try again"
        coverColor="#000"
        textColor="#fff"
      >
        <span>content</span>
      </AppLockGate>
    </ContainerProvider>,
  );
}

describe("AppLockGate", () => {
  afterEach(() => {
    appState.listeners.length = 0;
    vi.restoreAllMocks();
  });

  it("renders only the app when the lock is off", async () => {
    const lock = new MemoryAppLockDriver();
    await mount(buildConfig(AppLockConfig), lock);
    move("background");
    move("active");
    expect(screen.getByText("content")).toBeTruthy();
    expect(screen.queryByTestId("app-lock-cover")).toBeNull();
    expect(lock.prompts).toEqual([]);
  });

  it("prompts at launch and uncovers the app once proven", async () => {
    const lock = new MemoryAppLockDriver();
    await mount(buildConfig(OnAppLockConfig), lock);
    await waitFor(() => expect(screen.queryByTestId("app-lock-cover")).toBeNull());
    expect(lock.prompts).toEqual(["Unlock"]);
  });

  it("offers the unlock button after a cancel and prompts again on press", async () => {
    const lock = new MemoryAppLockDriver();
    lock.answer = false;
    await mount(buildConfig(OnAppLockConfig), lock);
    const retry = await screen.findByText("Try again");
    lock.answer = true;
    fireEvent.click(retry);
    await waitFor(() => expect(screen.queryByTestId("app-lock-cover")).toBeNull());
    expect(lock.prompts).toEqual(["Unlock", "Unlock"]);
  });

  it("covers the app in the switcher and locks again only after lockAfter", async () => {
    const lock = new MemoryAppLockDriver();
    const now = vi.spyOn(Date, "now").mockReturnValue(0);
    await mount(buildConfig(OnAppLockConfig), lock);
    await waitFor(() => expect(screen.queryByTestId("app-lock-cover")).toBeNull());

    move("inactive");
    expect(screen.getByTestId("app-lock-cover")).toBeTruthy();
    move("background");
    now.mockReturnValue(Duration.toMilliseconds(Duration.minutes(1)));
    move("active");
    expect(screen.queryByTestId("app-lock-cover")).toBeNull();
    expect(lock.prompts).toHaveLength(1);

    move("background");
    now.mockReturnValue(Duration.toMilliseconds(Duration.minutes(7)));
    move("active");
    await waitFor(() => expect(lock.prompts).toHaveLength(2));
  });

  it("never locks a phone that cannot authenticate", async () => {
    const lock = new MemoryAppLockDriver();
    lock.isAvailable = false;
    await mount(buildConfig(OnAppLockConfig), lock);
    await waitFor(() => expect(screen.queryByTestId("app-lock-cover")).toBeNull());
    expect(lock.prompts).toEqual([]);
  });
});
