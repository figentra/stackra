/**
 * Stackra file contract:
 * Purpose: proves ADR 0269 decision 2: no workspace package among the runtime or peer dependencies; the `.` entry
 *          imports only vitest, node built-ins and its own files; the `./react` and `./native` entries import no
 *          workspace package (every package's tests depend on this one, so an edge back would be a cycle); and no
 *          domain vocabulary anywhere in the public surface.
 * Boundary: reads package.json and the files under src/ from disk; asserts nothing about behaviour.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 2); ADR 0003 (tier direction); ADR 0022 (test placement).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "@stackra/testing";

/** The member root, two folders above this file. */
const ROOT = fileURLToPath(new URL("../..", import.meta.url));

/** Every authored source file outside the tests. */
const sources = readdirSync(join(ROOT, "src"), { recursive: true, encoding: "utf8" })
  .filter((path) => path.endsWith(".ts") && !path.split(/[\\/]/).includes("__tests__"))
  .map((path) => ({ path, text: readFileSync(join(ROOT, "src", path), "utf8") }));

/** The import specifiers of `text`. */
const specifiersOf = (text: string): string[] =>
  [...text.matchAll(/from "([^"]+)"/g)].map((match) => match[1] ?? "");

/** Whether `path` (relative to src/) belongs to the entry folder `entry`. */
const inEntry = (path: string, entry: string): boolean => path.split(/[\\/]/)[0] === entry;

// @covers sta-348:FR-008
describe("the entries of @stackra/testing", () => {
  it("depends on no workspace package at runtime, and needs only vitest", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as Record<
      string,
      Record<string, string> | undefined
    >;
    const runtime = { ...pkg["dependencies"], ...pkg["peerDependencies"] };
    expect(Object.values(runtime).filter((version) => version.startsWith("workspace:"))).toEqual(
      [],
    );
    expect(Object.keys(runtime).filter((name) => name.startsWith("@stackra/"))).toEqual([]);
    const optional = Object.keys(pkg["peerDependenciesMeta"] ?? {});
    expect(Object.keys(runtime).filter((name) => !optional.includes(name))).toEqual(["vitest"]);
  });

  it("keeps the . entry to vitest, node built-ins and its own files", () => {
    const core = sources.filter(({ path }) => inEntry(path, "core"));
    expect(core.length).toBeGreaterThan(0);
    for (const { path, text } of core) {
      const foreign = specifiersOf(text).filter(
        (s) => s !== "vitest" && !s.startsWith("#core/") && !s.startsWith("node:"),
      );
      expect({ path, foreign }).toEqual({ path, foreign: [] });
    }
  });

  // @covers sta-348:FR-009
  it("keeps ./react and ./native free of workspace imports", () => {
    const rendering = sources.filter(
      ({ path }) => inEntry(path, "react") || inEntry(path, "native"),
    );
    expect(rendering.length).toBeGreaterThan(0);
    for (const { path, text } of rendering) {
      const workspace = specifiersOf(text).filter((s) => s.startsWith("@stackra/"));
      expect({ path, workspace }).toEqual({ path, workspace: [] });
    }
  });

  it("names no domain kind in its source", () => {
    const domain = /\b(Action|Query|Permission|IntegrationEvent|DomainEvent|Module|Refusal)\b/;
    for (const { path, text } of sources) {
      const code = text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
      expect({ path, hit: domain.exec(code)?.[0] ?? null }).toEqual({ path, hit: null });
    }
  });
});
