/**
 * Stackra file contract:
 * Purpose: unit tests of `checkDestinations`: driven destinations and the npm and electron-release blocks pass; an
 *          undriven destination (compose, a dev server, a desktop electron-release) and an undriven target block
 *          (helm, aws-ecs, compose) are each one issue at their path.
 * Boundary: test only; plain root runway objects.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352; STA-2100.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkDestinations } from "#core/functions/check-destinations.function";
import type { RootRunway } from "#core/types/root-runway.type";

const root = (value: Record<string, unknown>) => value as unknown as RootRunway;

describe("checkDestinations", () => {
  it("passes driven destinations and the npm and electron-release blocks", () => {
    expect(
      checkDestinations(
        root({
          environments: {
            staging: {
              destinations: { services: "encore-cloud", web: "cloudflare-workers", mobile: "eas" },
            },
            production: { destinations: { docs: "mintlify" } },
          },
          targets: { "encore-cloud": {}, npm: {}, "electron-release": { feed: {} } },
        }),
      ),
    ).toEqual([]);
  });

  it("names every undriven destination and target block at its path", () => {
    const issues = checkDestinations(
      root({
        environments: {
          dev: { destinations: { services: "compose", web: "vite-dev" } },
          staging: { destinations: { desktop: "electron-release", services: "encore-cloud" } },
        },
        targets: { helm: {}, "aws-ecs": {}, mintlify: {} },
      }),
    );
    expect(issues.map(({ path }) => path)).toEqual([
      "environments.dev.destinations.services",
      "environments.dev.destinations.web",
      "environments.staging.destinations.desktop",
      "targets.helm",
      "targets.aws-ecs",
    ]);
    expect(issues[0]?.message).toContain("No driver ships to compose");
  });
});
