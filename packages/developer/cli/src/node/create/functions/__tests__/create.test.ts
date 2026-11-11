/**
 * Stackra file contract:
 * Purpose: hold `stackra create`'s pure parts to their contract: a profile writes only its paths and overlays, the
 *          rename list and the catalog pin apply, the starter's own files never reach the app, a malformed manifest or
 *          an unknown profile is refused; the gen tree groups by member and kind; a starter's files describe the
 *          doctor workspace of the app they make.
 * Boundary: pure functions on in-memory files; runs no command.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0515; STA-1952 spec FR-006, FR-007, FR-010 and FR-015.
 */
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";

import { test } from "@stackra/testing";

import { genTree } from "#node/create/functions/gen-tree.function";
import { starterFiles } from "#node/create/functions/starter-files.function";
import { starterTarball } from "#node/create/functions/starter-tarball.function";
import { starterWorkspace } from "#node/create/functions/starter-workspace.function";
import { doctorNeeds } from "#node/doctor/functions/doctor-needs.function";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const MANIFEST = `version: 1
rename:
  - from: "@figentra/acme-"
    to: "{scope}/"
  - from: acme-platform
    to: "{name}"
  - from: "key: acme"
    to: "key: {key}"
profiles:
  minimal:
    include: ["*", "apps/console/**", "services/example/**"]
    overlay:
      runway.yaml: starter/minimal/runway.yaml
  full:
    include: ["**"]
`;

const starter = (extra: Record<string, string | Uint8Array> = {}) =>
  new Map<string, Uint8Array>(
    Object.entries({
      "stackra.starter.yaml": MANIFEST,
      ".github/workflows/ci.yml": "on: push\n",
      "package.json": '{"name":"acme-platform","scripts":{"dev":"stackra dev"}}',
      "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
      ".infisical.yaml": "workspaceId: template-project\n",
      "pnpm-workspace.yaml":
        '# the catalogs\ncatalogs:\n  stackra:\n    "@stackra/cli": ^0.3.0 # the CLI\n    "@stackra/gen": ^0.3.0\n',
      "runway.yaml": "project: acme-platform\nproduct:\n  key: acme\nsurfaces: {}\n",
      "starter/minimal/runway.yaml": "project: acme-platform\nproduct:\n  key: acme\n",
      "apps/console/package.json":
        '{"name":"@figentra/acme-console","stackra":{"tier":"app","runtimes":["browser"]}}',
      "apps/console/runway.yaml": "version: 3\nenvironments:\n  dev:\n    port: 3710\n",
      "apps/docs/package.json": '{"name":"@figentra/acme-docs"}',
      "services/example/package.json":
        '{"name":"@figentra/acme-service-example","stackra":{"tier":"service","runtimes":["node"]},"dependencies":{"@stackra/actions":"catalog:stackra"}}',
      "services/example/assets/logo.png": new Uint8Array([137, 80, 78, 71, 0, 1, 2]),
      ...extra,
    }).map(([path, body]) => [path, typeof body === "string" ? encoder.encode(body) : body]),
  );

const options = { profile: "minimal", name: "demo-app", scope: "@demo", stackraVersion: "0.5.1" };
const read = (files: Map<string, Uint8Array>, path: string) => decoder.decode(files.get(path));

test("a profile writes only its paths, its overlays and never the starter's own files", () => {
  const files = starterFiles(starter(), options);
  assert.deepEqual([...files.keys()].sort(), [
    ".npmrc",
    "apps/console/package.json",
    "apps/console/runway.yaml",
    "package.json",
    "pnpm-workspace.yaml",
    "runway.yaml",
    "services/example/assets/logo.png",
    "services/example/package.json",
  ]);
  assert.doesNotMatch(read(files, "runway.yaml"), /surfaces/);
  const full = starterFiles(starter(), { ...options, profile: "full" });
  assert.equal(full.has("apps/docs/package.json"), true);
  // `**` keeps dotfiles too (path.matchesGlob alone skips them).
  assert.equal(full.has(".github/workflows/ci.yml"), true);
  // The template's Infisical binding never rides along, even in a profile that takes every file.
  assert.equal(full.has(".infisical.yaml"), false);
});

test("the rename list, the catalog pin and the registry line apply; binary files pass untouched", () => {
  const files = starterFiles(starter(), options);
  assert.equal(JSON.parse(read(files, "package.json")).name, "demo-app");
  assert.equal(
    JSON.parse(read(files, "services/example/package.json")).name,
    "@demo/service-example",
  );
  assert.match(read(files, "runway.yaml"), /project: demo-app\nproduct:\n {2}key: demoapp/);
  const workspace = read(files, "pnpm-workspace.yaml");
  assert.match(workspace, /# the catalogs/);
  assert.match(workspace, /"@stackra\/cli": 0\.5\.1/);
  assert.match(workspace, /"@stackra\/gen": 0\.5\.1/);
  assert.doesNotMatch(workspace, /overrides/);
  assert.match(
    read(files, ".npmrc"),
    /^@stackra:registry=https:\/\/npm\.stackra\.figentra\.com\/\n/,
  );
  assert.deepEqual(
    files.get("services/example/assets/logo.png"),
    new Uint8Array([137, 80, 78, 71, 0, 1, 2]),
  );
});

test("tarballs become pnpm overrides; an existing .npmrc keeps its lines", () => {
  const files = starterFiles(
    starter({ ".npmrc": "@figentra:registry=https://npm.stackra.figentra.com/" }),
    {
      ...options,
      tarballs: { "@stackra/cli": "file:/tmp/stackra-cli-0.5.1.tgz" },
    },
  );
  assert.match(
    read(files, "pnpm-workspace.yaml"),
    /overrides:\n {2}"@stackra\/cli": file:\/tmp\/stackra-cli-0\.5\.1\.tgz/,
  );
  assert.equal(
    read(files, ".npmrc"),
    "@figentra:registry=https://npm.stackra.figentra.com/\n@stackra:registry=https://npm.stackra.figentra.com/\n",
  );
});

test("a malformed manifest, an unknown profile and a missing overlay are refused", () => {
  assert.throws(() => starterFiles(new Map(), options), /has no stackra\.starter\.yaml/);
  assert.throws(
    () => starterFiles(starter({ "stackra.starter.yaml": "version: 2\n" }), options),
    /not a version 1 starter manifest/,
  );
  assert.throws(
    () => starterFiles(starter(), { ...options, profile: "tiny" }),
    /no profile tiny; it has minimal, full/,
  );
  const broken = starter();
  broken.delete("starter/minimal/runway.yaml");
  assert.throws(
    () => starterFiles(broken, options),
    /overlay runway\.yaml: the starter has no starter\/minimal\/runway\.yaml/,
  );
});

test("a starter's files describe the app's doctor workspace", () => {
  const workspace = starterWorkspace(starterFiles(starter(), options));
  assert.deepEqual(workspace.devPorts, [3710]);
  assert.deepEqual([...doctorNeeds(workspace)].sort(), ["services", "stackra"]);
});

/** A gzipped ustar archive of these files under `package/`, as npm packs one. */
function tgz(entries: Record<string, string>): Uint8Array {
  const blocks: Uint8Array[] = [];
  for (const [path, body] of Object.entries(entries)) {
    const header = new Uint8Array(512);
    const field = (offset: number, value: string) => header.set(encoder.encode(value), offset);
    const bytes = encoder.encode(body);
    field(0, `package/${path}`);
    field(100, "0000644\0");
    field(124, `${bytes.length.toString(8).padStart(11, "0")}\0`);
    field(156, "0");
    field(257, "ustar\0");
    field(148, "        ");
    const sum = header.reduce((total, byte) => total + byte, 0);
    field(148, `${sum.toString(8).padStart(6, "0")}\0 `);
    const data = new Uint8Array(Math.ceil(bytes.length / 512) * 512);
    data.set(bytes);
    blocks.push(header, data);
  }
  blocks.push(new Uint8Array(1024));
  return gzipSync(Buffer.concat(blocks));
}

test("starterTarball returns the template under template/, or the whole tarball without one", () => {
  const packed = starterTarball(
    tgz({
      "package.json": '{"name":"@stackra/starter"}',
      "template/package.json": '{"name":"acme-platform"}',
    }),
  );
  assert.deepEqual([...packed.keys()], ["package.json"]);
  assert.equal(read(packed, "package.json"), '{"name":"acme-platform"}');
  assert.deepEqual(
    [...starterTarball(tgz({ "stackra.starter.yaml": "version: 1\n" })).keys()],
    ["stackra.starter.yaml"],
  );
});

test("genTree has one node per member, a child per kind with its count and note, and the files under it", () => {
  const paths = [
    "services/example/stackra.manifest.json",
    "services/example/.stackra/gen/wiring.ts",
    "services/example/.stackra/gen/schemas/example.ts",
    "services/example/stackra-encore/example/api.ts",
    "services/example/stackra-encore/example/encore.service.ts",
    "services/example/.stackra/entry/node.ts",
    "services/example/encore.app",
    "apps/console/.stackra/gen/routes.ts",
    "apps/console/.stackra/vitest.config.ts",
    "apps/console/vitest.config.ts",
    "apps/console/tsconfig.build.json",
  ];
  assert.deepEqual(genTree(paths), [
    {
      label: "apps/console",
      children: [
        { label: ".stackra/gen/", note: "routes" },
        { label: ".stackra/ (tool configs)", note: "configs, tests, graph" },
        {
          label: "member root",
          note: "vitest.config.ts, tsconfig.build.json",
          count: 2,
          children: [{ label: "tsconfig.build.json" }, { label: "vitest.config.ts" }],
        },
      ],
    },
    {
      label: "services/example",
      children: [
        { label: "stackra.manifest.json", note: "the contract" },
        {
          label: ".stackra/gen/",
          note: "wiring, schemas",
          count: 2,
          children: [
            { label: ".stackra/gen/schemas/example.ts" },
            { label: ".stackra/gen/wiring.ts" },
          ],
        },
        {
          label: "stackra-encore/",
          note: "the Encore services",
          count: 2,
          children: [
            { label: "stackra-encore/example/api.ts" },
            { label: "stackra-encore/example/encore.service.ts" },
          ],
        },
        { label: ".stackra/entry/node.ts", note: "an entry" },
        { label: "member root", note: "encore.app" },
      ],
    },
  ]);
});
