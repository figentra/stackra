/**
 * Stackra file contract:
 * Purpose: `InstallCapability`, the `install` facet (capability `install_prompt`): whether the browser lets the app
 *          offer its install prompt now, and the call that shows it from the app's own button.
 * Boundary: a type only. The browser decides when installing is possible; `prompt` refuses with `unavailable` until
 *           then. A dismissed prompt is not a refusal: it resolves `{ ok: true, data: false }`.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decisions 2 and 3); ADR 0255.
 */
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { ReadonlySignal } from "#contracts/types/readonly-signal.type";

/** The install prompt. */
export interface InstallCapability {
  /** True while the browser holds an install prompt the app may show. */
  readonly canPrompt: ReadonlySignal<boolean>;

  /** Shows the install prompt; `data` is true when the user installed. */
  prompt: () => Promise<CapabilityResult<boolean>>;
}
