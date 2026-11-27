/**
 * Stackra file contract:
 * Purpose: proves the @stackra/starter build (STA-2874): the pinned template commit becomes `dist/template.tgz` holding
 *          every tracked file byte for byte, the ones `pnpm pack` would lose included (`.npmrc`, `.gitignore` files, a
 *          tracked file a `.gitignore` names), the same commit packs to the same bytes, and the build refuses what
 *          `stackra create` could not use: a moving pin, a commit the repository does not serve, a symlink, a
 *          submodule, a commit without `stackra.starter.yaml`, a file `git archive` leaves out.
 * Boundary: unit tier; drives the build through `main` (its one export) against local git repositories served over
 *           file://, so no network is used. `tar` on PATH lists and extracts the archive.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in __tests__); ADR 0515 (decision 3); STA-2874.
 */
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { main } from "../build-starter.mjs";

/** Where the build writes the archive (the package's `files` entry). */
const ARCHIVE = "dist/template.tgz";

const cleanups = [];
afterEach(() => {
  for (const dir of cleanups.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A new temporary folder, removed after the test. */
function temp(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  cleanups.push(dir);
  return dir;
}

const git = (cwd, ...args) =>
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

/** A path longer than a ustar name (100 bytes), so the archive needs a prefix or a pax header. */
const LONG = `apps/console/src/${"deeply-nested-folder/".repeat(5)}a-file-name-long-enough-to-need-pax.ts`;

/** The files of the fixture template. */
const FILES = {
  "stackra.starter.yaml": "version: 1\nrename: []\nprofiles: {}\n",
  ".npmrc": "@stackra:registry=https://npm.stackra.figentra.com/\nengine-strict=true\n",
  ".gitignore": "node_modules/\nnotes.local\n",
  "apps/console/.gitignore": "dist/\n",
  "notes.local": "tracked although .gitignore names it\n",
  "scripts/run.sh": "#!/usr/bin/env bash\necho run\n",
  [LONG]: "export const long = true;\n",
};

/**
 * A template repository with `files`, served over file:// with fetch-by-id allowed (GitHub allows it), and its head.
 * @param {Record<string, string>} files - the tracked files.
 * @param {(dir: string) => void} [extra] - more setup before the commit.
 */
function template(files = FILES, extra) {
  const dir = temp("starter-template-");
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "uploadpack.allowAnySHA1InWant", "true");
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  if (files["scripts/run.sh"]) chmodSync(join(dir, "scripts/run.sh"), 0o755);
  extra?.(dir);
  git(dir, "add", "-A", "-f");
  git(dir, "commit", "-q", "-m", "template");
  return { url: `file://${dir}`, dir, commit: git(dir, "rev-parse", "HEAD") };
}

/** A package root whose package.json pins `repository` at `commit`. */
function pkg(repository, commit) {
  const root = temp("starter-pkg-");
  writeFileSync(
    join(root, "package.json"),
    `${JSON.stringify({ name: "@stackra/starter", stackra: { template: { repository, commit } } }, null, 2)}\n`,
  );
  return root;
}

/** A build of a package pinned to `pin` of `repository`, to run later. */
const build = (repository, pin) => () => main([], { root: pkg(repository, pin), log: () => {} });

/** The archive extracted into a new folder. */
function extract(root) {
  const out = temp("starter-out-");
  execFileSync("tar", ["-xzf", join(root, ARCHIVE), "-C", out]);
  return join(out, "package");
}

describe("@stackra/starter build", () => {
  it("packs every tracked file of the pinned commit, byte for byte, the ones pnpm pack would lose included", () => {
    const repo = template();
    const root = pkg(repo.url, repo.commit);
    const lines = [];
    expect(main([], { root, log: (line) => lines.push(line) })).toBe(0);
    expect(lines.join("\n")).toContain(
      `${Object.keys(FILES).length} files of ${repo.url} at ${repo.commit}`,
    );
    const out = extract(root);
    for (const [path, text] of Object.entries(FILES))
      expect(readFileSync(join(out, path), "utf8"), path).toBe(text);
    expect(statSync(join(out, "scripts/run.sh")).mode & 0o111).not.toBe(0);
    const listed = execFileSync("tar", ["-tzf", join(root, ARCHIVE)], { encoding: "utf8" })
      .split("\n")
      .filter((line) => line !== "" && !line.endsWith("/"))
      .map((line) => line.slice("package/".length));
    expect(listed.sort()).toEqual(Object.keys(FILES).sort());
  });

  it("packs the same commit to the same bytes", () => {
    const repo = template();
    const first = pkg(repo.url, repo.commit);
    const second = pkg(repo.url, repo.commit);
    main([], { root: first, log: () => {} });
    main([], { root: second, log: () => {} });
    expect(readFileSync(join(first, ARCHIVE)).equals(readFileSync(join(second, ARCHIVE)))).toBe(
      true,
    );
  });

  it("refuses a pin that can move or is not a git URL", () => {
    const commit = "a".repeat(40);
    expect(build("https://x/t.git", "main")).toThrow(
      /full 40-character commit id, never a branch or tag/,
    );
    expect(build("https://x/t.git", "d78a4fa")).toThrow(/full 40-character commit id/);
    expect(build("git@x:t.git", commit)).toThrow(/https:\/\/ git URL/);
    const root = temp("starter-pkg-");
    writeFileSync(join(root, "package.json"), "{}\n");
    expect(() => main([], { root, log: () => {} })).toThrow(/stackra.template.repository/);
  });

  it("refuses a commit the repository does not serve, and writes nothing", () => {
    const repo = template();
    const root = pkg(repo.url, "b".repeat(40));
    expect(() => main([], { root, log: () => {} })).toThrow(
      `cannot fetch ${"b".repeat(40)} from ${repo.url}`,
    );
    expect(() => statSync(join(root, ARCHIVE))).toThrow();
  });

  it("packs the pinned commit, not the branch head", () => {
    const repo = template();
    writeFileSync(join(repo.dir, "later.txt"), "after the pin\n");
    git(repo.dir, "add", "-A");
    git(repo.dir, "commit", "-q", "-m", "later");
    const root = pkg(repo.url, repo.commit);
    main([], { root, log: () => {} });
    expect(existsSync(join(extract(root), "later.txt"))).toBe(false);
  });

  it("refuses a symlink, which stackra create cannot write", () => {
    const repo = template(FILES, (dir) =>
      symlinkSync("stackra.starter.yaml", join(dir, "link.yaml")),
    );
    expect(() => main([], { root: pkg(repo.url, repo.commit), log: () => {} })).toThrow(
      /link.yaml is a symlink/,
    );
  });

  it("refuses a submodule", () => {
    const inner = template({ "x.txt": "x\n" });
    const repo = template(FILES, (dir) =>
      git(
        dir,
        "-c",
        "protocol.file.allow=always",
        "submodule",
        "add",
        "-q",
        inner.url,
        "vendor/inner",
      ),
    );
    expect(() => main([], { root: pkg(repo.url, repo.commit), log: () => {} })).toThrow(
      /vendor\/inner is a submodule/,
    );
  });

  it("refuses a commit without stackra.starter.yaml", () => {
    const { "stackra.starter.yaml": _manifest, ...rest } = FILES;
    const repo = template(rest);
    expect(() => main([], { root: pkg(repo.url, repo.commit), log: () => {} })).toThrow(
      /has no stackra.starter.yaml/,
    );
  });

  it("refuses an archive that leaves out a tracked file (export-ignore)", () => {
    const repo = template({ ...FILES, ".gitattributes": "notes.local export-ignore\n" });
    expect(() => main([], { root: pkg(repo.url, repo.commit), log: () => {} })).toThrow(
      /git archive left out 1 tracked files \(an export-ignore attribute\?\): notes.local/,
    );
  });

  it("--bump moves the pin to main, or to the commit given, and builds nothing", () => {
    const repo = template();
    const root = pkg(repo.url, "c".repeat(40));
    const lines = [];
    expect(main(["--bump"], { root, log: (line) => lines.push(line) })).toBe(0);
    expect(
      JSON.parse(readFileSync(join(root, "package.json"), "utf8")).stackra.template.commit,
    ).toBe(repo.commit);
    expect(lines).toEqual([`stackra.template.commit: ${"c".repeat(40)} -> ${repo.commit}`]);
    expect(() => statSync(join(root, ARCHIVE))).toThrow();
    main(["--bump", "--commit", "d".repeat(40)], { root, log: () => {} });
    expect(
      JSON.parse(readFileSync(join(root, "package.json"), "utf8")).stackra.template.commit,
    ).toBe("d".repeat(40));
    expect(() => main(["--bump", "--commit", "main"], { root, log: () => {} })).toThrow(
      /full commit id/,
    );
  });
});
