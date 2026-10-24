/**
 * Stackra file contract:
 * Purpose: `MemoryPlatformOptions`, what a test sets on the memory platform (`fakePlatform({...})`,
 *          `renderRoute(..., { platform })`): the capabilities the target offers, permission answers, online state,
 *          the scanner's camera, launched files, shared payloads and whether an install prompt is held.
 * Boundary: a type only. `capabilities` replaces the offered set; each other option also offers the capability it
 *           describes. A permission not given reads `prompt`, which a request turns into `granted`.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 3: fakes are real drivers); ADR 0266 (memory drivers first); ADR 0250.
 */
import type { PermissionStatus } from "#contracts/types/permission-status.type";
import type { SharedPayload } from "#contracts/types/shared-payload.type";
import type { Capability } from "#core/enums/capability.enum";

/** The settings of a memory platform. */
export interface MemoryPlatformOptions {
  /** Exactly the capabilities offered; network only when absent. */
  readonly capabilities?: readonly Capability[];

  /** The permission each capability answers with; `prompt` when absent. */
  readonly permissions?: Readonly<Partial<Record<Capability, PermissionStatus>>>;

  /** Online state; offers `network`. */
  readonly network?: { readonly isOnline?: boolean };

  /** The camera: whether it exists now and its permission; offers `scanner`. */
  readonly scanner?: { readonly isAvailable?: boolean; readonly permission?: PermissionStatus };

  /** The files of the latest launch; offers `file_handling`. */
  readonly launchedFiles?: readonly File[];

  /** Payloads waiting in the share inbox, by id; offers `share_target`. */
  readonly shared?: Readonly<Record<string, SharedPayload>>;

  /** Whether an install prompt is held; offers `install_prompt`. */
  readonly canInstall?: boolean;
}
