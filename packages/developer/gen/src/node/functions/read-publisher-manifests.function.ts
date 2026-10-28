/**
 * Stackra file contract:
 * Purpose: `readPublisherManifests`, the committed `stackra.manifest.json` of every other service beside the member
 *          (`services/*` next to `services/<member>`) that publishes an integration event: what the events target
 *          subscribes a relay service to, so the relay sees every integration topic of the product.
 * Boundary: reads files only, and only for a member with a relay (discovery decides). A sibling is matched by its
 *           committed manifest, never by importing its package (ADR 0010); the member's own folder, a folder without
 *           a manifest and a manifest without an integration event are left out. A manifest that is not valid JSON
 *           fails the run.
 * Runtime: node
 * Governing contract: ADR 0260 (decision 4: the relay subscription); ADR 0141 (integration events); ADR 0158 (the
 *                     manifest is the contract); ADR 0148 (decisions 3 and 6: Encore Pub/Sub in SaaS).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The publishing services beside `root`, sorted by service key.
 *
 * @param root - the member root.
 * @throws Error when a sibling's manifest is not valid JSON.
 * @example
 * readPublisherManifests("/repo/services/webhooks").map((publisher) => publisher.folder); // ["billing", "orders"]
 */
export function readPublisherManifests(root: string): NonNullable<MemberIR["publishers"]> {
  const parent = dirname(root);
  const found: { member: string; folder: string; manifest: StackraManifest }[] = [];
  for (const entry of readdirSync(parent, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === basename(root)) continue;
    const path = join(parent, entry.name, "stackra.manifest.json");
    if (!existsSync(path)) continue;
    let manifest: StackraManifest;
    try {
      manifest = JSON.parse(readFileSync(path, "utf8")) as StackraManifest;
    } catch (error) {
      throw new Error(`${path} is not valid JSON: ${(error as Error).message}`, { cause: error });
    }
    if ((manifest.events ?? []).some((event) => event.kind === "integration"))
      found.push({ member: manifest.member, folder: entry.name, manifest });
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return found.sort((left, right) => left.member.localeCompare(right.member));
}
