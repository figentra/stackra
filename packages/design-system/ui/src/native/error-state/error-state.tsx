/**
 * Stackra file contract:
 * Purpose: the native `ErrorState`: the screen a route's error file shows: an icon for the `kind` of failure
 *          (unauthenticated, forbidden, not found, unexpected), a title, a description, the error's message as
 *          details (outside production, or in production when `isMessageShown` says it is safe), a retry button and further `actions`.
 * Boundary: the adapted form on free HeroUI Native parts, laid out by the shared internal `StateLayout`. No copy of
 *           its own. The screen is a live region (`alert`, assertive), so a failure that replaces content is read out
 *           at once. The stack is shown outside production only. The message and the stack are wrapped in `Text`; the
 *           actions are elements (a `Button`), never bare strings. Copying the details waits for the CopyButton of
 *           wave 12.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, decision 5: adapted form); ADR 0303 (decision 7); ADR 0313 (decisions 1
 *          and 6); ADR 0140 (error envelope); WCAG 2.2 SC 1.3.1 and 4.1.3.
 */
import { View } from "react-native";

import type { ErrorStateContractProps } from "#contracts/types/error-state-contract-props.type";
import { STATE_ICON } from "#core/constants/state-icon.constant";
import { errorDetailsOf } from "#core/functions/error-details-of.function";
import { liveRegionOf } from "#core/functions/live-region-of.function";
import { Button } from "#native/button/button";
import { StateLayout, type StateLayoutProps } from "#native/state-layout/state-layout";
import { Text } from "#native/text/text";

/**
 * Props of the native ErrorState: the shared contract plus the props of its root `View`, passed through. The role and
 * live region are the component's, never the caller's.
 */
export type ErrorStateProps = ErrorStateContractProps &
  Omit<
    StateLayoutProps,
    keyof ErrorStateContractProps | "defaultIcon" | "children" | "role" | "aria-live"
  >;

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
        <View className="w-full rounded-lg border border-separator p-3">
          <Text type="small">{details.message}</Text>
          {details.stack === undefined || isProduction ? null : (
            <Text type="caption" className="mt-2" selectable>
              {details.stack}
            </Text>
          )}
        </View>
      )}
    </StateLayout>
  );
}
