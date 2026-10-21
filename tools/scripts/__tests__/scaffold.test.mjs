import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { stripJsonc } from "../jsonc.mjs";
import { parseEntries, scaffold } from "../scaffold.mjs";
import { CATEGORY_NAMES, ENTRY_NAMES } from "../structure.mjs";
import { check, checkExports, checkService } from "../validate-repository.mjs";

const TOKENS = /\{\{\s*(NAME|PASCAL|TITLE|DESCRIPTION|PORT|CATEGORY|ENTRIES)\s*\}\}/;
const tmp = () => mkdtempSync(join(tmpdir(), "scaffold-"));
const render = (kind, name, extra = {}) =>
  scaffold({ kind, name, root: tmp(), format: false, description: 'Say "hi".', ...extra });
const json = (dest, f) => JSON.parse(stripJsonc(readFileSync(join(dest, f), "utf8")));

const cases = [
  ["service", "notes", {}],
  ["package", "billing-core", { category: "data" }],
  ["package", "cache", { category: "runtime", entries: ENTRY_NAMES }],
  ["tooling", "sample", {}],
  ["app:console", "admin", {}],
  ["app:mobile", "sample", {}],
  ["app:desktop", "studio", {}],
  ["app:docs", "handbook", {}],
];

for (const [kind, name, extra] of cases)
  test(`renders ${kind} ${name} as a conforming member`, () => {
    const { dest, rel, files } = render(kind, name, extra);
    assert.ok(files.length > 3);
    for (const f of files) {
      assert.ok(!TOKENS.test(f), `token left in path ${f}`);
      const text = readFileSync(join(dest, f), "utf8");
      assert.ok(!TOKENS.test(text), `token left in ${f}`);
      assert.ok(!/\benum\s+\w+\s*\{/.test(text), `enum in ${f}`);
      // tsc and the .jsonc tools take comments; every other .json stays strict.
      if (/\.jsonc$|tsconfig\.json$/.test(f)) JSON.parse(stripJsonc(text));
      else if (f.endsWith(".json")) JSON.parse(text);
    }
    for (const f of ["README.md", "AGENTS.md", "CHANGELOG.md", "package.json"])
      assert.ok(files.includes(f), `${f} missing`);
    assert.equal(files.includes("LICENSE"), kind === "package" || kind === "tooling");
    const pkg = json(dest, "package.json");
    const findings = check({
      dir: rel,
      pkg,
      turbo: json(dest, "turbo.jsonc"),
      tsconfig: files.includes("tsconfig.json") ? json(dest, "tsconfig.json") : undefined,
    });
    assert.deepEqual(findings, []);
    if (kind === "service") assert.deepEqual(checkService({ pkg, paths: files }), []);
    if (kind === "package") assert.deepEqual(checkExports(pkg.exports), []);
  });

// @covers sta-173:FR-003 sta-173:P-003
test("app templates take their brand from @stackra/brand, and every brand path exists", () => {
  const BRAND = fileURLToPath(new URL("../../../packages/experience/brand/", import.meta.url));
  const brandFile = (ref) => {
    const rel = ref.match(/@stackra\/brand\/(assets\/[^"'\s)]+)/)?.[1];
    assert.ok(rel, `not a brand path: ${ref}`);
    assert.ok(existsSync(join(BRAND, rel)), `brand file missing: ${rel}`);
  };
  const refs = (text) => [...text.matchAll(/@stackra\/brand\/assets\/[^"'\s)]+/g)].map((m) => m[0]);
  const read = (dest, f) => readFileSync(join(dest, f), "utf8");

  const web = render("app:console", "admin").dest;
  assert.equal(json(web, "package.json").dependencies["@stackra/brand"], "workspace:*");
  const styles = read(web, "src/styles.css");
  assert.ok(styles.includes("heroui/web.css") && styles.includes("fonts/fonts.css"));
  refs(styles).forEach(brandFile);
  assert.ok(existsSync(join(web, "public/favicon.svg")));

  const mobile = render("app:mobile", "sample").dest;
  assert.equal(json(mobile, "package.json").dependencies["@stackra/brand"], "workspace:*");
  assert.ok(read(mobile, "src/global.css").includes("heroui/native.css"));
  const app = read(mobile, "app.json");
  assert.equal(refs(app).length, 4); // icon, adaptive foreground, light and dark splash
  refs(app).forEach(brandFile);
  refs(read(mobile, "src/global.css")).forEach(brandFile);

  const desktop = render("app:desktop", "studio").dest;
  assert.equal(json(desktop, "package.json").devDependencies["@stackra/brand"], "workspace:*");
  const builder = read(desktop, "electron-builder.yml");
  assert.equal(refs(builder).length, 3); // mac, win, linux
  refs(builder).forEach(brandFile);

  const docs = render("app:docs", "handbook").dest;
  assert.equal(json(docs, "src/docs.json").colors.primary, "#0B0D0F");
  assert.equal(
    read(docs, "src/assets/logo/light.svg"),
    readFileSync(join(BRAND, "assets/public/logos/stackra-wordmark-light.svg"), "utf8"),
  );
});

test("a service is a plain-TypeScript skeleton with no Encore file", () => {
  const { dest, files } = render("service", "notes");
  assert.equal(json(dest, "package.json").name, "@figentra/service-notes");
  for (const f of [
    "src/main.ts",
    "src/notes.module.ts",
    "src/modules/README.md",
    "src/contracts/index.ts",
    "src/__tests__/notes.module.test.ts",
    "config/notes.config.ts",
  ])
    assert.ok(files.includes(f), `${f} missing`);
  assert.ok(!files.some((f) => /encore/.test(f)));
  const ts = files.filter((f) => f.endsWith(".ts"));
  assert.ok(!ts.some((f) => readFileSync(join(dest, f), "utf8").includes("encore.dev")));
});

test("package entries become exports and tsdown entries, in order", () => {
  const { dest, files } = render("package", "cache", {
    category: "runtime",
    entries: "testing,contracts",
  });
  assert.deepEqual(Object.keys(json(dest, "package.json").exports), [
    ".",
    "./contracts",
    "./testing",
    "./resources/*",
  ]);
  assert.match(
    readFileSync(join(dest, "tsdown.config.ts"), "utf8"),
    /\{ "index": "src\/core\/index.ts", "contracts": "src\/contracts\/index.ts", "testing": "src\/testing\/index.ts" \}/,
  );
  assert.ok(files.includes("src/testing/index.ts") && !files.includes("src/react/index.ts"));
  assert.ok(files.includes("config/cache.config.ts") && files.includes("resources/README.md"));
});

test("parseEntries", () => {
  assert.deepEqual(parseEntries("none"), []);
  assert.deepEqual(parseEntries(""), []);
  assert.deepEqual(parseEntries("react, contracts"), ["contracts", "react"]);
  assert.throws(() => parseEntries("ui"), /unknown entry "ui"/);
});

test("description is JSON-escaped and the target repo's LICENSE is copied", () => {
  const { dest } = render("package", "esc", { category: "data" });
  assert.equal(json(dest, "package.json").description, 'Say "hi".');
  assert.deepEqual(
    readFileSync(join(dest, "LICENSE")),
    readFileSync(new URL("../../../LICENSE", import.meta.url)),
  );
  const root = tmp();
  writeFileSync(join(root, "LICENSE"), "Proprietary.\n");
  const other = scaffold({
    kind: "package",
    name: "billing",
    category: "data",
    root,
    format: false,
  });
  assert.equal(readFileSync(join(other.dest, "LICENSE"), "utf8"), "Proprietary.\n");
  const svc = scaffold({ kind: "service", name: "billing", root, format: false });
  assert.ok(!existsSync(join(svc.dest, "LICENSE")));
});

test("next free port skips taken ones", () => {
  const root = tmp();
  const a = scaffold({ kind: "app:console", name: "one", root, format: false });
  assert.match(readFileSync(join(a.dest, "package.json"), "utf8"), /--port 3710/);
  const b = scaffold({ kind: "app:console", name: "two", root, format: false });
  assert.match(readFileSync(join(b.dest, "package.json"), "utf8"), /--port 3711/);
});

test("dry run writes nothing", () => {
  const root = tmp();
  const { dest, files } = scaffold({ kind: "service", name: "dry", root, dryRun: true });
  assert.ok(files.includes("src/dry.module.ts"));
  assert.ok(!existsSync(dest));
});

test("rejections", () => {
  const root = tmp();
  const bad = (o, re) => assert.throws(() => scaffold({ root, format: false, ...o }), re);
  bad({ kind: "package", name: "Bad_Name", category: "data" }, /invalid name/);
  bad({ kind: "package", name: "ok" }, /--category is required/);
  bad({ kind: "package", name: "ok", category: "nope" }, /--category/);
  bad({ kind: "package", name: "ok", category: "data", entries: "web" }, /unknown entry/);
  bad({ kind: "nope", name: "ok" }, /unknown kind/);
  bad({ kind: "app-next", name: "ok" }, /unknown kind/);
  bad({ kind: "app:mobile", name: "my-app" }, /hyphens/);
  bad({ kind: "service", name: "ok", root: join(root, "missing") }, /not a directory/);
  scaffold({ kind: "service", name: "dup", root, format: false });
  bad({ kind: "service", name: "dup" }, /already exists/);
  // The 12 categories on disk (settlement Q3.2); tooling is a separate tier, not a package category.
  assert.equal(CATEGORY_NAMES.length, 12);
});
