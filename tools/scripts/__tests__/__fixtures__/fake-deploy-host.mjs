/**
 * Stackra file contract:
 * Purpose: a fake box for stackra-deploy.mjs: a temporary home, work and approvals folder, and an `io` whose `run`
 *          answers git (the mirror), sudo (the build user's clone, checkout, toolchain and builds: the clone lays a
 *          small tree), the runway render child and wrangler (a deployment state machine: status, versions view and
 *          upload, versions deploy, d1 migrations list and apply), and whose `fetch` answers GitHub's check runs, the
 *          Encore Cloud API and the fake Workers. Every argv, environment, log line and request is recorded so a test
 *          can prove no secret went where it must not.
 * Boundary: test fixture; files only under its own temporary folder; no network, no real git, sudo or wrangler.
 * Runtime: node
 * Governing contract: ADR 0022; ADR 0536.
 */
import {
  chmodSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { generateKeyPairSync } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { fakeWorkers } from "./fake-workers.mjs";

const { registry: fakeRegistry, static: fakeStatic, turboCache: fakeTurboCache } = fakeWorkers;

const REPO_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));
const SHA = "a".repeat(40);
const OLD_SHA = "b".repeat(40);
const OLD = "00000000-0000-4000-8000-000000000001";
const NEW = "00000000-0000-4000-8000-000000000002";
const ACCOUNT = "d861f9ac9df28b7f0b1298cc0c89bc9d";
const CF_TOKEN = "cf-token-value-that-must-never-leak-0123456789";
const TURBO_TOKEN = "turbo-token-value-that-must-never-leak-012345";
const ENCORE_SECRET = "encore-client-secret-that-must-never-leak-0123";
const ENCORE_TOKEN = "encore-access-token-that-must-never-leak-4567";
const D1_ID = "12345678-1234-1234-1234-123456789abc";
const KV_ID = "0123456789abcdef0123456789abcdef";
const PACKAGES = {
  "@stackra/cli": "0.21.0",
  "@stackra/contracts": "0.21.0",
  "@stackra/store": "0.21.0",
};
const TRAINER_UID = 4242;
const APPROVER_UID = 4343;

const LOCK = [
  "---",
  "lockfileVersion: '9.0'",
  "importers:",
  "  .:",
  "    packageManagerDependencies:",
  "      pnpm:",
  "        specifier: 12.16.1",
  "        version: 12.16.1",
  "---",
  "lockfileVersion: '9.0'",
  "settings:",
  "  autoInstallPeers: true",
  "importers:",
  "  .:",
  "    devDependencies:",
  "      turbo:",
  "        specifier: catalog:quality",
  "        version: 2.9.0",
  "  workers/registry:",
  "    dependencies:",
  "      '@stackra/contracts':",
  "        specifier: workspace:*",
  "        version: link:../../packages/foundation/contracts",
  "    devDependencies:",
  "      wrangler:",
  "        specifier: catalog:deploy",
  "        version: 4.148.0(@types/node@26.6.4)",
  "  packages/foundation/contracts:",
  "    dependencies:",
  "      zod:",
  "        specifier: 'catalog:'",
  "        version: 4.0.0",
  "  packages/state/store: {}",
  "packages:",
  "  zod@4.0.0:",
  "    resolution: {integrity: sha512-AAAA}",
  "",
].join("\n");

const WRANGLER_JSONC = `// the registry, as a fixture
{
  "name": "stackra-registry",
  "main": "./dist/main.mjs",
  "account_id": "${ACCOUNT}",
  "d1_databases": [
    { "binding": "DB", "database_name": "stackra-registry", "database_id": "00000000-0000-0000-0000-000000000000", "migrations_dir": "migrations" },
  ],
  "kv_namespaces": [{ "binding": "CACHE", "id": "00000000000000000000000000000000" }],
}
`;

/** A command's answer. */
const answer = (code, stdout = "", stderr = "") => ({ code, stdout, stderr });

/** A file of the repository as git would show it at the deployed SHA; the lockfile is the small fixture. */
const realShow = (path) => {
  if (path === "pnpm-lock.yaml") return LOCK;
  try {
    return readFileSync(join(REPO_ROOT, path), "utf8");
  } catch {
    return null;
  }
};
/** Lays the tree the build user would have cloned and built. */
function layTree(tree, migrations) {
  const put = (path, text) => {
    mkdirSync(join(tree, path, ".."), { recursive: true });
    writeFileSync(join(tree, path), text);
  };
  put("mise.toml", '[tools]\nnode = "24.22.0" # exact\npnpm = "12.16.1"\n');
  put("pnpm-lock.yaml", LOCK);
  put("workers/registry/wrangler.jsonc", WRANGLER_JSONC);
  put("workers/registry/node_modules/wrangler/package.json", '{ "version": "4.148.0" }');
  for (const [file, sql] of Object.entries(migrations))
    put(`workers/registry/migrations/${file}`, sql);
  put("packages/developer/cli/package.json", '{ "name": "@stackra/cli" }');
  put("packages/developer/runway/package.json", '{ "name": "@stackra/runway" }');
  put("packages/foundation/contracts/package.json", '{ "name": "@stackra/contracts" }');
  put("packages/state/store/package.json", '{ "name": "@stackra/store" }');
  put("packages/state/secret/package.json", '{ "name": "@stackra/secret", "private": true }');
}

/**
 * A fake host. `options`: `onMain` (false: the SHA is not on main), `checkRuns` (GitHub's answer), `pending` and
 * `migrations` (D1), `registryBreaks` (a Set, or a function of the version the request targets), `oldMessage`,
 * `deployFails` (a percent whose `versions deploy` fails), `encore` (the Encore fake's script).
 */
function fakeHost(options = {}) {
  const dir = mkdtempSync(join(tmpdir(), "stackra-deploy-test-"));
  const home = join(dir, "home");
  const work = join(dir, "work");
  const approvals = join(dir, "approvals");
  const boxGreen = join(dir, "box-green");
  const etc = join(dir, "etc");
  for (const d of [home, work, approvals, boxGreen, etc])
    mkdirSync(d, { recursive: true, mode: 0o700 });
  chmodSync(home, 0o700);
  const secret = (name, value) => {
    const path = join(etc, name);
    writeFileSync(path, `${value}\n`, { mode: 0o400 });
    return path;
  };
  const files = {
    cloudflare: secret("cloudflare.token", CF_TOKEN),
    turbo: secret("turbo.token", TURBO_TOKEN),
    encore: secret(
      "encore.json",
      JSON.stringify({ client_id: "client-1", client_secret: ENCORE_SECRET }),
    ),
  };
  const vars = join(etc, "vars.json");
  writeFileSync(
    vars,
    JSON.stringify({
      REGISTRY_D1_DATABASE_ID: D1_ID,
      REGISTRY_KV_NAMESPACE_ID: KV_ID,
      REGISTRY_READ_ONLY: "",
    }),
    { mode: 0o600 },
  );
  const env = {
    STACKRA_DEPLOY_HOME: home,
    STACKRA_DEPLOY_MIRROR: join(dir, "mirror.git"),
    STACKRA_DEPLOY_WORK: work,
    STACKRA_DEPLOY_APPROVALS: approvals,
    STACKRA_DEPLOY_BOX_GREEN_DIR: boxGreen,
    STACKRA_DEPLOY_BOX: "box-test",
    STACKRA_DEPLOY_WORKERS: "on",
    STACKRA_DEPLOY_ENCORE: "on",
    STACKRA_DEPLOY_BUILD_AS: "stackra-deploy-build",
    STACKRA_DEPLOY_BUILD_HOME: "/home/stackra-deploy-build",
    STACKRA_DEPLOY_CLOUDFLARE_TOKEN_FILE: files.cloudflare,
    STACKRA_DEPLOY_CLOUDFLARE_ACCOUNT_ID: ACCOUNT,
    STACKRA_DEPLOY_TURBO_TOKEN_FILE: files.turbo,
    STACKRA_DEPLOY_WORKER_VARS_FILE: vars,
    STACKRA_DEPLOY_ENCORE_CLIENT_FILE: files.encore,
    STACKRA_DEPLOY_ENCORE_URL: "https://staging.stackra.test",
    STACKRA_DEPLOY_HOLD_SECONDS: "0",
    STACKRA_DEPLOY_PROPAGATION_SECONDS: "0",
    STACKRA_DEPLOY_POLL_SECONDS: "0",
    STACKRA_DEPLOY_READY_SECONDS: "0",
    STACKRA_DEPLOY_BOX_GREEN_OWNER: "trainer",
    STACKRA_DEPLOY_APPROVER: "approver",
    ...options.env,
  };

  const calls = [];
  const logs = [];
  const fetches = [];
  let clock = Date.parse("2026-11-25T08:00:00Z");
  const wrangler = {
    deployment: [{ version: OLD, percent: 100 }],
    messages: { [OLD]: options.oldMessage ?? OLD_SHA },
    pending: options.pending ?? [],
    applied: [],
    deploys: [],
    uploads: 0,
  };
  const migrations = options.migrations ?? {};
  const uid = process.getuid();

  const runWrangler = (args) => {
    const at = args.indexOf("--config");
    const a = at === -1 ? args : args.slice(0, at);
    const key = a.slice(0, 2).join(" ");
    if (key === "deployments status")
      return answer(
        0,
        `banner\n${JSON.stringify({ versions: wrangler.deployment.map((v) => ({ version_id: v.version, percentage: v.percent })) })}`,
      );
    if (key === "versions view")
      return answer(
        0,
        JSON.stringify({ annotations: { "workers/message": wrangler.messages[a[2]] ?? "" } }),
      );
    if (key === "d1 migrations" && a[2] === "list")
      return answer(
        0,
        wrangler.pending.length === 0
          ? "✅ No migrations to apply!"
          : `Migrations to be applied:\n${wrangler.pending.map((p) => `│ ${p} │`).join("\n")}`,
      );
    if (key === "d1 migrations" && a[2] === "apply") {
      wrangler.applied.push(...wrangler.pending);
      wrangler.pending = [];
      return answer(0, "applied");
    }
    if (key === "versions upload") {
      wrangler.uploads += 1;
      wrangler.messages[NEW] = a[a.indexOf("--message") + 1];
      return answer(0, `Uploaded stackra-registry\nWorker Version ID: ${NEW}\n`);
    }
    if (key === "versions deploy") {
      const split = a.slice(2).filter((x) => /@\d+$/.test(x));
      wrangler.deploys.push(split.join(" "));
      const newShare = split.find((x) => x.startsWith(NEW))?.split("@")[1];
      if (options.deployFails !== undefined && Number(newShare) === options.deployFails)
        return answer(1, "", "deploy failed");
      wrangler.deployment = split.map((x) => {
        const [version, percent] = x.split("@");
        return { version, percent: Number(percent) };
      });
      return answer(0, "deployed");
    }
    return answer(1, "", `unknown wrangler call ${a.join(" ")}`);
  };

  const run = async (command, args, opts = {}) => {
    calls.push({
      command,
      args: [...args],
      env: { ...opts.env },
      cwd: opts.cwd,
      input: opts.input,
    });
    if (command === "git") {
      const a = args.slice(2);
      if (a[0] === "init" || a[0] === "fetch") return answer(0);
      if (a[0] === "rev-parse") return answer(0, `${options.head ?? SHA}\n`);
      if (a[0] === "merge-base") return answer(options.onMain === false ? 1 : 0);
      if (a[0] === "show") {
        const text = realShow(a[1].split(":").slice(1).join(":"));
        return text === null ? answer(128, "", "no such path") : answer(0, text);
      }
      if (a[0] === "diff") return answer(0, (options.changed ?? []).join("\n"));
      return answer(1, "", `unknown git ${a.join(" ")}`);
    }
    if (command === "sudo") {
      const inner = args.slice(args.indexOf("-i") + 1).filter((x) => !/^[A-Z_]+=/.test(x));
      const [tool, ...rest] = inner;
      if (tool === "git" && rest.includes("clone")) {
        layTree(rest.at(-1), migrations);
        return answer(0);
      }
      if (tool === "node" && rest[0] === "--version") return answer(0, "v24.22.0\n");
      if (tool === "pnpm" && rest[0] === "--version") return answer(0, "12.16.1\n");
      return answer(options.buildFails === inner.join(" ") ? 1 : 0, "", "built");
    }
    if (command === process.execPath && args[0] === "--input-type=module") {
      const input = JSON.parse(opts.input);
      const config = JSON.parse(input.config);
      const member = input.target.members[input.member];
      return answer(
        0,
        JSON.stringify({
          ...config,
          workers_dev: false,
          routes: (member.customDomains ?? []).map((pattern) => ({ pattern, custom_domain: true })),
        }),
      );
    }
    if (command === process.execPath && String(args[0]).endsWith("wrangler.js"))
      return runWrangler(args.slice(1));
    return answer(127, "", `unknown command ${command}`);
  };

  // The Workers answer as the version a request targets: the override names it, none means what serves at 100%.
  const keyPair = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const registryFor = (version) => {
    const breaks =
      typeof options.registryBreaks === "function"
        ? options.registryBreaks(version, wrangler)
        : options.registryBreaks;
    return fakeRegistry({ packages: PACKAGES, breaks: breaks ?? new Set(), keyPair });
  };
  const turbo = fakeTurboCache({ token: TURBO_TOKEN });
  const staticSite = fakeStatic();
  const encore = { rollouts: [], tokens: 0, script: options.encore ?? {} };
  const fetch = async (url, init = {}) => {
    const { host, pathname } = new URL(url);
    const headers = init.headers ?? {};
    fetches.push({ url, method: init.method ?? "GET", headers: { ...headers }, body: init.body });
    if (host === "api.github.com")
      return Response.json({ check_runs: options.checkRuns ?? [verifyRun(SHA, "success")] });
    if (host === "api.encore.dev") return encoreAnswer(encore, pathname, init);
    if (host === "staging.stackra.test") {
      const sha = encore.live;
      const ready = (encore.script.readyFor ?? (() => 200))(sha);
      return new Response("", { status: ready });
    }
    const override = Object.entries(headers).find(
      ([k]) => k.toLowerCase() === "cloudflare-workers-version-overrides",
    )?.[1];
    const version = override ? override.split('"')[1] : wrangler.deployment[0].version;
    if (host === "npm.stackra.figentra.com") return registryFor(version).fetch(url, init);
    if (host === "turbo.stackra.figentra.com") return turbo.fetch(url, init);
    if (host === "static.stackra.figentra.com") return staticSite.fetch(url, init);
    throw new Error(`no fake for ${url}`);
  };

  const io = {
    user: "stackra-deploy",
    uid,
    sudoUser: null,
    now: () => clock,
    sleep: async (ms) => {
      clock += ms;
    },
    fetch,
    run,
    readFile: (path) => readFileSync(path, "utf8"),
    write: (path, text) => writeFileSync(path, text, { mode: 0o600 }),
    append: (path, text) => writeFileSync(path, text, { flag: "a", mode: 0o600 }),
    mkdir: (path) => mkdirSync(path, { recursive: true, mode: 0o700 }),
    remove: () => undefined,
    exists: (path) => {
      try {
        lstatSync(path);
        return true;
      } catch {
        return false;
      }
    },
    list: (path) => {
      try {
        return readdirSync(path).toSorted();
      } catch {
        return [];
      }
    },
    lstat: (path) => {
      const st = lstatSync(path);
      const owner = path.startsWith(boxGreen)
        ? TRAINER_UID
        : path.startsWith(approvals)
          ? APPROVER_UID
          : st.uid;
      return { uid: owner, mode: st.mode, file: st.isFile(), symlink: st.isSymbolicLink() };
    },
    uidOf: (name) =>
      ({ trainer: TRAINER_UID, approver: APPROVER_UID, "stackra-deploy": uid })[name] ?? null,
    which: () => "/usr/bin/tool",
    canSudo: () => true,
    log: (line) => logs.push(line),
  };
  return {
    dir,
    home,
    work,
    approvals,
    boxGreen,
    env,
    io,
    calls,
    logs,
    fetches,
    wrangler,
    encore,
    files,
  };
}

/** A completed stackra/verify check run of the verify App. */
const verifyRun = (sha, conclusion, at = "2026-11-25T07:00:00Z", app = 5_907_714) => ({
  id: 1,
  name: "stackra/verify",
  head_sha: sha,
  status: "completed",
  conclusion,
  completed_at: at,
  app: { id: app },
});

/** The Encore Cloud API fake: token, trigger and get, with the script deciding each rollout's end. */
async function encoreAnswer(encore, pathname, init) {
  if (pathname === "/api/oauth/token") {
    encore.tokens += 1;
    const body = new URLSearchParams(init.body);
    if (body.get("client_secret") !== ENCORE_SECRET)
      return Response.json({ error: "bad" }, { status: 401 });
    return Response.json({ access_token: ENCORE_TOKEN, expires_in: 3600, token_type: "Bearer" });
  }
  if ((init.headers?.authorization ?? "") !== `Bearer ${ENCORE_TOKEN}`)
    return Response.json({ ok: false, error: { code: "unauthenticated" } }, { status: 401 });
  const trigger = /^\/api\/apps\/([^/]+)\/envs\/([^/]+)\/rollouts$/.exec(pathname);
  if (trigger) {
    const { sha } = JSON.parse(init.body);
    const id = `roll_${encore.rollouts.length + 1}`;
    encore.rollouts.push({ id, app: trigger[1], env: trigger[2], sha });
    return Response.json({ ok: true, data: { id, status: "queued", conclusion: "pending" } });
  }
  const get = /^\/api\/apps\/([^/]+)\/rollouts\/([^/]+)$/.exec(pathname);
  if (get) {
    const rollout = encore.rollouts.find((r) => r.id === get[2]);
    const end = (encore.script.endFor ?? (() => "success"))(rollout.sha);
    if (end === "proposed")
      return Response.json({
        ok: true,
        data: { id: rollout.id, status: "running", infra: { status: "proposed" } },
      });
    if (end === "success") encore.live = rollout.sha;
    return Response.json({
      ok: true,
      data: { id: rollout.id, status: "completed", conclusion: end },
    });
  }
  return Response.json({ ok: false }, { status: 404 });
}

/** The fake box, its fixed values (SHAs, versions, the fake secrets) and `verifyRun`. */
export const fakeDeployHost = Object.freeze({
  REPO_ROOT,
  SHA,
  OLD_SHA,
  OLD,
  NEW,
  ACCOUNT,
  CF_TOKEN,
  TURBO_TOKEN,
  ENCORE_SECRET,
  ENCORE_TOKEN,
  D1_ID,
  KV_ID,
  PACKAGES,
  host: fakeHost,
  verifyRun,
});
