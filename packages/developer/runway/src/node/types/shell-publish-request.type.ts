/**
 * Stackra file contract:
 * Purpose: `ShellPublishRequest`, a new release of one web shell line put on its canary: the KV writer, the surface,
 *          the line, the release every host serves now, the new one and the canary scopes.
 * Boundary: type only; `publishShell` takes it. The OS deploy uploads the shell's files itself and runs
 *           `checkShellCompatibility` first.
 * Runtime: node
 * Governing contract: app-shells 4.1 (step 4), 15 (point 7) and 16 (point 3); owner decision D6.
 */
import type { EdgeKvWriter } from "@stackra/app/contracts";

import type { EdgeShellRelease } from "#node/types/edge-shell-release.type";

/** One shell canary to start. */
export type ShellPublishRequest = {
  /** The edge KV writer of that environment. */
  readonly kv: EdgeKvWriter;
  /** The shell's surface (`console`). */
  readonly surface: string;
  /** The line's major (`3`). */
  readonly line: string;
  /** The release every host serves now. */
  readonly current: EdgeShellRelease;
  /** The release that goes to the canary scopes. */
  readonly next: EdgeShellRelease;
  /** The internal and demo scope ids (D6). */
  readonly canaryScopes: readonly string[];
  /** The canary start; now when absent. */
  readonly now?: Date;
};
