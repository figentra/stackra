/**
 * Stackra file contract:
 * Purpose: `SCHEDULING_BOARD_METRICS`, the native SchedulingBoard's fixed sizes in points: a column's width per view,
 *          the resource label column, a row, a group heading, the column header, a block's inset and the resize
 *          handle. Every block is placed at `offset * width`, so the sizes must stay fixed.
 * Boundary: internal; each size is a multiple of the theme's spacing unit, so a denser theme draws a denser board.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0501 (native tokens); WCAG 2.2 SC 2.5.8 (a slot is at least 24
 *          points wide); shared modules step 4a (LEADER, 2026-11-09).
 */
import { THEME_PX } from "#core/constants/theme-px.constant";

/** The spacing unit every size is a multiple of. */
const UNIT = THEME_PX.spacing;

/** The native SchedulingBoard's sizes. */
export const SCHEDULING_BOARD_METRICS = Object.freeze({
  /** A slot's width in the day view. */
  daySlotWidth: UNIT * 12,
  /** A slot's width in the week view, narrower so a week stays scrollable; still a 24-point target. */
  weekSlotWidth: UNIT * 6,
  /** A day's width in the timeline view. */
  timelineDayWidth: UNIT * 24,
  /** The resource label column at the start of each row. */
  labelWidth: UNIT * 36,
  /** The indent per parent of a resource's label. */
  indent: UNIT * 4,
  /** A resource row's height. */
  rowHeight: UNIT * 14,
  /** A group heading's height. */
  groupHeight: UNIT * 10,
  /** The column header's height: the day line and the time line. */
  headerHeight: UNIT * 12,
  /** The gap between a block and its lane's edges. */
  inset: UNIT,
  /** The resize handle's width at a block's end edge. */
  handleWidth: UNIT * 3,
  /** The extra reach of the resize handle beyond its width. */
  handleSlop: UNIT * 2,
});
