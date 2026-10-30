/**
 * Stackra file contract:
 * Purpose: unit tests of the repository structure checks moved from tools/scripts/validate-repository.mjs: member
 *          manifests, required files, exports, services, test placement, JSON vs JSONC, the runway schemas and files,
 *          YAML flow maps, imports and the Expo form factor. The cases are the script's own, unchanged.
 * Boundary: test only; pure functions, no disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); the ADRs each check names.
 */
import assert from "node:assert/strict";

import { test } from "@stackra/testing";

import { checkExports } from "#node/functions/check-exports.function";
import { checkImports } from "#node/functions/check-imports.function";
import { checkIosFormFactor } from "#node/functions/check-ios-form-factor.function";
import { checkJsonConfigs } from "#node/functions/check-json-configs.function";
import { checkMemberFiles } from "#node/functions/check-member-files.function";
import { checkMember } from "#node/functions/check-member.function";
import { checkRunwayFiles } from "#node/functions/check-runway-files.function";
import { checkRunwaySchemas } from "#node/functions/check-runway-schemas.function";
import { checkService } from "#node/functions/check-service.function";
import { checkTestPlacement } from "#node/functions/check-test-placement.function";
import { checkWindowSizing } from "#node/functions/check-window-sizing.function";
import { checkYamlFlowMaps } from "#node/functions/check-yaml-flow-maps.function";
import { expectedName } from "#node/functions/expected-name.function";
import { isExpoAppConfig } from "#node/functions/is-expo-app-config.function";
import { isMemberSource } from "#node/functions/is-member-source.function";
import { isRepoOwnedYaml } from "#node/functions/is-repo-owned-yaml.function";
import { isRunwayFile } from "#node/functions/is-runway-file.function";
import { isV2Service } from "#node/functions/is-v2-service.function";
import { runwayKindOf } from "#node/functions/runway-kind-of.function";
import { tierFor } from "#node/functions/tier-for.function";
import type { PackageManifest } from "#node/types/package-manifest.type";

const ok = {
  dir: "packages/foundation/container",
  pkg: { name: "@stackra/container", dependencies: { a: "catalog:", b: "workspace:*" } },
  turbo: { extends: ["//"], tags: ["tier:lib"] },
  tsconfig: { extends: "@stackra/typescript-config/library" },
};

test("a well-formed member has no findings", () => assert.deepEqual(checkMember(ok), []));

test("a literal version is a finding; a peer range is not", () => {
  const f = checkMember({
    ...ok,
    pkg: { ...ok.pkg, devDependencies: { x: "^1.0.0" }, peerDependencies: { react: ">=19" } },
  });
  assert.equal(f.length, 1);
  assert.match(f[0] ?? "", /devDependencies\.x/);
});

test("forbidden dependency, wrong name, wrong tier, foreign tsconfig", () => {
  const f = checkMember({
    dir: "apps/console",
    pkg: { name: "console", dependencies: { prisma: "catalog:" } },
    turbo: { extends: ["//"], tags: ["tier:lib"] },
    tsconfig: { extends: "../../tsconfig.base.json" },
  });
  assert.equal(f.length, 4);
});

test("dependencies replaced by Accepted ADRs are forbidden", () => {
  for (const dep of [
    "expo-router",
    "zustand",
    "@tanstack/store",
    "i18next",
    "react-i18next",
    "class-validator",
    "class-transformer",
    "meilisearch",
    "@opensearch-project/opensearch",
  ]) {
    const f = checkMember({ ...ok, pkg: { ...ok.pkg, devDependencies: { [dep]: "catalog:" } } });
    assert.deepEqual(f, [`devDependencies.${dep} is a forbidden dependency`], dep);
  }
});

test("no member is in the @stackra-pro scope: the Pro wrapper moved to figentra/stackra-pro (ADR 0461)", () => {
  assert.equal(expectedName("packages/design-system/ui-pro"), "@stackra/ui-pro");
  assert.equal(expectedName("packages/design-system/ui"), "@stackra/ui");
});

/** The Pro findings (HeroUI Pro and the @stackra-pro scope) of a member at `dir`. */
const pro = (dir: string, pkg: PackageManifest): string[] =>
  checkMember({ ...ok, dir, pkg }).filter((m) => /HeroUI Pro|Pro package/.test(m));

/** The Uniwind Pro findings of a member at `dir`. */
const uniwind = (dir: string): string[] =>
  checkMember({
    ...ok,
    dir,
    pkg: { name: "x", dependencies: { uniwind: "catalog:uniwind-pro" } },
  }).filter((m) => m.includes("Uniwind Pro"));

test("no member depends on @stackra-pro/* or HeroUI Pro, apps included (ADR 0461, ADR 0469)", () => {
  for (const dir of ["packages/design-system/ui", "apps/playground", "apps/mobile"])
    for (const field of ["dependencies", "devDependencies", "peerDependencies"] as const)
      assert.deepEqual(
        pro(dir, { name: "x", [field]: { "@stackra-pro/ui": "workspace:*" } } as PackageManifest),
        [
          `${field}.@stackra-pro/ui is a Pro package: it lives in figentra/stackra-pro, and no member here may depend on it (ADR 0461)`,
        ],
        `${dir} ${field}`,
      );
  assert.deepEqual(
    pro("apps/console", {
      name: "@figentra/console",
      dependencies: { "@stackra-pro/builder": "catalog:" },
    }),
    [
      "dependencies.@stackra-pro/builder is a Pro package: it lives in figentra/stackra-pro, and no member here may depend on it (ADR 0461)",
    ],
  );
  for (const dep of ["@heroui-pro/react", "heroui-native-pro"])
    for (const [dir, name] of [
      ["packages/design-system/ui", "@stackra/ui"],
      ["apps/playground", "@figentra/playground"],
    ] as const)
      assert.deepEqual(
        pro(dir, { name, devDependencies: { [dep]: "catalog:" } }),
        [`devDependencies.${dep} is HeroUI Pro: no member here may depend on it (ADR 0469)`],
        `${dir} ${dep}`,
      );
  // A free name that merely contains "pro" is not a Pro package.
  assert.deepEqual(
    pro("packages/data/x", {
      name: "@stackra/x",
      dependencies: { "@stackra/profile": "workspace:*" },
    }),
    [],
  );
  assert.deepEqual(uniwind("packages/design-system/ui"), [
    "dependencies.uniwind is Uniwind Pro: only apps may use catalog:uniwind-pro (ADR 0310)",
  ]);
  assert.deepEqual(uniwind("apps/mobile"), []);
});

const named = (dir: string, name: string): string[] =>
  checkMember({ ...ok, dir, pkg: { name } }).filter((m) => /package name/.test(m));

test("names follow placement: packages @stackra, apps @figentra, services @figentra/service-, workers @figentra/worker-", () => {
  assert.equal(named("workers/static", "@figentra/worker-static").length, 0);
  assert.equal(named("workers/static", "@figentra/static").length, 1);
  assert.equal(named("apps/console", "@figentra/console").length, 0);
  assert.equal(named("services/health", "@figentra/service-health").length, 0);
  assert.equal(named("packages/tooling/vitest", "@stackra/vitest-config").length, 0);
  assert.equal(named("packages/data/search", "@stackra/search").length, 0);
  assert.equal(named("packages/design-system/tokens", "@stackra/tokens").length, 0);
  assert.equal(named("services/health", "@stackra/service-health").length, 1);
  assert.equal(named("apps/docs", "@stackra/docs").length, 1);
  assert.equal(named("packages/data/search", "@figentra/search").length, 1);
});

test("tiers follow the directory", () => {
  assert.equal(tierFor("apps/docs"), "tier:app");
  assert.equal(tierFor("workers/static"), "tier:app");
  assert.equal(tierFor("packages/tooling/vitest"), "tier:config");
  assert.equal(tierFor("packages/data/search"), "tier:lib");
  assert.equal(tierFor("packages/design-system/ui"), "tier:lib");
  assert.equal(tierFor(""), null);
});

const filesOk = {
  dir: "packages/data/search",
  pkg: {
    description: "x",
    license: "MIT",
    sideEffects: false,
    repository: {
      type: "git",
      url: "git+https://github.com/figentra/stackra.git",
      directory: "packages/data/search",
    },
    publishConfig: { access: "public", provenance: true },
    exports: {
      ".": {
        "@stackra/source": "./src/index.ts",
        types: "./dist/index.d.mts",
        default: "./dist/index.mjs",
      },
      "./c": "./c.json",
    },
  },
  files: ["README.md", "AGENTS.md", "CHANGELOG.md", "LICENSE"],
  agents: "# A\n\n## PII\n",
  licenseText: "L",
  rootLicense: "L",
};

test("a complete member has no file findings", () =>
  assert.deepEqual(checkMemberFiles(filesOk), []));

test("every library needs publishConfig access public and provenance true (ADR 0453)", () => {
  const missing: PackageManifest["publishConfig"][] = [
    undefined,
    { access: "public" },
    { provenance: true },
    { access: "restricted", provenance: true },
  ];
  for (const publishConfig of missing)
    assert.equal(
      checkMemberFiles({ ...filesOk, pkg: { ...filesOk.pkg, publishConfig } }).length,
      1,
    );
});

test("a member's publishConfig names no registry: the release workflow's input sets it (ADR 0453)", () => {
  const pinned = {
    ...filesOk.pkg,
    publishConfig: {
      access: "public",
      provenance: true,
      registry: "https://npm.stackra.figentra.com/",
    },
  };
  assert.deepEqual(checkMemberFiles({ ...filesOk, pkg: pinned }), [
    'package.json publishConfig must be { "access": "public", "provenance": true } with no registry (ADR 0453)',
  ]);
});

test("missing files, PII, license drift, manifest hygiene", () => {
  const f = checkMemberFiles({
    ...filesOk,
    files: ["README.md", "AGENTS.md", "LICENSE"],
    agents: "# A",
    licenseText: "other",
    pkg: { description: " ", license: "UNLICENSED", exports: { ".": "./dist/index.js" } },
  });
  assert.equal(f.length, 9); // the replaced manifest also lacks repository and publishConfig
});

test("apps and services are UNLICENSED with no LICENSE file (ADR 0195)", () => {
  const app = { dir: "apps/console", pkg: { description: "x", license: "UNLICENSED" } };
  assert.deepEqual(
    checkMemberFiles({ ...filesOk, ...app, files: ["README.md", "AGENTS.md", "CHANGELOG.md"] }),
    [],
  );
  assert.equal(checkMemberFiles({ ...filesOk, ...app }).length, 1);
  assert.equal(
    checkMemberFiles({
      ...filesOk,
      dir: "services/health",
      files: ["README.md", "AGENTS.md", "CHANGELOG.md"],
    }).length,
    1,
  );
});

test("sideEffects and exports rules apply to tier:lib only", () => {
  const pkg = { description: "x", license: "MIT", exports: "./dist/a.js" };
  assert.deepEqual(
    checkMemberFiles({
      ...filesOk,
      dir: "apps/console",
      pkg: { ...pkg, license: "UNLICENSED" },
      files: ["README.md", "AGENTS.md", "CHANGELOG.md"],
    }),
    [],
  );
  assert.deepEqual(checkMemberFiles({ ...filesOk, dir: "packages/tooling/vitest", pkg }), []);
});

/** The package-name findings among `findings`. */
const packageNameFindings = (findings: string[]): string[] =>
  findings.filter((finding) => finding.startsWith("package name"));

test("a product repository keeps its own names, licence and publish settings (ADR 0349, ADR 0453)", () => {
  const pkg = {
    name: "@figentra/acme-example",
    description: "x",
    license: "UNLICENSED",
    sideEffects: ["./src/landing.ts"],
  };
  assert.deepEqual(
    checkMemberFiles({ ...filesOk, dir: "packages/application/example", pkg, stackra: false }),
    [],
  );
  const member = { dir: "packages/application/example", pkg: { name: pkg.name } };
  assert.equal(packageNameFindings(checkMember(member)).length, 1);
  assert.deepEqual(packageNameFindings(checkMember({ ...member, stackra: false })), []);
});

test("checkExports: ADR 0025 dist shape with @stackra/source first; strings are static assets", () => {
  const good = {
    "@stackra/source": "./src/a/index.ts",
    types: "./dist/a.d.mts",
    default: "./dist/a.mjs",
  };
  assert.deepEqual(
    checkExports({ "./a": good, "./tokens.css": "./src/t.css", "./resources/*": "./resources/*" }),
    [],
  );
  assert.equal(
    checkExports({
      ".": { types: good.types, "@stackra/source": good["@stackra/source"], default: good.default },
    }).length,
    1,
  );
  assert.equal(checkExports({ ".": { types: "./src/a.ts", default: "./src/a.ts" } }).length, 3);
  assert.equal(checkExports({ ".": "./src/index.ts" }).length, 1);
  assert.equal(checkExports("./dist/index.mjs").length, 1);
  assert.deepEqual(checkExports(undefined), []);
});

test("checkExports: an Expo module's ./app.plugin.js stays a root CommonJS file", () => {
  assert.deepEqual(checkExports({ "./app.plugin.js": { default: "./app.plugin.js" } }), []);
  assert.equal(checkExports({ "./plugin.js": { default: "./plugin.js" } }).length, 3);
});

// @covers sta-347:FR-005 sta-347:P-004
test("transition: a v2 service keeps src/main.ts and an existing stackra.module (until STA-344)", () => {
  const dir = "services/notes";
  const pkg = { stackra: { module: "./src/notes.module.ts" } };
  assert.equal(isV2Service(["src/main.ts"]), true);
  assert.deepEqual(checkService({ dir, pkg, paths: ["src/main.ts", "src/notes.module.ts"] }), []);
  assert.deepEqual(checkService({ dir, pkg: {}, paths: ["src/main.ts"] }), [
    'package.json has no "stackra": { "module": "./src/<name>.module.ts" } (ADR 0090)',
  ]);
  assert.deepEqual(checkService({ dir, pkg, paths: ["src/main.ts"] }), [
    "package.json stackra.module ./src/notes.module.ts does not exist",
  ]);
});

// @covers sta-347:FR-005 sta-347:P-004
test("transition: a v3 service has stackra.config.ts, no main.ts, and its module file only when it says something", () => {
  const dir = "services/notes";
  const v3 = ["stackra.config.ts", "src/notes.module.ts", "runway.yaml"];
  assert.equal(isV2Service(v3), false);
  assert.deepEqual(checkService({ dir, pkg: {}, paths: v3 }), []);
  assert.deepEqual(checkService({ dir, pkg: {}, paths: ["stackra.config.ts", "runway.yaml"] }), []);
  assert.deepEqual(checkService({ dir, pkg: {}, paths: ["src/encore.service.ts"] }), [
    "stackra.config.ts missing (v3 service shape, ADR 0294 R12; a v2 service keeps src/main.ts until STA-344)",
    "src/encore.service.ts: services hold no Encore files; stackra gen generates them (ADR 0124)",
  ]);
});

test("checkTestPlacement: test files must sit directly in __tests__/", () => {
  assert.deepEqual(
    checkTestPlacement([
      "packages/a/b/src/__tests__/x.test.ts",
      "apps/web/src/app/__tests__/page.test.tsx",
      ".agents/hooks/__tests__/guard.test.mjs",
      "packages/a/b/src/__tests__/fixture.ts",
      ".old/console.old/src/app.test.ts",
    ]),
    [],
  );
  assert.deepEqual(checkTestPlacement(["packages/a/b/src/x.test.ts", "tools/scripts/y.test.mjs"]), [
    "packages/a/b/src/x.test.ts: test files go in a __tests__/ folder (ADR 0022)",
    "tools/scripts/y.test.mjs: test files go in a __tests__/ folder (ADR 0022)",
  ]);
  assert.deepEqual(checkTestPlacement(["src/__tests__/deep/x.test.ts"]), [
    "src/__tests__/deep/x.test.ts: test files go in a __tests__/ folder (ADR 0022)",
  ]);
  assert.deepEqual(checkTestPlacement(["src/__tests__/x.spec.ts"]), [
    "src/__tests__/x.spec.ts: name it <subject>.test.<ext>, not .spec (ADR 0022)",
  ]);
  assert.deepEqual(
    checkTestPlacement(["src/__tests__/x.int.test.ts", "src/__tests__/x.e2e.test.ts"]),
    [],
  );
  assert.deepEqual(checkTestPlacement(["src/x/x.stories.tsx"]), [
    "src/x/x.stories.tsx: no Storybook; test the component in __tests__/",
  ]);
});

test("checkJsonConfigs: a JSONC-capable *.json config is a finding; MUST_STAY_JSON paths are not", () => {
  assert.deepEqual(
    checkJsonConfigs([
      "package.json",
      "apps/console/package.json",
      "apps/console/tsconfig.json",
      "packages/tooling/typescript/src/node.json",
      "apps/mobile/app.json",
      "apps/mobile/eas.json",
      "apps/docs/src/docs.json",
      ".claude/settings.json",
      ".changeset/config.json",
      ".specify/integration.json",
      "assets/landing/index.json",
      "brand.json",
      "apps/mobile/brand.json",
      "apps/playground/src/constants/brand-themes/jute.json",
      "packages/design-system/showcase/api/react/free/button.json",
      ".agents/skills/x/scripts/package.json",
      "apps/console/turbo.jsonc",
      ".oxlintrc.jsonc",
      "README.md",
    ]),
    [],
  );
  const flagged = [
    "apps/console/turbo.json",
    ".oxfmtrc.json",
    "knip.json",
    ".agents/models.json",
    "packages/x/brand.json",
  ];
  assert.deepEqual(
    checkJsonConfigs(flagged).map((m) => m.split(":")[0]),
    flagged,
  );
  const yamlOwed = [".agents/models.jsonc", ".mcp.jsonc", "tools/x/config.jsonc"];
  assert.deepEqual(
    checkJsonConfigs([...yamlOwed, "knip.jsonc", "opencode.jsonc", ".oxfmtrc.jsonc"]).map(
      (m) => m.split(":")[0],
    ),
    yamlOwed,
  );
});

test("checkRunwaySchemas: each shipped runway schema is a byte copy of its tools/schemas file", () => {
  const files: Record<string, string> = {};
  for (const kind of ["app", "root", "service"]) {
    files[`tools/schemas/runway-${kind}.schema.json`] = `{ "title": "${kind}" }\n`;
    files[`packages/developer/runway/schema/${kind}.json`] = `{ "title": "${kind}" }\n`;
  }
  assert.deepEqual(
    checkRunwaySchemas((p) => files[p]),
    [],
  );

  files["packages/developer/runway/schema/root.json"] = '{"title":"root"}\n';
  delete files["packages/developer/runway/schema/service.json"];
  assert.deepEqual(
    checkRunwaySchemas((p) => files[p]).map((m) => m.split(":")[0]),
    [
      "packages/developer/runway/schema/root.json differs from tools/schemas/runway-root.schema.json",
      "packages/developer/runway/schema/service.json differs from tools/schemas/runway-service.schema.json",
    ],
  );
  assert.match(
    checkRunwaySchemas((p) => files[p])[0] ?? "",
    /: run `cp tools\/schemas\/runway-root\.schema\.json packages\/developer\/runway\/schema\/root\.json`$/,
  );
});

test("runwayKindOf: root, app and Worker members, service members and the scaffold templates; nothing else", () => {
  assert.equal(runwayKindOf("runway.yaml"), "root");
  assert.equal(runwayKindOf("apps/docs/runway.yaml"), "app");
  assert.equal(runwayKindOf("workers/static/runway.yaml"), "app");
  assert.equal(runwayKindOf("tools/scaffold/templates/apps/console/runway.yaml"), "app");
  assert.equal(runwayKindOf("services/commerce/runway.yaml"), "service");
  assert.equal(runwayKindOf("tools/scaffold/templates/services/service/runway.yaml"), "service");
  for (const p of [
    "apps/docs/src/runway.yaml",
    "packages/developer/runway/runway.yaml",
    "services/runway.yaml",
    "runway.yml",
  ])
    assert.equal(runwayKindOf(p), undefined, p);
  assert.equal(isRunwayFile("services/commerce/runway.yaml"), true);
  assert.equal(isRunwayFile("apps/docs/runway.yml"), true);
  assert.equal(isRunwayFile(".agents/skills/x/runway.yaml"), false);
  assert.equal(isRunwayFile("runway.yaml.md"), false);
});

/** One schema issue the stub reports. */
type Issue = { readonly path: string; readonly message: string };

/** A stand-in for the built @stackra/runway entry: records its calls and refuses documents with `bad: true`. */
function stubRunway(
  placement: readonly { readonly code: string; readonly message: string }[] = [],
) {
  class RunwayInvalidError extends Error {
    readonly issues: readonly Issue[];

    constructor(source: string, issues: readonly Issue[]) {
      super(source);
      this.issues = issues;
    }
  }
  const calls: unknown[][] = [];
  const runway = {
    RunwayInvalidError,
    parseRunway(kind: string, document: unknown, source: string): unknown {
      calls.push(["parseRunway", kind, source]);
      const doc = document as { readonly bad?: boolean; readonly crash?: boolean } | null;
      if (doc?.bad)
        throw new RunwayInvalidError(source, [
          { path: "environments.dev.member", message: "Unrecognized key" },
          { path: "", message: "Invalid input" },
        ]);
      if (doc?.crash) throw new TypeError("boom");
      return document;
    },
    checkPlacement(root: unknown, services: readonly string[]) {
      calls.push(["checkPlacement", (root as { readonly project?: string }).project, services]);
      return placement;
    },
  };
  return { calls, runway };
}

test("checkRunwayFiles: each file is parsed for its kind; only the root reaches checkPlacement", () => {
  const files: Record<string, string> = {
    "runway.yaml": "version: 3\nproject: acme\nenvironments: {}\n",
    "apps/docs/runway.yaml": "version: 3\nenvironments: {}\n",
    "services/commerce/runway.yaml": "version: 3\nenvironments: {}\n",
  };
  const { calls, runway } = stubRunway();
  const out = checkRunwayFiles({
    files: Object.keys(files),
    read: (p) => files[p] ?? "",
    runway,
    services: ["commerce"],
  });
  assert.deepEqual(out, []);
  assert.deepEqual(calls, [
    ["parseRunway", "root", "runway.yaml"],
    ["checkPlacement", "acme", ["commerce"]],
    ["parseRunway", "app", "apps/docs/runway.yaml"],
    ["parseRunway", "service", "services/commerce/runway.yaml"],
  ]);
});

test("checkRunwayFiles: schema issues name file and path; placement issues name the code", () => {
  const files: Record<string, string> = {
    "runway.yaml": "version: 3\nproject: acme\n",
    "services/commerce/runway.yaml": "bad: true\n",
  };
  const { runway } = stubRunway([
    {
      code: "member_unplaced",
      message: 'production: "billing" is in no group and the topology has no default group',
    },
  ]);
  assert.deepEqual(
    checkRunwayFiles({
      files: Object.keys(files),
      read: (p) => files[p] ?? "",
      runway,
      services: ["billing", "commerce"],
    }),
    [
      'runway.yaml: production: "billing" is in no group and the topology has no default group (member_unplaced)',
      "services/commerce/runway.yaml: environments.dev.member: Unrecognized key",
      "services/commerce/runway.yaml: (document): Invalid input",
    ],
  );
});

test("checkRunwayFiles: a misplaced file, invalid YAML and a repeated key are one finding each; other errors throw", () => {
  const files: Record<string, string> = {
    "packages/developer/runway/runway.yaml": "version: 3\n",
    "apps/docs/runway.yaml": "version: [\n",
    "services/commerce/runway.yaml": "version: 3\nversion: 3\n",
  };
  const { calls, runway } = stubRunway();
  const out = checkRunwayFiles({
    files: Object.keys(files),
    read: (p) => files[p] ?? "",
    runway,
    services: [],
  });
  assert.equal(out.length, 3);
  assert.match(
    out[0] ?? "",
    /^packages\/developer\/runway\/runway\.yaml: no runway kind applies here/,
  );
  assert.match(out[1] ?? "", /^apps\/docs\/runway\.yaml: not valid YAML/);
  assert.match(out[2] ?? "", /^services\/commerce\/runway\.yaml: not valid YAML/);
  assert.deepEqual(calls, []);
  assert.throws(
    () =>
      checkRunwayFiles({
        files: ["runway.yaml"],
        read: () => "crash: true\n",
        runway,
        services: [],
      }),
    TypeError,
  );
});

test("checkYamlFlowMaps: names file and line of a flow mapping; allows block maps, flow lists and {}", () => {
  const bad = "a: 1\nb:\n  c: { d: e }\n";
  assert.deepEqual(checkYamlFlowMaps("x.yml", bad), [
    "x.yml:3: flow mapping; write a block mapping (YAML standard, STA-299)",
  ]);
  assert.deepEqual(checkYamlFlowMaps("x.yml", "a: [b, c]\npermissions: {}\nd:\n  e: f\n"), []);
  assert.equal(
    (checkYamlFlowMaps("x.yml", "a: [")[0] ?? "").startsWith("x.yml: not valid YAML"),
    true,
  );
});

test("isRepoOwnedYaml: skips generated and vendored YAML", () => {
  for (const p of ["lefthook.yml", ".github/workflows/ci.yml", ".agents/routing.yaml"])
    assert.equal(isRepoOwnedYaml(p), true);
  for (const p of [
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ".specify/a.yml",
    ".agents/skills/x/a.yml",
    ".agents/reference/a.yml",
    "a.json",
  ])
    assert.equal(isRepoOwnedYaml(p), false);
});

/** A double quote, kept out of the import-shaped strings below. */
const Q = '"';

test("checkImports: flags an extension in a TS import and a relative import climbing two folders", () => {
  // Built with Q so this file's own source holds no import the check would flag.
  const src = [
    `import { a } from ${Q}./a.js${Q};`,
    `export * from ${Q}../b.ts${Q};`,
    `const c = await import(${Q}#src/c.tsx${Q});`,
    `vi.mock(${Q}../../d${Q});`,
    `import ${Q}../../../e${Q};`,
  ].join("\n");
  assert.deepEqual(checkImports("x.ts", src), [
    'x.ts: import "./a.js" names a file extension; drop it (bundler resolution, ADR 0233)',
    'x.ts: import "../b.ts" names a file extension; drop it (bundler resolution, ADR 0233)',
    'x.ts: import "#src/c.tsx" names a file extension; drop it (bundler resolution, ADR 0233)',
    'x.ts: import "../../d" climbs two or more folders; use the member\'s # alias (ADR 0233)',
    'x.ts: import "../../../e" climbs two or more folders; use the member\'s # alias (ADR 0233)',
  ]);
});

test("checkImports: allows same-folder, one-up, # aliases, packages, JSON and asset queries", () => {
  const src = [
    'import { a } from "./a";',
    'import { b } from "../b";',
    'import { c } from "#src/deep/c";',
    'import { z } from "zod";',
    'import pkg from "../package.json" with { type: "json" };',
    'import logo from "./logo.svg?url";',
    'const u = new URL("../../assets/", import.meta.url);',
  ].join("\n");
  assert.deepEqual(checkImports("x.ts", src), []);
});

test("isMemberSource: member TS only; Node-loaded tooling presets and lint fixtures are exempt", () => {
  for (const p of [
    "apps/console/src/main.ts",
    "packages/x/y/src/a.tsx",
    "services/s/src/m.mts",
    "workers/w/src/main.ts",
    "packages/developer/coding-standard/src/core/constants/__tests__/stackra-plugin.constant.test.ts",
  ])
    assert.equal(isMemberSource(p), true);
  for (const p of [
    "packages/tooling/vitest/src/preset-react.ts",
    "packages/developer/coding-standard/src/core/constants/stackra-plugin.constant.ts",
    "packages/developer/coding-standard/src/core/functions/file-kind.function.ts",
    "packages/tooling/oxlint/src/__tests__/fixtures/packages/demo/pkg/src/index.ts",
    "tools/scripts/scaffold.mjs",
    ".opencode/plugins/guard/decide.ts",
    "apps/console/src/a.js",
  ])
    assert.equal(isMemberSource(p), false);
});

/** An Expo app config's text with the given `expo` block. */
const config = (expo: unknown): string => JSON.stringify({ expo });

// @covers STA-461
test("checkIosFormFactor: refuses an orientation lock and a full-screen request; allows none or default", () => {
  assert.deepEqual(checkIosFormFactor("a/app.json", config({ name: "x" })), []);
  assert.deepEqual(checkIosFormFactor("a/app.json", config({ orientation: "default" })), []);
  assert.deepEqual(checkIosFormFactor("a/app.json", JSON.stringify({ name: "not expo" })), []);
  const locked = checkIosFormFactor("a/app.json", config({ orientation: "portrait" }));
  assert.equal(locked.length, 1);
  assert.match(locked[0] ?? "", /orientation.*portrait.*STA-461/);
  const full = checkIosFormFactor("a/app.json", config({ ios: { requireFullScreen: true } }));
  assert.equal(full.length, 1);
  assert.match(full[0] ?? "", /requireFullScreen/);
});

test("checkWindowSizing: refuses Dimensions.get and allows the window hook", () => {
  assert.equal(checkWindowSizing("a.tsx", "const { width } = Dimensions.get('window');").length, 1);
  assert.deepEqual(checkWindowSizing("a.tsx", "const { width } = useWindowDimensions();"), []);
});

test("isExpoAppConfig: app members and app templates only", () => {
  assert.equal(isExpoAppConfig("apps/mobile/app.json"), true);
  assert.equal(isExpoAppConfig("tools/scaffold/templates/apps/mobile/app.json"), true);
  assert.equal(isExpoAppConfig("apps/mobile/src/app.json"), false);
  assert.equal(isExpoAppConfig("packages/x/y/app.json"), false);
});
