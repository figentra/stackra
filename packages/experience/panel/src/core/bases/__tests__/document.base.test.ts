/**
 * Stackra file contract:
 * Purpose: unit tests of `Document({ kind })`: a Page and a Dashboard record their checked options; a Dashboard refuses a
 *          non-widget block and a layout, a Page refuses a range picker, and the range must offer its default.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 20); ADR 0154;
 *                     STA-1383 (one document-kind vocabulary: ExperienceKind).
 */
import { kindOf } from "@stackra/container";
import { ApiArea } from "@stackra/contracts";
import { ExperienceKind } from "@stackra/experience/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DocumentBase } from "#core/bases/document-base.base";
import { Document } from "#core/bases/document.base";
import { Blocks } from "#core/constants/blocks.constant";
import { DocumentLayout } from "#core/enums/document-layout.enum";
import { TimeRange } from "#core/enums/time-range.enum";
import { WidgetSize } from "#core/enums/widget-size.enum";

class KpisWidget {}
class ListOrdersQuery {}

describe("Document", () => {
  it("records a dashboard of widget tiles under one range picker", () => {
    class SalesOverview extends Document({
      kind: ExperienceKind.Dashboard,
      path: "/sales",
      area: ApiArea.Admin,
      range: { ranges: [TimeRange.Today, TimeRange.Last30Days], default: TimeRange.Last30Days },
      blocks: [Blocks.widget(KpisWidget), Blocks.widget(KpisWidget, { size: WidgetSize.Full })],
    }) {}
    const record = kindOf(SalesOverview);
    expect(record?.kind).toBe("document");
    expect(record?.options).toMatchObject({ kind: "dashboard", path: "/sales", area: "admin" });
    expect(new SalesOverview()).toBeInstanceOf(DocumentBase);
  });

  it("records a page with a table block and a layout", () => {
    class MyOrders extends Document({
      kind: ExperienceKind.Page,
      layout: DocumentLayout.SingleColumn,
      blocks: [Blocks.table(ListOrdersQuery, { columns: [] })],
    }) {}
    expect(kindOf(MyOrders)?.options).toMatchObject({ kind: "page", layout: "single_column" });
  });

  it("refuses what each kind does not take", () => {
    expect(() =>
      Document({
        kind: ExperienceKind.Dashboard,
        blocks: [Blocks.table(ListOrdersQuery, { columns: [] })],
      }),
    ).toThrow(/widget blocks only/);
    expect(() =>
      Document({ kind: ExperienceKind.Dashboard, layout: DocumentLayout.Stack, blocks: [] }),
    ).toThrow(TypeError);
    expect(() =>
      Document({
        kind: ExperienceKind.Page,
        range: { ranges: [TimeRange.Today], default: TimeRange.Today },
        blocks: [],
      }),
    ).toThrow(/range picker/);
    expect(() =>
      Document({
        kind: ExperienceKind.Dashboard,
        range: { ranges: [TimeRange.Today], default: TimeRange.ThisMonth },
        blocks: [],
      }),
    ).toThrow(TypeError);
    expect(() => Document({ kind: ExperienceKind.Page, path: "sales", blocks: [] })).toThrow(
      TypeError,
    );
    expect(() => Document({ kind: "report" as typeof ExperienceKind.Page, blocks: [] })).toThrow(
      TypeError,
    );
    // a document kind of the builder that is not a panel document
    expect(() =>
      Document({ kind: ExperienceKind.Screen as typeof ExperienceKind.Page, blocks: [] }),
    ).toThrow(TypeError);
  });
});
