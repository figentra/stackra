/**
 * Stackra file contract:
 * Purpose: `DevtoolsHost`, what attaches to the kit: the floating panel of an app or the dev console `stackra dev`
 *          starts, with the callbacks the kit pushes changes through.
 * Boundary: a type only. The transport between the page or process and the host UI is the host's.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decisions 2 and 3).
 */
import type { DevtoolsEvent } from "#core/types/devtools-event.type";
import type { DevtoolsTabMetadata } from "#core/types/devtools-tab-metadata.type";

/** A devtools host. A callback that throws is ignored, so a host bug never breaks the package that emitted. */
export interface DevtoolsHost {
  /** Names the host in errors (`vite-devtools`, `stackra-dev`). */
  readonly name: string;

  /** Sees sensitive tabs; only a host the developer runs locally declares it. */
  readonly acceptsSensitive?: boolean;

  /** Each new stream entry, as it is emitted. */
  onEvent?: (event: DevtoolsEvent) => void;

  /** The tabs it can see, after every tab is defined or removed. */
  onTabsChanged?: (tabs: readonly DevtoolsTabMetadata[]) => void;

  /** The RPC names, after every RPC is defined or removed. */
  onRpcChanged?: (names: readonly string[]) => void;
}
