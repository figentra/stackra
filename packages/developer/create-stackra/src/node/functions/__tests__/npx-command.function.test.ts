/**
 * Stackra file contract:
 * Purpose: unit tests of `npxCommand`: npm's `npx-cli.js` beside the running Node (POSIX and Windows layouts), the one
 *          beside `npm_execpath`, the `npx` on the PATH, and no answer on Windows without a script.
 * Boundary: pure function under test; the file probe is a fake.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27); ADR 0022 (test placement).
 */
import { join } from "node:path";

import { npxCommand } from "#node/functions/npx-command.function";

const probe =
  (...present: string[]) =>
  (path: string) =>
    present.includes(path);

describe("npxCommand", () => {
  it("runs the npx-cli.js of the npm installed with this Node", () => {
    const posix = join("/opt/node/bin", "..", "lib", "node_modules", "npm", "bin", "npx-cli.js");
    expect(
      npxCommand({
        env: {},
        execPath: "/opt/node/bin/node",
        platform: "linux",
        exists: probe(posix),
      }),
    ).toEqual({ command: "/opt/node/bin/node", args: [posix] });

    const windows = join("/node", "node_modules", "npm", "bin", "npx-cli.js");
    expect(
      npxCommand({
        env: {},
        execPath: "/node/node.exe",
        platform: "win32",
        exists: probe(windows),
      }),
    ).toEqual({ command: "/node/node.exe", args: [windows] });
  });

  it("falls back to the npx beside npm_execpath, then to npx on the PATH", () => {
    const npmBin = "/home/me/.npm-global/lib/node_modules/npm/bin";
    expect(
      npxCommand({
        env: { npm_execpath: `${npmBin}/npm-cli.js` },
        execPath: "/usr/bin/node",
        platform: "darwin",
        exists: probe(join(npmBin, "npx-cli.js")),
      }),
    ).toEqual({ command: "/usr/bin/node", args: [join(npmBin, "npx-cli.js")] });

    expect(
      npxCommand({
        env: { npm_execpath: "/usr/lib/pnpm/bin/pnpm.cjs" },
        execPath: "/usr/bin/node",
        platform: "linux",
        exists: probe(),
      }),
    ).toEqual({ command: "npx", args: [] });
  });

  it("gives no command on Windows when npx-cli.js is missing (a .cmd needs a shell)", () => {
    expect(
      npxCommand({ env: {}, execPath: "C:/node/node.exe", platform: "win32", exists: probe() }),
    ).toBeUndefined();
  });
});
