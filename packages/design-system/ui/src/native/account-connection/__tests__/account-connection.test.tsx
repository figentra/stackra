/**
 * Stackra file contract:
 * Purpose: proves the native AccountConnection shows the neutral status and a primary connect button while not
 *          connected, the success status, the account and a secondary disconnect button while connected, wires the
 *          matching handler, and plays the success haptic only when the state turns to connected.
 * Boundary: React Native and Reanimated do not run in vitest, so the parts and Reanimated are replaced by recording
 *           stand-ins that render plain DOM, and the haptics player is spied on.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { AccountConnection } from "#native/account-connection/account-connection";

const state = vi.hoisted(() => ({
  button: {} as Record<string, unknown>,
  badge: {} as Record<string, unknown>,
  played: [] as string[],
}));

const passThrough = vi.hoisted(() => async () => {
  const { createElement } = await import("react");
  return ({ children }: { children?: ReactNode }) => createElement("div", null, children);
});

vi.mock("react-native", async () => ({ View: await passThrough() }));
vi.mock("react-native-reanimated", async () => {
  const builder: Record<string, () => unknown> = {};
  builder["duration"] = () => builder;
  builder["reduceMotion"] = () => builder;
  return {
    default: { View: await passThrough() },
    FadeIn: builder,
    FadeOut: builder,
    ReduceMotion: { System: "system" },
  };
});
vi.mock("#native/card/card", async () => ({ Card: await passThrough() }));
vi.mock("#native/text/text", async () => ({ Text: await passThrough() }));
vi.mock("#native/status-badge/status-badge", async () => {
  const { createElement } = await import("react");
  return {
    StatusBadge: (props: Record<string, unknown>) => {
      state.badge = props;
      return createElement("span", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) => {
      state.button = props;
      return createElement("button", { type: "button" }, props["children"] as ReactNode);
    },
  };
});
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));

const WORDS = {
  title: "Talabat",
  connectedLabel: "Connected",
  disconnectedLabel: "Not connected",
  connectLabel: "Connect",
  disconnectLabel: "Disconnect",
} as const;

describe("AccountConnection (native)", () => {
  beforeEach(() => {
    state.played = [];
  });

  it("offers to connect while not connected", () => {
    const onConnect = vi.fn();
    render(<AccountConnection {...WORDS} isConnected={false} onConnect={onConnect} />);
    expect(state.badge).toMatchObject({ tone: "default", children: "Not connected" });
    expect(state.button).toMatchObject({
      variant: "primary",
      onPress: onConnect,
      children: "Connect",
    });
    expect(state.played).toEqual([]);
  });

  it("shows the account, offers to disconnect and plays success once on connecting", () => {
    const onDisconnect = vi.fn();
    const { rerender } = render(<AccountConnection {...WORDS} isConnected={false} />);
    rerender(
      <AccountConnection
        {...WORDS}
        isConnected
        accountName="store-4471"
        onDisconnect={onDisconnect}
      />,
    );
    expect(screen.getByText("store-4471")).toBeTruthy();
    expect(state.badge).toMatchObject({ tone: "success", children: "Connected" });
    expect(state.button).toMatchObject({ variant: "secondary", onPress: onDisconnect });
    rerender(<AccountConnection {...WORDS} isConnected accountName="store-4471" />);
    expect(state.played).toEqual(["success"]);
  });
});
