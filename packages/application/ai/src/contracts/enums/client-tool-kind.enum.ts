/**
 * Stackra file contract:
 * Purpose: `ClientToolKind`, which generated handler a client tool runs on the viewer's screen: navigate, open or
 *          filter or sort or select a list, apply a saved view, open a record, prefill an action's form, preview the
 *          theme, mode or density, start, advance or stop a tour, or point at an anchor.
 * Boundary: an enum (`Enum.of`), snake_case codes (ADR 0231), written by gen into each row of the client tool table
 *           (`#stackra/client-tools`) and read by the SDK to pick the handler. A client tool only changes the viewer's
 *           screen (ADR 0490 decision 2).
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decisions 1 and 2); STA-1631.
 */
import { Enum } from "@stackra/contracts";

/**
 * A client tool's handler kind.
 *
 * @example
 * { key: "navigate.order_detail", name: "navigate_order_detail", from: "client", risk: "L0", kind: ClientToolKind.Navigate }
 */
export const ClientToolKind = Enum.of({
  /** Goes to a route (`navigate.<route>`); the input is the route's path parameters. */
  Navigate: "navigate",
  /** Opens a resource's list page. */
  ListOpen: "list_open",
  /** Sets a list's filters. */
  Filter: "filter",
  /** Sets a list's sort. */
  Sort: "sort",
  /** Selects rows of the open list. */
  Select: "select",
  /** Applies a saved view to a list. */
  ViewApply: "view_apply",
  /** Opens one record's page. */
  RecordOpen: "record_open",
  /** Opens a placed action's input modal with the agent's draft; the human submits. */
  Prefill: "prefill",
  /** Previews the theme, mode or density on this screen only. */
  Preview: "preview",
  /** Starts a stored tour. */
  TourStart: "tour_start",
  /** Advances the running tour. */
  TourNext: "tour_next",
  /** Stops the running tour. */
  TourStop: "tour_stop",
  /** Points at a declared anchor. */
  Point: "point",
});

/** One of the codes above. */
export type ClientToolKind = Enum.Value<typeof ClientToolKind>;
