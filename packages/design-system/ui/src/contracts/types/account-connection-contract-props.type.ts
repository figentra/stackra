/**
 * Stackra file contract:
 * Purpose: the props every runtime's `AccountConnection` takes: an external service (payments, delivery, accounting)
 *          with its name, logo and what connecting does, whether an account is connected and which, the words of the
 *          status and of the connect and disconnect buttons, the busy state, a terms footnote and the two handlers.
 * Boundary: types only; the connecting itself (OAuth, keys) is the app's, in `onConnect`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); design-system gap
 *          inventory row 38 (2026-10-28).
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `AccountConnection`. */
export interface AccountConnectionContractProps {
  /** The service's name, for example "Stripe" or "Talabat". */
  readonly title: string;
  /** What connecting does, under the name. */
  readonly description?: string | undefined;
  /** The service's logo, usually a square `Avatar`. Decorative: the name beside it is read. */
  readonly logo?: ReactNode;
  /** True when an account is connected. */
  readonly isConnected: boolean;
  /** The connected account, for example its email or store id; shown only while connected. */
  readonly accountName?: string | undefined;
  /** The status while connected, for example "Connected". */
  readonly connectedLabel: string;
  /** The status while not connected, for example "Not connected". */
  readonly disconnectedLabel: string;
  /** The connect button's label. */
  readonly connectLabel: string;
  /** The disconnect button's label. */
  readonly disconnectLabel: string;
  /** True while connecting or disconnecting: the button shows a spinner and refuses presses. */
  readonly isLoading?: boolean | undefined;
  /** A footnote under the row, usually the terms the user accepts by connecting. */
  readonly details?: ReactNode;
  /** Called when the connect button is pressed. */
  readonly onConnect?: (() => void) | undefined;
  /** Called when the disconnect button is pressed. */
  readonly onDisconnect?: (() => void) | undefined;
}
