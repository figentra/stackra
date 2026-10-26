/**
 * Stackra file contract:
 * Purpose: the web `ErrorState`: the page a route's error file shows: an icon for the `kind` of failure
 *          (unauthenticated, forbidden, not found, unexpected), a title, a description, the error's message as
 *          details (outside production, or in production when `isMessageShown` says it is safe), a retry button and further `actions`.
 * Boundary: HeroUI v3 has no error-state component, so this is the documented adapted form on free parts, laid out by
 *           the shared internal `StateLayout`. No copy of its own. The page is a live region (`alert`, assertive), so
 *           a failure that replaces content is read out at once; one already on the page at load is not, which is
 *           what the route's own focus handling is for. The stack is shown outside production only, and always
 *           left to right, because a stack trace is code. Copying the details waits for the CopyButton of wave 12.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3, decision 5: adapted form); ADR 0303 (decision 7); ADR 0313 (decisions 1
 *          and 6); ADR 0140 (error envelope); WCAG 2.2 SC 1.3.1 and 4.1.3.
 */
import { STATE_ICON } from "#core/constants/state-icon.constant";
import { errorDetailsOf } from "#core/functions/error-details-of.function";
import { liveRegionOf } from "#core/functions/live-region-of.function";
import { Button } from "#react/button/button";
import { StateLayout } from "#react/state-layout/state-layout";
import { Text } from "#react/text/text";
import type { ErrorStateProps } from "#react/error-state/error-state.props";

/** A failure, named by its kind, with the error's message (outside production, or when `isMessageShown`), a retry and further actions, announced at once. */
export function ErrorState({
  kind = "unexpected",
  error,
  isMessageShown,
  retry,
  actions,
  headingLevel = 1,
  ...rest
}: ErrorStateProps) {
  const isProduction = process.env.NODE_ENV === "production";
  // A server or driver message is an internal, so in production it is shown only when the app marks it as safe.
  const details = (isMessageShown ?? !isProduction) ? errorDetailsOf(error) : undefined;
  return (
    <StateLayout
      {...rest}
      {...liveRegionOf("danger")}
      data-kind={kind}
      defaultIcon={STATE_ICON[kind]}
      headingLevel={headingLevel}
      actions={
        retry === undefined && actions == null ? undefined : (
          <>
            {retry === undefined ? null : <Button onPress={retry.onPress}>{retry.label}</Button>}
            {actions}
          </>
        )
      }
    >
      {details === undefined ? null : (
        <div
          data-slot="error-state-details"
          className="w-full max-w-prose rounded-lg border border-separator p-3 text-start"
        >
          <Text type="small" className="break-words">
            {details.message}
          </Text>
          {details.stack === undefined || isProduction ? null : (
            <pre dir="ltr" className="mt-2 text-xs break-words whitespace-pre-wrap">
              {details.stack}
            </pre>
          )}
        </div>
      )}
    </StateLayout>
  );
}
