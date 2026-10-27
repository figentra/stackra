/**
 * Stackra file contract:
 * Purpose: `navigationLabel`, the label of a demo navigation id, for the page that shows where the user is; an
 *          unknown id is its own label.
 * Boundary: a pure function over `DEMO_NAVIGATION`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0305 (rule 10); STA-403 FR-005.
 */
import { DEMO_NAVIGATION } from "#src/components/demo-navigation/demo-navigation.constant";

/** The label of a navigation id, for the page that shows where the user is. */
export function navigationLabel(id: string): string {
  const all = [...DEMO_NAVIGATION.items, DEMO_NAVIGATION.settings].flatMap((item) => [
    item,
    ...("children" in item ? (item.children ?? []) : []),
  ]);
  return all.find((item) => item.id === id)?.label ?? id;
}
