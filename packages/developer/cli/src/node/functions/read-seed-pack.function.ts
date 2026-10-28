/**
 * Stackra file contract:
 * Purpose: `readSeedPack(folder)`, a product seed pack read and checked: `seed-pack.yaml` (`key: seed-pack:<product>`,
 *          `product`, a semantic `version`) and one YAML document per record under `profiles/<profile>/`, each with a
 *          `kind` from `SEED_RECORD_KINDS`, a `key` and `rows`, every row with an `id` and the `answer` id it encodes.
 *          A record key appears once in the layers a profile loads, and a row id once in its record.
 * Boundary: reads the pack folder only; collects every issue and throws them together. It never decides a value:
 *           the rows are the product's data.
 * Runtime: node
 * Governing contract: config-model section 6 (seed packs, answer ids on every row); ADR 0190 (decision 1: profiles);
 *                     ADR 0325 (decision 7).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "yaml";

import { SEED_PROFILES } from "#node/constants/seed-profiles.constant";
import { SEED_RECORD_KINDS } from "#node/constants/seed-record-kinds.constant";
import { SeedPackInvalidError } from "#node/errors/seed-pack-invalid.error";
import type { SeedIssue } from "#node/types/seed-issue.type";
import type { SeedPack } from "#node/types/seed-pack.type";
import type { SeedRecord } from "#node/types/seed-record.type";
import type { SeedRow } from "#node/types/seed-row.type";

/** An owner answer or default id: `COM-160`, `XP-6`, `C8`, `OS-17`. */
const ANSWER_ID = /^[A-Z][A-Z0-9]*(-[A-Z0-9]+)*$/;

/** A semantic version without range operators. */
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

/** Whether a parsed YAML value is a plain object. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The seed pack in `folder`.
 *
 * @param folder - the pack folder, holding `seed-pack.yaml` and `profiles/`.
 * @throws SeedPackInvalidError listing every issue.
 * @example
 * const pack = readSeedPack("/repo/seed-packs/commerce");
 * pack.key; // "seed-pack:commerce"
 */
export function readSeedPack(folder: string): SeedPack {
  const issues: SeedIssue[] = [];
  const issue = (file: string, code: string, message: string): void => {
    issues.push({ file, code, message });
  };

  const headerFile = join(folder, "seed-pack.yaml");
  const header: unknown = existsSync(headerFile)
    ? parse(readFileSync(headerFile, "utf8"))
    : undefined;
  const product =
    isObject(header) && typeof header["product"] === "string" ? header["product"] : "";
  const key = isObject(header) ? header["key"] : undefined;
  const version =
    isObject(header) && typeof header["version"] === "string" ? header["version"] : "";
  if (
    !isObject(header) ||
    product === "" ||
    key !== `seed-pack:${product}` ||
    !SEMVER.test(version)
  )
    issue(
      "seed-pack.yaml",
      "seed_pack_header",
      "write `product: <key>`, `key: seed-pack:<product>` and a semantic `version` such as 1.0.0",
    );

  const folders = new Set(Object.values(SEED_PROFILES).flat());
  const profilesRoot = join(folder, "profiles");
  const records: SeedRecord[] = [];
  const profiles = existsSync(profilesRoot)
    ? readdirSync(profilesRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
        .sort()
    : [];
  for (const profile of profiles) {
    if (!folders.has(profile)) {
      issue(
        `profiles/${profile}`,
        "seed_profile_unknown",
        `name the folder ${[...folders].join(", ")}`,
      );
      continue;
    }
    const files = readdirSync(join(profilesRoot, profile))
      .filter((name) => /\.ya?ml$/.test(name))
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort();
    for (const name of files) {
      const file = `profiles/${profile}/${name}`;
      const document: unknown = parse(readFileSync(join(folder, file), "utf8"));
      if (!isObject(document)) {
        issue(
          file,
          "seed_kind_unknown",
          "a seed document is a mapping with `kind`, `key` and `rows`",
        );
        continue;
      }
      const kind = document["kind"];
      if (typeof kind !== "string" || !SEED_RECORD_KINDS.includes(kind))
        issue(file, "seed_kind_unknown", `set \`kind\` to one of ${SEED_RECORD_KINDS.join(", ")}`);
      const recordKey = document["key"];
      if (typeof recordKey !== "string" || recordKey === "")
        issue(
          file,
          "seed_record_key_missing",
          "set `key` to the record key the product reads (`rule-set:commerce:returns`)",
        );
      const rows: SeedRow[] = [];
      const ids = new Set<string>();
      const written = Array.isArray(document["rows"]) ? document["rows"] : [];
      written.forEach((row: unknown, index) => {
        const at = `rows[${index}]`;
        if (!isObject(row) || typeof row["id"] !== "string" || row["id"] === "") {
          issue(file, "seed_row_id_missing", `${at} needs an \`id\` unique in the record`);
          return;
        }
        if (ids.has(row["id"]))
          issue(file, "seed_row_duplicate", `${at} repeats the id \`${row["id"]}\``);
        ids.add(row["id"]);
        if (typeof row["answer"] !== "string" || !ANSWER_ID.test(row["answer"]))
          issue(
            file,
            "seed_row_answer_missing",
            `${at} (\`${row["id"]}\`) needs the \`answer\` id it encodes, such as COM-160`,
          );
        rows.push(row as SeedRow);
      });
      if (typeof kind === "string" && typeof recordKey === "string")
        records.push({ kind, key: recordKey, profile, file, rows });
    }
  }

  // A record key appears once in the layers each profile loads.
  for (const layers of Object.values(SEED_PROFILES)) {
    const seen = new Map<string, string>();
    for (const record of layers.flatMap((layer) =>
      records.filter((candidate) => candidate.profile === layer),
    )) {
      const id = `${record.kind}:${record.key}`;
      const other = seen.get(id);
      if (other !== undefined && other !== record.file)
        issue(
          record.file,
          "seed_record_duplicate",
          `\`${id}\` is also seeded by ${other}; one profile loads both`,
        );
      else seen.set(id, record.file);
    }
  }

  // A duplicate in `minimal` shows in every profile's layers; report it once.
  const unique = [
    ...new Map(issues.map((item) => [`${item.file}|${item.code}|${item.message}`, item])).values(),
  ];
  if (unique.length > 0) throw new SeedPackInvalidError(folder, unique);
  return { key: `seed-pack:${product}`, product, version, records };
}
