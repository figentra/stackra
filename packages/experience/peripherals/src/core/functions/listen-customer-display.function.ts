/**
 * Stackra file contract:
 * Purpose: `listenCustomerDisplay`, the display side of the `channel` customer display driver: the customer display
 *          window (an Electron second window, a browser window on the second screen) hears each view the till shows,
 *          or `null` when the till clears it.
 * Boundary: listens on `CUSTOMER_DISPLAY_CHANNEL` of the window's own origin; a message that is not a show or a clear
 *           with the expected shape is ignored, so a stray post cannot inject anything. Returns the function that stops
 *           listening. Throws `TypeError` where `BroadcastChannel` does not exist.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1 and open question 3).
 */
import type { CustomerDisplayView } from "#contracts/types/customer-display-view.type";
import { CUSTOMER_DISPLAY_CHANNEL } from "#core/constants/customer-display-channel.constant";

/** Whether `value` is a view: string lines with label and amount, a string or null total and message. */
function isView(value: unknown): value is CustomerDisplayView {
  if (typeof value !== "object" || value === null) return false;
  const { lines, total, message } = value as Record<string, unknown>;
  return (
    Array.isArray(lines) &&
    lines.every(
      (line) =>
        typeof line === "object" &&
        line !== null &&
        typeof (line as Record<string, unknown>)["label"] === "string" &&
        typeof (line as Record<string, unknown>)["amount"] === "string",
    ) &&
    (total === null || typeof total === "string") &&
    (message === null || typeof message === "string")
  );
}

/**
 * Calls `listener` with each view shown, and `null` on a clear.
 *
 * @example
 * // the customer display route
 * useEffect(() => listenCustomerDisplay(setView), []);
 * @throws TypeError when `BroadcastChannel` is not available.
 */
export function listenCustomerDisplay(
  listener: (view: CustomerDisplayView | null) => void,
): () => void {
  if (typeof BroadcastChannel === "undefined")
    throw new TypeError("listenCustomerDisplay needs BroadcastChannel");
  const channel = new BroadcastChannel(CUSTOMER_DISPLAY_CHANNEL);
  channel.onmessage = (event: MessageEvent<unknown>) => {
    const data = event.data as { type?: unknown; view?: unknown } | null;
    if (data?.type === "clear") listener(null);
    else if (data?.type === "show" && isView(data.view)) listener(data.view);
  };
  return () => channel.close();
}
