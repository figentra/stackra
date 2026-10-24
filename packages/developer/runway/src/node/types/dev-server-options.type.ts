/**
 * Stackra file contract:
 * Purpose: `DevServerOptions`, what `devServer(member)` returns: the Vite `server` block of a member's dev server
 *          (port, host, strict port, open, the HMR port and, for https, the TLS key pair), structurally a Vite
 *          `ServerOptions`.
 * Boundary: type only; declared here so the package needs no Vite dependency.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 1), ADR 0295 (decision 5).
 */

/** A Vite dev server block. */
export type DevServerOptions = {
  /** The member's dev port, lane offset applied. */
  readonly port: number;
  /** The member's dev host. */
  readonly host: string;
  /** Always true: a taken port fails instead of drifting from the facts every other tool reads. */
  readonly strictPort: true;
  /** Whether `stackra dev` opens a browser. */
  readonly open: boolean;
  /** HMR on the port after the dev port. */
  readonly hmr: { readonly port: number };
  /** The TLS key pair `stackra dev` made, present when the member serves https in dev. */
  readonly https?: { readonly cert: Buffer; readonly key: Buffer };
};
