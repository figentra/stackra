/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Style`: it renders one `<style>` with the provider's nonce, its attributes
 *          (`data-brand` as the site layout passes it) and its CSS as text, with no nonce outside a provider, a
 *          `</style>` in the CSS unable to close the element, and `nonce` and raw HTML refused as props.
 * Boundary: test only; renders with react-dom/server.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0237.
 */
import { renderToString } from "react-dom/server";

import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { NonceProvider } from "#react/nonce/nonce-provider";
import { Style } from "#react/style/style";
import type { StyleProps } from "#react/style/style-props.type";

describe("Style", () => {
  it("renders the CSS with the request's nonce and its attributes", () => {
    const html = renderToString(
      <NonceProvider value="abc">
        <Style data-brand>{":root{--accent:oklch(0.6 0.2 250)}"}</Style>
      </NonceProvider>,
    );
    expect(html).toMatch(/^<style /);
    expect(html).toContain('nonce="abc"');
    expect(html).toContain('data-brand="true"');
    expect(html).toContain(":root{--accent:oklch(0.6 0.2 250)}</style>");
  });

  it("renders no nonce outside a provider", () => {
    const html = renderToString(<Style media="print">{"body{color:black}"}</Style>);
    expect(html).toContain('media="print"');
    expect(html).not.toContain("nonce");
  });

  it("keeps a closing tag in the CSS from ending the element", () => {
    // React escapes `</style` inside a style element's text, so the injected markup stays CSS text
    const html = renderToString(<Style>{"a{}</style><script>alert(1)</script>"}</Style>);
    expect(html.match(/<\/style>/g)).toHaveLength(1);
    expect(html.endsWith("</style>")).toBe(true);
  });

  it("takes neither a nonce nor raw HTML", () => {
    expectTypeOf<StyleProps>().not.toHaveProperty("nonce");
    expectTypeOf<StyleProps>().not.toHaveProperty("dangerouslySetInnerHTML");
    expectTypeOf<StyleProps["children"]>().toEqualTypeOf<string>();
  });
});
