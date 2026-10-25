/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template and the generated samples import from
 *          `@stackra/validation` (with the folded `./runtime`) is exported, nothing else is, and the type exports
 *          resolve with the shapes they are used with.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0127 2026-10-24 note.
 */
import { DataClassification } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import * as entry from "#core/index";
import type { Assert, FieldDecorator, Fields, Same, ShapeClass } from "#core/index";

const { Classified, Field, Int, List, Num, Renamed, Schema, Str, Trim } = entry;

class Line extends Schema {
  @Int({ min: 1 })
  quantity = 1;
}

class ContactInput extends Schema {
  @Trim
  @Str({ min: 2, max: 120, message: "web::contact.errors.name" })
  name!: string;

  // reason: an email format with its own message
  @Field(z.string().email("web::contact.errors.email"))
  email!: string;

  @Classified(DataClassification.Personal)
  @Str({ max: 64 })
  phone?: string;

  @Num({ exclusiveMin: 0 })
  rate = 0.01;

  @List({ min: 1 })
  lines: Line[] = [];

  @Renamed("customersMayCancel")
  cancellable = true;
}

describe("@stackra/validation", () => {
  it("exports exactly the runtime surface", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "Classified",
      "CursorInput",
      "Field",
      "Int",
      "List",
      "Num",
      "OmitType",
      "Page",
      "PartialType",
      "PickType",
      "Renamed",
      "Schema",
      "Str",
      "TableInput",
      "Trim",
      "duration",
      "isoDateTime",
      "json",
      "publicId",
      "registerSchemas",
      "schemaOf",
      "tableInput",
      "url",
      "validate",
    ]);
  });

  it("supports the template's uses", () => {
    entry.registerSchemas([
      [
        ContactInput,
        z.object({
          name: z.string().trim().min(2).max(120),
          email: z.string().email(),
          phone: z.string().max(64).exactOptional(),
          rate: z.number().gt(0).default(0.01),
          lines: z.array(z.object({ quantity: z.number().int().min(1) })).min(1),
          cancellable: z.boolean().default(true),
        }),
      ],
    ]);
    const parsed = entry.validate(ContactInput, {
      name: " Lina ",
      email: "lina@northwind.example",
      lines: [{ quantity: 2 }],
    });
    expect(parsed.success && parsed.data.name).toBe("Lina");
    expect(entry.Classified.members(ContactInput).get("phone")).toBe("personal");
    class LinePage extends entry.Page.of(Line) {}
    class NameForm extends entry.PickType(ContactInput, ["name", "email"]) {}
    expect((Object.getPrototypeOf(LinePage) as { name: string }).name).toBe("Page.of(Line)");
    expect(() => entry.validate(NameForm, {})).toThrow(/NameForm has no registered schema/);
    expect(entry.duration("60s")).toBe("PT1M");
    expect(entry.publicId("ord").safeParse("ord_01j9z3k4m5n6p7q8r9s0t1v2w3").success).toBe(true);
  });

  it("resolves the type exports", () => {
    const Line$ = z.object({ quantity: z.number().int().min(1).default(1) });
    expectTypeOf<Assert<Same<z.output<typeof Line$>, Fields<Line>>>>().toEqualTypeOf<true>();
    expectTypeOf<FieldDecorator<string>>().toBeFunction();
    expectTypeOf<InstanceType<ShapeClass<{ a: string }>>>().toExtend<{ a: string }>();
  });
});
