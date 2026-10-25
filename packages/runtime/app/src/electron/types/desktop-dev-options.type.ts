/**
 * Stackra file contract:
 * Purpose: `DesktopDevOptions`, the dev values of an unpackaged desktop run: the Vite dev origin the window loads and
 *          the Electron dev values the member runway gives (`devPorts(member)` from @stackra/runway).
 * Boundary: a type only; `null` when packaged. The PKCE loopback port is the identity package's and passes through.
 * Runtime: node
 * Governing contract: ADR 0296 (member runway dev ports); ADR 0251.
 */

/** The dev values of an unpackaged run. */
export interface DesktopDevOptions {
  /** The Vite dev origin the window loads instead of `app://bundle/`. */
  readonly url: string;

  /** Opens the developer tools on each window. */
  readonly devtools?: boolean | undefined;

  /** The Chromium remote-debugging port. */
  readonly remoteDebugPort?: number | undefined;

  /** The identity package's PKCE loopback port. */
  readonly pkceLoopbackPort?: number | undefined;
}
