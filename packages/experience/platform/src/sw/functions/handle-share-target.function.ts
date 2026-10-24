/**
 * Stackra file contract:
 * Purpose: `handleShareTarget`, the service worker's answer to the share target's POST (`PwaConfig.manifest
 *          .shareTarget`): it keeps the shared title, text, link and files in the device's share inbox and redirects
 *          (303) to the share page with the payload's id, which the page takes once.
 * Boundary: the payload never reaches the network and is never cached as a response. The standard field names
 *           (`title`, `text`, `url`) are read and every file field is kept. Only an in-app path is a redirect target.
 * Runtime: worker
 * Governing contract: ADR 0255 (share target); ADR 0250.
 */
import { putSharedPayload } from "#core/functions/put-shared-payload.function";
import type { ServiceWorkerScope } from "#sw/types/service-worker-scope.type";
import type { ShareTargetEvent } from "#sw/types/share-target-event.type";
import type { ShareTargetOptions } from "#sw/types/share-target-options.type";

/** A text field of the form, or null. */
function textOf(form: FormData, name: string): string | null {
  const value = form.get(name);
  return typeof value === "string" && value !== "" ? value : null;
}

/**
 * Keeps the share and redirects to `redirectTo?shared=<id>`.
 *
 * @throws TypeError when `redirectTo` is not an in-app path.
 * @example
 * registerRoute(
 *   ({ url, request }) => request.method === "POST" && SHARE_TARGET.test(url.pathname),
 *   ({ event, url }) => handleShareTarget(event as FetchEvent, { redirectTo: url.pathname }),
 *   "POST",
 * );
 */
export async function handleShareTarget(
  event: ShareTargetEvent,
  options: ShareTargetOptions,
): Promise<Response> {
  if (!options.redirectTo.startsWith("/") || options.redirectTo.startsWith("//"))
    throw new TypeError("handleShareTarget redirects to an in-app path only");
  const form = await event.request.formData();
  const files: File[] = [];
  for (const [, value] of form) if (typeof value !== "string") files.push(value);
  const id = await putSharedPayload({
    title: textOf(form, "title"),
    text: textOf(form, "text"),
    url: textOf(form, "url"),
    files,
  });
  const scope = globalThis as unknown as ServiceWorkerScope;
  const target = new URL(options.redirectTo, scope.location.origin);
  target.searchParams.set("shared", id);
  return Response.redirect(target.href, 303);
}
