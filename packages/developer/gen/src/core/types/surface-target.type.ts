/**
 * Stackra file contract:
 * Purpose: `SurfaceTarget`, one entry of a manifest's `surfaces` section: a surface a member contributes to, the shell
 *          line it targets (`console@3`) and the shell package that line comes from.
 * Boundary: a type only. Derived by `surfacesOf` from the dependencies' committed manifests, never authored.
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (decision 4: a bundle declares the shell line it targets); ADR 0438;
 *                     app-shells-edge-and-extension.md 4.2 (step 1) and 15 (point 7).
 */

/** A surface a member targets. */
export interface SurfaceTarget {
  /** The surface code (`console`). */
  readonly surface: string;

  /** The shell line, `<surface>@<major>` (`console@3`): the edge's `shell:<surface>:<major>` record. */
  readonly targets: string;

  /** The shell package whose slots sit on the surface (`@os/console-shell`). */
  readonly shell: string;
}
