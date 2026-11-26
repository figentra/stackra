/**
 * Stackra file contract:
 * Purpose: proves the web Schematic is a group named by its label whose nodes read and take focus in DOM order while
 *          the pipes stay hidden and unfocusable; that it measures its nodes and draws each link down, across and
 *          down with one junction where pipes turn and none on a straight pipe; that it re-measures on resize; that
 *          right-to-left draws where the mirrored layout put the nodes, without flipping; and that it draws in on
 *          80 ms floor steps (a chained pipe after the one it leaves from) at full motion, and at once under reduced
 *          motion or without `drawOnView`.
 * Boundary: jsdom has no layout, so `getBoundingClientRect` answers from a table keyed by the node name, the machine
 *           at the origin; there is no IntersectionObserver, so drawing starts at once; `ResizeObserver` is a stand-in
 *           the test fires by hand; fake timers; `useReducedMotion` is stubbed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); ADR 0501 (section 9); WCAG 2.2 SC 2.3.3;
 *          STA-2041.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { Schematic } from "#react/schematic/schematic";
import { SchematicNode } from "#react/schematic/schematic-node";

const state = vi.hoisted(() => ({ isReduced: false }));
vi.mock("motion/react", async (load) => ({
  ...(await load<object>()),
  useReducedMotion: () => state.isReduced,
}));

/** Each node's box: left, top, width, height. The machine itself sits at the origin. */
let boxes: Record<string, readonly [number, number, number, number]> = {};

/** Left to right: the action above, the web and phone surfaces below it, the MCP tool under the phone. */
const LTR = {
  action: [100, 0, 100, 40],
  web: [0, 100, 100, 40],
  phone: [200, 100, 100, 40],
  mcp: [200, 200, 100, 40],
} as const;

const LINKS = [
  { from: "action", to: "web" },
  { from: "action", to: "phone" },
  { from: "phone", to: "mcp" },
] as const;

let resize: () => void = () => {};

/** The machine with three surfaces and a tool, each with a button. */
const machine = (drawOnView?: boolean) => (
  <Schematic
    label="One action, every surface"
    links={LINKS}
    {...(drawOnView === undefined ? {} : { drawOnView })}
    className="grid grid-cols-3"
  >
    {(["action", "web", "phone", "mcp"] as const).map((id) => (
      <SchematicNode key={id} id={id}>
        <button type="button">{id}</button>
      </SchematicNode>
    ))}
  </Schematic>
);

const paths = () =>
  [...document.querySelectorAll('[data-slot="schematic-pipes"] path')].map((path) =>
    path.getAttribute("d"),
  );
/** Runs `count` floor steps, one act each, so every step's effect schedules the next. */
const steps = (count: number) => {
  for (let index = 0; index < count; index++) act(() => vi.advanceTimersByTime(80));
};

const junctions = () => [
  ...document.querySelectorAll<HTMLElement>('[data-slot="schematic-junction"]'),
];

describe("Schematic (web)", () => {
  beforeEach(() => {
    state.isReduced = false;
    boxes = LTR;
    vi.useFakeTimers();
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (
      this: Element,
    ) {
      const name = this instanceof HTMLElement ? this.dataset.schematicNode : undefined;
      const [left, top, width, height] = boxes[name ?? ""] ?? [0, 0, 300, 240];
      return {
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON: () => ({}),
      };
    });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          resize = callback;
        }

        observe() {}

        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("is a named group whose nodes take focus in DOM order while the pipes stay hidden", () => {
    state.isReduced = true;
    render(machine());
    const group = screen.getByRole("group", { name: "One action, every surface" });
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual(["action", "web", "phone", "mcp"]);
    for (const button of buttons) {
      button.focus();
      expect(document.activeElement).toBe(button);
    }
    const pipes = group.querySelector('[data-slot="schematic-pipes"]');
    expect(pipes?.getAttribute("aria-hidden")).toBe("true");
    expect(pipes?.querySelectorAll("a, button, [tabindex]")).toHaveLength(0);
    expect(pipes?.querySelector("svg")?.getAttribute("class")).toContain(
      "[stroke:var(--blueprint-pipe)]",
    );
  });

  it("draws each link down, across and down at once under reduced motion, with one junction", () => {
    state.isReduced = true;
    const { container } = render(machine());
    expect(paths()).toEqual([
      "M150 40 L150 70 L50 70 L50 100",
      "M150 40 L150 70 L250 70 L250 100",
      "M250 140 L250 170 L250 170 L250 200",
    ]);
    // Both turns share the one junction under the action; the straight pipe has none.
    expect(junctions()).toHaveLength(1);
    expect(junctions()[0]?.style.left).toBe("150px");
    expect(junctions()[0]?.style.top).toBe("70px");
    expect(junctions()[0]?.className).toContain("size-(--blueprint-junction-size)");
    expect(container.querySelector('[data-slot="schematic"]')?.hasAttribute("data-drawn")).toBe(
      true,
    );
  });

  it("re-measures when it resizes", () => {
    state.isReduced = true;
    render(machine());
    boxes = { ...LTR, web: [0, 120, 100, 40] };
    act(() => resize());
    expect(paths()[0]).toBe("M150 40 L150 80 L50 80 L50 120");
  });

  it("draws where the mirrored layout put the nodes in right-to-left, without flipping", () => {
    state.isReduced = true;
    boxes = {
      action: [100, 0, 100, 40],
      web: [200, 100, 100, 40],
      phone: [0, 100, 100, 40],
      mcp: [0, 200, 100, 40],
    };
    render(<I18nProvider locale="ar">{machine()}</I18nProvider>);
    expect(paths()).toEqual([
      "M150 40 L150 70 L250 70 L250 100",
      "M150 40 L150 70 L50 70 L50 100",
      "M50 140 L50 170 L50 170 L50 200",
    ]);
    const svg = document.querySelector('[data-slot="schematic-pipes"] svg');
    expect(svg?.getAttribute("class")).not.toMatch(/scale|rotate|rtl:/);
    expect(svg?.hasAttribute("transform")).toBe(false);
  });

  it("draws in on 80 ms floor steps at full motion, a chained pipe after the one it leaves", () => {
    const { container } = render(machine());
    const machineElement = container.querySelector('[data-slot="schematic"]');
    expect(paths()).toEqual([]);
    expect(machineElement?.hasAttribute("data-drawn")).toBe(false);
    steps(1);
    expect(paths()).toEqual(["M150 40 L150 70", "M150 40 L150 70"]);
    expect(junctions()).toHaveLength(0);
    steps(1);
    expect(paths()).toEqual(["M150 40 L150 70 L50 70", "M150 40 L150 70 L250 70"]);
    expect(junctions()).toHaveLength(1);
    steps(2);
    expect(paths()).toHaveLength(3);
    expect(paths()[2]).toBe("M250 140 L250 170");
    steps(2);
    expect(paths()[2]).toBe("M250 140 L250 170 L250 170 L250 200");
    expect(machineElement?.hasAttribute("data-drawn")).toBe(true);
  });

  it("draws at once at full motion without drawOnView", () => {
    render(machine(false));
    expect(paths()).toHaveLength(3);
  });
});
