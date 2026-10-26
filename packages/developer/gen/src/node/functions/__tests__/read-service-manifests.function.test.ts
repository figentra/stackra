/**
 * Stackra file contract:
 * Purpose: unit tests of `readServiceManifests`: a consumed service's committed manifest found in the folder beside
 *          the member (by key or kebab-case folder), once each and sorted, a folder whose manifest names another
 *          member skipped, a service without one left out, an app's service found in the repo's `services/`, and an invalid
 *          manifest refused.
 * Boundary: test only; writes small fixtures under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0260 (decision 3).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { readServiceManifests } from "#node/functions/read-service-manifests.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

/** Writes `content` as the manifest of the folder `folder` beside `root`. */
function sibling(root: string, folder: string, content: string): void {
  const path = join(dirname(root), folder, "stackra.manifest.json");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

describe("readServiceManifests", () => {
  it("reads each consumed service's manifest from beside the member", () => {
    const root = writeFixtureMember("channels", {});
    const catalogue = { member: "catalogue", package: "@acme/catalogue", version: "0.1.0" };
    const giftCards = { member: "gift_cards", package: "@acme/gift-cards", version: "0.1.0" };
    sibling(root, "catalogue", JSON.stringify(catalogue));
    sibling(root, "gift-cards", JSON.stringify(giftCards));
    sibling(root, "stock", JSON.stringify({ member: "warehouse" }));
    expect(
      readServiceManifests(root, ["gift_cards", "catalogue", "catalogue", "stock", "missing"]),
    ).toEqual([
      { member: "catalogue", folder: "catalogue", manifest: catalogue },
      { member: "gift_cards", folder: "gift-cards", manifest: giftCards },
    ]);
  });

  it("reads an app's consumed service from the repo's services folder (STA-1293)", () => {
    const root = writeFixtureMember("apps/web", {});
    const channels = { member: "channels", package: "@acme/channels", version: "0.1.0" };
    const path = join(dirname(dirname(root)), "services", "channels", "stackra.manifest.json");
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(channels));
    expect(readServiceManifests(root, ["channels"])).toEqual([
      { member: "channels", folder: "channels", manifest: channels },
    ]);
  });

  it("matches a snake-case member under a kebab-case specifier (STA-1296)", () => {
    const root = writeFixtureMember("audit", {});
    const privacy = {
      member: "compliance_privacy",
      package: "@acme/compliance-privacy",
      version: "0.1.0",
    };
    sibling(root, "compliance-privacy", JSON.stringify(privacy));
    expect(readServiceManifests(root, ["compliance-privacy"])).toEqual([
      { member: "compliance-privacy", folder: "compliance-privacy", manifest: privacy },
    ]);
  });

  it("refuses an invalid manifest", () => {
    const root = writeFixtureMember("sales", {});
    sibling(root, "broken", "{ nope");
    expect(() => readServiceManifests(root, ["broken"])).toThrow(/is not valid JSON/);
  });
});
