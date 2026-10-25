/**
 * Stackra file contract:
 * Purpose: `DevPorts`, what `devPorts(member)` returns: the member's dev origin, port and host (lane offsets applied)
 *          and its Electron dev ports, which the generated Electron entry spreads into the dev window config.
 * Boundary: type only; dev values only, never read in a packaged build.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0251 (the desktop target).
 */
import type { Url } from "@stackra/contracts";

/** One member's dev ports. */
export type DevPorts = {
  /** The dev origin, `http://localhost:5173` on lane 0. */
  readonly url: Url;
  /** The dev server port. */
  readonly port: number;
  /** The dev server host. */
  readonly host: string;
  /** The Electron dev values; `{}` for a member without a desktop target. */
  readonly desktop: {
    readonly devtools?: boolean | undefined;
    readonly remoteDebugPort?: number | undefined;
    readonly pkceLoopbackPort?: number | undefined;
  };
};
