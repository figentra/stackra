/**
 * Stackra file contract:
 * Purpose: proves the native FeedbackIcon draws each tone's own icon at the small size in the tone's theme colour with
 *          nothing registered by the app (the package's own registry holds them), an element as given, and a caller's named icon through the app's registry.
 * Boundary: React Native does not render in vitest: heroui-native is replaced by a recording stand-in, the Lucide icons
 *           by markers so the real Icon resolves a name through the
 *           registries, the package's own included, and draws the marker with the size and colour it would hand the real icon.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 10); ADR 0312 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-114
import { Enum, Tone } from "@stackra/contracts";
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/native";
import { render, screen } from "@testing-library/react";

import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { FEEDBACK_BY_TONE } from "#core/constants/feedback-by-tone.constant";
import { FeedbackIcon } from "#native/feedback-icon/feedback-icon";

vi.mock("heroui-native", () => ({
  useIsRTL: () => false,
  useThemeColor: (role: string) => `color:${role}`,
}));

/** A drawn icon: records the name it stands for and the props it is handed, as the real Svg would receive them. */
const marker = (name: string) => (props: object) => (
  <output data-testid="icon" data-name={name} data-props={JSON.stringify(props)} />
);

vi.mock("@stackra/icons/native/lucide-icons", async () => {
  const { createElement } = await import("react");
  const drawn = (name: string) => (props: object) =>
    createElement("output", {
      "data-testid": "icon",
      "data-name": name,
      "data-props": JSON.stringify(props),
    });
  return {
    ArrowDown: drawn("arrow-down"),
    ArrowUp: drawn("arrow-up"),
    ArrowUpDown: drawn("arrow-up-down"),
    Camera: drawn("camera"),
    ChartColumn: drawn("chart-column"),
    Check: drawn("check"),
    ChevronDown: drawn("chevron-down"),
    ChevronLeft: drawn("chevron-left"),
    ChevronRight: drawn("chevron-right"),
    CircleAlert: drawn("circle-alert"),
    CircleCheck: drawn("circle-check"),
    Copy: drawn("copy"),
    Download: drawn("download"),
    Ellipsis: drawn("ellipsis"),
    Eye: drawn("eye"),
    EyeOff: drawn("eye-off"),
    ExternalLink: drawn("external-link"),
    File: drawn("file"),
    GripVertical: drawn("grip-vertical"),
    Image: drawn("image"),
    ImageOff: drawn("image-off"),
    Images: drawn("images"),
    Info: drawn("info"),
    Link2: drawn("link-2"),
    Maximize2: drawn("maximize-2"),
    Minus: drawn("minus"),
    Pencil: drawn("pencil"),
    Plus: drawn("plus"),
    RefreshCw: drawn("refresh-cw"),
    RotateCcw: drawn("rotate-ccw"),
    SlidersHorizontal: drawn("sliders-horizontal"),
    Sparkles: drawn("sparkles"),
    Table2: drawn("table-2"),
    Trash: drawn("trash"),
    TriangleAlert: drawn("triangle-alert"),
    Upload: drawn("upload"),
    UserRound: drawn("user-round"),
    X: drawn("x"),
  };
});

const propsOf = (): Record<string, unknown> =>
  JSON.parse(screen.getByTestId("icon").dataset["props"] ?? "{}");

describe("FeedbackIcon (native)", () => {
  it.each(Enum.values(Tone))("draws the %s tone's icon, small and in the tone's colour", (tone) => {
    render(<FeedbackIcon tone={tone} />);
    expect(screen.getByTestId("icon").dataset["name"]).toBe(FEEDBACK_BY_TONE[tone].icon);
    expect(propsOf()["size"]).toBe(ICON_SIZES.sm);
    expect(propsOf()["color"]).toBe(`color:${tone === "default" ? "foreground" : tone}`);
  });

  it("draws an element as given", () => {
    render(<FeedbackIcon tone="success" icon={<i data-testid="mine" />} />);
    expect(screen.getByTestId("mine")).toBeTruthy();
    expect(screen.queryByTestId("icon")).toBeNull();
  });

  it("draws a named icon from the app's registry", () => {
    render(
      <IconRegistryProvider registry={defineIconRegistry({ "loyalty::star": marker("star") })}>
        <FeedbackIcon tone="warning" icon="loyalty::star" />
      </IconRegistryProvider>,
    );
    expect(screen.getByTestId("icon").dataset["name"]).toBe("star");
    expect(propsOf()["color"]).toBe("color:warning");
  });
});
