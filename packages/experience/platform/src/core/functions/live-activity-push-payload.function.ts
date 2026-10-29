/**
 * Stackra file contract:
 * Purpose: `liveActivityPushPayload`, the APNs `liveactivity` payload of one push: the `OrderProgress` content state
 *          as expo-widgets' activity reads it, the dismissal date of an end, and the attributes and alert a
 *          push-to-start needs.
 * Boundary: pure; internal to the package. The content state is `{ name, props }` with `props` as JSON text, exactly
 *           what expo-widgets' `LiveActivityAttributes.ContentState` decodes; the deep link rides in the attributes,
 *           so only a start carries it.
 * Runtime: isomorphic
 * Governing contract: Apple, "Starting and updating Live Activities with ActivityKit push notifications"; STA-1539.
 */
import type { ActivityProgress } from "#contracts/types/activity-progress.type";
import { ORDER_PROGRESS_ACTIVITY_NAME } from "#core/constants/order-progress-activity-name.constant";

/** Whole seconds since the epoch, as APNs reads dates. */
const seconds = (date: Date) => Math.floor(date.getTime() / 1000);

/**
 * The payload of one Live Activity push.
 *
 * @example
 * const body = JSON.stringify(liveActivityPushPayload("end", progress, new Date(), dismissAt));
 */
export function liveActivityPushPayload(
  event: "start" | "update" | "end",
  progress: ActivityProgress,
  now: Date,
  dismissAt: Date,
): { readonly aps: Readonly<Record<string, unknown>> } {
  const { url, ...props } = progress;
  const aps: Record<string, unknown> = {
    timestamp: seconds(now),
    event,
    "content-state": { name: ORDER_PROGRESS_ACTIVITY_NAME, props: JSON.stringify(props) },
  };
  if (event === "end") aps["dismissal-date"] = seconds(dismissAt);
  if (event === "start") {
    aps["attributes-type"] = "LiveActivityAttributes";
    aps["attributes"] = url === undefined ? {} : { url };
    aps["alert"] = { title: progress.title, body: progress.status };
  }
  return { aps };
}
