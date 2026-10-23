/**
 * Stackra file contract:
 * Purpose: proves the native Link hands LinkButton the link role, label, hint, hit area and disabled state, paints the
 *          label with the tone and underline classes, and on press calls onPress then opens the URL or navigates
 *          through the RouterProvider.
 * Boundary: React Native does not render in vitest: heroui-native, react-native and the native Icon are replaced by
 *          recording stand-ins and the tree renders to the jsdom DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 5 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-025 sta-350:FR-026 sta-350:P-017
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { Tone } from "#contracts/enums/tone.enum";
import type { LinkContractProps } from "#contracts/types/link-contract-props.type";
import { TONE_CLASS_NAME } from "#core/constants/tone-class-name.constant";
import { Link, type LinkProps } from "#native/link/link";
import { RouterProvider } from "#native/router-provider/router-provider";

const native = vi.hoisted(() => ({
  openURL: vi.fn((_url: string) => Promise.resolve()),
  icon: {} as Record<string, unknown>,
}));

vi.mock("react-native", () => ({ Linking: { openURL: native.openURL } }));
vi.mock("lucide-react-native", () => ({ ExternalLink: () => null }));
vi.mock("#native/icon/icon", () => ({
  Icon: (props: Record<string, unknown>) => {
    native.icon = props;
    return <i data-testid="icon" />;
  },
}));
vi.mock("heroui-native", () => {
  const LinkButton = Object.assign(
    ({
      children,
      onPress,
      isDisabled,
      accessibilityRole,
      accessibilityLabel,
      accessibilityHint,
      hitSlop,
      size,
      testID,
    }: Record<string, unknown> & { children?: ReactNode }) => (
      <button
        type="button"
        data-testid={String(testID ?? "link")}
        data-role={String(accessibilityRole)}
        aria-label={accessibilityLabel as string | undefined}
        data-hint={accessibilityHint as string | undefined}
        data-hit-slop={String(hitSlop)}
        data-size={size as string | undefined}
        disabled={isDisabled as boolean}
        onClick={() => (onPress as (() => void) | undefined)?.()}
      >
        {children}
      </button>
    ),
    {
      Label: ({ className, children }: { className?: string; children?: ReactNode }) => (
        <span data-testid="label" data-class={className}>
          {children}
        </span>
      ),
    },
  );
  return { LinkButton };
});

const press = () => fireEvent.click(screen.getByTestId("link"));
const labelClass = () => screen.getByTestId("label").dataset["class"];

describe("Link (native)", () => {
  beforeEach(() => {
    native.openURL.mockClear();
    native.openURL.mockImplementation(() => Promise.resolve());
    native.icon = {};
  });

  it("hands LinkButton the link role, a hit slop of 8 and the text inside the label", () => {
    render(<Link href="/orders">Orders</Link>);
    const link = screen.getByTestId("link");
    expect(link.dataset["role"]).toBe("link");
    expect(link.dataset["hitSlop"]).toBe("8");
    expect(screen.getByTestId("label").textContent).toBe("Orders");
    expect(labelClass()).toBe("text-link underline");
  });

  it.each(Tone)("paints the %s tone", (tone) => {
    render(<Link tone={tone}>Go</Link>);
    expect(labelClass()).toContain(tone === "default" ? "text-link" : TONE_CLASS_NAME[tone]);
  });

  it("drops the underline for hover", () => {
    render(<Link underline="hover">Go</Link>);
    expect(labelClass()).toBe("text-link");
  });

  it("marks an external link with a hint and a mirrored small icon, and a custom hint replaces the default", () => {
    const { rerender } = render(<Link isExternal>Docs</Link>);
    expect(screen.getByTestId("link").dataset["hint"]).toBe("opens in your browser");
    expect(native.icon).toMatchObject({ size: "sm", isMirroredInRtl: true });
    rerender(
      <Link isExternal externalLabel="öffnet den Browser">
        Docs
      </Link>,
    );
    expect(screen.getByTestId("link").dataset["hint"]).toBe("öffnet den Browser");
  });

  it("passes the caller's hint when the link is not external, and draws no icon", () => {
    render(<Link accessibilityHint="Opens the order">Orders</Link>);
    expect(screen.getByTestId("link").dataset["hint"]).toBe("Opens the order");
    expect(screen.queryByTestId("icon")).toBeNull();
  });

  it("maps label to the accessibility label", () => {
    render(<Link label="Settings">x</Link>);
    expect(screen.getByTestId("link").getAttribute("aria-label")).toBe("Settings");
  });

  it("calls onPress first and then hands an app path to the RouterProvider", () => {
    const calls: string[] = [];
    render(
      <RouterProvider navigate={(href) => calls.push(`navigate:${href}`)}>
        <Link href="/orders" onPress={() => calls.push("press")}>
          Orders
        </Link>
      </RouterProvider>,
    );
    press();
    expect(calls).toEqual(["press", "navigate:/orders"]);
    expect(native.openURL).not.toHaveBeenCalled();
  });

  it.each([
    ["an https URL", { href: "https://example.com" }],
    ["a mailto URL", { href: "mailto:a@b.c" }],
    ["an external link", { href: "/docs", isExternal: true }],
  ] as const)("opens %s in the system browser, not through the router", (_name, props) => {
    const navigate = vi.fn();
    render(
      <RouterProvider navigate={navigate}>
        <Link {...props}>Go</Link>
      </RouterProvider>,
    );
    press();
    expect(native.openURL).toHaveBeenCalledWith(props.href);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("opens an app path in the system browser when there is no RouterProvider, and warns without the URL", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    native.openURL.mockImplementation(() => Promise.reject(new Error("no handler")));
    render(<Link href="/orders?token=secret">Orders</Link>);
    press();
    await vi.waitFor(() => expect(warn).toHaveBeenCalledOnce());
    expect(native.openURL).toHaveBeenCalledWith("/orders?token=secret");
    expect(String(warn.mock.calls[0]?.[0])).not.toContain("secret");
    warn.mockRestore();
  });

  it("only calls onPress when there is no href", () => {
    const onPress = vi.fn();
    render(<Link onPress={onPress}>Go</Link>);
    press();
    expect(onPress).toHaveBeenCalledOnce();
    expect(native.openURL).not.toHaveBeenCalled();
  });

  it("hands the disabled flag to LinkButton", () => {
    render(<Link isDisabled>Off</Link>);
    expect((screen.getByTestId("link") as HTMLButtonElement).disabled).toBe(true);
  });

  it("passes size, testID and a hit slop of the caller's through", () => {
    render(
      <Link size="lg" testID="mine" hitSlop={16}>
        Go
      </Link>,
    );
    const link = screen.getByTestId("mine");
    expect(link.dataset["size"]).toBe("lg");
    expect(link.dataset["hitSlop"]).toBe("16");
  });

  it("extends its contract and refuses the names the wrapper owns", () => {
    expectTypeOf<LinkProps>().toExtend<LinkContractProps>();
    // @ts-expect-error the role is always `link`
    void (<Link accessibilityRole="button" />);
    // @ts-expect-error the accessible name is `label`
    void (<Link accessibilityLabel="x" />);
  });
});
