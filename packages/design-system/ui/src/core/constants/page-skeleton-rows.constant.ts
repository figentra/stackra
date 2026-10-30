/**
 * Stackra file contract:
 * Purpose: the placeholders of each PageSkeleton layout as plain data: a column of rows, each row a line of bones
 *          with the classes that give it its shape and size. The web and native PageSkeleton draw the same rows, so
 *          the two runtimes show one layout.
 * Boundary: data only; classes are Tailwind utilities that Uniwind reads as well (heights, widths, radii, gaps), with
 *           no physical sides, so right-to-left mirrors by itself. Internal, not in the `.` barrel: `react/` and
 *           `native/` import it by path.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decision 6); ADR 0060 (RTL).
 */
import type { PageSkeletonLayout } from "#contracts/enums/page-skeleton-layout.enum";

/** One placeholder: a stable id for its React key and the classes that shape it. */
interface SkeletonBone {
  /** Unique inside its row. */
  readonly id: string;
  /** The Skeleton's `className`: its height, width and radius. */
  readonly className: string;
}

/** A line of bones, laid out start to end. */
interface SkeletonRow {
  /** Unique inside its layout. */
  readonly id: string;
  /** The bones, in reading order. */
  readonly bones: readonly SkeletonBone[];
  /** Extra classes for the row, for example `justify-between`. */
  readonly className?: string;
}

const bone = (id: string, className: string): SkeletonBone => ({ id, className });

const row = (id: string, bones: readonly SkeletonBone[], className?: string): SkeletonRow =>
  className === undefined ? { id, bones } : { id, bones, className };

/** A row of one full-width bone. */
const wide = (id: string, className: string): SkeletonRow => row(id, [bone("bone", className)]);

/** The rows of a table body: four equal cells each. */
const tableRows = Array.from({ length: 6 }, (_, index) =>
  row(
    `row-${index + 1}`,
    ["a", "b", "c", "d"].map((cell) => bone(cell, "h-6 flex-1 rounded")),
  ),
);

/** The rows of a form: a label, then an input, for each of four fields. */
const formFieldRows = ["one", "two", "three", "four"].flatMap((field) => [
  wide(`${field}-label`, "h-4 w-24 rounded"),
  wide(`${field}-input`, "h-10 w-full rounded-[var(--radius-control)]"),
]);

/** The rows of each layout, top to bottom. */
export const PAGE_SKELETON_ROWS = Object.freeze({
  page: [
    row(
      "header",
      [
        bone("title", "h-8 w-1/3 rounded-[var(--radius-control-inner)]"),
        bone("action", "h-9 w-28 rounded-[var(--radius-control)]"),
      ],
      "justify-between",
    ),
    wide("subtitle", "h-4 w-1/2 rounded"),
    row("blocks", [
      bone("first", "h-40 flex-1 rounded-[var(--radius-control)]"),
      bone("second", "h-40 flex-1 rounded-[var(--radius-control)]"),
    ]),
    wide("detail", "h-24 w-full rounded-[var(--radius-control)]"),
  ],
  table: [
    row(
      "toolbar",
      [
        bone("search", "h-9 w-64 rounded-[var(--radius-control)]"),
        bone("action", "h-9 w-24 rounded-[var(--radius-control)]"),
      ],
      "justify-between",
    ),
    row(
      "head",
      ["a", "b", "c", "d"].map((cell) => bone(cell, "h-4 flex-1 rounded")),
    ),
    ...tableRows,
  ],
  section: [
    wide("heading", "h-6 w-1/4 rounded"),
    wide("line-one", "h-4 w-full rounded"),
    wide("line-two", "h-4 w-full rounded"),
    wide("line-three", "h-4 w-3/4 rounded"),
    wide("block", "h-32 w-full rounded-[var(--radius-control)]"),
  ],
  form: [
    ...formFieldRows,
    row("actions", [
      bone("save", "h-9 w-24 rounded-[var(--radius-control)]"),
      bone("cancel", "h-9 w-20 rounded-[var(--radius-control)]"),
    ]),
  ],
} as const satisfies Record<PageSkeletonLayout, readonly SkeletonRow[]>);
