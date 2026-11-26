/**
 * Stackra file contract:
 * Purpose: `TamoPartKind`, the closed list of Tamo's typed data parts in a chat turn: table, chart, KPIs, a prefilled
 *          form, a question, a report, an artifact, a placed widget, follow-up suggestions and a question's answer.
 * Boundary: an enum (`Enum.of`), snake_case codes (ADR 0231). On the wire each kind is the AI SDK data part
 *           `data-tamo-<kind>` (`TamoDataPartType`); the model emits typed data, never markup, and the host's
 *           renderers draw it.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
import { Enum } from "@stackra/contracts";

/**
 * A Tamo data part's kind.
 *
 * @example
 * if (part.type === `data-tamo-${TamoPartKind.Table}`) drawTable(part.data);
 */
export const TamoPartKind = Enum.of({
  /** Rows under columns. */
  Table: "table",
  /** Rows drawn as a chart. */
  Chart: "chart",
  /** A band of key figures. */
  Kpi: "kpi",
  /** An action's form, prefilled for the person to check and send. */
  Form: "form",
  /** A question Tamo asks the person. */
  Question: "question",
  /** Headed sections that may embed other parts. */
  Report: "report",
  /** A saved artifact, by id and version. */
  Artifact: "artifact",
  /** A module's widget, placed in the turn. */
  WidgetRef: "widget_ref",
  /** Follow-up prompts the person may send. */
  Suggestions: "suggestions",
  /** The person's answer to a question. */
  Answer: "answer",
});

/** One of the codes above. */
export type TamoPartKind = Enum.Value<typeof TamoPartKind>;
