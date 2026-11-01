/**
 * Stackra file contract:
 * Purpose: `SCAFFOLD_KINDS`, every member kind the scaffold renders from `tools/scaffold/templates`, kind to its
 *          template, destination, flags and starting runtimes (moved from `tools/scripts/scaffold.mjs`).
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0126 (member shapes and scaffold templates); ADR 0294; ADR 0453 (decision 11).
 */
import type { ScaffoldKind } from "#node/scaffold/types/scaffold-kind.type";

/** Kind to its template dir and destination (relative to the target repo root). */
export const SCAFFOLD_KINDS: Readonly<Record<string, ScaffoldKind>> = {
  service: { tpl: "services/service", dest: (n) => `services/${n}`, runtimes: ["node"] },
  package: {
    tpl: "packages/package",
    dest: (n, c) => `packages/${c}/${n}`,
    category: true,
    data: true,
    // `.` and `./node` always come; `entryRuntimes` adds the picked optional entries.
    runtimes: ["isomorphic", "node"],
  },
  tooling: { tpl: "packages/tooling", dest: (n) => `packages/tooling/${n}`, runtimes: ["node"] },
  "app:console": {
    tpl: "apps/console",
    dest: (n) => `apps/${n}`,
    ports: [3710, 3799],
    runtimes: ["browser"],
  },
  "app:mobile": {
    tpl: "apps/mobile",
    dest: (n) => `apps/${n}`,
    noHyphen: true,
    runtimes: ["react-native"],
  },
  "app:desktop": { tpl: "apps/desktop", dest: (n) => `apps/${n}`, runtimes: ["node", "browser"] },
  "app:docs": {
    tpl: "apps/docs",
    dest: (n) => `apps/${n}`,
    ports: [3334, 3399],
    runtimes: ["browser"],
  },
};
