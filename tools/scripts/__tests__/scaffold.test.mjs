import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";

import { stripJsonc } from "../jsonc.mjs";
import { parseEntries, scaffold } from "../scaffold.mjs";
import { CATEGORY_NAMES, ENTRY_NAMES, MODULE_GROUPS, OPTIONAL_ENTRY_NAMES } from "../structure.mjs";
import { check, checkExports, checkService, checkYamlFlowMaps } from "../validate-repository.mjs";

const TOKENS = /\{\{\s*(NAME|PASCAL|TITLE|DESCRIPTION|PORT|CATEGORY|ENTRIES)\s*\}\}/;
const tmp = () => mkdtempSync(join(tmpdir(), "scaffold-"));
const render = (kind, name, extra = {}) =>
  scaffold({ kind, name, root: tmp(), format: false, description: 'Say "hi".', ...extra });
const json = (dest, f) => JSON.parse(stripJsonc(readFileSync(join(dest, f), "utf8")));

const cases = [
  ["service", "notes", {}],
  ["package", "billing-core", { category: "data" }],
  ["package", "cache", { category: "runtime", entries: OPTIONAL_ENTRY_NAMES, data: true }],
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
    if (kind === "service") assert.deepEqual(checkService({ dir: rel, pkg, paths: files }), []);
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
  const styles = read(web, "src/styles/app.css");
  assert.ok(styles.includes("heroui/web.css") && styles.includes("fonts/fonts.css"));
  refs(styles).forEach(brandFile);
  assert.ok(existsSync(join(web, "public/favicon.svg")));

  const mobile = render("app:mobile", "sample").dest;
  assert.equal(json(mobile, "package.json").dependencies["@stackra/brand"], "workspace:*");
  assert.ok(read(mobile, "src/styles/global.css").includes("heroui/native.css"));
  const app = read(mobile, "app.json");
  assert.equal(refs(app).length, 4); // icon, adaptive foreground, light and dark splash
  refs(app).forEach(brandFile);
  refs(read(mobile, "src/styles/global.css")).forEach(brandFile);

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

/** The v3 member root (ADR 0294 R12): no authored entry, barrel or generated contract in what the scaffold writes. */
const assertV3Root = (files) => {
  assert.ok(files.includes("stackra.config.ts"), "stackra.config.ts missing");
  assert.ok(!files.some((f) => /(^|\/)main\.tsx?$/.test(f)), "authored main.ts");
  assert.ok(!files.some((f) => /(^|\/)index\.tsx?$/.test(f)), "authored barrel");
  assert.ok(!files.includes("stackra.manifest.json"), "gen writes the manifest");
};

// @covers sta-347:FR-002 sta-347:P-001
test("a service is the v3 shape: config, root module, modules, runway v3, no main.ts or Encore file", () => {
  const { dest, rel, files } = render("service", "notes");
  const pkg = json(dest, "package.json");
  assert.equal(pkg.name, "@figentra/service-notes");
  assert.equal(pkg.stackra, undefined);
  assert.equal(pkg.scripts.start, undefined);
  assertV3Root(files);
  for (const f of [
    "runway.yaml",
    "src/notes.module.ts",
    "src/__tests__/notes.module.test.ts",
    "src/config/notes.config.ts",
    "src/config/__tests__/notes.config.test.ts",
    "src/contracts/README.md",
    "src/modules/README.md",
  ])
    assert.ok(files.includes(f), `${f} missing`);
  assert.deepEqual(checkService({ dir: rel, pkg, paths: files }), []);
  assert.ok(!files.some((f) => /encore/.test(f)));
  const ts = files.filter((f) => f.endsWith(".ts"));
  assert.ok(!ts.some((f) => readFileSync(join(dest, f), "utf8").includes("encore.dev")));

  const runway = parse(readFileSync(join(dest, "runway.yaml"), "utf8"));
  assert.equal(runway.version, 3);
  assert.deepEqual(Object.keys(runway), ["version", "requires", "secrets", "environments"]);
  assert.deepEqual(
    checkYamlFlowMaps("runway.yaml", readFileSync(join(dest, "runway.yaml"), "utf8")),
    [],
  );

  const groups = readFileSync(join(dest, "src/modules/README.md"), "utf8");
  for (const { group } of MODULE_GROUPS.filter((g) => g.group))
    assert.ok(groups.includes(`\`${group}/\``), `modules/README.md lacks ${group}/`);
});

// @covers sta-347:FR-001 sta-347:FR-003 sta-347:P-001 sta-347:P-002
test("a package is the v3 shape: entries by folder, exports naming files, no barrels", () => {
  const { dest, files } = render("package", "billing-core", { category: "data" });
  assertV3Root(files);
  for (const f of [
    "src/config/billing-core.config.ts",
    "src/config/__tests__/billing-core.config.test.ts",
    "src/contracts/README.md",
    "src/core/constants/package-name.constant.ts",
    "src/core/constants/__tests__/package-name.constant.test.ts",
    "src/node/billing-core.module.ts",
    "src/node/__tests__/billing-core.module.test.ts",
    "src/testing/README.md",
  ])
    assert.ok(files.includes(f), `${f} missing`);
  for (const absent of ["src/react", "src/native", "src/node/database", "config/", "resources/"])
    assert.ok(!files.some((f) => f.startsWith(absent)), `${absent} written without asking`);

  const pkg = json(dest, "package.json");
  assert.deepEqual(pkg.exports, {
    ".": {
      "@stackra/source": "./src/core/constants/package-name.constant.ts",
      types: "./dist/index.d.mts",
      default: "./dist/index.mjs",
    },
    "./node": {
      "@stackra/source": "./src/node/billing-core.module.ts",
      types: "./dist/node.d.mts",
      default: "./dist/node.mjs",
    },
  });
  for (const target of Object.values(pkg.exports))
    assert.ok(files.includes(target["@stackra/source"].slice(2)), "an export names a missing file");
  assert.deepEqual(Object.keys(pkg.imports), [
    "#contracts/*",
    "#config/*",
    "#core/*",
    "#node/*",
    "#testing/*",
    "#stackra/*",
  ]);
  assert.equal(pkg.sideEffects, false);
  assert.ok(pkg.files.includes("dist") && pkg.files.includes("stackra.manifest.json"));
  assert.match(
    readFileSync(join(dest, "tsdown.config.ts"), "utf8"),
    /\{ "index": "src\/core\/constants\/package-name\.constant\.ts", "node": "src\/node\/billing-core\.module\.ts" \}/,
  );
  assert.equal(json(dest, "tsconfig.json").extends, "@stackra/typescript-config/decorators");
});

// @covers sta-347:FR-003 sta-347:P-002
test("--entries adds react and native folders and aliases; --data adds the module's database folders", () => {
  const { dest, files } = render("package", "cache", {
    category: "runtime",
    entries: "native,contracts,react",
    data: true,
  });
  for (const f of [
    "src/react/README.md",
    "src/native/README.md",
    "src/node/database/migrations/README.md",
    "src/node/database/factories/README.md",
    "src/node/database/seeders/README.md",
  ])
    assert.ok(files.includes(f), `${f} missing`);
  const pkg = json(dest, "package.json");
  assert.deepEqual(Object.keys(pkg.exports), [".", "./node"]);
  assert.ok("#react/*" in pkg.imports && "#native/*" in pkg.imports);
});

// @covers sta-347:FR-004 sta-347:P-003
test("apps come out in the v3 shape: config, root module, route folders, config classes; docs is exempt", () => {
  const appFiles = {
    "app:console": [
      "src/admin.module.ts",
      "src/__tests__/admin.module.test.ts",
      "src/routes/home/home.route.ts",
      "src/routes/home/home.tsx",
      "src/routes/home/__tests__/home.test.tsx",
      "src/components/panel-shell/index.ts",
      "src/styles/app.css",
    ],
    "app:mobile": [
      "src/sample.module.ts",
      "src/config/chrome.config.ts",
      "src/routes/home/home.route.ts",
      "src/routes/item/item.tsx",
      "src/routes/settings/settings.route.ts",
      "src/components/screen/index.ts",
      "src/styles/global.css",
    ],
    "app:desktop": ["src/studio.module.ts", "src/__tests__/studio.module.test.ts"],
  };
  const names = { "app:console": "admin", "app:mobile": "sample", "app:desktop": "studio" };
  for (const [kind, expected] of Object.entries(appFiles)) {
    const { dest, files } = render(kind, names[kind]);
    for (const f of ["stackra.config.ts", ...expected])
      assert.ok(files.includes(f), `${kind}: ${f}`);
    for (const retired of [
      "src/screens/",
      "src/components/ui/",
      "src/routes.tsx",
      "src/styles.css",
    ])
      assert.ok(!files.some((f) => f.startsWith(retired)), `${kind}: ${retired}`);
    // Beside the root module, src/ holds only the stand-ins gen replaces; the entry is marked (ADR 0294 d14).
    const STAND_INS = ["src/main.ts", "src/main.tsx", "src/app.tsx", "src/window-options.ts"];
    for (const f of files.filter((f) => /^src\/[^/]+(?<!\.d)\.tsx?$/.test(f)))
      assert.ok(f === `src/${names[kind]}.module.ts` || STAND_INS.includes(f), `${kind}: ${f}`);
    const entry = files.find((f) => /^src\/main\.tsx?$/.test(f));
    assert.match(
      readFileSync(join(dest, entry), "utf8"),
      /shortcut: authored until stackra gen writes/,
    );
  }
  const docs = render("app:docs", "handbook").files;
  assert.ok(!docs.includes("stackra.config.ts") && !docs.some((f) => f.endsWith(".module.ts")));
});

test("parseEntries", () => {
  assert.deepEqual(parseEntries("none"), []);
  assert.deepEqual(parseEntries(""), []);
  assert.deepEqual(parseEntries("native, contracts, react"), ["react", "native"]);
  assert.deepEqual(parseEntries(ENTRY_NAMES), OPTIONAL_ENTRY_NAMES);
  assert.throws(() => parseEntries("ui"), /unknown entry "ui"/);
  assert.throws(() => parseEntries("devtools"), /unknown entry "devtools"/);
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
  bad({ kind: "service", name: "ok", data: true }, /--data applies to package only/);
  bad({ kind: "nope", name: "ok" }, /unknown kind/);
  bad({ kind: "app-next", name: "ok" }, /unknown kind/);
  bad({ kind: "app:mobile", name: "my-app" }, /hyphens/);
  bad({ kind: "service", name: "ok", root: join(root, "missing") }, /not a directory/);
  scaffold({ kind: "service", name: "dup", root, format: false });
  bad({ kind: "service", name: "dup" }, /already exists/);
  // The 12 categories on disk (settlement Q3.2); tooling is a separate tier, not a package category.
  assert.equal(CATEGORY_NAMES.length, 12);
});
