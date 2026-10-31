/**
 * Stackra file contract:
 * Purpose: `NETWORK_GRAPH_KEYS`, the typed keys of the web Network graph demos' words in `assets/lang/<locale>/network_graph.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The network_graph namespace's keys. */
export const NETWORK_GRAPH_KEYS = keys({
  network_graph: [
    "label",
    "sara",
    "omar",
    "lina",
    "khalid",
    "noura",
    "faisal",
    "huda",
    "yousef",
    "reem",
    "majed",
  ],
});
