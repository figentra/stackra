/**
 * Stackra file contract:
 * Purpose: `LANDING_BLOCK_ICONS`, the palette icon of each landing block of STA-2041, by block.
 * Boundary: data only: the icon names the blocks' `Block({ icon })` read, held here until gen emits the `Icons`
 *           constants (ADR 0322), because an icon position takes a constant, never a literal (R-56).
 * Runtime: isomorphic
 * Governing contract: owner decision R-56; ADR 0322 (decision 3); ADR 0294 (decision 16); STA-2041.
 */
import type { IconName } from "@stackra/icons/contracts";

/** Each landing block's palette icon. */
export const LANDING_BLOCK_ICONS = Object.freeze({
  siteHeader: "panel-top",
  heroMachine: "sparkles",
  ctaRow: "mouse-pointer-click",
  statement: "quote",
  chapterTitle: "heading",
  station: "milestone",
  stepSwitcher: "list-ordered",
  bentoGrid: "layout-grid",
  terminalStage: "terminal",
  monoDisplay: "type",
  askAi: "bot",
  productCards: "boxes",
  siteFooter: "panel-bottom",
  surfaces: "monitor-smartphone",
  pageDock: "panel-bottom-open",
  capabilityMatrix: "table",
  leadForm: "mail",
} as const satisfies Readonly<Record<string, IconName>>);
