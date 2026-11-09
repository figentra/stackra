/**
 * Stackra file contract:
 * Purpose: `ChatPartRenderers`, the host's registry of how each Tamo data part is drawn in the chat: one function per
 *          `TamoPartKind`, typed by the kind's data and its AI SDK data part.
 * Boundary: a type only. A kind without a renderer draws nothing; the model never sends markup, only the typed data the
 *           renderer draws with @stackra/ui.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { DataUIPart } from "ai";
import type { ReactNode } from "react";

import type { TamoPartKind } from "#contracts/enums/tamo-part-kind.enum";
import type { TamoPartData } from "#contracts/types/tamo-part-data.type";

/**
 * How each Tamo data part kind is drawn.
 *
 * @example
 * const renderers: ChatPartRenderers = { table: (data) => <DataTable columns={data.columns} rows={data.rows} /> };
 */
export type ChatPartRenderers = {
  readonly [K in TamoPartKind]?: (
    data: TamoPartData[K],
    part: DataUIPart<{ readonly [N in `tamo-${K}`]: TamoPartData[K] }>,
  ) => ReactNode;
};
