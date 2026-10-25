/**
 * Stackra file contract:
 * Purpose: unit tests of `readSeedPack`: a valid pack read with its records sorted by profile and file, and every
 *          refusal collected in one error: a bad header, an unknown profile folder and kind, a missing key, row id and
 *          answer id, a repeated row id and a record seeded twice in one profile's layers.
 * Boundary: test only; writes a throwaway pack in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); config-model section 6; ADR 0190.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { SeedPackInvalidError } from "#node/errors/seed-pack-invalid.error";
import { readSeedPack } from "#node/functions/read-seed-pack.function";

let folder: string;

beforeEach(() => {
  folder = mkdtempSync(join(tmpdir(), "stackra-seed-"));
});

afterEach(() => {
  rmSync(folder, { recursive: true, force: true });
});

const write = (path: string, text: string) => {
  mkdirSync(dirname(join(folder, path)), { recursive: true });
  writeFileSync(join(folder, path), text);
};

const HEADER = "key: seed-pack:commerce\nproduct: commerce\nversion: 1.2.0\n";

describe("readSeedPack", () => {
  it("reads the header and every record in profile and file order", () => {
    write("seed-pack.yaml", HEADER);
    write(
      "profiles/minimal/returns.yaml",
      "kind: settings\nkey: settings:product-default:returns\nrows:\n  - id: refund-window-days\n    answer: COM-160\n    value: 14\n",
    );
    write(
      "profiles/demo/store.yaml",
      "kind: brand-kit\nkey: brand-kit:commerce\nrows:\n  - id: name\n    answer: OS-17\n    value: Demo\n",
    );
    const pack = readSeedPack(folder);
    expect(pack).toMatchObject({
      key: "seed-pack:commerce",
      product: "commerce",
      version: "1.2.0",
    });
    expect(pack.records.map((record) => `${record.profile} ${record.kind}:${record.key}`)).toEqual([
      "demo brand-kit:brand-kit:commerce",
      "minimal settings:settings:product-default:returns",
    ]);
    expect(pack.records[1]?.rows).toEqual([
      { id: "refund-window-days", answer: "COM-160", value: 14 },
    ]);
  });

  it("collects every issue into one error", () => {
    write("seed-pack.yaml", "key: seed-pack:other\nproduct: commerce\nversion: latest\n");
    write("profiles/staging/x.yaml", "kind: settings\nkey: a\nrows: []\n");
    write("profiles/minimal/a.yaml", "kind: price\nrows:\n  - answer: COM-1\n");
    write(
      "profiles/minimal/b.yaml",
      "kind: rule-set\nkey: rule-set:commerce:returns\nrows:\n  - id: r1\n    answer: COM-160\n  - id: r1\n    answer: nope\n",
    );
    write("profiles/demo/c.yaml", "kind: rule-set\nkey: rule-set:commerce:returns\nrows: []\n");
    let caught: unknown;
    try {
      readSeedPack(folder);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(SeedPackInvalidError);
    const codes = (caught as SeedPackInvalidError).issues.map(
      (issue) => `${issue.file} ${issue.code}`,
    );
    expect(codes).toEqual(
      expect.arrayContaining([
        "seed-pack.yaml seed_pack_header",
        "profiles/staging seed_profile_unknown",
        "profiles/minimal/a.yaml seed_kind_unknown",
        "profiles/minimal/a.yaml seed_record_key_missing",
        "profiles/minimal/a.yaml seed_row_id_missing",
        "profiles/minimal/b.yaml seed_row_duplicate",
        "profiles/minimal/b.yaml seed_row_answer_missing",
        "profiles/demo/c.yaml seed_record_duplicate",
      ]),
    );
  });
});
