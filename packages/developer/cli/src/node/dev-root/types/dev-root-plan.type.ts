/**
 * Stackra file contract:
 * Purpose: `DevRootPlan`, what root `stackra dev` runs (`planDevRoot`): the lane, the gateway the one `encore run`
 *          serves on, the service members of the local monolith app, the member ports forwarded to the gateway and the
 *          seed profile.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0296 (decisions 1 and 3); ADR 0190; STA-2664 (items 1, 2, 5 and 8); STA-2840.
 */
import type { DevRootService } from "#node/dev-root/types/dev-root-service.type";

/** The plan of one root dev run. */
export type DevRootPlan = {
  /** The repository root. */
  readonly root: string;

  /** The dev lane (`devLane`); every dev port is shifted by it. */
  readonly lane: number;

  /** The port `encore run` serves every service on (`environments.dev.infra.gateway.port`, lane applied). */
  readonly gateway: number;

  /** The service members with a generated Encore app, sorted by key. */
  readonly services: readonly DevRootService[];

  /** The member dev ports forwarded to the gateway, so a URL naming a member's port reaches it in one app. */
  readonly forwards: readonly { readonly key: string; readonly port: number }[];

  /** The seed profile to run after migrations, or none (`--seed none`). */
  readonly seed?: string | undefined;
};
