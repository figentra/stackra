/**
 * Stackra file contract:
 * Purpose: `uiResourceContents`, the MCP `resources/read` answer for one `ui://` resource: its HTML bundle as text with
 *          the MCP Apps media type, and the frame's content-security policy and permissions under `_meta.ui`.
 * Boundary: pure. The gateway fetches the bundle from `resource.url` (the published asset) and passes its text; nothing
 *           here reads the network. An empty permission list is left out.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 2); STA-784.
 */
import type { Json } from "@stackra/contracts";

import { UI_RESOURCE_MIME_TYPE } from "#core/constants/ui-resource-mime-type.constant";
import type { UiResource } from "#core/types/ui-resource.type";

/**
 * The read result of `resource` whose bundle is `html`.
 *
 * @example
 * return { contents: [uiResourceContents(resource, await (await fetch(resource.url)).text())] };
 */
export function uiResourceContents(
  resource: UiResource,
  html: string,
): {
  readonly uri: string;
  readonly mimeType: string;
  readonly text: string;
  readonly _meta: Json;
} {
  return {
    uri: resource.uri,
    mimeType: UI_RESOURCE_MIME_TYPE,
    text: html,
    _meta: {
      ui: {
        csp: {
          connectDomains: [...resource.csp.connectDomains],
          resourceDomains: [...resource.csp.resourceDomains],
        },
        ...(resource.permissions.length === 0 ? {} : { permissions: [...resource.permissions] }),
      },
    },
  };
}
