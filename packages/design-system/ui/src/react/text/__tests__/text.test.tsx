/**
 * Stackra file contract:
 * Purpose: proves the web Text renders HeroUI v3 Typography with each contract prop mapped and every other prop
 *          passed through.
 * Boundary: jsdom with the real @heroui/react; no theme CSS is loaded, so classes, elements and attributes are
 *          checked, not computed styles (the e2e checks those).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 6 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-017 sta-350:FR-018 sta-350:P-010 sta-350:P-011
import { render, screen } from "@testing-library/react";
import { createRef } from "react";

import { TextTone } from "#contracts/enums/text-tone.enum";
import { TextType } from "#contracts/enums/text-type.enum";
import { Tone } from "#contracts/enums/tone.enum";
import type { TextContractProps } from "#contracts/types/text-contract-props.type";
import { TONE_CLASS_NAME } from "#core/constants/tone-class-name.constant";
import { TYPOGRAPHY_TYPE } from "#core/constants/typography-type.constant";
import { Text, type TextProps } from "#react/text/text";

/** The one element a case draws. */
const element = (container: HTMLElement) => {
  const found = container.firstElementChild;
  if (!found) throw new Error("nothing was drawn");
  return found as HTMLElement;
};

describe("Text (web)", () => {
  it("draws a paragraph with HeroUI's default classes", () => {
    const text = element(render(<Text>Hello</Text>).container);
    expect(text.localName).toBe("p");
    for (const name of [
      "typography",
      "typography--body",
      "typography--color-default",
      "typography--align-start",
    ])
      expect(text.classList.contains(name), name).toBe(true);
    expect(text.dataset["type"]).toBe("body");
    expect(text.hasAttribute("lang")).toBe(false);
    expect(text.hasAttribute("dir")).toBe(false);
    expect(text.classList.contains("typography--truncate")).toBe(false);
  });

  it.each(TextType)("maps the %s style to HeroUI's type", (type) => {
    const text = element(render(<Text type={type}>Hello</Text>).container);
    expect(text.dataset["type"]).toBe(TYPOGRAPHY_TYPE[type]);
    expect(text.classList.contains(`typography--${TYPOGRAPHY_TYPE[type]}`)).toBe(true);
  });

  it("maps small to body-sm and caption to body-xs", () => {
    expect(TYPOGRAPHY_TYPE.small).toBe("body-sm");
    expect(TYPOGRAPHY_TYPE.caption).toBe("body-xs");
  });

  it.each(TextTone)("draws the %s tone with HeroUI's colour or the theme's utility", (tone) => {
    const text = element(render(<Text tone={tone}>Hello</Text>).container);
    const utility = TONE_CLASS_NAME[tone];
    expect(text.classList.contains("typography--color-muted")).toBe(tone === "muted");
    expect(text.classList.contains("typography--color-default")).toBe(tone !== "muted");
    for (const name of ["text-accent", "text-success", "text-warning", "text-danger"])
      expect(text.classList.contains(name), name).toBe(name === utility);
  });

  it("knows every shared tone, and muted besides", () => {
    for (const tone of Tone) expect(TextTone).toContain(tone);
    expect(TextTone).toContain("muted");
  });

  it("puts the caller's class after the tone class", () => {
    const text = element(
      render(
        <Text tone="danger" className="mt-2">
          Hello
        </Text>,
      ).container,
    );
    const names = [...text.classList];
    expect(names).toContain("text-danger");
    expect(names).toContain("mt-2");
    expect(names.indexOf("text-danger")).toBeLessThan(names.indexOf("mt-2"));
  });

  it("maps alignment and truncation", () => {
    const text = element(
      render(
        <Text align="end" isTruncated>
          Hello
        </Text>,
      ).container,
    );
    expect(text.classList.contains("typography--align-end")).toBe(true);
    expect(text.classList.contains("typography--truncate")).toBe(true);
  });

  it("sets the language and the direction it implies, which a caller's dir overrides", () => {
    const arabic = element(render(<Text lang="ar">مرحبا</Text>).container);
    expect(arabic.getAttribute("lang")).toBe("ar");
    expect(arabic.getAttribute("dir")).toBe("rtl");
    const english = element(render(<Text lang="en">Hello</Text>).container);
    expect(english.getAttribute("dir")).toBe("ltr");
    const own = element(
      render(
        <Text lang="ar" dir="auto">
          مرحبا
        </Text>,
      ).container,
    );
    expect(own.getAttribute("dir")).toBe("auto");
  });

  it("passes the other props through and the ref reaches the element", () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLParagraphElement>();
    render(
      <Text
        ref={ref}
        id="intro"
        title="Intro"
        data-testid="found"
        aria-describedby="hint"
        weight="bold"
        onClick={onClick}
      >
        Hello
      </Text>,
    );
    const text = screen.getByTestId("found");
    expect(text.id).toBe("intro");
    expect(text.title).toBe("Intro");
    expect(text.getAttribute("aria-describedby")).toBe("hint");
    expect(text.classList.contains("typography--weight-bold")).toBe(true);
    text.click();
    expect(onClick).toHaveBeenCalledOnce();
    expect(ref.current).toBe(text);
  });

  it("draws a span inside a sentence through `render`, keeping the classes", () => {
    const { container } = render(
      <p>
        See <Text render={(props) => <span {...props} />}>this</Text>.
      </p>,
    );
    const span = container.querySelector("span");
    expect(span?.textContent).toBe("this");
    expect(span?.classList.contains("typography--body")).toBe(true);
  });

  it("extends its contract and refuses the HeroUI names the contract replaces", () => {
    expectTypeOf<TextProps>().toExtend<TextContractProps>();
    // @ts-expect-error the colour is `tone`
    void (<Text color="muted" />);
    // @ts-expect-error truncation is `isTruncated`
    void (<Text truncate />);
  });
});
