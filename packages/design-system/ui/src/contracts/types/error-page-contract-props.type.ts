/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ErrorPage` takes: the `preset` (403, 404, 500, offline), optional overrides of
 *          its words and icon, the `error` for details, and `onRetry`, whose promise keeps the retry button pending.
 * Boundary: types only. The preset's title, description and retry label are the `ui` catalogue's; a caller's words
 *           win. The rest of `ErrorState` (live region, details) is reused as it is.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decisions 1 and 6); GAPS.md row 31 (owner decision
 *          2026-10-28); WCAG 2.2 SC 4.1.3.
 */
import type { ReactNode } from "react";

import type { ErrorPagePreset } from "#contracts/enums/error-page-preset.enum";
import type { StateContractProps } from "#contracts/types/state-contract-props.type";

/** Props shared by the web and native ErrorPage. */
export interface ErrorPageContractProps extends Omit<StateContractProps, "title"> {
  /** Which failure: `forbidden`, `not-found`, `server-error` or `offline`. */
  readonly preset: ErrorPagePreset;
  /** The heading, in place of the preset's own. */
  readonly title?: ReactNode;
  /** The thrown value; its message shows as details outside production, as `ErrorState` decides. */
  readonly error?: unknown;
  /** Whether the error's message is shown; see `ErrorStateContractProps.isMessageShown`. */
  readonly isMessageShown?: boolean | undefined;
  /**
   * Tries again. Given, a retry button is drawn first among the actions; while the returned promise is pending the
   * button shows a spinner and refuses presses, so a slow reload is not sent twice.
   */
  // oxlint-disable-next-line typescript/no-invalid-void-type -- reason: the handler may return nothing when the retry is instant
  readonly onRetry?: (() => Promise<unknown> | void) | undefined;
  /** The retry button's label; defaults to the catalogue's "Try again". */
  readonly retryLabel?: string | undefined;
}
