/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ErrorState` takes: the shared state props plus the `kind` of failure, the
 *          `error` itself (its message is shown as details outside production, or in production when the app says it is safe;
 *          its stack outside production only) and a `retry` button.
 *          A route's error file renders it, and the kind `unauthenticated` is what sends the user to sign in.
 * Boundary: types only. An announcement is the component's: the page is a live region, so a failure that appears
 *           after a load is read out at once. `variant` is absent for the reason `EmptyStateContractProps` gives.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decisions 1 and 6); ADR 0140 (error envelope); WCAG 2.2 SC
 *          4.1.3.
 */
import type { ErrorKind } from "#contracts/enums/error-kind.enum";
import type { StateContractProps } from "#contracts/types/state-contract-props.type";

/** Props shared by the web and native `ErrorState`. */
export interface ErrorStateContractProps extends StateContractProps {
  /** What kind of failure it is: `unauthenticated`, `forbidden`, `not-found` or `unexpected`. Defaults to `unexpected`. */
  readonly kind?: ErrorKind | undefined;
  /**
   * The thrown value, as caught. An `Error` or a string shows its message outside production; its stack is shown
   * outside production only.
   */
  readonly error?: unknown;
  /**
   * Whether the error's message is shown. It defaults to true outside production and false in production, because a
   * server or driver message (a database or gateway error) is an internal the user must not read. An app whose error
   * carries text written for the user (a typed refusal's message) sets it to true.
   */
  readonly isMessageShown?: boolean | undefined;
  /** A button that tries again: its label in the app's language and what it runs. Left out, there is no button. */
  readonly retry?: { readonly label: string; readonly onPress: () => void } | undefined;
}
