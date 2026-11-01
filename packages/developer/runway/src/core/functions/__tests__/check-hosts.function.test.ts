/**
 * Stackra file contract:
 * Purpose: unit tests of `checkHosts` (STA-1796): distinct hosts pass; two surfaces on one name, or on a relative and an
 *          absolute name that meet under the zone, are a `host_collision` naming the host, the environment and both
 *          surfaces; a collision is per environment (zones differ); one surface naming a host twice and `ops` are not
 *          collisions; `parseRunway("root")` refuses a collision with the second claim's path.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437; STA-1796.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { checkHosts } from "#core/functions/check-hosts.function";
import { parseRunway } from "#core/functions/parse-runway.function";
import type { RootRunway } from "#core/types/root-runway.type";

/** A root runway with `surfaces` in a production zone of figentra.com and a staging zone of staging.figentra.com. */
const rootWith = (surfaces: Record<string, unknown>): RootRunway =>
  ({
    version: 3,
    project: "mezzora",
    product: { key: "mezzora" },
    surfaces,
    environments: {
      production: { domains: { zone: "figentra.com" } },
      staging: { domains: { zone: "staging.figentra.com" } },
    },
  }) as unknown as RootRunway;

describe("checkHosts", () => {
  it("passes surfaces on hosts of their own", () => {
    expect(
      checkHosts(
        rootWith({
          console: { shell: "os/console@3", host: "console.mezzora" },
          landing: {
            shell: "os/landing@1",
            hosts: [{ host: "mezzora" }, { host: "mezzora.com." }],
          },
        }),
      ),
    ).toEqual([]);
  });

  it("refuses two surfaces on one host, naming both, in every environment", () => {
    const issues = checkHosts(
      rootWith({
        console: { shell: "os/console@3", host: "app.mezzora" },
        portal: { shell: "os/console@3", preset: "portal", hosts: [{ host: "app.mezzora" }] },
      }),
    );
    expect(
      issues.map(({ code, host, environment, surfaces, path }) => ({
        code,
        host,
        environment,
        surfaces,
        path,
      })),
    ).toEqual([
      {
        code: "host_collision",
        host: "app.mezzora.figentra.com",
        environment: "production",
        surfaces: ["console", "portal"],
        path: "surfaces.portal.hosts.0.host",
      },
      {
        code: "host_collision",
        host: "app.mezzora.staging.figentra.com",
        environment: "staging",
        surfaces: ["console", "portal"],
        path: "surfaces.portal.hosts.0.host",
      },
    ]);
    expect(issues[0]?.message).toMatch(
      /surfaces console and portal both resolve to app\.mezzora\.figentra\.com/,
    );
  });

  it("refuses a relative and an absolute name that meet under one zone only", () => {
    const issues = checkHosts(
      rootWith({
        console: { shell: "os/console@3", host: "app.mezzora" },
        landing: { shell: "os/landing@1", host: "app.mezzora.figentra.com." },
      }),
    );
    expect(issues.map((issue) => `${issue.environment} ${issue.host}`)).toEqual([
      "production app.mezzora.figentra.com",
    ]);
  });

  it("does not count one surface naming its host twice, or ops", () => {
    expect(
      checkHosts(
        rootWith({
          landing: {
            shell: "os/landing@1",
            host: "mezzora",
            hosts: [{ host: "mezzora", canonical: true }],
          },
          ops: { contributes: "@mezzora/ops-ui" },
        }),
      ),
    ).toEqual([]);
  });

  it("makes parseRunway refuse the root with the second claim's path", () => {
    try {
      parseRunway("root", {
        version: 3,
        project: "mezzora",
        product: { key: "mezzora" },
        surfaces: {
          console: { shell: "os/console@3", host: "app.mezzora" },
          portal: { shell: "os/console@3", preset: "portal", host: "app.mezzora" },
        },
        environments: { production: { domains: { zone: "figentra.com" } } },
      });
      expect.unreachable("parseRunway accepted two surfaces on one host");
    } catch (error) {
      expect(error).toBeInstanceOf(RunwayInvalidError);
      const issues = (error as RunwayInvalidError).issues;
      expect(issues.map((issue) => issue.path)).toEqual(["surfaces.portal.host"]);
      expect(issues[0]?.message).toMatch(/\(host_collision\)$/);
    }
  });
});
