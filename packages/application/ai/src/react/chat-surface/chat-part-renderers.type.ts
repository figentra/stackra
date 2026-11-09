/**
 * Stackra file contract:
 * Purpose: `ChatPartRenderers`, the registry of how each Tamo data part is drawn in the chat: one function per
 *          `TamoPartKind`, typed by the kind's data, its AI SDK data part and the turn's context (its handlers).
 * Boundary: a type only. A host's renderer wins over `defaultChatPartRenderers` for its kind; a kind with neither draws
 *           nothing. The model never sends markup, only the typed data the renderer draws with @stackra/ui.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { DataUIPart } from "ai";
import type { ReactNode } from "react";

import type { TamoPartKind } from "#contracts/enums/tamo-part-kind.enum";
import type { TamoPartData } from "#contracts/types/tamo-part-data.type";
import type { ChatPartOptions } from "#react/chat-surface/chat-part-options.type";

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
    options: ChatPartOptions,
  ) => ReactNode;
};
