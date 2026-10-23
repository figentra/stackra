/**
 * Stackra file contract:
 * Purpose: proves the native StatusBadge is a neutral chip whatever its tone, puts a 6 pt dot first in the tone's
 *          theme colour, gives the dot no accessibility name and the badge no live region, forwards `size`, and
 *          refuses `variant`.
 * Boundary: React Native does not render in vitest, so heroui-native, lucide-react-native and react-native are replaced
 *          by recording stand-ins that render plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0304 (decision 4); WCAG 2.2 SC 1.4.1; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-033 sta-350:FR-035 sta-350:P-023 sta-350:P-024
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { Tone } from "#contracts/enums/tone.enum";
import { STATUS_DOT_ROLE } from "#core/constants/status-dot-role.constant";
import { StatusBadge } from "#native/status-badge/status-badge";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Chip: Object.assign(record("chip"), { Label: record("label") }),
    useThemeColor: (name: string) => `color:${name}`,
  };
});

vi.mock("lucide-react-native", async () => {
  const { createElement } = await import("react");
  return {
    LucideProvider: (props: Record<string, unknown>) =>
      createElement("div", { "data-testid": "provider" }, props["children"] as ReactNode),
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      received.props["view"] = props;
      return createElement("div", { "data-testid": "view" });
    },
  };
});

const propsOf = (name: string) => received.props[name] ?? {};

describe("StatusBadge (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it.each(Tone)("is a neutral chip with a %s dot in the tone's theme colour", (tone) => {
    const { container } = render(<StatusBadge tone={tone}>Active</StatusBadge>);
    expect(propsOf("chip")).toMatchObject({ variant: "secondary", color: "default" });
    expect(propsOf("view")["style"]).toEqual({
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: `color:${STATUS_DOT_ROLE[tone]}`,
    });
    // The dot comes first, then the label, inside the chip's provider.
    const provider = container.querySelector('[data-testid="provider"]');
    expect([...(provider?.children ?? [])].map((node) => node.getAttribute("data-testid"))).toEqual(
      ["view", "label"],
    );
  });

  it("draws a neutral dot without a tone", () => {
    render(<StatusBadge>Draft</StatusBadge>);
    expect((propsOf("view")["style"] as Record<string, unknown>)["backgroundColor"]).toBe(
      "color:muted",
    );
  });

  it("names nothing but the text and announces nothing", () => {
    render(<StatusBadge tone="danger">Failed</StatusBadge>);
    expect(propsOf("label")["children"]).toBe("Failed");
    for (const name of ["view", "chip"]) {
      expect(propsOf(name)).not.toHaveProperty("accessibilityLabel");
      expect(propsOf(name)).not.toHaveProperty("accessibilityLiveRegion");
    }
  });

  it("forwards the size to the chip", () => {
    render(<StatusBadge size="lg">Active</StatusBadge>);
    expect(propsOf("chip")["size"]).toBe("lg");
  });

  it("types: refuses `variant`", () => {
    // @ts-expect-error the badge is always a neutral chip
    render(<StatusBadge variant="soft">Active</StatusBadge>);
  });
});
