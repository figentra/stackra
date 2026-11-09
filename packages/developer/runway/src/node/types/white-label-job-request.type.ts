/**
 * Stackra file contract:
 * Purpose: `WhiteLabelJobRequest`, one white-label build started by the OS event: the event, and everything else the
 *          mobile job needs (the repository, the template checkout or line, the environment, the store accounts).
 * Boundary: type only; `startWhiteLabelJob` takes it. The app and the variant come from the event, so the request
 *           names neither. `job` replaces `runMobileJob` in a test.
 * Runtime: node
 * Governing contract: ADR 0439 (decisions 2 and 8); STA-2074 (os#244).
 */
import type { MobileJobRequest } from "#node/types/mobile-job-request.type";
import type { MobileJobResult } from "#node/types/mobile-job-result.type";
import type { WhiteLabelBuildRequested } from "#node/types/white-label-build-requested.type";

/** One event-started white-label build. */
export type WhiteLabelJobRequest = Omit<MobileJobRequest, "app" | "variant"> & {
  /** The `white_label.build.requested.v1` event that starts the build. */
  readonly event: WhiteLabelBuildRequested;
  /** The mobile job; `runMobileJob` when absent. */
  readonly job?: (request: MobileJobRequest) => Promise<MobileJobResult>;
};
