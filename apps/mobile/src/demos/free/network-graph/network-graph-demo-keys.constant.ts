/**
 * Stackra file contract:
 * Purpose: `NETWORK_GRAPH_DEMO_KEYS`, the typed keys of the native network graph demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371.
 */
import { keys } from "@stackra/i18n";

/** The network graph demos' keys. */
export const NETWORK_GRAPH_DEMO_KEYS = keys({
  demo_free: {
    network_graph: {
      team: [
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
    },
  },
});
