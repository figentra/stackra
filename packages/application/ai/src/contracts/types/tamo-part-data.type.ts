/**
 * Stackra file contract:
 * Purpose: `TamoPartData`, each `TamoPartKind` to the data its part carries.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
import type { TamoAnswerPart } from "#contracts/types/tamo-answer-part.type";
import type { TamoArtifactPart } from "#contracts/types/tamo-artifact-part.type";
import type { TamoChartPart } from "#contracts/types/tamo-chart-part.type";
import type { TamoFormPart } from "#contracts/types/tamo-form-part.type";
import type { TamoKpiPart } from "#contracts/types/tamo-kpi-part.type";
import type { TamoQuestionPart } from "#contracts/types/tamo-question-part.type";
import type { TamoReportPart } from "#contracts/types/tamo-report-part.type";
import type { TamoSuggestionsPart } from "#contracts/types/tamo-suggestions-part.type";
import type { TamoTablePart } from "#contracts/types/tamo-table-part.type";
import type { TamoWidgetRefPart } from "#contracts/types/tamo-widget-ref-part.type";

/** The data of each Tamo part kind; its keys are exactly `TamoPartKind`. */
export interface TamoPartData {
  /** A table the renderer draws. */
  readonly table: TamoTablePart;

  /** A chart the renderer draws. */
  readonly chart: TamoChartPart;

  /** Key figures to show. */
  readonly kpi: TamoKpiPart;

  /** A prefilled action form. */
  readonly form: TamoFormPart;

  /** A question for the user. */
  readonly question: TamoQuestionPart;

  /** A report the renderer draws. */
  readonly report: TamoReportPart;

  /** A saved artifact. */
  readonly artifact: TamoArtifactPart;

  /** A placed widget. */
  readonly widget_ref: TamoWidgetRefPart;

  /** Follow-up suggestions to offer. */
  readonly suggestions: TamoSuggestionsPart;

  /** An answer to a question. */
  readonly answer: TamoAnswerPart;
}
