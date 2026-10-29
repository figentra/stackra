/**
 * Stackra file contract:
 * Purpose: `RootSurface`, what `stackra dev --surface` needs from the root runway: the surface's shell, the product
 *          packages its bundle holds, the local API port (`environments.dev.infra.gateway.port`), the product key and a
 *          landing surface's seed `content`.
 * Boundary: type only; `readSurface` builds it.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 6); app-shells sections 8.2 and 15 point 2; ADR 0170 (`local` is `dev`).
 */
import type { ShellRef } from "#node/dev-surface/types/shell-ref.type";

/** One surface of the root runway, as the dev command reads it. */
export type RootSurface = {
  /** The shell it runs in. */
  readonly shell: ShellRef;

  /** The product packages built into its bundle, in runway order. */
  readonly packages: readonly string[];

  /** The local API gateway's port, when the root runway declares one. */
  readonly gatewayPort: number | undefined;

  /** The product key (`product.key`), when the root runway names one. */
  readonly product?: string | undefined;

  /** A landing surface's seed documents (`content`, a folder under `assets/`). */
  readonly content?: string | undefined;

  /** The shell preset (`portal`, ADR 0436 decision 10). */
  readonly preset?: string | undefined;
};
