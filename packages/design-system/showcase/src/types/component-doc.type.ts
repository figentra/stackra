/**
 * Stackra file contract:
 * Purpose: `ComponentDoc`, the structured extras of a component's doc page that are not words: its keyboard map, its
 *          anatomy items, the entries to reach for instead, and whether the knobs playground mounts it. The words
 *          (hero, pillars, do/don't, reasons) live in `showcase::doc.component.<tier>.<slug>.*`.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (doc pages wave, 2026-10-28).
 */
import type { KeyboardRow } from "#src/types/keyboard-row.type";

/** The doc-page extras of one entry; every field is optional. */
export interface ComponentDoc {
  /** The Keyboard panel rows, in the order a person meets them. */
  readonly keyboard?: readonly KeyboardRow[];
  /** The anatomy items, numbered in this order; each label is `…anatomy.<id>` in the catalogue. */
  readonly anatomy?: readonly string[];
  /** Entry keys to use instead ("free/switch"); each reason is `…alternative.<slug>` in the catalogue. */
  readonly alternatives?: readonly string[];
  /** The knobs playground mounts the export, its children the component's title when `children` is true; absent = no playground. */
  readonly playground?: { readonly children?: boolean };
  /** How many do and don't rules the catalogue holds (`…do_1`, `…dont_1`, …). */
  readonly rules?: { readonly do: number; readonly dont: number };
}
