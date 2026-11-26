/**
 * Stackra file contract:
 * Purpose: unit tests of `checkRunwayUnreadFields`: a listed field whose description says "Not read yet (<reader>)"
 *          and that no reader source accesses passes; a listed field without the note, a noted field that is not
 *          listed, a missing schema and a reader source that accesses a listed field each fail. A `$ref`'d shared
 *          definition is read at its use site, and comments, tests and schema constants are not readers.
 * Boundary: test only; pure function, no disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2001 (Runway plan PR 6c).
 */
import assert from "node:assert/strict";

import { test } from "@stackra/testing";

import { RUNWAY_UNREAD_FIELDS } from "#node/constants/runway-unread-fields.constant";
import { checkRunwayUnreadFields } from "#node/functions/check-runway-unread-fields.function";
import type { RunwayUnreadField } from "#node/types/runway-unread-field.type";

const READER = "Runway plan PR 16, STA-2001";

const FIELDS: readonly RunwayUnreadField[] = [
  { kind: "root", path: "environments.*.ttl", reader: READER, access: /\benv\??\.ttl\b/ },
];

/** A root schema whose `environments.*` is a `$ref`, with the ttl note as given. */
function rootSchema(ttl: string, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    properties: {
      environments: { additionalProperties: { $ref: "#/$defs/environment" } },
      ...extra,
    },
    $defs: {
      environment: {
        properties: { ttl: { type: "string", description: ttl }, zone: { type: "string" } },
      },
    },
  });
}

/** The reader that the files map gives. */
const reader =
  (files: Record<string, string>) =>
  (path: string): string | undefined =>
    files[path];

test("checkRunwayUnreadFields: a noted, listed field that nothing reads passes", () => {
  const files = {
    "tools/schemas/runway-root.schema.json": rootSchema(
      `Not read yet (${READER}). How long a preview lives.`,
    ),
    "packages/developer/runway/src/core/functions/plan.function.ts": "const zone = env.zone;\n",
  };
  assert.deepEqual(checkRunwayUnreadFields(reader(files), Object.keys(files), FIELDS), []);
});

test("checkRunwayUnreadFields: the list and the notes must agree", () => {
  const unnoted = {
    "tools/schemas/runway-root.schema.json": rootSchema("How long a preview lives."),
  };
  assert.match(
    checkRunwayUnreadFields(reader(unnoted), Object.keys(unnoted), FIELDS).join("\n"),
    /`environments\.\*\.ttl` is listed as not read yet, but its description lacks/,
  );

  const unlisted = {
    "tools/schemas/runway-root.schema.json": rootSchema(
      `Not read yet (${READER}). How long a preview lives.`,
      {
        region: { type: "string", description: "Not read yet (STA-1). The region." },
      },
    ),
  };
  assert.deepEqual(checkRunwayUnreadFields(reader(unlisted), Object.keys(unlisted), FIELDS), [
    'tools/schemas/runway-root.schema.json: `region` says "Not read yet" but is not in RUNWAY_UNREAD_FIELDS: list it, or drop the note if it is read',
  ]);

  assert.match(
    checkRunwayUnreadFields(reader({}), [], FIELDS).join("\n"),
    /runway-root\.schema\.json: missing, but 1 of its fields are listed/,
  );
});

test("RUNWAY_UNREAD_FIELDS: providers.aws.ecr is a runway read, never Pulumi's aws.ecr resource namespace", () => {
  const ecr = RUNWAY_UNREAD_FIELDS.find((field) => field.path === "providers.aws.ecr");
  assert.ok(ecr !== undefined);
  // infra-aws's Docker Hub pull-through cache (docker-hub-cache.function.ts) builds Pulumi resources
  assert.equal(ecr.access.test("const rule = new aws.ecr.PullThroughCacheRule(name, {"), false);
  assert.equal(
    ecr.access.test("): { rule: aws.ecr.PullThroughCacheRule; secret: Secret } {"),
    false,
  );
  assert.equal(ecr.access.test("const registry = providers.aws?.ecr;"), true);
  assert.equal(ecr.access.test("const account = aws.ecr.account;"), true);
  assert.equal(ecr.access.test('const registry = aws["ecr"];'), true);
});

test("checkRunwayUnreadFields: a reader source that accesses a listed field fails at its line", () => {
  const files = {
    "tools/schemas/runway-root.schema.json": rootSchema(
      `Not read yet (${READER}). How long a preview lives.`,
    ),
    "packages/infrastructure/infra-aws/src/node/functions/preview.function.ts":
      "// env.ttl is not read here\nconst zone = env.zone;\nconst ttl = env?.ttl;\n",
    "packages/developer/runway/src/core/functions/__tests__/preview.function.test.ts":
      "expect(env.ttl);\n",
    "packages/developer/runway/src/core/constants/environment-schema.constant.ts": "env.ttl\n",
    "packages/data/cache/src/core/functions/expire.function.ts": "const ttl = env.ttl;\n",
  };
  assert.deepEqual(checkRunwayUnreadFields(reader(files), Object.keys(files), FIELDS), [
    'packages/infrastructure/infra-aws/src/node/functions/preview.function.ts:3: reads root `environments.*.ttl`, listed as not read yet: remove the read field from RUNWAY_UNREAD_FIELDS and drop "Not read yet" from its schema description',
  ]);
});
