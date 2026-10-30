/**
 * Stackra file contract:
 * Purpose: proves the native Button hands HeroUI Native the variant, size and disabled flag unchanged, wraps a string
 *          label, orders its icons, stretches with `w-full`, blocks the press and reports `busy` while loading with a
 *          spinner in the label colour, sizes and colours its icons through a Lucide provider, maps `label` to the
 *          accessibility label, passes the press feedback props through, and hands HeroUI Native the glass look of
 *          its variant (the layer and the class that clears the fill) unless the caller brings its own background.
 * Boundary: React Native does not render in vitest, so heroui-native and lucide-react-native are replaced by recording
 *          stand-ins that render plain DOM, and the glass hook by a stand-in whose look each test sets; what reaches
 *          HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-023 sta-350:FR-024 sta-350:P-016 sta-350:FR-053
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { ButtonVariant } from "#contracts/enums/button-variant.enum";
import { Size } from "#contracts/enums/size.enum";
import type { ButtonContractProps } from "#contracts/types/button-contract-props.type";
import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { Button } from "#native/button/button";
import type { ButtonProps } from "#native/button/button.props";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Button: Object.assign(record("button"), { Label: record("label") }),
    Spinner: record("spinner"),
    useThemeColor: (name: string) => `color:${name}`,
    cn: (...parts: unknown[]) => parts.filter(Boolean).join(" "),
  };
});

vi.mock("lucide-react-native", async () => {
  const { createElement } = await import("react");
  return {
    LucideProvider: (props: Record<string, unknown>) => {
      received.props["provider"] = props;
      return createElement("div", { "data-testid": "provider" }, props["children"] as ReactNode);
    },
  };
});

const propsOf = (name: string) => received.props[name] ?? {};

/** The glass look the hook stand-in returns, and the variants it was asked for. */
const glass = vi.hoisted(() => ({
  look: undefined as { background: unknown; className: string } | undefined,
  asked: [] as string[],
  disabled: undefined as boolean | undefined,
}));

vi.mock("#native/glass/use-glass-button", () => ({
  useGlassButton: (variant: string, isDisabled?: boolean) => {
    glass.asked.push(variant);
    glass.disabled = isDisabled;
    return glass.look;
  },
}));

const GLASS = { background: "glass-layer", className: "bg-transparent" } as const;

/** The order of the stand-in elements inside the button's provider. */
const order = (container: HTMLElement) =>
  [...(container.querySelector('[data-testid="provider"]')?.children ?? [])].map(
    (node) => node.getAttribute("data-testid") ?? node.textContent,
  );

/** The accessibility state the button was handed, typed for the assertions. */
const stateOf = () => propsOf("button")["accessibilityState"] as Record<string, unknown>;

// The slot's Icon needs a native runtime: a name draws a marker, an element is drawn as given.
vi.mock("#native/slot-icon/slot-icon", async () => {
  const { createElement } = await import("react");
  return {
    SlotIcon: ({ icon }: { readonly icon?: unknown }) =>
      typeof icon === "string"
        ? createElement("i", { "data-testid": "slot-icon", "data-name": icon })
        : (icon ?? null),
  };
});

/** The icon names the slot stand-in drew, in document order. */
const slotNames = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-testid="slot-icon"]')].map((node) =>
    node.getAttribute("data-name"),
  );

describe("Button (native)", () => {
  beforeEach(() => {
    received.props = {};
    glass.look = undefined;
    glass.asked = [];
  });

  it("draws an icon name through Icon on either side and an element as given", () => {
    const { container } = render(
      <Button startIcon="plus" endIcon="chevron-right">
        Add
      </Button>,
    );
    expect(slotNames(container)).toEqual(["plus", "chevron-right"]);
    const second = render(<Button startIcon={<i data-testid="mine" />}>Add</Button>);
    expect(second.container.querySelector('[data-testid="mine"]')).toBeTruthy();
  });

  it.each(ButtonVariant)("hands %s and every size to HeroUI Native unchanged", (variant) => {
    for (const size of Size) {
      render(
        <Button variant={variant} size={size} isDisabled>
          Save
        </Button>,
      );
      expect(propsOf("button")).toMatchObject({ variant, size, isDisabled: true });
    }
  });

  it("defaults to a primary button of the medium size", () => {
    render(<Button>Save</Button>);
    expect(propsOf("button")).toMatchObject({ variant: "primary", size: "md", isDisabled: false });
  });

  it("wraps a string or number in the label and leaves other nodes alone", () => {
    const { container, rerender } = render(<Button>Save</Button>);
    expect(propsOf("label")["children"]).toBe("Save");
    rerender(<Button>{3}</Button>);
    expect(propsOf("label")["children"]).toBe(3);
    received.props = {};
    rerender(
      <Button>
        <i data-testid="node" />
      </Button>,
    );
    expect(propsOf("label")).toEqual({});
    expect(container.querySelector('[data-testid="node"]')).toBeTruthy();
  });

  it("draws the start icon, the label and the end icon in that order", () => {
    const { container } = render(
      <Button startIcon={<i data-testid="start" />} endIcon={<i data-testid="end" />}>
        Next
      </Button>,
    );
    expect(order(container)).toEqual(["start", "label", "end"]);
  });

  it("gives w-full to a full-width button and keeps the caller's class", () => {
    const { rerender } = render(
      <Button isFullWidth className="mine">
        Save
      </Button>,
    );
    expect(propsOf("button")["className"]).toBe("w-full mine");
    rerender(<Button className="mine">Save</Button>);
    expect(propsOf("button")["className"]).toBe("mine");
    rerender(<Button>Save</Button>);
    expect(propsOf("button")).not.toHaveProperty("className");
  });

  it("asks the glass look of its variant and hands HeroUI Native its layer and class", () => {
    glass.look = GLASS;
    render(
      <Button variant="secondary" isFullWidth className="mine">
        Save
      </Button>,
    );
    expect(glass.asked.at(-1)).toBe("secondary");
    expect(propsOf("button")).toMatchObject({
      background: "glass-layer",
      className: "w-full bg-transparent mine",
    });
  });

  it("lets the caller's own background, or none, win over the glass layer", () => {
    glass.look = GLASS;
    render(
      <Button variant="tertiary" background={null}>
        Save
      </Button>,
    );
    expect(propsOf("button")["background"]).toBeNull();
  });

  it("hands the glass hook its disabled flag, so a disabled button stays solid", () => {
    render(
      <Button variant="secondary" isDisabled>
        Save
      </Button>,
    );
    expect(glass.disabled).toBe(true);
    render(<Button variant="secondary">Save</Button>);
    expect(glass.disabled).toBe(false);
  });

  it("hands no background and no class while the variant stays solid", () => {
    render(<Button variant="primary">Save</Button>);
    expect(glass.asked.at(-1)).toBe("primary");
    expect(propsOf("button")).not.toHaveProperty("background");
    expect(propsOf("button")).not.toHaveProperty("className");
  });

  it("blocks the press and reports busy while loading, without the disabled dimming", () => {
    const { container } = render(
      <Button
        isLoading
        accessibilityState={{ expanded: true }}
        startIcon={<i data-testid="start" />}
        endIcon={<i data-testid="end" />}
      >
        Save
      </Button>,
    );
    expect(propsOf("button")).toMatchObject({ disabled: true, isDisabled: false });
    expect(stateOf()).toEqual({ expanded: true, disabled: true, busy: true });
    expect(order(container)).toEqual(["spinner", "label", "end"]);
  });

  it.each(ButtonVariant)("colours the %s spinner and icons in the label colour", (variant) => {
    render(
      <Button variant={variant} isLoading>
        Save
      </Button>,
    );
    expect(propsOf("spinner")["color"]).toBe(propsOf("provider")["color"]);
    expect(String(propsOf("provider")["color"])).toMatch(/^color:[a-z-]+-foreground$/);
  });

  it("sizes the icons 16 for small and 20 otherwise", () => {
    render(<Button size="sm">Save</Button>);
    expect(propsOf("provider")["size"]).toBe(ICON_SIZES.sm);
    render(<Button size="lg">Save</Button>);
    expect(propsOf("provider")["size"]).toBe(ICON_SIZES.md);
  });

  it("is not blocked and not busy when idle, and a disabled button reports disabled", () => {
    const { rerender } = render(<Button>Save</Button>);
    expect(propsOf("button")["disabled"]).toBe(false);
    expect(stateOf()).toMatchObject({ busy: false, disabled: false });
    rerender(<Button isDisabled>Save</Button>);
    expect(propsOf("button")["disabled"]).toBe(true);
    expect(stateOf()).toMatchObject({ disabled: true });
  });

  it("maps label to the accessibility label", () => {
    render(<Button label="Save the draft">Save</Button>);
    expect(propsOf("button")["accessibilityLabel"]).toBe("Save the draft");
  });

  it("passes the press feedback and every other prop through unchanged", () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();
    render(
      <Button
        feedbackVariant="scale-ripple"
        animation={{ scale: false, ripple: { opacity: { value: [0, 0.3, 0] } } }}
        background={null}
        hitSlop={9}
        testID="found"
        onLongPress={onLongPress}
        onPress={onPress}
      >
        Save
      </Button>,
    );
    expect(propsOf("button")).toMatchObject({
      feedbackVariant: "scale-ripple",
      animation: { scale: false, ripple: { opacity: { value: [0, 0.3, 0] } } },
      background: null,
      hitSlop: 9,
      testID: "found",
      onLongPress,
    });
    // The press reaches HeroUI Native wrapped in its haptic tap, and still calls the caller's handler.
    (propsOf("button")["onPress"] as () => void)();
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<ButtonProps>().toExtend<ButtonContractProps>();
    // @ts-expect-error `disabled` is `isDisabled`, and loading blocks the press itself
    void (<Button disabled />);
    // @ts-expect-error an icon-only button is built through IconButton, which requires a label
    void (<Button isIconOnly />);
    // @ts-expect-error the accessible name is `label`
    void (<Button accessibilityLabel="x" />);
    // @ts-expect-error `feedbackVariant="none"` only takes `disable-all`, so the union survived the omit
    void (<Button feedbackVariant="none" animation={{ scale: false }} />);
  });
});
