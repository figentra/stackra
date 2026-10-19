import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { CATEGORIES, scaffold } from "./scaffold.mjs";

const TOKENS = /\{\{(NAME|PASCAL|TITLE|DESCRIPTION|PORT|CATEGORY)\}\}/;
const tmp = () => mkdtempSync(join(tmpdir(), "scaffold-"));
const render = (kind, name, extra = {}) =>
  scaffold({ kind, name, root: tmp(), format: false, description: 'Say "hi".', ...extra });

const cases = [
  ["domain", "billing-core", { category: "data" }],
  ["platform", "registry", { category: "runtime" }],
  ["lib", "sample-lib", { category: "foundation" }],
  ["tooling", "sample", {}],
  ["app-vite", "admin", {}],
  ["app-expo", "sample", {}],
  ["app-docs", "handbook", {}],
  ["app-next", "site", {}],
  ["service", "sample", {}],
];

for (const [kind, name, extra] of cases)
  test(`renders ${kind}`, () => {
    const { dest, files } = render(kind, name, extra);
    assert.ok(files.length > 3);
    for (const f of files) {
      assert.ok(!TOKENS.test(f), `token left in path ${f}`);
      const text = readFileSync(join(dest, f), "utf8");
      assert.ok(!TOKENS.test(text), `token left in ${f}`);
      if (/\.jsonc?$/.test(f) && f.endsWith(".json")) JSON.parse(text);
    }
    assert.equal(existsSync(join(dest, "LICENSE")), kind !== "service");
  });

test("description is JSON-escaped and the LICENSE is copied byte-for-byte", () => {
  const { dest } = render("lib", "esc", { category: "data" });
  assert.equal(
    JSON.parse(readFileSync(join(dest, "package.json"), "utf8")).description,
    'Say "hi".',
  );
  assert.deepEqual(
    readFileSync(join(dest, "LICENSE")),
    readFileSync(new URL("../../LICENSE", import.meta.url)),
  );
});

test("next free port skips taken ones", () => {
  const root = tmp();
  const a = scaffold({ kind: "app-vite", name: "one", root, format: false });
  assert.match(readFileSync(join(a.dest, "package.json"), "utf8"), /--port 3710/);
  const b = scaffold({ kind: "app-next", name: "two", root, format: false });
  assert.match(readFileSync(join(b.dest, "package.json"), "utf8"), /--port 3711/);
});

test("dry run writes nothing", () => {
  const root = tmp();
  const { dest, files } = scaffold({
    kind: "lib",
    name: "dry",
    category: "data",
    root,
    dryRun: true,
  });
  assert.ok(files.includes("LICENSE"));
  assert.ok(!existsSync(dest));
});

test("rejections", () => {
  const root = tmp();
  const bad = (o, re) => assert.throws(() => scaffold({ root, format: false, ...o }), re);
  bad({ kind: "lib", name: "Bad_Name", category: "data" }, /invalid name/);
  bad({ kind: "lib", name: "ok" }, /--category is required/);
  bad({ kind: "lib", name: "ok", category: "nope" }, /--category/);
  bad({ kind: "nope", name: "ok" }, /unknown kind/);
  bad({ kind: "app-expo", name: "my-app" }, /hyphens/);
  scaffold({ kind: "service", name: "dup", root, format: false });
  bad({ kind: "service", name: "dup" }, /already exists/);
  assert.equal(CATEGORIES.length, 10);
});
