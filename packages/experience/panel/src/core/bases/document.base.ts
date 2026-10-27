/**
 * Stackra file contract:
 * Purpose: `Document({ kind, path, area, navigation, layout, range, blocks })`, the kind base of a saved,
 *          scope-editable block tree: a Page a route renders, or a Dashboard of widget tiles under one range picker.
 * Boundary: called only; registered as the `document` kind, not a binding. A document only references registered
 *           code (blocks by class, widgets by class, keys as typed constants), never markup, expressions or logic. A
 *           Dashboard places widget blocks only and has no layout; a Page has no range picker. The key and the title
 *           are derived. `DocumentBase` is the instance base; the entry exports it as a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 20); ADR 0110; ADR 0154; ADR 0270; ADR 0294 (decisions 16, 20 and 23); ADR 0305
 *                     (rule 43).
 */
import { createKind } from "@stackra/container";
import { ApiArea, Enum } from "@stackra/contracts";

import { DocumentBase } from "#core/bases/document-base.base";
import { DocumentKind } from "#core/enums/document-kind.enum";
import { DocumentLayout } from "#core/enums/document-layout.enum";
import { TimeRange } from "#core/enums/time-range.enum";
import type { DocumentOptions } from "#core/types/document-options.type";

/** The one called form. */
type DocumentForm = (options: DocumentOptions) => abstract new () => DocumentBase;

/** Checks a dashboard's range picker. */
function checkRange(range: DocumentOptions["range"]): void {
  if (range === undefined) return;
  const codes: readonly string[] = Enum.values(TimeRange);
  if (range.ranges.length === 0 || !range.ranges.every((code) => codes.includes(code)))
    throw new TypeError(
      `Document({ range.ranges }) are TimeRange codes, got ${JSON.stringify(range.ranges)}`,
    );
  if (!range.ranges.includes(range.default))
    throw new TypeError(
      `Document({ range.default }) is one of its ranges, got ${JSON.stringify(range.default)}`,
    );
}

/** Checks the options and records them frozen (an object type, so the kind registry takes it). */
function read(options?: Partial<DocumentOptions>) {
  const kind = options?.kind;
  if (kind === undefined || !Enum.values(DocumentKind).includes(kind))
    throw new TypeError(`Document({ kind }) is a DocumentKind, got ${JSON.stringify(kind)}`);
  const blocks = options?.blocks;
  if (!Array.isArray(blocks))
    throw new TypeError("Document({ blocks }) lists the document's blocks");
  if (options?.path !== undefined && !options.path.startsWith("/"))
    throw new TypeError(`Document({ path }) starts with "/", got ${JSON.stringify(options.path)}`);
  if (options?.area !== undefined && !Enum.values(ApiArea).includes(options.area))
    throw new TypeError(`Document({ area }) is an ApiArea, got ${JSON.stringify(options.area)}`);
  if (kind === DocumentKind.Dashboard) {
    if (blocks.some((block) => block.kind !== "widget"))
      throw new TypeError("A Dashboard places widget blocks only: use Blocks.widget(...)");
    if (options?.layout !== undefined)
      throw new TypeError("A Dashboard is always the 12-column grid: it takes no layout");
    checkRange(options?.range);
  } else {
    if (options?.range !== undefined)
      throw new TypeError("A Page has no range picker: a Dashboard does");
    if (options?.layout !== undefined && !Enum.values(DocumentLayout).includes(options.layout))
      throw new TypeError(
        `Document({ layout }) is a DocumentLayout, got ${JSON.stringify(options.layout)}`,
      );
  }
  return Object.freeze({ ...options, kind, blocks: Object.freeze([...blocks]) });
}

/**
 * The document kind base.
 *
 * @example
 * export class SalesOverviewDocument extends Document({
 *   kind: DocumentKind.Dashboard,
 *   path: "/sales",
 *   area: ApiArea.Admin,
 *   blocks: [Blocks.widget(OrderKpisWidget), Blocks.widget(AwaitingPaymentWidget, { size: WidgetSize.Full })],
 * }) {}
 */
export const Document = createKind("document", DocumentBase, read) as DocumentForm;
