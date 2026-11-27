/**
 * Stackra file contract:
 * Purpose: `readLocalResource(knowledge, uri)`, the local MCP's `resources/read` of one `stackra://` URI: the
 *          guidelines Markdown, every manifest or one member's as JSON, or one rule's or skill's Markdown body.
 * Boundary: reads the manifests under the root on every call; never writes. A URI it does not serve, a member with no
 *           committed manifest or a name with no document answers the MCP "resource not found" error (-32002) with the
 *           URI; a manifest that is not JSON answers an internal error (-32603) that names the cause.
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 2, 5 and 6); ADR 0294 (rule R10); the MCP `resources/read` error codes;
 *                     STA-2919.
 */
import type { RuleDocument, SkillDocument } from "@stackra/skills";

import { LOCAL_RESOURCE_URI } from "#node/constants/local-resource-uri.constant";
import { McpProtocolError } from "#node/errors/mcp-protocol.error";
import { guidelinesOf } from "#node/functions/guidelines-of.function";
import { readManifests } from "#node/functions/read-manifests.function";
import type { LocalKnowledge } from "#node/types/local-knowledge.type";
import type { ResourceContents } from "#node/types/resource-contents.type";

/** The MCP error code for a resource that does not exist. */
const RESOURCE_NOT_FOUND = -32_002;

/** The error for `uri`, which this server does not serve. */
const notFound = (uri: string): McpProtocolError =>
  new McpProtocolError(RESOURCE_NOT_FOUND, `Resource not found: ${uri}`);

/** The manifests under `root`, or an internal error naming why they cannot be read. */
const manifestsOf = (root: string) => {
  try {
    return readManifests(root);
  } catch (error) {
    throw new McpProtocolError(
      -32_603,
      `A stackra.manifest.json cannot be read: ${(error as Error).message}`,
    );
  }
};

/** `encoded` decoded, or `undefined` when it is not valid percent-encoding. */
const decoded = (encoded: string): string | undefined => {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return undefined;
  }
};

/**
 * The contents of one local resource.
 *
 * @param knowledge - the root, the documents and the tool names.
 * @param uri - a URI from `listLocalResources`.
 * @throws McpProtocolError (-32002) when the URI names nothing this server serves; (-32603) when a manifest is not
 *         JSON.
 * @example
 * readLocalResource(knowledge, "stackra://skills/backend-errors").text;
 */
export function readLocalResource(knowledge: LocalKnowledge, uri: string): ResourceContents {
  if (uri === LOCAL_RESOURCE_URI.guidelines)
    return { uri, mimeType: "text/markdown", text: guidelinesOf(knowledge) };
  if (uri === LOCAL_RESOURCE_URI.manifest)
    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify(manifestsOf(knowledge.root), null, 2),
    };
  if (uri.startsWith(LOCAL_RESOURCE_URI.manifestOf)) {
    const member = decoded(uri.slice(LOCAL_RESOURCE_URI.manifestOf.length));
    const manifest = manifestsOf(knowledge.root).find((each) => each.member === member);
    if (manifest === undefined) throw notFound(uri);
    return { uri, mimeType: "application/json", text: JSON.stringify(manifest, null, 2) };
  }
  for (const [prefix, kind] of [
    [LOCAL_RESOURCE_URI.rule, "rule"],
    [LOCAL_RESOURCE_URI.skill, "skill"],
  ] as const) {
    if (!uri.startsWith(prefix)) continue;
    const name = uri.slice(prefix.length);
    const document = knowledge.documents.find(
      (each): each is RuleDocument | SkillDocument => each.kind === kind && each.name === name,
    );
    if (document === undefined) throw notFound(uri);
    return { uri, mimeType: "text/markdown", text: document.body };
  }
  throw notFound(uri);
}
