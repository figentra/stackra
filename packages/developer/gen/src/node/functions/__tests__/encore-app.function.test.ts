/**
 * Stackra file contract:
 * Purpose: unit tests of `encoreApp`: a service gets `.stackra/encore/encore.app` with the root runway's
 *          `providers.encore.app` (quoted or not, past sibling providers and comments); a root runway without the key
 *          is `encore_app_missing`; a package gets no app file; an `encore.app` at the member or repository root is
 *          `encore_app_stray` for any member.
 * Boundary: test only; writes small repository trees under `<gen>/.cache/encore-app/` (gitignored).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0091 (decision 2); ADR 0029; STA-1322.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { encoreApp } from "#node/functions/encore-app.function";

/** The gen package root. */
const GEN_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

/** Counts the trees this process wrote, so tests never share a folder. */
let written = 0;

/** A repository with `pnpm-workspace.yaml`, the given root files and a member `services/sales`; returns the member. */
function repository(files: Readonly<Record<string, string>>): string {
  written += 1;
  const repo = join(GEN_ROOT, ".cache", "encore-app", `${process.pid}-${written}`);
  rmSync(repo, { recursive: true, force: true });
  const all: Record<string, string> = {
    "pnpm-workspace.yaml": "packages:\n  - services/*\n",
    "services/sales/package.json": "{}\n",
    ...files,
  };
  for (const [path, content] of Object.entries(all)) {
    mkdirSync(join(repo, path, ".."), { recursive: true });
    writeFileSync(join(repo, path), content);
  }
  return join(repo, "services", "sales");
}

const RUNWAY = [
  "version: 3",
  "providers:",
  "  cloudflare:",
  "    accountId: abc",
  "    zones:",
  "      figentra.com: ref:cloudflare.zones.figentraCom",
  "  encore:",
  "    # Encore Cloud app id (public, not a secret).",
  '    app: "figentra-commerce" # the runway id',
  "  npm:",
  "    app: not-this-one",
  "environments:",
  "  dev:",
  "    encore:",
  "      app: nor-this-one",
  "",
].join("\n");

describe("encoreApp", () => {
  it("writes the service's app file from providers.encore.app", () => {
    const { errors, files } = encoreApp(repository({ "runway.yaml": RUNWAY }), true);
    expect(errors).toEqual([]);
    expect(files.map((file) => file.path)).toEqual([".stackra/encore/encore.app"]);
    expect(JSON.parse(files[0]?.content ?? "")).toEqual({
      id: "figentra-commerce",
      lang: "typescript",
    });
  });

  it("refuses a service when the root runway names no app id", () => {
    const withoutKey = RUNWAY.replace(/ {2}encore:\n.*\n.*\n/, "");
    for (const root of [repository({ "runway.yaml": withoutKey }), repository({})]) {
      const { errors, files } = encoreApp(root, true);
      expect(files).toEqual([]);
      expect(errors.map((error) => [error.code, error.file])).toEqual([
        ["encore_app_missing", "../../runway.yaml"],
      ]);
      expect(errors[0]?.message).toContain("providers.encore.app");
    }
  });

  it("writes nothing for a package or a manifest pass", () => {
    expect(encoreApp(repository({ "runway.yaml": RUNWAY }), false)).toEqual({
      errors: [],
      files: [],
    });
  });

  it("refuses an encore.app at the repository or the member root", () => {
    const root = repository({
      "runway.yaml": RUNWAY,
      "encore.app": '{ "id": "commerce-9v52" }\n',
      "services/sales/encore.app": "{}\n",
    });
    for (const service of [true, false])
      expect(encoreApp(root, service).errors.map((error) => [error.code, error.file])).toEqual([
        ["encore_app_stray", "encore.app"],
        ["encore_app_stray", "../../encore.app"],
      ]);
  });
});
