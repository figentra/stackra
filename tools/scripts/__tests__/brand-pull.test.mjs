/**
 * Stackra file contract:
 * Purpose: hold `brand-pull.mjs` to its contract: a missing checkout fails with the fix, a pinned file is copied from
 *          the pinned commit (not the working tree), a JSON row is written, and a second pull at the same sha skips.
 * Boundary: builds a throwaway git repo in a temp directory; never reads the real figentra/brand checkout.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); figentra/brand rules §32; STA-1371.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { brandPull } from "../brand-pull.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "brand-pull-"));
  const repo = join(root, "brand");
  mkdirSync(join(repo, "brands/x/logo"), { recursive: true });
  const git = (...args) =>
    execFileSync("git", ["-C", repo, "-c", "user.name=t", "-c", "user.email=t@t", ...args], {
      encoding: "utf8",
    });
  git("init", "-q");
  writeFileSync(join(repo, "brands/x/logo/mark.svg"), "<svg>pinned</svg>");
  git("add", ".");
  git("commit", "-qm", "pin");
  const sha = git("rev-parse", "--short", "HEAD").trim();
  writeFileSync(join(repo, "brands/x/logo/mark.svg"), "<svg>moved on</svg>");
  const app = join(root, "app");
  mkdirSync(app);
  const files = [
    { to: "mark.svg", from: "logo/mark.svg" },
    { to: "x.icon/icon.json", json: { groups: [] } },
  ];
  writeFileSync(
    join(app, "brand.json"),
    JSON.stringify({ brand: "x", sha, source: "local", out: "public/brand", files }),
  );
  return { repo, app };
}

test("fails loudly with the fix when the checkout is missing", () => {
  const { app } = fixture();
  assert.throws(
    () => brandPull({ appDir: app, repo: "/nowhere" }),
    /no figentra\/brand checkout.*brand:pull/,
  );
});

test("copies from the pinned commit, writes json rows, then skips at the same sha", () => {
  const { repo, app } = fixture();
  assert.deepEqual(brandPull({ appDir: app, repo }), { pulled: 2, skipped: false });
  assert.equal(readFileSync(join(app, "public/brand/mark.svg"), "utf8"), "<svg>pinned</svg>");
  assert.deepEqual(JSON.parse(readFileSync(join(app, "public/brand/x.icon/icon.json"), "utf8")), {
    groups: [],
  });
  assert.deepEqual(brandPull({ appDir: app, repo }), { pulled: 0, skipped: true });
});
