/**
 * Stackra file contract:
 * Purpose: proves the native Icon hands the drawn component the size, tone colour, accessibility props and mirror
 *          transform the contract promises, and passes the rest through.
 * Boundary: React Native does not render in vitest: heroui-native is replaced by a recording stand-in, and the drawn
 *          icon is a stand-in component that records its props in the jsdom DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 3 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-052 sta-350:FR-012 sta-350:FR-013 sta-350:FR-014 sta-350:P-008 sta-350:P-009 sta-350:P-013
import { render as renderBare, screen } from "@testing-library/react";
import { defineIconRegistry } from "@stackra/icons";
import type { IconComponent } from "@stackra/icons/contracts";
import { IconRegistryProvider } from "@stackra/icons/native";
import type { LucideIcon } from "lucide-react-native";
import type { ReactElement, ReactNode } from "react";

import { Size } from "#contracts/enums/size.enum";
import { TextTone } from "#contracts/enums/text-tone.enum";
import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { Icon } from "#native/icon/icon";

const heroui = vi.hoisted(() => ({
  isRtl: false,
  useThemeColor: vi.fn((role: string) => `color:${role}`),
}));

// The package's own icons are real lucide-react-native components, which need a native runtime: a marker stands in.
vi.mock("#native/icon/ui-icons.constant", () => ({
  UI_ICONS: { "user-round": () => <output data-testid="own" /> },
}));

vi.mock("heroui-native", () => ({
  useIsRTL: () => heroui.isRtl,
  useThemeColor: heroui.useThemeColor,
}));

/** The drawn icon: records every prop it is handed in the DOM, as the real Svg would receive them. */
function Recorder(props: object) {
  return <output data-testid="icon" data-props={JSON.stringify(props)} />;
}

const registry = defineIconRegistry({ "loyalty::recorder": Recorder });

/** Renders with the registry an app would provide. */
const render = (ui: ReactElement) =>
  renderBare(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <IconRegistryProvider registry={registry}>{children}</IconRegistryProvider>
    ),
  });

const propsOf = (): Record<string, unknown> =>
  JSON.parse(screen.getByTestId("icon").dataset["props"] ?? "{}");

describe("Icon (native)", () => {
  beforeEach(() => {
    heroui.isRtl = false;
    heroui.useThemeColor.mockClear();
  });

  it("leaves size and colour to the holder when they are not given", () => {
    render(<Icon name="loyalty::recorder" />);
    expect(propsOf()).not.toHaveProperty("size");
    expect(propsOf()).not.toHaveProperty("color");
  });

  it.each(Size)("hands %s its pixel size", (size) => {
    render(<Icon name="loyalty::recorder" size={size} />);
    expect(propsOf()["size"]).toBe(ICON_SIZES[size]);
  });

  it.each(TextTone)("colours the %s tone with the resolved theme colour", (tone) => {
    render(<Icon name="loyalty::recorder" tone={tone} />);
    expect(propsOf()["color"]).toBe(`color:${tone === "default" ? "foreground" : tone}`);
  });

  it("asks for the theme colour on every render, so the hook order is stable", () => {
    const { rerender } = render(<Icon name="loyalty::recorder" />);
    rerender(<Icon name="loyalty::recorder" tone="danger" />);
    expect(heroui.useThemeColor).toHaveBeenCalledTimes(2);
  });

  it("hides a decorative icon from VoiceOver and TalkBack", () => {
    for (const label of [undefined, ""]) {
      const { unmount } = render(<Icon name="loyalty::recorder" label={label} />);
      expect(propsOf()).toMatchObject({
        accessible: false,
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants",
      });
      expect(propsOf()).not.toHaveProperty("accessibilityLabel");
      expect(propsOf()).not.toHaveProperty("role");
      unmount();
    }
  });

  it("names a labelled icon as an image", () => {
    render(<Icon name="loyalty::recorder" label="Search" />);
    expect(propsOf()).toMatchObject({
      accessible: true,
      role: "img",
      accessibilityLabel: "Search",
    });
    expect(propsOf()).not.toHaveProperty("accessibilityElementsHidden");
  });

  it("mirrors only in right-to-left and only when asked", () => {
    heroui.isRtl = true;
    const { rerender } = render(
      <Icon name="loyalty::recorder" isMirroredInRtl style={{ opacity: 0.5 }} />,
    );
    expect(propsOf()["style"]).toEqual([{ opacity: 0.5 }, { transform: [{ scaleX: -1 }] }]);
    rerender(<Icon name="loyalty::recorder" style={{ opacity: 0.5 }} />);
    expect(propsOf()["style"]).toEqual({ opacity: 0.5 });
    heroui.isRtl = false;
    rerender(<Icon name="loyalty::recorder" isMirroredInRtl style={{ opacity: 0.5 }} />);
    expect(propsOf()["style"]).toEqual({ opacity: 0.5 });
  });

  it("passes the rest through", () => {
    render(<Icon name="loyalty::recorder" testID="found" strokeWidth={1.5} />);
    expect(propsOf()).toMatchObject({ testID: "found", strokeWidth: 1.5 });
  });

  it("draws the icons the package itself uses without any registry", () => {
    renderBare(<Icon name="user-round" />);
    expect(screen.getByTestId("own")).toBeTruthy();
  });

  it("draws nothing for a name no registry holds, and does not throw", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<Icon name="loyalty::unknown" label="Points" />);
    expect(screen.queryByTestId("icon")).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"loyalty::unknown"'));
    warn.mockRestore();
  });

  it("takes an icon name and refuses what the contract owns", () => {
    expectTypeOf<LucideIcon>().toExtend<IconComponent>();
    // @ts-expect-error the component prop is gone: icons are drawn by name
    void (<Icon as={Recorder} name="search" />);
    // @ts-expect-error the accessible name is `label`
    void (<Icon name="search" accessibilityLabel="x" />);
    // @ts-expect-error the theme is the only colour lever: `tone` picks a role
    void (<Icon name="search" color="red" />);
  });
});
