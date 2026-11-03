/**
 * Stackra file contract:
 * Purpose: `focusFromAppState(state)`, React Native's app state handed to TanStack Query's focus manager: `active` is
 *          focused, anything else (`background`, `inactive`) is not, so a stale answer refetches when the app returns.
 * Boundary: internal to the `./native` entry; `useQuery` subscribes it to `AppState`. TanStack's own listener reads the
 *           browser's `visibilitychange`, which a phone never fires. The manager notifies only on a change, so many
 *           subscribers are harmless.
 * Runtime: react-native
 * Governing contract: ADR 0079 (TanStack Query core); ADR 0260 (decision 4).
 */
import { focusManager } from "@tanstack/query-core";
import type { AppStateStatus } from "react-native";

/**
 * Tells the query cache whether the app is in the foreground.
 *
 * @example
 * AppState.addEventListener("change", focusFromAppState);
 */
export function focusFromAppState(state: AppStateStatus): void {
  focusManager.setFocused(state === "active");
}
