/**
 * Stackra file contract:
 * Purpose: unit tests of `readServiceManifests`: a consumed service's committed manifest found in the folder beside
 *          the member (by key or kebab-case folder), once each and sorted, a folder whose manifest names another
 *          member skipped, a service without one left out, a contract package (`stackra.kind`) supplying a service with no
 *          folder by kind and manifest member, never by package name or an ordinary dependency (STA-1820), an app's service found in the repo's `services/`, and an invalid
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

  it("reads a package three folders deep from the repository's services folder (STA-1673)", () => {
    const root = writeFixtureMember("packages/commerce/console-ui", {});
    const repository = dirname(dirname(dirname(root)));
    writeFileSync(join(repository, "pnpm-workspace.yaml"), "packages: []\n");
    const sales = { member: "sales", package: "@acme/sales", version: "0.1.0" };
    const path = join(repository, "services", "sales", "stackra.manifest.json");
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(sales));
    expect(readServiceManifests(root, ["sales"])).toEqual([
      { member: "sales", folder: "sales", manifest: sales },
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

/** An installed package with this `stackra` field and manifest. */
const installed = (
  name: string,
  kind: string | undefined,
  manifest: object,
): Record<string, string> => ({
  [`node_modules/${name}/package.json`]: JSON.stringify({
    name,
    ...(kind === undefined ? {} : { stackra: { kind } }),
  }),
  [`node_modules/${name}/stackra.manifest.json`]: JSON.stringify(manifest),
});

describe("readServiceManifests from a contract package (STA-1820)", () => {
  const commerce = { member: "commerce", package: "@acme/service-commerce", version: "1.2.0" };
  it("resolves a service from a contract dependency by kind and manifest member, whatever its name", () => {
    const root = writeFixtureMember("console", installed("@acme/orders-api", "contract", commerce));
    expect(readServiceManifests(root, ["commerce"], ["@acme/orders-api"])).toEqual([
      { member: "commerce", package: "@acme/orders-api", manifest: commerce },
    ]);
  });

  it("prefers a sibling folder over a contract package", () => {
    const root = writeFixtureMember(
      "console2",
      installed("@acme/commerce-contract", "contract", commerce),
    );
    sibling(root, "commerce", JSON.stringify(commerce));
    expect(readServiceManifests(root, ["commerce"], ["@acme/commerce-contract"])).toEqual([
      { member: "commerce", folder: "commerce", manifest: commerce },
    ]);
  });

  it("does not resolve a service from a package that is not a contract, even one named for it", () => {
    const root = writeFixtureMember("console3", {
      ...installed("@acme/commerce-contract", undefined, commerce),
      ...installed("@stackra/tenancy", "package", {
        member: "tenancy",
        package: "@stackra/tenancy",
      }),
    });
    expect(
      readServiceManifests(
        root,
        ["commerce", "tenancy"],
        ["@acme/commerce-contract", "@stackra/tenancy"],
      ),
    ).toEqual([]);
  });

  it("skips a contract whose manifest names another service", () => {
    const root = writeFixtureMember(
      "console4",
      installed("@acme/billing-contract", "contract", { member: "billing" }),
    );
    expect(readServiceManifests(root, ["commerce"], ["@acme/billing-contract"])).toEqual([]);
  });
});
