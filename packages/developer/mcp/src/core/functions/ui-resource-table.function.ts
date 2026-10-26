/**
 * Stackra file contract:
 * Purpose: `uiResourceTable`, the hosted MCP server's `ui://` resources, built from the `uiResources` section of the
 *          committed manifests; the first manifest to list a URI wins.
 * Boundary: pure. An entry with a malformed URI, no `https:` bundle URL or no name is left out, so a bad manifest never
 *           serves a frame from an unexpected origin. No permission is applied here: `uiResourcesFor` keeps only the
 *           resources a caller's listed tools name.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 2); STA-784.
 */
import type { StackraManifest } from "@stackra/contracts";

import { UI_RESOURCE_URI } from "#core/constants/ui-resource-uri.constant";
import type { UiResource } from "#core/types/ui-resource.type";

/** The strings of `value` when it is an array of strings; empty otherwise. */
function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

/** Whether `value` is an `https:` URL. */
function isHttps(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Every `ui://` resource the manifests offer, sorted by URI.
 *
 * @param manifests - the committed `stackra.manifest.json` of each member the server fronts.
 * @example
 * uiResourceTable([commerceManifest]); // [{ uri: "ui://orders/order-card", url: "https://static…/order-card.html", … }]
 */
export function uiResourceTable(manifests: readonly StackraManifest[]): UiResource[] {
  const byUri = new Map<string, UiResource>();
  for (const manifest of manifests) {
    const entries = manifest["uiResources"];
    if (!Array.isArray(entries)) continue;
    for (const entry of entries as unknown[]) {
      if (typeof entry !== "object" || entry === null) continue;
      const { uri, name, description, url, csp, permissions } = entry as Record<string, unknown>;
      if (typeof uri !== "string" || !UI_RESOURCE_URI.test(uri) || byUri.has(uri)) continue;
      if (typeof name !== "string" || name === "" || !isHttps(url)) continue;
      const policy = (typeof csp === "object" && csp !== null ? csp : {}) as Record<
        string,
        unknown
      >;
      byUri.set(uri, {
        uri,
        name,
        ...(typeof description === "string" ? { description } : {}),
        url,
        member: manifest.member,
        csp: {
          connectDomains: strings(policy["connectDomains"]),
          resourceDomains: strings(policy["resourceDomains"]),
        },
        permissions: strings(permissions),
      });
    }
  }
  return [...byUri.values()].sort((a, b) => a.uri.localeCompare(b.uri));
}
