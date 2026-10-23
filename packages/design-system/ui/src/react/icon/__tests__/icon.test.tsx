/**
 * Stackra file contract:
 * Purpose: proves the web Icon draws real Lucide icons at the three sizes, hides decorative icons and names labelled
 *          ones, colours by tone through the theme variable, mirrors only directional icons in right-to-left, and
 *          passes every other SVG prop and the ref through.
 * Boundary: jsdom with real lucide-react and React Aria's I18nProvider; no theme CSS is loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 3 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-012 sta-350:FR-013 sta-350:FR-014 sta-350:P-008 sta-350:P-009 sta-350:P-013
import { render, screen } from "@testing-library/react";
import { ChevronRight, Search, type LucideIcon } from "lucide-react";
import { I18nProvider } from "react-aria-components";
import { createRef } from "react";

import { Size } from "#contracts/enums/size.enum";
import { TextTone } from "#contracts/enums/text-tone.enum";
import type { IconComponent, IconComponentProps } from "#contracts/types/icon-component.type";
import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { Icon } from "#react/icon/icon";

const svgOf = (container: HTMLElement) => {
  const svg = container.querySelector("svg");
  if (!svg) throw new Error("no svg was drawn");
  return svg;
};

/** The `transform` an icon draws under a locale, with or without the mirror flag. */
const view = (locale: string, isMirroredInRtl: boolean) => {
  const { container, unmount } = render(
    <I18nProvider locale={locale}>
      <Icon as={ChevronRight} isMirroredInRtl={isMirroredInRtl} />
    </I18nProvider>,
  );
  const transform = svgOf(container).style.transform;
  unmount();
  return transform;
};

/** An app's own icon component: any component with the contract's props can be drawn. */
function Mark(props: IconComponentProps) {
  return <svg data-testid="mark" width={props.size} />;
}

describe("Icon (web)", () => {
  it("draws the md size by default and 16, 20 and 24 for sm, md and lg", () => {
    const { container } = render(<Icon as={Search} />);
    expect(svgOf(container).getAttribute("width")).toBe("20");
    expect(svgOf(container).getAttribute("height")).toBe("20");
    expect(svgOf(container).classList.contains("lucide-search")).toBe(true);
  });

  it.each(Size)("draws %s at its pixel size", (size) => {
    const { container } = render(<Icon as={Search} size={size} />);
    expect(svgOf(container).getAttribute("width")).toBe(String(ICON_SIZES[size]));
  });

  it("is decorative by default and when the label is empty", () => {
    for (const label of [undefined, ""]) {
      const { container, unmount } = render(<Icon as={Search} label={label} />);
      expect(svgOf(container).getAttribute("aria-hidden")).toBe("true");
      expect(svgOf(container).hasAttribute("role")).toBe(false);
      expect(screen.queryByRole("img")).toBeNull();
      unmount();
    }
  });

  it("names a labelled icon as an image", () => {
    const { container } = render(<Icon as={Search} label="Search" />);
    expect(screen.getByRole("img", { name: "Search" })).toBeTruthy();
    expect(svgOf(container).hasAttribute("aria-hidden")).toBe(false);
  });

  it.each(TextTone)("colours the %s tone through the theme variable", (tone) => {
    const { container } = render(<Icon as={Search} tone={tone} />);
    const role = tone === "default" ? "foreground" : tone;
    expect(svgOf(container).style.color).toBe(`var(--${role})`);
    expect(svgOf(container).getAttribute("stroke")).toBe("currentColor");
  });

  it("sets no colour without a tone, so the icon inherits the text colour", () => {
    const { container } = render(<Icon as={Search} />);
    expect(svgOf(container).style.color).toBe("");
  });

  it("mirrors a directional icon only in right-to-left", () => {
    expect(view("ar", true)).toBe("scaleX(-1)");
    expect(view("en", true)).toBe("");
    expect(view("ar", false)).toBe("");
  });

  it("keeps the caller's style and puts the mirror after it", () => {
    const { container } = render(
      <I18nProvider locale="ar">
        <Icon
          as={ChevronRight}
          isMirroredInRtl
          style={{ transform: "rotate(90deg)", marginInline: 4 }}
        />
      </I18nProvider>,
    );
    expect(svgOf(container).style.transform).toBe("scaleX(-1)");
    expect(svgOf(container).style.marginInline).toBe("4px");
  });

  it("passes SVG props and the ref through", () => {
    const ref = createRef<SVGSVGElement>();
    const onClick = vi.fn();
    const { container } = render(
      <Icon
        as={Search}
        ref={ref}
        className="x"
        data-testid="found"
        strokeWidth={1.5}
        aria-describedby="hint"
        onClick={onClick}
      />,
    );
    const svg = svgOf(container);
    expect(svg.classList.contains("lucide")).toBe(true);
    expect(svg.classList.contains("x")).toBe(true);
    expect(svg.getAttribute("data-testid")).toBe("found");
    expect(svg.getAttribute("stroke-width")).toBe("1.5");
    expect(svg.getAttribute("aria-describedby")).toBe("hint");
    svg.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(ref.current).toBe(svg);
  });

  it("draws any component with the same props", () => {
    render(<Icon as={Mark} size="lg" />);
    expect(screen.getByTestId("mark").getAttribute("width")).toBe("24");
  });

  it("accepts every Lucide icon as an IconComponent and refuses the names the contract owns (hyphenated `aria-label` is never type-checked by JSX)", () => {
    const accepted: IconComponent = ChevronRight;
    expectTypeOf<LucideIcon>().toExtend<IconComponent>();
    expect(accepted).toBe(ChevronRight);
    // @ts-expect-error `size` is the contract's Size, not a number of pixels
    void (<Icon as={Search} size={20} />);
    // @ts-expect-error the component prop is `as`; `icon` is the slot name on hosts
    void (<Icon icon={Search} />);
    // @ts-expect-error the theme is the only colour lever: `tone` picks a role
    void (<Icon as={Search} color="red" />);
  });
});
