/**
 * Stackra file contract:
 * Purpose: data tests of the payroll export profiles in `assets/data/payroll-export-profiles/`: each file is a settings
 *          seed record whose profile row passes `PAYROLL_EXPORT_PROFILE_SCHEMA`, keyed by its file name.
 * Boundary: test only; reads the shipped YAML from disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0431 (decision 4); config-model section 6.
 */
import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "@stackra/testing";
import { parse } from "yaml";

import { PAYROLL_EXPORT_PROFILE_SCHEMA } from "#core/constants/payroll-export-profile-schema.constant";

const folder = new URL("../../../assets/data/payroll-export-profiles/", import.meta.url);

describe("payroll export profiles", () => {
  const files = readdirSync(folder).filter((file) => file.endsWith(".yaml"));

  it("ships the launch profiles", () => {
    expect(files.sort()).toEqual(["datev-lodas.yaml", "generic-csv.yaml", "zenhr-xlsx.yaml"]);
  });

  it.each(files)("%s is a valid settings record", (file) => {
    const record = parse(readFileSync(new URL(file, folder), "utf8")) as {
      kind: string;
      key: string;
      rows: { id: string; value: unknown }[];
    };
    const name = file.replace(/\.yaml$/, "");
    expect(record.kind).toBe("settings");
    expect(record.key).toBe(`settings:os:payroll-export-profile:${name}`);
    const profile = PAYROLL_EXPORT_PROFILE_SCHEMA.parse(record.rows[0]?.value);
    expect(profile.key).toBe(name);
  });
});
