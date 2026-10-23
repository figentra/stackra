/**
 * Stackra file contract:
 * Purpose: proves the web Avatar is hidden without a label and one named image with it, draws the image, else the
 *          fallback, the initials of the name or the person icon in that order, maps tone, size, variant and shape to
 *          HeroUI's classes, takes the locale for its initials, passes unknown props and the ref through, and refuses
 *          `color`, `children` and the raw accessibility props.
 * Boundary: jsdom with real HeroUI and Radix; jsdom never loads images, so `window.Image` is stubbed; the theme CSS
 *          is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-041 sta-350:FR-042 sta-350:P-031 sta-350:P-034
import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { I18nProvider } from "react-aria-components";

import { AvatarVariant } from "#contracts/enums/avatar-variant.enum";
import { Size } from "#contracts/enums/size.enum";
import { Tone } from "#contracts/enums/tone.enum";
import type { AvatarContractProps } from "#contracts/types/avatar-contract-props.type";
import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { Avatar, type AvatarProps } from "#react/avatar/avatar";

/** Stands in for `window.Image`, which Radix probes with: it reports `load` or `error` in a microtask. */
function stubImage(outcome: "load" | "error") {
  class FakeImage extends EventTarget {
    complete = false;
    naturalWidth = 0;
    set src(_value: string) {
      queueMicrotask(() => {
        if (outcome === "load") {
          this.complete = true;
          this.naturalWidth = 1;
        }
        this.dispatchEvent(new Event(outcome));
        // Radix reads the handlers it set as properties, not listeners.
        (this as { onload?: () => void; onerror?: () => void })[
          outcome === "load" ? "onload" : "onerror"
        ]?.();
      });
    }
  }
  vi.stubGlobal("Image", FakeImage);
}

const rootOf = (container: HTMLElement) => container.querySelector<HTMLElement>(".avatar");

describe("Avatar (web)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is hidden from assistive technology without a label, or with an empty one", () => {
    const { container, rerender } = render(<Avatar name="Ada Lovelace" />);
    expect(rootOf(container)?.getAttribute("aria-hidden")).toBe("true");
    expect(rootOf(container)?.hasAttribute("role")).toBe(false);
    expect(screen.queryByRole("img")).toBeNull();
    rerender(<Avatar name="Ada Lovelace" label="" />);
    expect(rootOf(container)?.getAttribute("aria-hidden")).toBe("true");
  });

  it("is one image named by its label", () => {
    const { container } = render(<Avatar name="Ada Lovelace" label="Ada Lovelace, admin" />);
    const root = screen.getByRole("img", { name: "Ada Lovelace, admin" });
    expect(root).toBe(rootOf(container));
    expect(root.hasAttribute("aria-hidden")).toBe(false);
  });

  it("draws the initials of the name in the locale of the provider", () => {
    const { container, rerender } = render(<Avatar name="Ada Lovelace" />);
    expect(container.querySelector(".avatar__fallback")?.textContent).toBe("AL");
    rerender(
      <I18nProvider locale="tr">
        <Avatar name="ilhan" />
      </I18nProvider>,
    );
    expect(container.querySelector(".avatar__fallback")?.textContent).toBe("İ");
  });

  it("prefers the fallback to the name, then the person icon at the size of the avatar", () => {
    const { container, rerender } = render(
      <Avatar name="Ada Lovelace" fallback={<b data-testid="mine" />} />,
    );
    expect(screen.getByTestId("mine")).toBeTruthy();
    expect(container.querySelector(".avatar__fallback")?.textContent).toBe("");
    for (const size of Size) {
      rerender(<Avatar size={size} />);
      const icons = container.querySelectorAll(".avatar__fallback svg");
      expect(icons).toHaveLength(1);
      expect(icons[0]?.getAttribute("width")).toBe(String(ICON_SIZES[size]));
    }
    rerender(<Avatar name="   " />);
    expect(container.querySelectorAll(".avatar__fallback svg")).toHaveLength(1);
  });

  it("draws the image once it has loaded, and keeps the fallback when it fails or is missing", async () => {
    stubImage("load");
    const { container, rerender } = render(<Avatar name="Ada Lovelace" src="/ada.png" />);
    await act(async () => {
      await Promise.resolve();
    });
    const image = container.querySelector("img");
    expect(image?.getAttribute("src")).toBe("/ada.png");
    expect(image?.getAttribute("alt")).toBe("");
    expect(container.querySelector(".avatar__fallback")).toBeNull();

    stubImage("error");
    rerender(<Avatar key="broken" name="Ada Lovelace" src="/missing.png" />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".avatar__fallback")?.textContent).toBe("AL");

    rerender(<Avatar key="none" name="Ada Lovelace" />);
    expect(container.querySelector("img")).toBeNull();
  });

  it.each(AvatarVariant)(
    "draws the %s variant in every tone and size as HeroUI's classes",
    (variant) => {
      for (const tone of Tone)
        for (const size of Size) {
          const { container, unmount } = render(
            <Avatar name="Ada Lovelace" variant={variant} tone={tone} size={size} />,
          );
          const root = rootOf(container);
          expect(root?.classList.contains(`avatar--${size}`), `${tone} ${size}`).toBe(true);
          expect(root?.classList.contains("avatar--soft")).toBe(variant === "soft");
          expect(
            container.querySelector(`.avatar__fallback--${tone}`),
            `${variant} ${tone}`,
          ).toBeTruthy();
          unmount();
        }
    },
  );

  it("is a default-tone circle with no props, and a square keeps the caller's class", () => {
    const { container, rerender } = render(<Avatar name="Ada Lovelace" className="mine" />);
    expect(container.querySelector(".avatar__fallback--default")).toBeTruthy();
    expect(rootOf(container)?.classList.contains("rounded-lg")).toBe(false);
    expect(rootOf(container)?.classList.contains("rounded-full")).toBe(true);
    rerender(<Avatar name="Acme" shape="square" className="mine" />);
    expect(rootOf(container)?.classList.contains("rounded-lg")).toBe(true);
    expect(rootOf(container)?.classList.contains("rounded-full")).toBe(false);
    expect(rootOf(container)?.classList.contains("mine")).toBe(true);
  });

  it("passes unknown props and the ref through to the root", () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <Avatar
        ref={ref}
        id="a"
        title="Ada"
        data-testid="avatar"
        aria-describedby="d"
        style={{ opacity: 0.5 }}
      />,
    );
    const root = rootOf(container);
    expect(root?.id).toBe("a");
    expect(root?.getAttribute("title")).toBe("Ada");
    expect(root?.getAttribute("data-testid")).toBe("avatar");
    expect(root?.getAttribute("aria-describedby")).toBe("d");
    expect(root?.style.opacity).toBe("0.5");
    expect(ref.current).toBe(root);
  });

  it("types: extends the contract and refuses `color`, `children` and the raw accessibility props", () => {
    expectTypeOf<AvatarProps>().toExtend<AvatarContractProps>();
    // @ts-expect-error the colour role is `tone`
    render(<Avatar color="success" />);
    // @ts-expect-error the wrapper builds the children
    render(<Avatar>x</Avatar>);
    // JSX does not check a hyphenated attribute against the props, so the type itself is asserted.
    expectTypeOf<AvatarProps>().not.toHaveProperty("aria-label");
    // @ts-expect-error a label makes the role
    render(<Avatar role="img" />);
  });
});
