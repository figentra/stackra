/**
 * Stackra file contract:
 * Purpose: `Member`, what the tool commands know about the member they run in: its root, its layout (from the
 *          `define*` call of `stackra.config.ts`) and an app's targets (from the committed manifest gen writes).
 * Boundary: type only; `readMember` reads it without running `stackra.config.ts`.
 * Runtime: node
 * Governing contract: ADR 0295 (decisions 1 and 2: one static `define*` call, `targets`); ADR 0294 (decision 10).
 */

/** One member a tool command runs in. */
export type Member = {
  /** The absolute member root. */
  readonly root: string;

  /**
   * `app`, `package`, `service` or `worker` from the `define*` call; `docs` for the Mintlify docs app (no
   * `stackra.config.ts`, a `src/docs.json`); `tooling` for any other member without `stackra.config.ts` (the
   * `tier:config` presets), which gen skips.
   */
  readonly layout: "app" | "package" | "service" | "worker" | "docs" | "tooling";

  /** The app's `Target` codes from `stackra.manifest.json`, in declared order; empty for other layouts. */
  readonly targets: readonly string[];
};
