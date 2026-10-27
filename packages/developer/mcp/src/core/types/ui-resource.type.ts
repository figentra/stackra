/**
 * Stackra file contract:
 * Purpose: `UiResource`, one `ui://` resource the hosted MCP server can serve: its URI, name and description, where its
 *          single-file bundle is published, and the content-security policy and permissions the host's frame gets.
 * Boundary: a type only; `uiResourceTable` builds it from the committed manifests (the member that builds the bundle
 *           lists it under `uiResources`). The bundle is built by an app member or a package and published as an
 *           asset, never built here or in the AI service.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 2); STA-784; ADR 0284 (assets).
 */

/** A `ui://` resource. */
export type UiResource = {
  /** The resource's URI, `ui://<module>/<name>`. */
  readonly uri: string;

  /** Its display name. */
  readonly name: string;

  /** What it shows, when the manifest says. */
  readonly description?: string;

  /** The published asset URL of its single-file HTML bundle. */
  readonly url: string;

  /** The member whose manifest listed it. */
  readonly member: string;

  /** The origins the frame may reach: `connectDomains` (fetch), `resourceDomains` (scripts, images, fonts). */
  readonly csp: {
    readonly connectDomains: readonly string[];
    readonly resourceDomains: readonly string[];
  };

  /** The device permissions the frame asks for (`camera`, `clipboardWrite`); none when empty. */
  readonly permissions: readonly string[];
};
