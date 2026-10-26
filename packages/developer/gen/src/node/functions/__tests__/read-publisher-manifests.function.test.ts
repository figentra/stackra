/**
 * Stackra file contract:
 * Purpose: unit tests of `readPublisherManifests`: every sibling service whose committed manifest publishes an
 *          integration event, with its folder, sorted by service key; the member itself, a folder without a manifest
 *          and a manifest without an integration event left out; an invalid manifest refused.
 * Boundary: test only; writes small fixtures under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0260 (decision 4).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { readPublisherManifests } from "#node/functions/read-publisher-manifests.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

/** Writes `content` as the manifest of the folder `folder` beside `root`. */
function sibling(root: string, folder: string, content: string): void {
  const path = join(dirname(root), folder, "stackra.manifest.json");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

/** A manifest of `member` with the given event kinds. */
function manifest(member: string, kinds: readonly string[]): Record<string, unknown> {
  return {
    member,
    package: `@acme/${member}`,
    version: "0.1.0",
    events: kinds.map((kind, index) => ({ name: `${member}.thing.v${index + 1}`, kind })),
  };
}

describe("readPublisherManifests", () => {
  it("reads every publishing sibling with its folder", () => {
    const root = writeFixtureMember("webhooks", {});
    const orders = manifest("orders", ["integration"]);
    const giftCards = manifest("gift_cards", ["domain", "integration"]);
    sibling(root, "orders", JSON.stringify(orders));
    sibling(root, "gift-cards", JSON.stringify(giftCards));
    sibling(root, "quiet", JSON.stringify(manifest("quiet", ["domain"])));
    sibling(root, "webhooks", JSON.stringify(manifest("webhooks", ["integration"])));
    mkdirSync(join(dirname(root), "empty"), { recursive: true });
    expect(readPublisherManifests(root)).toEqual([
      { member: "gift_cards", folder: "gift-cards", manifest: giftCards },
      { member: "orders", folder: "orders", manifest: orders },
    ]);
  });

  it("refuses an invalid manifest", () => {
    const root = writeFixtureMember("webhooks", {});
    sibling(root, "broken", "{ nope");
    expect(() => readPublisherManifests(root)).toThrow(/is not valid JSON/);
  });
});
