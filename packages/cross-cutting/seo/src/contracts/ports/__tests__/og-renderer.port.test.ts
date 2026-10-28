/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `OgRenderer` port: it is a `Port`, a subclass that implements `render` stands in
 *          for it, and `render` answers PNG bytes.
 * Boundary: test only; the implementation is an in-test stand-in, not a shipped driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 16 and 17).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { OgRenderer } from "#contracts/ports/og-renderer.port";
import type { OgCard } from "#contracts/types/og-card.type";

/** A renderer that answers the PNG signature. */
class SignatureRenderer extends OgRenderer {
  async render(_card: OgCard): Promise<Uint8Array<ArrayBuffer>> {
    return new Uint8Array([137, 80, 78, 71]);
  }
}

describe("OgRenderer", () => {
  it("is a port that an implementation stands in for", async () => {
    const renderer: OgRenderer = new SignatureRenderer();
    expect(renderer).toBeInstanceOf(Port);
    const png = await renderer.render({
      template: "site",
      width: 1200,
      height: 630,
      title: "Acme",
      siteName: "Acme",
      dir: "ltr",
      brand: {},
      logo: "",
    });
    expect([...png]).toEqual([137, 80, 78, 71]);
  });

  it("types render as PNG bytes", () => {
    expectTypeOf<ReturnType<OgRenderer["render"]>>().toEqualTypeOf<
      Promise<Uint8Array<ArrayBuffer>>
    >();
    expectTypeOf<OgRenderer["~key"]>().toEqualTypeOf<"seo.OgRenderer">();
  });
});
