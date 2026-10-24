/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ContentEntryType`: the built-in types of ADR 0116 CT4 in order, snake_case codes, the
 *          two the template's loaders ask for, and the generated client's `z.enum(Enum.values(...))` input.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0116 (decision CT4); ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { ContentEntryType } from "#core/enums/content-entry-type.enum";

describe("ContentEntryType", () => {
  it("lists the built-in types in order with snake_case codes", () => {
    expect(Enum.values(ContentEntryType)).toEqual([
      "page",
      "post",
      "form_definition",
      "gallery",
      "help_article",
      "faq",
      "announcement",
      "changelog",
      "legal_document",
      "testimonial",
      "team_member",
      "job_posting",
      "reusable_block",
      "navigation_menu",
      "redirect",
      "short_link",
    ]);
    for (const code of Enum.values(ContentEntryType)) expect(code).toMatch(/^[a-z]+(_[a-z]+)*$/);
  });

  it("names the types the landing and pricing loaders ask for", () => {
    expect(ContentEntryType.Faq).toBe("faq");
    expect(ContentEntryType.Testimonial).toBe("testimonial");
    expectTypeOf(ContentEntryType.Faq).toEqualTypeOf<"faq">();
  });

  it("builds the content client's list input", () => {
    const type = z.enum(Enum.values(ContentEntryType));
    expect(type.parse(ContentEntryType.Faq)).toBe("faq");
    expect(type.safeParse("product").success).toBe(false);
    expectTypeOf<z.infer<typeof type>>().toEqualTypeOf<ContentEntryType>();
  });
});
