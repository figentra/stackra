/**
 * Stackra file contract:
 * Purpose: the native `RouteLeaveConfirmation`: `@stackra/ui`'s `LeaveConfirmation` wired to React Navigation. While
 *          `when` is true every way of leaving the screen (the back button, a header back, a swipe, a `goBack()`) is
 *          held (`usePreventRemove`) and the "discard your changes?" dialog asks; Discard replays the held action and
 *          Stay drops it.
 * Boundary: renders `LeaveConfirmation` and the prevent-remove hook, nothing else; the words are the caller's. The
 *           native stack already turns off the iOS swipe-down while a removal is prevented, so no `gestureEnabled`
 *           is set here. The Android hardware back button is caught by the same hook; verify on a device. One question
 *           is open at a time: an action that fires again while the dialog is open waits for the answer.
 * Runtime: react-native
 * Governing contract: ADR 0317 (decision 2); ADR 0312; ADR 0055 (forms); WCAG 2.2 SC 3.3.4.
 */
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import type { LeaveConfirmationHandle } from "@stackra/ui/contracts";
import { LeaveConfirmation } from "@stackra/ui/native";
import { useRef, type ReactElement } from "react";

import type { RouteLeaveConfirmationProps } from "#native/route-leave-confirmation/route-leave-confirmation.props";

/** Asks before leaving the screen drops unsaved work: hold the removal, ask, then replay it or drop it. */
export function RouteLeaveConfirmation(props: RouteLeaveConfirmationProps): ReactElement {
  const leave = useRef<LeaveConfirmationHandle>(null);
  const isAsking = useRef(false);
  const navigation = useNavigation();

  usePreventRemove(props.when, ({ data }) => {
    if (isAsking.current) return;
    isAsking.current = true;
    void (leave.current?.confirmLeave() ?? Promise.resolve(false)).then((mayLeave) => {
      isAsking.current = false;
      if (mayLeave) navigation.dispatch(data.action);
    });
  });

  return <LeaveConfirmation {...props} ref={leave} />;
}
