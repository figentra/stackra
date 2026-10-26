/**
 * Stackra file contract:
 * Purpose: data tests of the offer seeds in `assets/data/`: the `os` rule-set pack holds `startup_perk_eligibility`
 *          (incubator members, or software companies incorporated in the window) and `offer_stacking` (only the
 *          annual offer stacks) in the `RuleSetPack$` shape of `@stackra/rules`, and the incubator list is an editable
 *          settings record that ships empty.
 * Boundary: test only; reads the shipped YAML from disk. This package does not depend on `@stackra/rules`, so the
 *           shape is checked here structurally; seeding checks each rule against the OS consumer's `Rules`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0393 (decisions 3 and 4); ADR 0331 (decision 5); owner RV-52, M3-6.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "@stackra/testing";
import { parse } from "yaml";
import { z } from "zod";

const folder = new URL("../../../assets/data/", import.meta.url);

/** Reads one shipped YAML file. */
const read = (path: string): unknown => parse(readFileSync(new URL(path, folder), "utf8"));

/** A dotted lowercase key, as `RuleSetPack$` asks. */
const KEY = z.string().regex(/^[a-z0-9_]+(\.[a-z0-9_]+)*$/);

/** The `RuleSetPack$` shape. */
const PACK = z.object({
  key: KEY,
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  ruleSets: z.array(
    z.object({
      key: KEY,
      consumer: z.string().min(1),
      condition: z.json(),
      outcomes: z.array(
        z.object({ kind: z.string().min(1), params: z.record(z.string(), z.json()) }),
      ),
    }),
  ),
});

describe("offer seeds", () => {
  const pack = PACK.parse(read("rule-sets/os-offers.yaml"));
  const byKey = new Map(pack.ruleSets.map((ruleSet) => [ruleSet.key, ruleSet]));

  it("ship the startup eligibility and offer stacking rule sets once each", () => {
    expect(pack.ruleSets.map((ruleSet) => ruleSet.key)).toEqual([
      "startup_perk_eligibility",
      "offer_stacking",
    ]);
  });

  it("grant the startup offer to incubator members or young software companies", () => {
    const eligibility = byKey.get("startup_perk_eligibility");
    expect(eligibility?.outcomes).toEqual([
      { kind: "grant_offer", params: { offer: "offer:startup" } },
    ]);
    expect(JSON.stringify(eligibility?.condition)).toContain("organisation.incubator_member");
  });

  it("let only the annual offer stack", () => {
    expect(byKey.get("offer_stacking")?.condition).toEqual({
      field: "offer.key",
      operator: "one_of",
      value: ["offer:annual"],
    });
  });

  it("ship the incubator list as an empty editable settings record", () => {
    expect(read("settings/startup-incubators.yaml")).toEqual({
      kind: "settings",
      key: "settings:os:startup-incubators",
      rows: [{ id: "incubators", answer: "RV-52", value: [] }],
    });
  });
});
