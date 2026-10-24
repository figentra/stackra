/**
 * Stackra file contract:
 * Purpose: proves ADR 0269 decision 2 for the `.` entry: no workspace package among the runtime or peer dependencies,
 *          no workspace or app import in the source, and no domain vocabulary in the public surface.
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

// @covers sta-348:FR-008
describe("the . entry of @stackra/testing", () => {
  it("depends on no workspace package at runtime", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as Record<
      string,
      Record<string, string> | undefined
    >;
    const runtime = { ...pkg["dependencies"], ...pkg["peerDependencies"] };
    expect(Object.values(runtime).filter((version) => version.startsWith("workspace:"))).toEqual(
      [],
    );
    expect(Object.keys(runtime)).toEqual(["vitest"]);
  });

  it("imports only vitest, node built-ins and its own files", () => {
    expect(sources.length).toBeGreaterThan(0);
    for (const { path, text } of sources) {
      const specifiers = [...text.matchAll(/from "([^"]+)"/g)].map((match) => match[1] ?? "");
      const foreign = specifiers.filter(
        (s) => s !== "vitest" && !s.startsWith("#core/") && !s.startsWith("node:"),
      );
      expect({ path, foreign }).toEqual({ path, foreign: [] });
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
