/**
 * Stackra file contract:
 * Purpose: unit tests of `plannedExtensions`: the union of the extensions the service runways name for one
 *          environment, deduplicated and sorted; narrowed to the given members; a member without a runway (a
 *          workload) or without a database block names none.
 * Boundary: test only; runways are parsed from inline documents.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0160 (notes of 2026-11-03 and 2026-11-26).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { parseRunway } from "#core/functions/parse-runway.function";
import { plannedExtensions } from "#core/functions/planned-extensions.function";
import type { ServiceRunway } from "#core/types/service-runway.type";

/** A service runway naming `extensions` in production, none in staging. */
function service(extensions: readonly string[]): ServiceRunway {
  return parseRunway("service", {
    version: 3,
    environments: { production: { database: { extensions } }, staging: {} },
  });
}

const SERVICES = {
  commerce: service(["pg_trgm", "citext"]),
  search: service(["vector", "pg_trgm"]),
};

describe("plannedExtensions", () => {
  it("unites every service's extensions, deduplicated and sorted", () => {
    expect(plannedExtensions(SERVICES, RunwayEnvironment.Production)).toEqual([
      "citext",
      "pg_trgm",
      "vector",
    ]);
  });

  it("narrows to the given members and skips a key without a runway", () => {
    expect(
      plannedExtensions(SERVICES, RunwayEnvironment.Production, ["search", "chatwoot_web"]),
    ).toEqual(["pg_trgm", "vector"]);
  });

  it("names none for an environment without a database block", () => {
    expect(plannedExtensions(SERVICES, RunwayEnvironment.Staging)).toEqual([]);
  });
});
