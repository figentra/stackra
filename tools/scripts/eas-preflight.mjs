#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm eas:preflight` — the checks before a local EAS build (`eas build --local`), and the record after it
 *   (STA-1577).
 *     check  --platform ios|android [--deployed-sha <sha>]
 *            refuses a dirty tree, a HEAD that is not the deployed sha, and too little free disk (25 GB for iOS,
 *            10 GB for Android). The deployed sha is `--deployed-sha`, else `STACKRA_DEPLOYED_SHA`, else the head of
 *            origin/main, which is what `pnpm runway deploy` ships to Workers. The backend's deployed sha is not
 *            knowable yet (Encore deploy, STA-136), so pass it explicitly when the backend matters.
 *     record --platform ios|android --build-id <id> [--rollout-id <id>] [--profile <name>]
 *            appends one JSON line `{ at, platform, profile, sha, buildId, rolloutId }` to
 *            `.stackra/releases/eas-builds.jsonl` (git-ignored, per machine), so a build id sits next to the rollout
 *            id that shipped it.
 * Boundary: runs git and reads the file system; never runs eas, reads no secret and writes only the record file.
 * Runtime: node
 * Governing contract: ADR 0180 (mobile builds and updates); ADR 0170 (deploy from a commit of main); STA-1577.
 * Secrets: none.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, statfsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const GB = 1024 ** 3;
/** Free disk a local build needs: Xcode archives and DerivedData are far larger than a Gradle build. */
export const MIN_FREE_BYTES = { ios: 25 * GB, android: 10 * GB };
export const RECORD_PATH = ".stackra/releases/eas-builds.jsonl";
const USAGE =
  "usage: pnpm eas:preflight check --platform ios|android [--deployed-sha <sha>] | record --platform ios|android --build-id <id> [--rollout-id <id>] [--profile <name>]";

/** Every reason a local build must not start; empty when it may. */
export function problems({ platform, dirty, head, deployedSha, freeBytes }) {
  const out = [];
  if (!(platform in MIN_FREE_BYTES)) return [`unknown platform "${platform}" (ios or android)`];
  if (dirty) out.push("the working tree has uncommitted changes; build from a clean checkout");
  if (head !== deployedSha)
    out.push(
      `HEAD ${head} is not the deployed sha ${deployedSha}; check out the deployed commit or pass --deployed-sha`,
    );
  const need = MIN_FREE_BYTES[platform];
  if (freeBytes < need)
    out.push(
      `${(freeBytes / GB).toFixed(1)} GB free; a local ${platform} build needs ${need / GB} GB`,
    );
  return out;
}

/** The JSON line `record` appends. */
export function recordLine({ at, platform, profile, sha, buildId, rolloutId }) {
  if (!buildId) throw new Error("--build-id is required");
  return `${JSON.stringify({ at, platform, profile: profile ?? null, sha, buildId, rolloutId: rolloutId ?? null })}\n`;
}

const git = (args) =>
  execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

function main(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      platform: { type: "string" },
      "deployed-sha": { type: "string" },
      "build-id": { type: "string" },
      "rollout-id": { type: "string" },
      profile: { type: "string" },
    },
  });
  const [command] = positionals;
  const head = git(["rev-parse", "HEAD"]);
  if (command === "check") {
    let deployedSha = values["deployed-sha"] ?? process.env.STACKRA_DEPLOYED_SHA;
    if (!deployedSha) {
      git(["fetch", "--quiet", "origin", "main"]);
      deployedSha = git(["rev-parse", "origin/main"]);
      console.log(
        `deployed sha: head of origin/main ${deployedSha} (backend sha unknown until STA-136)`,
      );
    }
    const { bavail, bsize } = statfsSync(ROOT);
    const found = problems({
      platform: values.platform,
      dirty: git(["status", "--porcelain"]) !== "",
      head,
      deployedSha: git(["rev-parse", deployedSha]),
      freeBytes: Number(bavail) * Number(bsize),
    });
    for (const line of found) console.error(`eas-preflight: ${line}`);
    if (found.length) process.exit(1);
    console.log(`eas-preflight: ok, ${values.platform} at ${head}`);
    return;
  }
  if (command === "record") {
    if (!(values.platform in MIN_FREE_BYTES)) throw new Error(USAGE);
    const path = join(ROOT, RECORD_PATH);
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(
      path,
      recordLine({
        at: new Date().toISOString(),
        platform: values.platform,
        profile: values.profile,
        sha: head,
        buildId: values["build-id"],
        rolloutId: values["rollout-id"],
      }),
    );
    console.log(`recorded in ${RECORD_PATH}`);
    return;
  }
  throw new Error(USAGE);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`eas-preflight: ${error.message}`);
    process.exit(1);
  }
}
