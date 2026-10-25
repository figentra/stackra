/**
 * Stackra file contract:
 * Purpose: unit tests of `KIND_BASES`: every suffix is kebab-case and lists at least one base; the bases follow
 *          `PascalCase(kind)` except for the aliases ADR 0294 R3 names; the table is frozen.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import { KIND_BASES } from "#core/constants/kind-bases.constant";
import { pascalCase } from "#core/functions/pascal-case.function";

const ALIASED = new Set(["error", "event", "schema", "service"]);

describe("KIND_BASES", () => {
  it("is frozen", () => {
    expect(Object.isFrozen(KIND_BASES)).toBe(true);
  });

  it.each(Object.entries(KIND_BASES))("%s is kebab-case with at least one base", (kind, bases) => {
    expect(kind).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
    expect(bases.length).toBeGreaterThan(0);
  });

  it.each(Object.entries(KIND_BASES).filter(([kind]) => !ALIASED.has(kind)))(
    "%s takes PascalCase(kind)",
    (kind, bases) => {
      expect(bases).toContain(pascalCase(kind));
    },
  );

  it("holds the aliases of ADR 0294 R3", () => {
    expect(KIND_BASES["error"]).toEqual(["Refusal"]);
    expect(KIND_BASES["event"]).toEqual(["DomainEvent", "IntegrationEvent", "WebhookEvent"]);
    expect(KIND_BASES["service"]).toEqual(["Service", "CrudService"]);
    expect(KIND_BASES["schema"]).toContain("Schema");
  });

  it("lists no function kind", () => {
    for (const kind of ["function", "constant", "type", "enum", "props", "server"]) {
      expect(KIND_BASES[kind]).toBeUndefined();
    }
  });
});
