/**
 * Stackra file contract:
 * Purpose: unit tests of `testbedPackageRoot`: it answers the folder holding this package's own package.json (the one
 *          named `@stackra/infra-testbed`), skipping a package.json of another name on the way up, and throws, naming the
 *          package, when no parent holds one.
 * Boundary: test only; `node:fs` is wrapped so a test can make the manifests absent or differently named, and falls
 *           back to the real filesystem otherwise.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0484 (decision 2); ADR 0171 (the program only declares).
 */
import { basename, join } from "node:path";

import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { testbedPackageRoot } from "#node/functions/testbed-package-root.function";

const fs = vi.hoisted(() => ({
  existsSync: vi.fn<(path: string) => boolean>(),
  readFileSync: vi.fn<(path: string, encoding: string) => string>(),
}));

/** The real `node:fs`, which this file's own import of it is not: the mock below replaces that one. */
const actual = await vi.importActual<{
  existsSync: (path: string) => boolean;
  readFileSync: (path: string, encoding: "utf8") => string;
}>("node:fs");
const realExists = actual.existsSync;
const realRead = actual.readFileSync;

vi.mock("node:fs", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  existsSync: fs.existsSync,
  readFileSync: fs.readFileSync,
}));

/** Lets every call through to the real filesystem. */
function useRealFilesystem(): void {
  fs.existsSync.mockImplementation((path) => realExists(path));
  fs.readFileSync.mockImplementation((path, encoding) => realRead(path, encoding as "utf8"));
}

afterEach(() => {
  fs.existsSync.mockReset();
  fs.readFileSync.mockReset();
});

describe("testbedPackageRoot", () => {
  it("answers the folder of this package, the one whose package.json names it", () => {
    useRealFilesystem();
    const root = testbedPackageRoot();
    expect(basename(root)).toBe("infra-testbed");
    const manifest = JSON.parse(realRead(join(root, "package.json"), "utf8")) as { name: string };
    expect(manifest.name).toBe("@stackra/infra-testbed");
  });

  it("skips a package.json of another name on the way up", () => {
    useRealFilesystem();
    const here = testbedPackageRoot();
    // A nearer package.json that belongs to another package (a nested fixture, a copied tree) is not this package.
    const nearer = join(here, "src", "node", "functions", "package.json");
    fs.existsSync.mockImplementation((path) => path === nearer || realExists(path));
    fs.readFileSync.mockImplementation((path) =>
      path === nearer ? '{"name":"@acme/other"}' : realRead(path, "utf8"),
    );
    expect(testbedPackageRoot()).toBe(here);
    expect(fs.readFileSync).toHaveBeenCalledWith(nearer, "utf8");
  });

  it("throws, naming the package, when no parent holds its package.json", () => {
    fs.existsSync.mockReturnValue(false);
    expect(() => testbedPackageRoot()).toThrow("@stackra/infra-testbed package root not found");
  });

  it("throws when every package.json it meets names another package", () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('{"name":"@acme/other"}');
    expect(() => testbedPackageRoot()).toThrow("@stackra/infra-testbed package root not found");
  });
});
