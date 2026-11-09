/**
 * Stackra file contract:
 * Purpose: unit tests of `whiteLabelVariantOf` and `startWhiteLabelJob`: the event's scope, entitlements and set
 *          identity parts become the variant, null, empty and blank parts are dropped so the runway entry's stay, and
 *          the starter runs the job for the event's app and refuses an event with no scope or app before it.
 * Boundary: test only; the mobile job is a stand-in that records its request.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0439 (decision 8); STA-2074 (os#244).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { startWhiteLabelJob } from "#node/functions/start-white-label-job.function";
import { whiteLabelVariantOf } from "#node/functions/white-label-variant-of.function";
import type { MobileJobRequest } from "#node/types/mobile-job-request.type";
import type { MobileJobResult } from "#node/types/mobile-job-result.type";
import type { WhiteLabelBuildRequested } from "#node/types/white-label-build-requested.type";

/** An event for scope `scp_acme` with every identity part set. */
const EVENT: WhiteLabelBuildRequested = {
  buildId: "wlb_1",
  scopeId: "scp_acme",
  app: "shopper",
  identity: {
    scheme: "acme",
    links: ["shop.acme.example"],
    name: { en: "Acme", ar: "أكمي" },
    ios: { bundleId: "com.acme.shopper" },
    android: { package: "com.acme.shopper" },
  },
  entitlements: ["storefront.white_label", "white_label.builds"],
};

/** `EVENT` with `identity` replaced. */
const withIdentity = (identity: Partial<WhiteLabelBuildRequested["identity"]>) => ({
  ...EVENT,
  identity: { ...EVENT.identity, ...identity },
});

/** A job stand-in that records the request it gets. */
function recorder(): {
  job: (request: MobileJobRequest) => Promise<MobileJobResult>;
  seen: MobileJobRequest[];
} {
  const seen: MobileJobRequest[] = [];
  const job = async (request: MobileJobRequest): Promise<MobileJobResult> => {
    seen.push(request);
    return { builds: [] } as unknown as MobileJobResult;
  };
  return { job, seen };
}

describe("whiteLabelVariantOf", () => {
  it("carries the scope, the entitlements and every set identity part", () => {
    expect(whiteLabelVariantOf(EVENT)).toEqual({
      scope: "scp_acme",
      entitlements: ["storefront.white_label", "white_label.builds"],
      identity: {
        name: { en: "Acme", ar: "أكمي" },
        ios: { bundleId: "com.acme.shopper" },
        android: { package: "com.acme.shopper" },
        scheme: "acme",
        links: ["shop.acme.example"],
      },
    });
  });

  it("drops null, empty and blank parts, so the runway entry's stay", () => {
    const variant = whiteLabelVariantOf(
      withIdentity({ scheme: null, links: [], name: {}, ios: null, android: null }),
    );
    expect(variant.identity).toEqual({});
    const blank = whiteLabelVariantOf(
      withIdentity({
        scheme: " ",
        links: ["", "shop.acme.example"],
        name: { en: "Acme", ar: "" },
        ios: { bundleId: "" },
        android: { package: " " },
      }),
    );
    expect(blank.identity).toEqual({ name: { en: "Acme" }, links: ["shop.acme.example"] });
  });
});

describe("startWhiteLabelJob", () => {
  const BASE = {
    repository: ".",
    templateDir: ".stackra/mobile",
    sha: "b".repeat(40),
    environment: "production" as const,
    stores: [],
  };

  it("runs the mobile job for the event's app with the event's variant", async () => {
    const { job, seen } = recorder();
    await startWhiteLabelJob({ ...BASE, event: EVENT, job });
    expect(seen).toHaveLength(1);
    expect(seen[0]?.app).toBe("shopper");
    expect(seen[0]?.variant).toEqual(whiteLabelVariantOf(EVENT));
    expect(seen[0]?.repository).toBe(".");
    expect(seen[0]).not.toHaveProperty("event");
    expect(seen[0]).not.toHaveProperty("job");
  });

  it("refuses an event with no scope or app before the job runs", async () => {
    const { job, seen } = recorder();
    const refused = startWhiteLabelJob({
      ...BASE,
      event: { ...EVENT, scopeId: "", app: " " },
      job,
    });
    await expect(refused).rejects.toBeInstanceOf(RunwayInvalidError);
    await refused.catch((error: RunwayInvalidError) =>
      expect(error.issues.map((issue) => issue.path)).toEqual(["scopeId", "app"]),
    );
    expect(seen).toHaveLength(0);
  });
});
