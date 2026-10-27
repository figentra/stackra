/**
 * Stackra file contract:
 * Purpose: proves the web Link renders HeroUI's anchor with the contract's tone, underline, external and label
 *          mapping, stays inert when disabled, passes unknown props through, and navigates through React Aria's
 *          RouterProvider only for internal links.
 * Boundary: jsdom; HeroUI and React Aria are real, and the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 5 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-025 sta-350:FR-026 sta-350:P-017
import { Enum, Tone } from "@stackra/contracts";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";

import type { LinkContractProps } from "#contracts/types/link-contract-props.type";
import { TONE_CLASS_NAME } from "#core/constants/tone-class-name.constant";
import { Link, RouterProvider, type LinkProps } from "#react/index";

const anchor = (name: string) => screen.getByRole("link", { name });

describe("Link (web)", () => {
  it("is an anchor with the href, HeroUI's class, the link tone and an underline", () => {
    render(<Link href="/orders">Orders</Link>);
    const link = anchor("Orders");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/orders");
    for (const name of ["link", "text-link", "underline"])
      expect(link.classList.contains(name)).toBe(true);
  });

  it.each(Enum.values(Tone))("paints the %s tone", (tone) => {
    render(
      <Link href="/x" tone={tone}>
        Go
      </Link>,
    );
    const expected = tone === "default" ? "text-link" : TONE_CLASS_NAME[tone];
    expect(anchor("Go").classList.contains(expected)).toBe(true);
  });

  it("leaves the underline off for hover", () => {
    render(
      <Link href="/x" underline="hover">
        Go
      </Link>,
    );
    expect(anchor("Go").classList.contains("underline")).toBe(false);
  });

  it("opens an external link in a new tab, marks it and says so", () => {
    render(
      <Link href="https://example.com" isExternal>
        Docs
      </Link>,
    );
    const link = anchor("Docs opens in a new tab");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    const mark = link.querySelector('[data-slot="link-icon"]');
    expect(mark?.getAttribute("aria-hidden")).toBe("true");
    expect(mark?.className).toContain("rtl:-scale-x-100");
  });

  it("lets the caller's target and rel win over the external defaults", () => {
    render(
      <Link href="https://example.com" isExternal target="_self" rel="noopener">
        Docs
      </Link>,
    );
    const link = anchor("Docs opens in a new tab");
    expect(link.getAttribute("target")).toBe("_self");
    expect(link.getAttribute("rel")).toBe("noopener");
  });

  it("names an icon-only link by label, and folds the external hint into that name", () => {
    const { rerender } = render(
      <Link href="/settings" label="Settings">
        <i />
      </Link>,
    );
    expect(anchor("Settings")).toBeTruthy();
    rerender(
      <Link href="https://example.com" label="Settings" isExternal>
        <i />
      </Link>,
    );
    expect(anchor("Settings (opens in a new tab)")).toBeTruthy();
    expect(document.querySelector(".sr-only")).toBeNull();
    rerender(
      <Link href="https://example.com" isExternal externalLabel="öffnet einen neuen Tab">
        Docs
      </Link>,
    );
    expect(anchor("Docs öffnet einen neuen Tab")).toBeTruthy();
  });

  it("is an inert link when disabled and never calls onPress", () => {
    const onPress = vi.fn();
    render(
      <Link href="/x" isDisabled onPress={onPress}>
        Off
      </Link>,
    );
    const link = anchor("Off");
    expect(link.tagName).toBe("SPAN");
    expect(link.getAttribute("aria-disabled")).toBe("true");
    expect(link.hasAttribute("href")).toBe(false);
    act(() => link.click());
    expect(onPress).not.toHaveBeenCalled();
  });

  it("calls onPress with and without an href", () => {
    const onPress = vi.fn();
    const { rerender } = render(
      <Link href="/x" onPress={onPress}>
        Go
      </Link>,
    );
    act(() => anchor("Go").click());
    expect(onPress).toHaveBeenCalledTimes(1);
    rerender(<Link onPress={onPress}>Go</Link>);
    expect(anchor("Go").tagName).toBe("SPAN");
    act(() => anchor("Go").click());
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("navigates an internal link through the nearest RouterProvider, with the router's own href", () => {
    const navigate = vi.fn();
    render(
      <RouterProvider navigate={navigate} useHref={(href) => `/base${href}`}>
        <Link href="/orders">Orders</Link>
      </RouterProvider>,
    );
    expect(anchor("Orders").getAttribute("href")).toBe("/base/orders");
    act(() => anchor("Orders").click());
    expect(navigate).toHaveBeenCalledWith("/orders", undefined);
  });

  it.each([
    ["an absolute URL on another origin", { href: "https://other.example.com/x" }, "Away"],
    ["an external link", { href: "/docs", isExternal: true }, "Away opens in a new tab"],
    ["a click with a modifier key", { href: "/orders" }, "Away"],
  ] as const)("does not navigate through the RouterProvider for %s", (_name, props, name) => {
    const navigate = vi.fn();
    render(
      <RouterProvider navigate={navigate}>
        <Link {...props}>Away</Link>
      </RouterProvider>,
    );
    if (_name.includes("modifier")) fireEvent.click(anchor(name), { metaKey: true });
    else act(() => anchor(name).click());
    expect(navigate).not.toHaveBeenCalled();
  });

  it("passes unknown props, class names (string or function) and the ref through", () => {
    const ref = createRef<HTMLAnchorElement>();
    const { rerender } = render(
      <Link ref={ref} href="/x" id="l" data-testid="found" download className="extra">
        Go
      </Link>,
    );
    const link = screen.getByTestId("found");
    expect(link.id).toBe("l");
    expect(link.hasAttribute("download")).toBe(true);
    expect(link.classList.contains("extra")).toBe(true);
    expect(link.classList.contains("underline")).toBe(true);
    expect(ref.current).toBe(link);
    rerender(
      <Link
        href="/x"
        data-testid="found"
        className={({ isDisabled }) => (isDisabled ? "off" : "on")}
      >
        Go
      </Link>,
    );
    expect(screen.getByTestId("found").classList.contains("on")).toBe(true);
  });

  it("extends its contract and re-exports React Aria's RouterProvider", () => {
    expectTypeOf<LinkProps>().toExtend<LinkContractProps>();
    expect(RouterProvider).toBeTypeOf("function");
  });
});
