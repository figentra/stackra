/**
 * Stackra file contract:
 * Purpose: `nativeExamples(entry)`, the entry's examples that exist on native (an example's `platforms`, else the
 *          entry's), so the Preview pager, the Usage tab and the RTL preview skip the web-only ones.
 * Boundary: pure; the same rule as the playground's component page.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1 (`ExampleEntry.platforms`).
 */
import type { ComponentEntry, ExampleEntry } from "@stackra/showcase";

/** The examples of `entry` that native draws. */
export const nativeExamples = (entry: ComponentEntry): readonly ExampleEntry[] =>
  entry.examples.filter((example) => (example.platforms ?? entry.platforms).includes("native"));
