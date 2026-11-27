/**
 * Stackra file contract:
 * Purpose: `LOCAL_RESOURCE_TEMPLATES`, the local MCP's `resources/templates/list`: the URI templates of one member's
 *          manifest, one rule and one skill, so a client can read a member or document it already knows by name.
 * Boundary: data only; every URI a template expands to is read by `readLocalResource`.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); the MCP `ResourceTemplate` shape (RFC 6570 URI templates); STA-2919.
 */
import { LOCAL_RESOURCE_URI } from "#node/constants/local-resource-uri.constant";

/** The resource templates of the local MCP. */
export const LOCAL_RESOURCE_TEMPLATES = [
  {
    uriTemplate: `${LOCAL_RESOURCE_URI.manifestOf}{member}`,
    name: "manifest-of-member",
    title: "One member's manifest",
    description: "The committed stackra.manifest.json of one member, by member key.",
    mimeType: "application/json",
  },
  {
    uriTemplate: `${LOCAL_RESOURCE_URI.rule}{name}`,
    name: "rule",
    title: "A Stackra rule",
    description: "One rule of @stackra/skills, by name.",
    mimeType: "text/markdown",
  },
  {
    uriTemplate: `${LOCAL_RESOURCE_URI.skill}{name}`,
    name: "skill",
    title: "A Stackra skill",
    description: "One skill of @stackra/skills, by name.",
    mimeType: "text/markdown",
  },
] as const;
