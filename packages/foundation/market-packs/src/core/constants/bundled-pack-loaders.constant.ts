/**
 * Stackra file contract:
 * Purpose: `BUNDLED_PACK_LOADERS`, a lazy loader per market for the packs this package bundles in
 *          `assets/data/packs/`, so the interim `bundled` source reads only the markets a host pins.
 * Boundary: data only; a dynamic `import()` with a JSON import attribute, so the bundler splits each pack out and
 *           a Worker loads only the ones it resolves. Returns the parsed JSON unchecked: the driver checks its shape,
 *           its content hash against the pin, and its status.
 * Runtime: isomorphic
 * Governing contract: ADR 0386 (as amended 2026-11-09); ADR 0385; ADR 0370 (decision 2).
 */

/** Market code to a loader of its bundled pack file (the module namespace; the pack is `default`). */
export const BUNDLED_PACK_LOADERS: Readonly<Record<string, () => Promise<{ default: unknown }>>> =
  Object.freeze({
    ae: () => import("../../../assets/data/packs/ae.json", { with: { type: "json" } }),
    eg: () => import("../../../assets/data/packs/eg.json", { with: { type: "json" } }),
    sa: () => import("../../../assets/data/packs/sa.json", { with: { type: "json" } }),
    us: () => import("../../../assets/data/packs/us.json", { with: { type: "json" } }),
    "us-ca": () => import("../../../assets/data/packs/us-ca.json", { with: { type: "json" } }),
    "us-fl": () => import("../../../assets/data/packs/us-fl.json", { with: { type: "json" } }),
    "us-il": () => import("../../../assets/data/packs/us-il.json", { with: { type: "json" } }),
    "us-mi": () => import("../../../assets/data/packs/us-mi.json", { with: { type: "json" } }),
    "us-nj": () => import("../../../assets/data/packs/us-nj.json", { with: { type: "json" } }),
    "us-ny": () => import("../../../assets/data/packs/us-ny.json", { with: { type: "json" } }),
    "us-tx": () => import("../../../assets/data/packs/us-tx.json", { with: { type: "json" } }),
  });
