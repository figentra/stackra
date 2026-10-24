/**
 * Stackra file contract:
 * Purpose: proves the native DatePicker adds a calendar button named by `calendarButtonLabel` (an English default
 *          otherwise) that opens the platform picker, follows a controlled `isOpen`, reports each open and close
 *          through `onOpenChange`, opens from `defaultOpen`, and keeps the button off while disabled or read-only.
 * Boundary: React Native does not render in vitest, so heroui-native, react-native, `@expo/ui`'s picker, the provider
 *           and the IconButton are replaced by stand-ins that render plain DOM. The day handling is the DateField's and
 *           is proved there.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (open state); ADR 0318 (decision 8); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-206
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";
import { DatePicker, type DatePickerProps } from "#native/date-picker/date-picker";

const state = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement: h } = await import("react");
  const pass = ({ children }: { readonly children?: ReactNode }) => h("div", null, children);
  return {
    TextField: pass,
    Label: pass,
    Description: pass,
    FieldError: pass,
    Input: () => h("input", { readOnly: true }),
    useThemeColor: () => "#000",
  };
});

vi.mock("react-native", async () => {
  const { createElement: h } = await import("react");
  return {
    Platform: { OS: "android" },
    View: ({ children }: { readonly children?: ReactNode }) => h("div", null, children),
    Pressable: (props: Record<string, unknown>) =>
      h(
        "button",
        { "aria-label": "field", onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      ),
  };
});

vi.mock("@expo/ui/community/datetime-picker", async () => {
  const { createElement: h } = await import("react");
  return {
    DateTimePicker: (props: Record<string, unknown>) => {
      state.props["picker"] = props;
      return h("div", { "data-testid": "picker" });
    },
  };
});

vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en-US", resolvedColorScheme: "light" }),
}));

// Android shows its dialog on its own, so the sheet never renders; the stand-in keeps React Native out of the import.
vi.mock("#native/drawer/drawer", () => ({ Drawer: () => null }));

vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement: h } = await import("react");
  return {
    IconButton: (props: {
      readonly label: string;
      readonly icon: string;
      readonly isDisabled?: boolean;
      readonly onPress?: () => void;
    }) =>
      h("button", {
        "aria-label": props.label,
        "data-icon": props.icon,
        disabled: props.isDisabled,
        onClick: props.onPress,
      }),
  };
});

const picker = () => screen.queryByTestId("picker");
const propsOf = (name: string) => state.props[name] ?? {};

describe("DatePicker (native)", () => {
  beforeEach(() => {
    state.props = {};
  });

  it("opens the platform picker from its calendar button, named by default or by the caller", () => {
    const { rerender } = render(<DatePicker label="Due" />);
    const button = screen.getByRole("button", { name: "Choose a date" });
    expect(button.getAttribute("data-icon")).toBe("calendar");
    fireEvent.click(button);
    expect(picker()).toBeTruthy();
    rerender(<DatePicker label="Due" calendarButtonLabel="Choose the due date" />);
    expect(screen.getByRole("button", { name: "Choose the due date" })).toBeTruthy();
  });

  it("follows a controlled isOpen and reports opening and closing", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <DatePicker label="Due" isOpen={false} onOpenChange={onOpenChange} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Choose a date" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(picker()).toBeNull();
    rerender(<DatePicker label="Due" isOpen onOpenChange={onOpenChange} />);
    expect(picker()).toBeTruthy();
    act(() => (propsOf("picker")["onDismiss"] as () => void)());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(picker()).toBeTruthy();
  });

  it("opens from defaultOpen", () => {
    render(<DatePicker label="Due" defaultOpen />);
    expect(picker()).toBeTruthy();
  });

  it.each([{ isDisabled: true }, { isReadOnly: true }])(
    "keeps the button off and the picker shut while %o",
    (locked) => {
      render(<DatePicker label="Due" defaultOpen {...locked} />);
      expect(
        (screen.getByRole("button", { name: "Choose a date" }) as HTMLButtonElement).disabled,
      ).toBe(true);
      expect(picker()).toBeNull();
    },
  );

  it("extends its contract", () => {
    expectTypeOf<DatePickerProps>().toExtend<DatePickerContractProps>();
  });
});
