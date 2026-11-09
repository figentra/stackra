/**
 * Stackra file contract:
 * Purpose: `defaultChatPartRenderers`, how the ChatSurface draws Tamo's data parts when the host gives no renderer for
 *          the kind: a table, a chart, KPIs, a question, follow-up suggestions and a file Tamo made, each with
 *          @stackra/ui.
 * Boundary: a registry only. A host's `renderers` entry wins for its kind. `widget_ref`, `form`, `report` and `answer`
 *           have no default, since they need the host's or the panel's context: they draw nothing unless the host
 *           renders them.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0507 (Ask Tamo); ADR 0165 (UI through @stackra/ui).
 */
import type { ChatPartRenderers } from "#react/chat-surface/chat-part-renderers.type";
import { renderArtifactPart } from "#react/chat-surface/render-artifact-part.function";
import { renderChartPart } from "#react/chat-surface/render-chart-part.function";
import { renderKpiPart } from "#react/chat-surface/render-kpi-part.function";
import { renderQuestionPart } from "#react/chat-surface/render-question-part.function";
import { renderSuggestionsPart } from "#react/chat-surface/render-suggestions-part.function";
import { renderTablePart } from "#react/chat-surface/render-table-part.function";

/**
 * The default renderer of each Tamo data part kind that needs no host context.
 *
 * @example
 * const renderers: ChatPartRenderers = {
 *   table: (data, part, options) => <Card>{defaultChatPartRenderers.table?.(data, part, options)}</Card>,
 * };
 */
export const defaultChatPartRenderers: ChatPartRenderers = Object.freeze({
  table: renderTablePart,
  chart: renderChartPart,
  kpi: renderKpiPart,
  question: renderQuestionPart,
  suggestions: renderSuggestionsPart,
  artifact: renderArtifactPart,
});
