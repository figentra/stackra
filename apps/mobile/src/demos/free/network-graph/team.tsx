/**
 * Stackra file contract:
 * Purpose: the "team" demo of the native NetworkGraph: a product team: who works with whom, coloured by team, the busiest people largest.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap wave, owner approval 2026-10-31).
 */
import { NetworkGraph, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NETWORK_GRAPH_DEMO_KEYS } from "#src/demos/free/network-graph/network-graph-demo-keys.constant";

/** The demo's keys. */
const K = NETWORK_GRAPH_DEMO_KEYS.demo_free.network_graph.team;

/** Each person and their team. */
const PEOPLE = [
  ["sara", "design"],
  ["omar", "design"],
  ["lina", "design"],
  ["khalid", "engineering"],
  ["noura", "engineering"],
  ["faisal", "engineering"],
  ["huda", "engineering"],
  ["yousef", "sales"],
  ["reem", "sales"],
  ["majed", "sales"],
] as const;

/** Who worked together this quarter, and how often. */
const LINKS = [
  { source: "sara", target: "omar", value: 8 },
  { source: "sara", target: "lina", value: 5 },
  { source: "omar", target: "lina", value: 3 },
  { source: "sara", target: "khalid", value: 6 },
  { source: "khalid", target: "noura", value: 9 },
  { source: "khalid", target: "faisal", value: 7 },
  { source: "noura", target: "faisal", value: 4 },
  { source: "faisal", target: "huda", value: 5 },
  { source: "huda", target: "noura", value: 2 },
  { source: "khalid", target: "yousef", value: 3 },
  { source: "yousef", target: "reem", value: 6 },
  { source: "reem", target: "majed", value: 4 },
  { source: "yousef", target: "majed", value: 2 },
  { source: "lina", target: "reem", value: 2 },
];

/** Network graph: team. */
export default function Team() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <NetworkGraph
      label={t(K.label)}
      nodes={PEOPLE.map(([key, group]) => ({ key, group, label: t(K[key]) }))}
      links={LINKS}
    />
  );
}
