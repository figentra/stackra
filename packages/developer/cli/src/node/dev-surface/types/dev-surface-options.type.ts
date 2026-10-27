/**
 * Stackra file contract:
 * Purpose: `DevSurfaceOptions`, the flags that steer `stackra dev --surface`: a local checkout (`--os`), a published
 *          shell version (`--shell`), the published shells' origin (`--shell-origin`) and the API (`--api`).
 * Boundary: type only; `runDevSurface` fills it from the command line and `planDevSurface` reads it.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 6); app-shells section 15 point 2.
 */

/** The flags that steer a surface run. */
export type DevSurfaceOptions = {
  /** A local checkout of the shell's repository (`--os`). */
  readonly os?: string | undefined;

  /** A published shell version inside the surface's line (`--shell 3.4.1`). */
  readonly shell?: string | undefined;

  /** Where published shells are served from (`--shell-origin`, else `STACKRA_SHELL_ORIGIN`). */
  readonly shellOrigin?: string | undefined;

  /** The API base URL (`--api`); default the root runway's local gateway. */
  readonly api?: string | undefined;
};
