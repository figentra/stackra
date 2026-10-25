/**
 * Stackra file contract:
 * Purpose: `DisplayKind`, the built-in displays a widget presents its query's answer with.
 * Boundary: an enum (`Enum.of`) carried by each display node; only `Custom` takes a renderer. The Chart, Table,
 *           Timeline, Banner and Check displays wait for their options to be decided.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14, 15 and 18); ADR 0110 (0294 note: display kinds); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * A widget's display.
 *
 * @example
 * d.kpi("revenue") // a node of kind DisplayKind.Kpi
 */
export const DisplayKind = Enum.of({
  /** One metric field: value, change against the previous period, target. */
  Kpi: "kpi",
  /** Several metric fields in one tile. */
  KpiGroup: "kpi_group",
  /** One metric field against its target. */
  Progress: "progress",
  /** The rows of a list field: a primary line, a secondary line and a meta value. */
  List: "list",
  /** A resource's saved view, with its columns and row actions. */
  View: "view",
  /** The producing package's own renderer, bound by the widget's name. */
  Custom: "custom",
});

/** One of the codes above. */
export type DisplayKind = Enum.Value<typeof DisplayKind>;
