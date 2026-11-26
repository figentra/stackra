/**
 * Stackra file contract:
 * Purpose: unit tests of `pairSubclassConnections` and `connectionOf`: a directly typed connection keeps its partner;
 *          a subclassed one takes its same-stem integration, else its base's partner (through an own chain); two
 *          same-stem integrations are `connection_partner_ambiguous`; and an integration's connection is the one named
 *          after it, never a subclass that only inherits it.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rule 5); ADR 0308 (rules 15 and 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { connectionOf } from "#core/functions/connection-of.function";
import { pairSubclassConnections } from "#core/functions/pair-subclass-connections.function";
import type { DeclaredClass } from "#core/types/declared-class.type";

/** One class of the `gateway` module, its file and import path derived from its kind and name. */
const declared = (
  name: string,
  kind: "connection" | "integration",
  extra: Partial<DeclaredClass> = {},
  module = "gateway",
): DeclaredClass => {
  const stem = name
    .replace(/(Connection|Integration)$/, "")
    .replaceAll(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase();
  const path = `modules/${module}/${kind}s/${stem}.${kind}`;
  return {
    name,
    kind,
    module,
    file: `src/${path}.ts`,
    importPath: `#${path}`,
    options: {},
    deps: [],
    facets: [],
    methods: [],
    refusals: [],
    statics: {},
    traits: [],
    ...extra,
  };
};

const BASE_INTEGRATION = declared("BaseIntegration", "integration");
const BASE = declared("BaseConnection", "connection", {
  partner: {
    name: "BaseIntegration",
    kind: "integration",
    from: "#modules/gateway/integrations/base.integration",
  },
});
/** A subclass of `BaseConnection`, which the reader gives its base's partner. */
const subclassOf = (name: string, parent: DeclaredClass): DeclaredClass =>
  declared(name, "connection", {
    base: { name: parent.name, from: parent.importPath, own: true },
    ...(BASE.partner !== undefined ? { partner: BASE.partner } : {}),
  });

describe("pairSubclassConnections", () => {
  it("pairs each subclass with its same-stem integration and keeps the direct pair", () => {
    const { classes, errors } = pairSubclassConnections([
      BASE_INTEGRATION,
      BASE,
      declared("RegionalIntegration", "integration"),
      subclassOf("RegionalConnection", BASE),
      declared("BaseSandboxIntegration", "integration"),
      subclassOf("BaseSandboxConnection", BASE),
    ]);
    expect(errors).toEqual([]);
    const partnerOf = (name: string) => classes.find((one) => one.name === name)?.partner;
    expect(partnerOf("BaseConnection")).toEqual(BASE.partner);
    expect(partnerOf("RegionalConnection")).toEqual({
      name: "RegionalIntegration",
      kind: "integration",
      from: "#modules/gateway/integrations/regional.integration",
    });
    expect(partnerOf("BaseSandboxConnection")?.name).toBe("BaseSandboxIntegration");
  });

  it("inherits the base's partner, through an own chain, when no same-stem integration exists", () => {
    const regional = subclassOf("RegionalConnection", BASE);
    const { classes, errors } = pairSubclassConnections([
      BASE_INTEGRATION,
      BASE,
      declared("RegionalIntegration", "integration"),
      regional,
      subclassOf("RegionalSandboxConnection", regional),
      subclassOf("MirrorConnection", BASE),
    ]);
    expect(errors).toEqual([]);
    const partnerOf = (name: string) => classes.find((one) => one.name === name)?.partner?.name;
    expect(partnerOf("RegionalSandboxConnection")).toBe("RegionalIntegration");
    expect(partnerOf("MirrorConnection")).toBe("BaseIntegration");
    // The base keeps its own connection; the inheriting subclass never displaces it.
    expect(connectionOf(classes, "BaseIntegration")?.name).toBe("BaseConnection");
    expect(connectionOf(classes, "RegionalIntegration")?.name).toBe("RegionalConnection");
  });

  it("refuses two same-stem integrations with connection_partner_ambiguous", () => {
    const { errors } = pairSubclassConnections([
      BASE_INTEGRATION,
      BASE,
      declared("RegionalIntegration", "integration"),
      declared("RegionalIntegration", "integration", {}, "mirror"),
      subclassOf("RegionalConnection", BASE),
    ]);
    expect(errors).toEqual([
      expect.objectContaining({
        code: "connection_partner_ambiguous",
        subject: "RegionalConnection",
        file: "src/modules/gateway/connections/regional.connection.ts",
      }),
    ]);
  });
});
