/**
 * Stackra file contract:
 * Purpose: `AppDefinition`, what an app member's `stackra.config.ts` passes to `defineApp`: its identity and targets
 *          at the top, then one section per platform or tool it uses.
 * Boundary: a type only; static data (enum values, literals and classes), never a function or an environment read.
 *           There is no `key`: the member key comes from the package name.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 1 to 4), ADR 0249 (targets), ADR 0082 (areas).
 */
import type { ApiArea } from "#core/enums/api-area.enum";
import type { Target } from "#core/enums/target.enum";

/** The definition of an app member. */
export type AppDefinition = {
  /** What gen builds: only the listed targets get outputs. */
  readonly targets: readonly Target[];
  /** The API area the app calls; a reference to another area is a gen error. */
  readonly area: ApiArea;
  /** The env Config class whose `env` map names the public environment values the bundle carries. */
  readonly env?: abstract new (...args: never[]) => object;
  /** The product name: install names, the dock, the installers. */
  readonly name?: string;
  /** The deep-link scheme (`acme` for `acme://`). */
  readonly scheme?: string;
  /** The end-to-end projects and the seeder keys (`<module>.<profile>`) run before them. */
  readonly e2e?: {
    readonly projects?: readonly string[];
    readonly seeds?: readonly string[];
    readonly profile?: string;
  };
  // shortcut: tool sections (`ios`, `android`, `expo`, `eas`, `maestro`, `pwa`, `electron`, `vite`, `html`,
  // `render`, `appLinks`) are open until gen ships each tool's shape minus the keys it owns (STA-339).
  readonly [section: string]: unknown;
};
