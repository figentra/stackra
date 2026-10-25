/**
 * Stackra file contract:
 * Purpose: `handleNotificationClick`, the service worker's `notificationclick` listener: closes the notification and
 *          opens the route it carries in the app, reusing an open tab when there is one.
 * Boundary: only an in-app path is followed: a route that is not `/…`, reads as `//host` or holds a backslash opens
 *           `/`, so a push cannot send the user to another origin.
 * Runtime: worker
 * Governing contract: ADR 0255 (decision 3); ADR 0241 (open redirects refused).
 */
import type { NotificationClickEvent } from "#sw/types/notification-click-event.type";
import type { ServiceWorkerScope } from "#sw/types/service-worker-scope.type";

/** The in-app path a notification's data names; `/` when it names none or a foreign one. */
function routeOf(data: unknown): string {
  const route = (data as { route?: unknown } | null)?.route;
  if (typeof route !== "string" || !route.startsWith("/")) return "/";
  if (route.startsWith("//") || route.includes("\\")) return "/";
  return route;
}

/**
 * Opens the clicked notification's route.
 *
 * @example
 * self.addEventListener("notificationclick", handleNotificationClick);
 */
export function handleNotificationClick(event: NotificationClickEvent): void {
  event.notification.close();
  const scope = globalThis as unknown as ServiceWorkerScope;
  const route = routeOf(event.notification.data);
  event.waitUntil(
    (async () => {
      const [open] = await scope.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (open === undefined) {
        await scope.clients.openWindow(route);
        return;
      }
      await open.navigate(new URL(route, scope.location.origin).href);
      await open.focus();
    })(),
  );
}
