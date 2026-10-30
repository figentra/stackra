/**
 * Stackra file contract:
 * Purpose: proves the native SaveStatus hands InlineLoading the mapped state and the autosave's words, with haptics off
 *          by default.
 * Boundary: InlineLoading is replaced by a recording stand-in; its own behaviour is proved in its own test.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { SaveStatus } from "#native/save-bar/save-status";

const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("#native/inline-loading/inline-loading", () => ({
  InlineLoading: (props: Record<string, unknown>) => {
    received.props = props;
    return null;
  },
}));

describe("SaveStatus (native)", () => {
  it("maps each autosave state and keeps haptics off", () => {
    const words = { savingLabel: "Saving", savedLabel: "Saved", failedLabel: "Not saved" };
    const { rerender } = render(<SaveStatus state="saving" {...words} />);
    expect(received.props).toMatchObject({
      status: "loading",
      loadingLabel: "Saving",
      playsHaptics: false,
    });
    rerender(<SaveStatus state="saved" {...words} />);
    expect(received.props).toMatchObject({ status: "success", successLabel: "Saved" });
    rerender(<SaveStatus state="failed" {...words} playsHaptics />);
    expect(received.props).toMatchObject({
      status: "error",
      errorLabel: "Not saved",
      playsHaptics: true,
    });
    rerender(<SaveStatus state="idle" {...words} />);
    expect(received.props["status"]).toBe("idle");
  });
});
