/**
 * Stackra file contract:
 * Purpose: proves the back-button block registers one hardware back handler that reports the press as handled while
 *          `isBlocked`, registers none otherwise, takes its handler away when it stops blocking or unmounts, and draws
 *          nothing.
 * Boundary: React Native does not render in vitest, so react-native is replaced by a recording `BackHandler`; that
 *           React Native calls the last registered handler first is its documented behaviour and is checked on a
 *           device, not here.
 * Runtime: node
 * Governing contract: ADR 0312 (decision 1 and Consequences); WCAG 2.2 SC 2.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-100
import { render } from "@testing-library/react";

import { BackButtonBlock } from "#native/modal/back-button-block";

/** The back handlers the stand-in `BackHandler` currently holds, in registration order. */
const held = vi.hoisted(() => ({ handlers: [] as (() => boolean)[] }));

vi.mock("react-native", () => ({
  BackHandler: {
    addEventListener: (_event: string, handler: () => boolean) => {
      held.handlers.push(handler);
      return {
        remove: () => {
          held.handlers.splice(held.handlers.indexOf(handler), 1);
        },
      };
    },
  },
}));

describe("BackButtonBlock (native)", () => {
  beforeEach(() => {
    held.handlers = [];
  });

  it("registers one handler that reports the press as handled while blocking", () => {
    render(<BackButtonBlock isBlocked />);
    expect(held.handlers).toHaveLength(1);
    expect(held.handlers[0]?.()).toBe(true);
  });

  it("registers nothing while not blocking", () => {
    render(<BackButtonBlock isBlocked={false} />);
    expect(held.handlers).toHaveLength(0);
  });

  it("takes its handler away when it stops blocking and when it unmounts", () => {
    const { rerender, unmount } = render(<BackButtonBlock isBlocked />);
    rerender(<BackButtonBlock isBlocked={false} />);
    expect(held.handlers).toHaveLength(0);
    rerender(<BackButtonBlock isBlocked />);
    expect(held.handlers).toHaveLength(1);
    unmount();
    expect(held.handlers).toHaveLength(0);
  });

  it("draws nothing", () => {
    const { container } = render(<BackButtonBlock isBlocked />);
    expect(container.innerHTML).toBe("");
  });
});
