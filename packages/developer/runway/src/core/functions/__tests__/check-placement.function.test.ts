/**
 * Stackra file contract:
 * Purpose: unit tests of `checkPlacement`: the template's topology places every member; a grouped environment without
 *          a default reports an unplaced member; a member in two groups, a group listing a non-member, a default
 *          naming no group and an isolate naming a non-member are each reported with their environment and code;
 *          monolith and split environments skip group placement.
 * Boundary: test only; topologies are built through `parseRunway` so they carry the parsed defaults.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 2 and enforcement).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkPlacement } from "#core/functions/check-placement.function";
import { parseRunway } from "#core/functions/parse-runway.function";
import type { RootRunway } from "#core/types/root-runway.type";

/** A group of the given members with the template's sizes. */
function group(...members: string[]) {
  return { members, cpu: 0.5, memory: "1Gi", instances: { min: 1, max: 2 } };
}

/** A root runway whose environments have the given topologies. */
function rootWith(environments: Record<string, unknown>): RootRunway {
  const shaped = Object.fromEntries(
    Object.entries(environments).map(([name, topology]) => [name, { topology }]),
  );
  return parseRunway("root", { version: 3, project: "acme-platform", environments: shaped });
}

const MEMBERS = ["commerce", "notifications"];

describe("checkPlacement", () => {
  it("passes the template's topologies", () => {
    const root = rootWith({
      dev: { mode: "monolith" },
      preview: {
        mode: "grouped",
        default: "core",
        groups: { core: group("commerce", "notifications") },
      },
      production: {
        mode: "grouped",
        isolate: [],
        groups: { commerce: group("commerce"), notifications: group("notifications") },
      },
    });

    expect(checkPlacement(root, MEMBERS)).toEqual([]);
  });

  it("reports a member no group lists when there is no default group", () => {
    const root = rootWith({
      production: { mode: "grouped", groups: { commerce: group("commerce") } },
    });

    expect(checkPlacement(root, MEMBERS)).toEqual([
      {
        environment: "production",
        code: "member_unplaced",
        subject: "notifications",
        message: expect.stringContaining("no default group"),
      },
    ]);
  });

  it("places unlisted members in the default group", () => {
    const root = rootWith({
      staging: { mode: "grouped", default: "core", groups: { core: group("commerce") } },
    });

    expect(checkPlacement(root, MEMBERS)).toEqual([]);
  });

  it("reports a member placed twice, an unknown member and an unknown default group", () => {
    const root = rootWith({
      staging: {
        mode: "grouped",
        default: "rest",
        groups: { a: group("commerce", "billing"), b: group("commerce", "notifications") },
      },
    });

    expect(checkPlacement(root, MEMBERS).map(({ code, subject }) => [code, subject])).toEqual([
      ["unknown_default_group", "rest"],
      ["unknown_member", "billing"],
      ["member_placed_twice", "commerce"],
    ]);
  });

  it("checks isolate in every mode and skips group placement outside grouped", () => {
    const root = rootWith({
      dev: { mode: "monolith", isolate: ["identity"] },
      preview: { mode: "split", groups: { a: group("commerce") } },
    });

    expect(checkPlacement(root, MEMBERS)).toEqual([
      {
        environment: "dev",
        code: "isolate_unknown_member",
        subject: "identity",
        message: expect.stringContaining("not a service member"),
      },
    ]);
  });

  it("reports environments in promotion order", () => {
    const root = rootWith({
      production: { mode: "grouped", groups: { a: group("commerce") } },
      dev: { mode: "grouped", groups: { a: group("commerce") } },
    });

    expect(checkPlacement(root, MEMBERS).map((issue) => issue.environment)).toEqual([
      "dev",
      "production",
    ]);
  });
});
