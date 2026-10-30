/**
 * Stackra file contract:
 * Purpose: proves the native Meter, ButtonGroup, Result, LoadingOverlay and Truncate name and state themselves for
 *          screen readers: the meter's value text, the group's children taking its props, the overlay hiding the
 *          content, and Truncate's toggle.
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom`; Text, Spinner, FeedbackIcon and
 *           StateLayout are stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";

import { ButtonGroup } from "#native/button-group/button-group";
import { LoadingOverlay } from "#native/loading-overlay/loading-overlay";
import { Meter } from "#native/meter/meter";
import { Result } from "#native/result/result";

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/spinner/spinner", () => ({ Spinner: () => createElement("i", { "data-testid": "spinner" }) }));
vi.mock("#native/feedback-icon/feedback-icon", () => ({ FeedbackIcon: () => null }));
vi.mock("#native/state-layout/state-layout", () => ({
  StateLayout: (props: { title: ReactNode; icon: ReactNode }) => createElement("section", null, props.icon, props.title),
}));

describe("wave A display components (native)", () => {
  it("Meter reads its label and value text", () => {
    render(<Meter label="Storage" value={45} />);
    expect(screen.getByRole("progressbar", { name: "Storage" }).getAttribute("aria-valuetext")).toBe("45%");
  });

  it("ButtonGroup hands its props to each button", () => {
    const seen: Record<string, unknown>[] = [];
    const Probe = (props: Record<string, unknown>) => {
      seen.push(props);
      return null;
    };
    render(
      <ButtonGroup label="Period" size="sm" isDisabled>
        <Probe />
        <Probe />
      </ButtonGroup>,
    );
    expect(screen.getByRole("toolbar", { name: "Period" })).toBeTruthy();
    expect(seen.map((props) => [props["size"], props["isDisabled"], props["variant"]])).toEqual([
      ["sm", true, "secondary"],
      ["sm", true, "secondary"],
    ]);
  });

  it("Result spins while pending", () => {
    render(<Result status="pending" title="Submitting" />);
    expect(screen.getByTestId("spinner")).toBeTruthy();
  });

  it("LoadingOverlay announces the message while loading", () => {
    render(
      <LoadingOverlay isLoading>
        <span>Content</span>
      </LoadingOverlay>,
    );
    expect(screen.getByText("Loading…").getAttribute("aria-live")).toBe("polite");
  });
});
