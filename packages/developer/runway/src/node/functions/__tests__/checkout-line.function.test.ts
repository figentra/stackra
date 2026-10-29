/**
 * Stackra file contract:
 * Purpose: unit tests of `checkoutLine`: a registry line resolves to the highest release of its major, is packed and
 *          unpacked into the folder and becomes a git checkout that excludes installs, native projects and `.stackra/`; a dry run reads the version and plans the rest; a
 *          local checkout is copied without its installs and native projects; a line without a release, another
 *          package or major locally, a malformed line or scope and a folder that is not empty are refused.
 * Boundary: test only; temporary folders and a fake command runner, so nothing reaches npm, tar or git.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0481.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { checkoutLine } from "#node/functions/checkout-line.function";
import { dryRunCommand } from "#node/functions/dry-run-command.function";

const SHA = "c".repeat(40);

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-line-"));
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

/** A runner answering `npm view` with `versions` and `npm pack` with a tarball name. */
function registry(versions: unknown) {
  return dryRunCommand({
    head: SHA,
    answer: (command, args) => {
      if (command !== "npm") return undefined;
      if (args[0] === "view") return JSON.stringify(versions);
      return JSON.stringify([{ filename: "figentra-os-mobile-3.2.0.tgz" }]);
    },
  });
}

describe("checkoutLine", () => {
  it("fetches the highest release of the line's major and makes a git checkout of it", async () => {
    const into = join(root, "mobile");
    const run = registry(["3.0.0", "3.10.1", "3.2.0", "3.11.0-next.1"]);
    const checkout = await checkoutLine({
      line: "os/mobile@3",
      scope: "@figentra",
      into,
      git: true,
      cwd: root,
      run,
    });
    expect(checkout).toMatchObject({
      line: "os/mobile@3",
      major: "3",
      name: "mobile",
      package: "@figentra/os-mobile",
      version: "3.10.1",
      from: "registry",
      dir: into,
      sha: SHA,
    });
    const commands = run.calls.map((call) => [call.command, ...call.args].join(" "));
    expect(commands[0]).toBe("npm view @figentra/os-mobile@3 version --json");
    expect(commands[1]).toMatch(
      /^npm pack @figentra\/os-mobile@3\.10\.1 --pack-destination \S+ --json$/,
    );
    expect(commands[2]).toMatch(
      new RegExp(
        `^tar -xzf \\S+figentra-os-mobile-3\\.2\\.0\\.tgz -C ${into} --strip-components=1 package$`,
      ),
    );
    expect(commands.slice(3).map((command) => command.split(" ").slice(0, 2).join(" "))).toEqual([
      "git init",
      "git add",
      "git -c",
      "git rev-parse",
    ]);
    expect(run.calls.slice(0, 2).map((call) => call.cwd)).toEqual([root, root]);
    expect(run.calls[3]?.cwd).toBe(into);
  });

  it("excludes installs, native projects and .stackra/ from a git checkout's commits", async () => {
    const local = join(root, "os-mobile");
    mkdirSync(local);
    writeFileSync(
      join(local, "package.json"),
      JSON.stringify({ name: "@figentra/os-mobile", version: "3.0.0" }),
    );
    const into = join(root, "checkout");
    // A runner whose `git init` makes the folder a repository, as the real one does.
    const run = dryRunCommand({
      head: SHA,
      answer: (command, args, cwd) => {
        if (command === "git" && args[0] === "init" && cwd !== undefined)
          mkdirSync(join(cwd, ".git"), { recursive: true });
        return undefined;
      },
    });
    await checkoutLine({ line: "os/mobile@3", scope: "@figentra", into, local, git: true, run });
    const exclude = readFileSync(join(into, ".git/info/exclude"), "utf8").split("\n");
    expect(exclude).toEqual(
      expect.arrayContaining(["/node_modules/", "/ios/", "/android/", "/.stackra/"]),
    );
  });

  it("plans a dry run after reading the version, and writes nothing", async () => {
    const into = join(root, "console");
    const run = registry("3.0.4");
    const checkout = await checkoutLine({
      line: "os/console@3",
      scope: "@figentra",
      into,
      dryRun: true,
      run,
    });
    expect(checkout.version).toBe("3.0.4");
    expect(checkout.steps.map((step) => step.args[0])).toEqual(["view", "pack", "-xzf"]);
    expect(run.calls).toHaveLength(1);
    expect(existsSync(into)).toBe(false);
  });

  it("copies a local checkout without its installs and native projects", async () => {
    const local = join(root, "os-mobile");
    for (const folder of ["node_modules/expo", "ios", "src/ios"])
      mkdirSync(join(local, folder), { recursive: true });
    writeFileSync(
      join(local, "package.json"),
      JSON.stringify({ name: "@figentra/os-mobile", version: "3.0.0" }),
    );
    writeFileSync(join(local, "src/ios/screen.ts"), "export {};\n");
    const into = join(root, "out");
    const checkout = await checkoutLine({ line: "os/mobile@3", scope: "@figentra", into, local });
    expect(checkout.from).toBe("local");
    expect(JSON.parse(readFileSync(join(into, "package.json"), "utf8")).version).toBe("3.0.0");
    expect(existsSync(join(into, "src/ios/screen.ts"))).toBe(true);
    expect(existsSync(join(into, "node_modules"))).toBe(false);
    expect(existsSync(join(into, "ios"))).toBe(false);
  });

  it("refuses a line with no release on its major", async () => {
    await expect(
      checkoutLine({
        line: "os/mobile@4",
        scope: "@figentra",
        into: join(root, "x"),
        run: registry([]),
      }),
    ).rejects.toThrow(RunwayUnresolvedError);
  });

  it("refuses another package or major locally, a malformed line or scope, and a folder that is not empty", async () => {
    const local = join(root, "os-landing");
    mkdirSync(local);
    writeFileSync(
      join(local, "package.json"),
      JSON.stringify({ name: "@figentra/os-console", version: "1.0.0" }),
    );
    await expect(
      checkoutLine({ line: "os/landing@2", scope: "@figentra", into: join(root, "a"), local }),
    ).rejects.toThrow(RunwayInvalidError);

    const busy = join(root, "busy");
    mkdirSync(busy);
    writeFileSync(join(busy, "file"), "");
    try {
      await checkoutLine({ line: "OS/console", scope: "figentra", into: busy, local });
      throw new Error("expected a RunwayInvalidError");
    } catch (error) {
      expect(error).toBeInstanceOf(RunwayInvalidError);
      expect((error as RunwayInvalidError).issues.map((issue) => issue.path)).toEqual([
        "line",
        "scope",
        "into",
      ]);
    }
  });
});
