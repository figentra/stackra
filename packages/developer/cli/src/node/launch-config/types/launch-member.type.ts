/**
 * Stackra file contract:
 * Purpose: `LaunchMember`, one app or Worker member that declares a dev port in its runway, as the launch file needs it.
 * Boundary: type only; `readLaunchInputs` builds it, `renderLaunchConfig` reads it.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 1: a dev port is written once, in the member runway); STA-2081.
 */

/** A member the launch file starts. */
export type LaunchMember = {
  /** The member folder name, the configuration's name (`docs`, `static`). */
  readonly key: string;

  /** The workspace package name (`@figentra/docs`). */
  readonly name: string;

  /** The runway's `environments.dev.port`, else its `environments.dev.mobile.metroPort`. */
  readonly port: number;

  /** A Cloudflare Worker member (`wrangler.jsonc`): `wrangler dev` serves its own build, so it builds itself first. */
  readonly worker: boolean;
};
