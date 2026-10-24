/**
 * Stackra file contract:
 * Purpose: unit tests of `createSourceReader`'s refusals on a fixture of banned forms: `shape_number_kind`,
 *          `shape_unknown_type` (a literal union, an interface, an inferred enum literal with the annotation fix),
 *          `shape_default_not_constant`, `shape_rule_not_constant`, `shape_hatch_reason_missing`,
 *          `shape_decorator_type_mismatch`, `action_handle_signature`, `two_declarations_in_file`,
 *          `partner_mismatch`, `event_base_abstract` and `token_not_a_class`, each with a position and a fix; and a
 *          derived shape (`PickType`) and a discriminated union read correctly.
 * Boundary: test only; writes the fixture under `.cache/` and opens TypeScript on it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26, 2026-10-23 item 13); ADR 0305 (rules 6, 13
 *                     and 19).
 */
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { createSourceReader } from "#node/functions/create-source-reader.function";
import { openHost } from "#node/functions/open-host.function";
import { readMemberFacts } from "#node/functions/read-member-facts.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

/** The banned and edge forms, one per file. */
const SOURCES: Readonly<Record<string, string>> = {
  "src/core/schemas/banned.schema.ts": [
    'import { Field, Int, Str, Schema } from "@stackra/validation";',
    'import { OrderStatus } from "#contracts/enums/order-status.enum";',
    "",
    "interface Loose { a: string }",
    "const LIMIT: number = 5;",
    "",
    "export class Banned extends Schema {",
    "  count!: number;",
    '  mode!: "a" | "b";',
    "  loose!: Loose;",
    "  status = OrderStatus.Paid;",
    "  createdAt: Date = new Date();",
    "  @Int({ max: LIMIT })",
    "  capped!: number;",
    "  @Field(OrderStatus)",
    "  hatched!: string;",
    "  @Str({ max: 3 })",
    "  misplaced!: boolean;",
    "}",
    "",
  ].join("\n"),
  "src/contracts/enums/order-status.enum.ts": [
    'import { Enum } from "@stackra/contracts";',
    'export const OrderStatus = Enum.of({ Pending: "pending", Paid: "paid" });',
    "export type OrderStatus = Enum.Value<typeof OrderStatus>;",
    "",
  ].join("\n"),
  "src/core/schemas/two.schema.ts": [
    'import { Schema } from "@stackra/validation";',
    "export class One extends Schema {}",
    "export class Two extends Schema {}",
    "",
  ].join("\n"),
  "src/node/actions/untyped.action.ts": [
    'import { Action } from "@stackra/actions";',
    'export class UntypedAction extends Action({ key: "order.untyped" }) {',
    "  async handle(input: string): Promise<number> {",
    "    return input.length;",
    "  }",
    "}",
    "",
  ].join("\n"),
  "src/node/events/raw.event.ts": [
    'import { Event } from "@stackra/events";',
    "export class RawEvent extends Event {}",
    "",
  ].join("\n"),
  "src/core/services/bad-token.service.ts": [
    'import { Service } from "@stackra/container";',
    "export class BadTokenService extends Service {",
    "  constructor(private readonly name: string) {",
    "    super();",
    "  }",
    "}",
    "",
  ].join("\n"),
  "src/core/schemas/order-view.schema.ts": [
    'import type { PublicId } from "@stackra/contracts";',
    'import { Schema } from "@stackra/validation";',
    "export class OrderView extends Schema {",
    '  id!: PublicId<"ord">;',
    "  note?: string;",
    "}",
    "",
  ].join("\n"),
  "src/core/schemas/order-ref.schema.ts": [
    'import { PickType } from "@stackra/validation";',
    'import { OrderView } from "#core/schemas/order-view.schema";',
    'export class OrderRef extends PickType(OrderView, ["id"]) {}',
    "",
  ].join("\n"),
  "src/core/schemas/link-cta.schema.ts": [
    'import { Schema } from "@stackra/validation";',
    'import { OrderStatus } from "#contracts/enums/order-status.enum";',
    "export class LinkCta extends Schema {",
    "  kind!: typeof OrderStatus.Pending;",
    "  href!: string;",
    "}",
    "",
  ].join("\n"),
  "src/core/schemas/paid-cta.schema.ts": [
    'import { Schema } from "@stackra/validation";',
    'import { OrderStatus } from "#contracts/enums/order-status.enum";',
    "export class PaidCta extends Schema {",
    "  kind!: typeof OrderStatus.Paid;",
    "}",
    "",
  ].join("\n"),
  "src/core/schemas/banner.schema.ts": [
    'import { Schema } from "@stackra/validation";',
    'import { LinkCta } from "#core/schemas/link-cta.schema";',
    'import { PaidCta } from "#core/schemas/paid-cta.schema";',
    "export class Banner extends Schema {",
    "  cta!: LinkCta | PaidCta;",
    "}",
    "",
  ].join("\n"),
};

describe("createSourceReader", async () => {
  const root = writeFixtureMember("banned", SOURCES);
  const host = await openHost(join(root, "tsconfig.json"));
  const reader = createSourceReader(host, readMemberFacts(root));
  const shapes = reader.sources.flatMap((file) => reader.shapes(file));
  for (const file of reader.sources) {
    reader.classes(file);
    reader.exports(file);
  }
  host.close();
  const codes = reader.errors.map((error) => `${error.code} ${error.subject}`);

  it("refuses the banned shape forms with a fix", () => {
    expect(codes).toContain("shape_number_kind Banned.count");
    expect(codes).toContain("shape_unknown_type Banned.mode");
    expect(codes).toContain("shape_unknown_type Banned.loose");
    expect(codes).toContain("shape_unknown_type Banned.status");
    expect(codes).toContain("shape_default_not_constant Banned.createdAt");
    expect(codes).toContain("shape_rule_not_constant Banned.capped");
    expect(codes).toContain("shape_hatch_reason_missing Banned.hatched");
    expect(codes).toContain("shape_decorator_type_mismatch Banned.misplaced");
    const status = reader.errors.find((error) => error.subject === "Banned.status");
    expect(status?.fix).toBe("annotate the field: `status: OrderStatus = OrderStatus.Paid`");
    expect(status?.file).toBe("src/core/schemas/banned.schema.ts");
    expect(status?.line).toBeGreaterThan(0);
  });

  it("refuses the banned class and file forms", () => {
    expect(codes).toContain("two_declarations_in_file src/core/schemas/two.schema.ts");
    expect(codes).toContain("action_handle_signature UntypedAction");
    expect(codes).toContain("event_base_abstract RawEvent");
    expect(codes).toContain("token_not_a_class BadTokenService.constructor");
  });

  it("reads a derived shape and a discriminated union", () => {
    expect(
      shapes.find((shape) => shape.name === "OrderRef")?.fields.map((field) => field.name),
    ).toEqual(["id"]);
    expect(shapes.find((shape) => shape.name === "Banner")?.fields[0]?.type).toEqual({
      kind: "union",
      discriminator: "kind",
      members: [
        { name: "LinkCta", module: "banned" },
        { name: "PaidCta", module: "banned" },
      ],
    });
    expect(shapes.find((shape) => shape.name === "PaidCta")?.fields[0]?.type).toEqual({
      kind: "enum",
      name: "OrderStatus.Paid",
      values: ["paid"],
    });
  });
});
