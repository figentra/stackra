/**
 * Stackra file contract:
 * Purpose: the "plans" demo of the native ChordDiagram: a month of customers moving between plans, and those who cancelled.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap wave, owner approval 2026-10-31).
 */
import { ChordDiagram, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHORD_DIAGRAM_DEMO_KEYS } from "#src/demos/free/chord-diagram/chord-diagram-demo-keys.constant";

/** The demo's keys. */
const K = CHORD_DIAGRAM_DEMO_KEYS.demo_free.chord_diagram.plans;

/** The plans, round the circle. */
const PLANS = ["basic", "standard", "premium", "cancelled"] as const;

/** October's moves from one plan to another. */
const MOVES = [
  { source: "basic", target: "standard", value: 120 },
  { source: "standard", target: "premium", value: 80 },
  { source: "premium", target: "standard", value: 30 },
  { source: "standard", target: "basic", value: 25 },
  { source: "basic", target: "cancelled", value: 40 },
  { source: "standard", target: "cancelled", value: 22 },
  { source: "premium", target: "cancelled", value: 10 },
];

/** Chord diagram: plans. */
export default function Plans() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ChordDiagram
      label={t(K.label)}
      nodes={PLANS.map((key) => ({ key, label: t(K[key]) }))}
      links={MOVES}
    />
  );
}
