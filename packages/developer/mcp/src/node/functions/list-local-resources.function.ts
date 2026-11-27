/**
 * Stackra file contract:
 * Purpose: `listLocalResources(knowledge)`, the local MCP's `resources/list`: `stackra://guidelines`,
 *          `stackra://manifest` and one `stackra://manifest/<member>` per committed manifest, then one
 *          `stackra://rules/<name>` per rule and one `stackra://skills/<name>` per skill of `@stackra/skills`.
 * Boundary: reads the manifests under the root on every call, so the list follows `stackra gen`; never writes. A
 *           manifest that is not JSON leaves the per-member entries out here, and `stackra://manifest` reports it
 *           when read.
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 2, 5 and 6); ADR 0294 (rule R10: the committed manifest is the contract);
 *                     STA-2919.
 */
import type { StackraManifest } from "@stackra/contracts";

import { LOCAL_RESOURCE_URI } from "#node/constants/local-resource-uri.constant";
import { readManifests } from "#node/functions/read-manifests.function";
import type { LocalKnowledge } from "#node/types/local-knowledge.type";
import type { LocalResource } from "#node/types/local-resource.type";

/** The manifests under `root`, or none when one cannot be read. */
const readableManifests = (root: string): StackraManifest[] => {
  try {
    return readManifests(root);
  } catch {
    return [];
  }
};

/**
 * Every resource the local MCP serves.
 *
 * @param knowledge - the root, the documents and the tool names.
 * @example
 * listLocalResources({ root, documents: loadSkillSet(), tools }).map((resource) => resource.uri);
 */
export function listLocalResources(knowledge: LocalKnowledge): LocalResource[] {
  const resources: LocalResource[] = [
    {
      uri: LOCAL_RESOURCE_URI.guidelines,
      name: "guidelines",
      title: "Stackra guidelines",
      description:
        "Read first. The conventions every change follows: the always-on rules in full, the rules and skills to " +
        "read on request, and the steps every change ends with (`stackra gen --check` and the tests).",
      mimeType: "text/markdown",
    },
    {
      uri: LOCAL_RESOURCE_URI.manifest,
      name: "manifest",
      title: "Every member's manifest",
      description:
        "The committed stackra.manifest.json of every member, as one JSON array: actions, events, routes, " +
        "permissions, errors, models and drivers.",
      mimeType: "application/json",
    },
  ];
  for (const manifest of readableManifests(knowledge.root)) {
    resources.push({
      uri: `${LOCAL_RESOURCE_URI.manifestOf}${encodeURIComponent(manifest.member)}`,
      name: `manifest/${manifest.member}`,
      title: `The ${manifest.member} manifest`,
      description: `The committed stackra.manifest.json of ${manifest.member} (${manifest.package}).`,
      mimeType: "application/json",
    });
  }
  for (const document of knowledge.documents) {
    if (document.kind === "rule") {
      resources.push({
        uri: `${LOCAL_RESOURCE_URI.rule}${document.name}`,
        name: `rules/${document.name}`,
        title: document.title,
        description: document.always
          ? `${document.description} Always applies; stackra://guidelines holds it in full.`
          : document.description,
        mimeType: "text/markdown",
      });
    } else if (document.kind === "skill") {
      resources.push({
        uri: `${LOCAL_RESOURCE_URI.skill}${document.name}`,
        name: `skills/${document.name}`,
        title: document.name,
        description: document.description,
        mimeType: "text/markdown",
      });
    }
  }
  return resources;
}
