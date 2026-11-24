/**
 * Stackra file contract:
 * Purpose: unit tests of `layoutFindings`: the repository's own files and declarations feed `checkRepositoryLayout`: the preset
 *          named in flow.config.json (neutral when none), the members the workspace globs name (apps excepted), `stackra.layout`
 *          allow and banned declarations in package.json, and the tools README; every finding is a `layout` finding at the root.
 * Boundary: test only; a throwaway repository under the OS temp folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0526; ADR 0528.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { layoutFindings } from "#node/functions/layout-findings.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-layout-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** Writes `files` under the root and returns the context over them (plus `extra` paths that are listed but not written). */
function repo(files: Record<string, string>, extra: string[] = []) {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return { root, files: [...Object.keys(files), ...extra] };
}

/** The required entries of every template. */
const REQUIRED = {
  "AGENTS.md": "x",
  "README.md": "x",
  "docs/README.md": "x",
  "flow.config.json": JSON.stringify({ preset: "stackra" }),
};

describe("layoutFindings", () => {
  it("finds nothing in a repository that has the required entries and a workspace member folder", () => {
    const context = repo({
      ...REQUIRED,
      "package.json": "{}",
      "pnpm-workspace.yaml": "packages:\n  - services/*\n",
      "services/example/package.json": "{}",
    });
    expect(layoutFindings(context)).toEqual([]);
  });

  it("reports a missing required entry and a root src/, each as a layout finding at the root", () => {
    const context = repo({ "README.md": "x", "src/main.ts": "x" });
    const findings = layoutFindings(context);
    expect(findings.every((finding) => finding.rule === "layout" && finding.dir === "")).toBe(true);
    const texts = findings.map((finding) => finding.text).join("\n");
    expect(texts).toContain("AGENTS.md: missing");
    expect(texts).toContain("src/: no root src/");
  });

  it("reads the preset from flow.config.json and refuses one without a template", () => {
    const context = repo({
      ...REQUIRED,
      "flow.config.json": JSON.stringify({ preset: "no-such-preset" }),
    });
    expect(layoutFindings(context).map((finding) => finding.text)).toEqual([
      'flow.config.json: preset "no-such-preset" has no template (ADR 0528)',
    ]);
  });

  it("falls back to the neutral preset when flow.config.json names none, or there is no flow.config.json", () => {
    const context = repo({
      "AGENTS.md": "x",
      "README.md": "x",
      "docs/README.md": "x",
      "flow.config.json": "{}",
    });
    expect(layoutFindings(context).map((finding) => finding.text)).toEqual([]);
    expect(
      layoutFindings({ root, files: [] })
        .map((finding) => finding.text)
        .join("\n"),
    ).toContain("AGENTS.md: missing; the neutral template has it");
  });

  it("lets a declared entry through and lists an undeclared one, naming the declaration", () => {
    const files = { ...REQUIRED, "extra/notes.md": "x" };
    const undeclared = layoutFindings(repo(files));
    expect(undeclared.map((finding) => finding.text).join("\n")).toContain(
      "extra: not in the stackra template; remove it or declare it in package.json stackra.layout.allow",
    );
    const declared = layoutFindings(
      repo({
        ...files,
        "package.json": JSON.stringify({ stackra: { layout: { allow: { extra: "notes" } } } }),
      }),
    );
    expect(declared).toEqual([]);
  });

  it("treats the workspace globs' first segments as members, except apps", () => {
    const files = {
      ...REQUIRED,
      "pnpm-workspace.yaml": "packages:\n  - widgets/*\n  - apps/*\n",
      "widgets/a/package.json": "{}",
      "apps/console/package.json": "{}",
    };
    const texts = layoutFindings(repo(files)).map((finding) => finding.text);
    expect(texts.some((text) => text.startsWith("widgets"))).toBe(false);
    expect(texts.some((text) => text.startsWith("apps/: only where an app is the product"))).toBe(
      true,
    );
  });

  it("asks for a README in tools/", () => {
    const without = layoutFindings(repo({ ...REQUIRED, "tools/x.sh": "x" }));
    expect(without.map((finding) => finding.text).join("\n")).toContain("tools/: add a README.md");
    const withReadme = layoutFindings(
      repo({ ...REQUIRED, "tools/README.md": "x", "tools/x.sh": "x" }),
    );
    expect(withReadme.map((finding) => finding.text).join("\n")).not.toContain(
      "tools/: add a README.md",
    );
  });

  it("reads banned names from package.json, and refuses the retired Flow name, except under an adr/ register", () => {
    const context = repo({
      ...REQUIRED,
      "package.json": JSON.stringify({ stackra: { layout: { banned: ["Legacy"] } } }),
      "docs/legacy-notes.md": "x",
      "docs/figentra-flow-setup.md": "x",
      "docs/adr/0001-figentra-flow.md": "x",
    });
    const texts = layoutFindings(context).map((finding) => finding.text);
    expect(texts).toContain(
      "docs/legacy-notes.md: the name legacy is banned here (package.json stackra.layout.banned)",
    );
    expect(texts).toContain(
      "docs/figentra-flow-setup.md: the name figentra-flow is retired; use flow or fflow (ADR 0529 d5)",
    );
    expect(texts.some((text) => text.startsWith("docs/adr/"))).toBe(false);
  });
});
