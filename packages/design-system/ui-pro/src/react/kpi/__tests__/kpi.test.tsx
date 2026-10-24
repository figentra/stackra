/**
 * Stackra file contract:
 * Purpose: proves the web Kpi maps `tone` to HeroUI Pro's `status` on its icon and progress bar, names the actions
 *          button from `label`, draws the metric, passes unknown props through, carries HeroUI Pro's own parts, and
 *          refuses HeroUI Pro's `status` and a tone outside success, warning and danger.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `ResizeObserver` is stubbed because jsdom has none and the
 *          chart measures its box through it; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-403:FR-007
import { KPI as HeroKpi } from "@heroui-pro/react/kpi";
import { render, screen } from "@testing-library/react";

import { Kpi, type KpiProps } from "#react/kpi/kpi";
import type { KpiActionsProps } from "#react/kpi/kpi-actions";
import type { KpiIconProps } from "#react/kpi/kpi-icon";
import type { KpiProgressProps } from "#react/kpi/kpi-progress";

describe("Kpi (web)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("draws the metric in HeroUI Pro's parts and passes unknown props through", () => {
    render(
      <Kpi data-testid="card" className="extra">
        <Kpi.Header>
          <Kpi.Title>Revenue</Kpi.Title>
        </Kpi.Header>
        <Kpi.Content>
          <Kpi.Value value={1200} />
          <Kpi.Trend trend="up">4%</Kpi.Trend>
        </Kpi.Content>
        <Kpi.Separator />
        <Kpi.Footer>Since last month</Kpi.Footer>
      </Kpi>,
    );
    const card = screen.getByTestId("card");
    expect(card.classList.contains("extra")).toBe(true);
    expect(screen.getByText("Revenue")).toBeTruthy();
    expect(screen.getByText("Since last month")).toBeTruthy();
    expect(card.textContent).toContain("1,200");
  });

  it("gives the title's dt and the value's dd a dl parent that is neither announced nor laid out", () => {
    render(
      <Kpi>
        <Kpi.Header data-testid="header">
          <Kpi.Title>Revenue</Kpi.Title>
        </Kpi.Header>
        <Kpi.Content data-testid="content">
          <Kpi.Value value={1200} />
        </Kpi.Content>
      </Kpi>,
    );
    const title = screen.getByText("Revenue");
    expect(title.tagName).toBe("DT");
    const value = screen.getByTestId("content").querySelector("dd");
    for (const item of [title, value]) {
      const list = item?.parentElement;
      expect(list?.tagName).toBe("DL");
      expect(list?.getAttribute("role")).toBe("none");
      expect(list?.style.display).toBe("contents");
    }
    expect(screen.getByTestId("header").dataset["slot"]).toBe("kpi-header");
  });

  it("maps tone to HeroUI Pro's status on the icon, and keeps HeroUI Pro's default without one", () => {
    const { rerender } = render(
      <Kpi.Icon tone="danger" data-testid="icon">
        i
      </Kpi.Icon>,
    );
    const tinted = screen.getByTestId("icon").outerHTML;
    rerender(<Kpi.Icon data-testid="icon">i</Kpi.Icon>);
    const plain = screen.getByTestId("icon").outerHTML;
    expect(tinted).not.toBe(plain);
    rerender(
      <HeroKpi.Icon status="danger" data-testid="icon">
        i
      </HeroKpi.Icon>,
    );
    expect(screen.getByTestId("icon").outerHTML).toBe(tinted);
  });

  it("maps tone to status on the progress bar", () => {
    const { rerender } = render(<Kpi.Progress value={40} tone="danger" />);
    const bar = screen.getByRole("progressbar", { name: "Progress" });
    expect(bar.getAttribute("aria-valuenow")).toBe("40");
    expect(bar.classList.contains("progress-bar--danger")).toBe(true);
    rerender(<Kpi.Progress value={40} />);
    expect(screen.getByRole("progressbar").classList.contains("progress-bar--success")).toBe(true);
  });

  it("names the actions button from label and presses once", () => {
    const onPress = vi.fn();
    render(<Kpi.Actions label="Card actions" onPress={onPress} />);
    const button = screen.getByRole("button", { name: "Card actions" });
    button.click();
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of ["Title", "Value", "Trend", "Chart", "Separator", "Footer"] as const) {
      expect(Kpi[part]).toBe(HeroKpi[part]);
    }
  });

  it("refuses HeroUI Pro's status name and the tones a KPI cannot take", () => {
    expectTypeOf<KpiProps>().toHaveProperty("children");
    expectTypeOf<KpiIconProps>().toHaveProperty("tone");
    expectTypeOf<KpiProgressProps>().toHaveProperty("tone");
    expectTypeOf<KpiActionsProps>().toHaveProperty("label");
    // @ts-expect-error `tone` is the one name for the colour role
    void (<Kpi.Icon status="danger">i</Kpi.Icon>);
    // @ts-expect-error `tone` is the one name for the colour role
    void (<Kpi.Progress value={1} status="danger" />);
    // @ts-expect-error `label` is required: HeroUI Pro gives this part no accessible name of its own
    void (<Kpi.Actions aria-label="x" />);
    // @ts-expect-error a KPI tint is success, warning or danger
    void (<Kpi.Icon tone="accent">i</Kpi.Icon>);
  });
});
