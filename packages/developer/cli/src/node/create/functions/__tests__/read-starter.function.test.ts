/**
 * Stackra file contract:
 * Purpose: unit tests of `readStarter`: a template checkout is read through git (tracked and untracked files, never the ignored
 *          ones, a tracked file deleted from the working tree skipped), a folder that is not a git checkout is refused with the
 *          fix, and a file is handed to `starterTarball` as a packed `@stackra/starter`.
 * Boundary: test only; a throwaway git repository under the OS temp folder, and `starterTarball` replaced by a marker.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0515; STA-1952 spec FR-006.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { readStarter } from "#node/create/functions/read-starter.function";

const { starterTarball } = vi.hoisted(() => ({
  starterTarball: vi.fn((_bytes: Uint8Array) => new Map([["from-tarball", new Uint8Array([1])]])),
}));
vi.mock("#node/create/functions/starter-tarball.function", () => ({ starterTarball }));

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-read-starter-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** Writes `files` (path to text) under `root`. */
const write = (files: Record<string, string>): void => {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
};

const git = (...args: string[]): void => {
  execFileSync("git", ["-C", root, ...args], { stdio: "ignore" });
};

const text = (files: Map<string, Uint8Array>, path: string): string =>
  new TextDecoder().decode(files.get(path));

describe("readStarter", () => {
  it("reads a checkout's tracked and untracked files and leaves out the ignored ones", () => {
    git("init", "-q");
    write({
      ".gitignore": "node_modules\n",
      "package.json": '{"name":"acme"}',
      "apps/console/src/main.ts": "export {};\n",
      "node_modules/dep/index.js": "ignored",
    });
    git("add", ".gitignore", "package.json");
    const files = readStarter(root);
    expect([...files.keys()].sort()).toEqual([
      ".gitignore",
      "apps/console/src/main.ts",
      "package.json",
    ]);
    expect(text(files, "package.json")).toBe('{"name":"acme"}');
    expect(starterTarball).not.toHaveBeenCalled();
  });

  it("skips a tracked file that was deleted from the working tree", () => {
    git("init", "-q");
    write({ "keep.txt": "kept", "gone.txt": "gone" });
    git("add", "keep.txt", "gone.txt");
    rmSync(join(root, "gone.txt"));
    expect([...readStarter(root).keys()]).toEqual(["keep.txt"]);
  });

  it("refuses a folder that is not a git checkout, naming what to pass", () => {
    write({ "package.json": "{}" });
    expect(() => readStarter(root)).toThrow(
      /is not a git checkout; pass a template checkout or a starter \.tgz/,
    );
  });

  it("hands a file to starterTarball as a packed starter", () => {
    write({ "starter.tgz": "packed bytes" });
    const files = readStarter(join(root, "starter.tgz"));
    expect([...files.keys()]).toEqual(["from-tarball"]);
    expect(starterTarball).toHaveBeenCalledTimes(1);
    expect(new TextDecoder().decode(starterTarball.mock.calls[0]?.[0] ?? new Uint8Array())).toBe(
      "packed bytes",
    );
  });
});
