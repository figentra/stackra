/**
 * Stackra file contract:
 * Purpose: unit tests of `watchDevMembers`: an edit under a member's sources reaches the local monolith app after the
 *          quiet period, rewritten; an edit the app does not carry (a test) is ignored; `close` stops the watch.
 * Boundary: test only; a temporary product and the real file watcher.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 3); STA-2840.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { syncDevEncoreApp } from "@stackra/runway/node";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { watchDevMembers } from "#node/dev-root/functions/watch-dev-members.function";
import { captureIo } from "#node/functions/capture-io.function";

let root: string;
let member: string;

/** Writes `content` at `path` under the member. */
function write(path: string, content: string): void {
  mkdirSync(join(member, path, ".."), { recursive: true });
  writeFileSync(join(member, path), content);
}

/** Resolves once `check` holds, or fails after two seconds. */
async function eventually(check: () => boolean): Promise<void> {
  for (let tries = 0; tries < 40 && !check(); tries += 1)
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  expect(check()).toBe(true);
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-dev-watch-"));
  member = join(root, "services", "billing");
  write(
    "package.json",
    JSON.stringify({ name: "@acme/billing", imports: { "#src/*": ["./src/*.ts"] } }),
  );
  write("encore.app", '{ "id": "acme", "lang": "typescript" }\n');
  write("src/a.ts", "export const a = 1;\n");
  syncDevEncoreApp({ repository: root, members: [member] });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("watchDevMembers", () => {
  it("re-syncs an edited member, ignores what the app does not carry, and stops on close", async () => {
    const { io, output } = captureIo();
    const watcher = watchDevMembers({ repository: root, members: [member] }, io, 20);
    const copy = (path: string) => join(root, ".stackra/dev/encore/services/billing", path);
    try {
      write("src/b.ts", 'export * from "#src/a";\n');
      await eventually(() => existsSync(copy("src/b.ts")));
      expect(readFileSync(copy("src/b.ts"), "utf8")).toBe('export * from "./a";\n');
      expect(output()).toContain("synced services/billing");

      write("src/__tests__/b.test.ts", "export {};\n");
      await new Promise((resolve) => {
        setTimeout(resolve, 200);
      });
      expect(existsSync(copy("src/__tests__"))).toBe(false);
    } finally {
      watcher.close();
    }
    write("src/c.ts", "export const c = 3;\n");
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
    expect(existsSync(copy("src/c.ts"))).toBe(false);
  });
});
