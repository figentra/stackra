/**
 * Stackra file contract:
 * Purpose: hold `vault-keeper.mjs` to its contract (ADR 0480): the preflight lists every declared secret by NAME as
 *          present, missing or placeholder; generate and rotate write a random value blind, refuse the wrong one of
 *          the two, and need the owner's one-time token for prod; `importSecret`, the Infisical import core moved
 *          here from secrets-import (ADR 0525), streams a value in; no value reaches the output or the runner's argv.
 * Boundary: a throwaway HOME and an in-memory Infisical runner; the real vault is never touched.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0257; ADR 0480.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";
import { STORE_KIT, ciHome, declared, importSecret, main } from "../vault-keeper.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const fixedNow = () => 1_800_000_000_000;
const canary = () => `fake-${randomBytes(12).toString("hex")}`;
const flag = (args, k) => args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];

/** In-memory Infisical: `export --format=json`, `secrets get`, `secrets set NAME=@file`. */
function fakeInfisical(seed = {}) {
  const store = new Map(Object.entries(seed));
  const calls = [];
  const runner = (args) => {
    calls.push(args);
    const scope = `${flag(args, "env")}:${flag(args, "path")}`;
    if (args[0] === "export") {
      const rows = [...store]
        .filter(([k]) => k.startsWith(`${scope}:`))
        .map(([k, value]) => ({ key: k.split(":").at(-1), value }));
      return { status: 0, stdout: JSON.stringify(rows), stderr: "" };
    }
    if (args[1] === "get") {
      const v = store.get(`${scope}:${args[2]}`);
      const row =
        v === undefined
          ? { secretKey: args[2], secretValue: "*not found*", type: "*not found*" }
          : { secretKey: args[2], secretValue: v };
      return { status: 0, stdout: JSON.stringify([row]), stderr: "" };
    }
    if (args[1] === "set" && args.includes("--help"))
      return { status: 0, stdout: "set <secretName=@/path/to/file>", stderr: "" };
    if (args[1] === "set") {
      const [name, file] = args[2].split("=@");
      store.set(`${scope}:${name}`, readFileSync(file, "utf8"));
      return { status: 0, stdout: "ok", stderr: "" };
    }
    return { status: 2, stdout: "", stderr: "" };
  };
  return { store, calls, runner };
}

async function run(argv, fake, { home = mkdtempSync(join(tmpdir(), "vault-test-")), now } = {}) {
  let out = "";
  const code = await main(argv, {
    runner: fake.runner,
    home,
    root: ROOT,
    now,
    write: (s) => (out += s),
  });
  return { code, out, home };
}

/** A throwaway product repository: core's CI secret names plus one mobile app whose store.yaml names review secrets. */
function productRoot() {
  const dir = mkdtempSync(join(tmpdir(), "vault-product-"));
  writeFileSync(
    join(dir, "runway.yaml"),
    stringify({
      environments: { dev: { destinations: {} }, production: { destinations: {} } },
      providers: { infisical: { paths: { ci: "/ci" } } },
      secrets: { ci: ["CLOUDFLARE_API_TOKEN", "MINTLIFY_ADMIN_KEY"] },
      mobile: { app: { template: "os/mobile@3", store: "assets/store/app" } },
    }),
  );
  mkdirSync(join(dir, "assets/store/app"), { recursive: true });
  writeFileSync(
    join(dir, "assets/store/app/store.yaml"),
    stringify({ review: { contact: { phoneSecret: "STORE_REVIEW_CONTACT_PHONE" } } }),
  );
  return dir;
}

test("declared: runway CI names and, for prod with mobile apps, the root kit and each app's review secrets", () => {
  const root = productRoot();
  const names = declared("prod", { root });
  assert.ok(
    names.some(
      (d) => d.name === "CLOUDFLARE_API_TOKEN" && d.project === "ci-deploy" && d.path === "/ci",
    ),
  );
  for (const n of STORE_KIT)
    assert.ok(
      names.some((d) => d.name === n && d.path === "/ci/store"),
      n,
    );
  assert.ok(
    names.some((d) => d.name === "STORE_REVIEW_CONTACT_PHONE" && d.why === "store review app"),
  );
  assert.ok(!declared("dev", { root }).some((d) => d.path === "/ci/store"));
  // Core itself declares no mobile app (ADR 0441): no store kit.
  assert.ok(!declared("prod", { root: ROOT }).some((d) => d.path === "/ci/store"));
});

test("preflight: present, missing and placeholder by name; values never printed", async () => {
  const values = [canary(), canary()];
  const fake = fakeInfisical({
    "prod:/ci:CLOUDFLARE_API_TOKEN": values[0],
    "prod:/ci:MINTLIFY_ADMIN_KEY": "placeholder",
    "prod:/ci/store:ASC_API_KEY_ID": values[1],
  });
  const { code, out } = await run(["preflight", "--env", "prod", "--root", productRoot()], fake);
  assert.equal(code, 1);
  assert.match(out, /^present +CLOUDFLARE_API_TOKEN  prod:\/ci/m);
  assert.match(out, /^placeholder +MINTLIFY_ADMIN_KEY/m);
  assert.match(
    out,
    /^missing +GOOGLE_PLAY_SERVICE_ACCOUNT_JSON  prod:\/ci\/store  \(store root kit\)/m,
  );
  assert.match(
    out,
    /^placement: CI reads prod secrets only in the GitHub environment `production`$/m,
  );
  for (const v of values) assert.ok(!out.includes(v));
});

test("generate creates a random value blind; a second generate is refused; --rotate replaces it", async () => {
  const fake = fakeInfisical();
  const first = await run(
    [
      "generate",
      "STACKRA_WEBHOOK_SECRET",
      "--env",
      "dev",
      "--path",
      "/ci",
      "--project",
      "ci-deploy",
    ],
    fake,
  );
  assert.equal(first.code, 0, first.out);
  assert.match(first.out, /STACKRA_WEBHOOK_SECRET  ci-deploy\/dev:\/ci  created/);
  const v1 = fake.store.get("dev:/ci:STACKRA_WEBHOOK_SECRET");
  assert.equal(Buffer.from(v1, "base64url").length, 32);

  const again = await run(
    [
      "generate",
      "STACKRA_WEBHOOK_SECRET",
      "--env",
      "dev",
      "--path",
      "/ci",
      "--project",
      "ci-deploy",
    ],
    fake,
  );
  assert.equal(again.code, 1);
  assert.match(again.out, /exists; pass --rotate/);

  const rot = await run(
    [
      "generate",
      "STACKRA_WEBHOOK_SECRET",
      "--env",
      "dev",
      "--path",
      "/ci",
      "--project",
      "ci-deploy",
      "--rotate",
      "--encoding",
      "hex",
    ],
    fake,
  );
  assert.equal(rot.code, 0, rot.out);
  const v2 = fake.store.get("dev:/ci:STACKRA_WEBHOOK_SECRET");
  assert.notEqual(v1, v2);
  assert.match(v2, /^[0-9a-f]{64}$/);
  for (const v of [v1, v2]) {
    assert.ok(![first.out, again.out, rot.out].some((o) => o.includes(v)), "value in output");
    assert.ok(!JSON.stringify(fake.calls).includes(v), "value on argv");
  }
});

test("prod generate needs the dry run's one-time token, bound to the operation", async () => {
  const fake = fakeInfisical();
  const home = mkdtempSync(join(tmpdir(), "vault-test-"));
  const args = [
    "generate",
    "STACKRA_SESSION_SECRET",
    "--env",
    "prod",
    "--path",
    "/ci",
    "--project",
    "ci-deploy",
  ];
  const refused = await run(args, fake, { home, now: fixedNow });
  assert.equal(refused.code, 1);
  assert.match(refused.out, /needs --confirm/);
  const dry = await run([...args, "--dry-run"], fake, { home, now: fixedNow });
  const token = dry.out.match(/--confirm (\S+)/)[1];
  const wrongOp = await run([...args, "--bytes", "64", "--confirm", token], fake, {
    home,
    now: fixedNow,
  });
  assert.match(wrongOp.out, /does not match/);
  const ok = await run([...args, "--confirm", token], fake, { home, now: fixedNow });
  assert.equal(ok.code, 0, ok.out);
  assert.ok(fake.store.has("prod:/ci:STACKRA_SESSION_SECRET"));
  const replay = await run([...args, "--rotate", "--confirm", token], fake, {
    home,
    now: fixedNow,
  });
  assert.equal(replay.code, 1);
});

test("rotate refuses a secret that does not exist; bad flags are refused without echo", async () => {
  const fake = fakeInfisical();
  assert.match(
    (
      await run(
        [
          "generate",
          "STACKRA_X",
          "--env",
          "dev",
          "--path",
          "/ci",
          "--project",
          "ci-build",
          "--rotate",
        ],
        fake,
      )
    ).out,
    /nothing to rotate/,
  );
  const pasted = canary();
  const bad = await run(["generate", "STACKRA_X", "--env", "dev", `--value=${pasted}`], fake);
  assert.equal(bad.code, 2);
  assert.ok(!bad.out.includes(pasted));
  assert.equal(
    (await run(["generate", "STACKRA_X", "--env", "dev", "--bytes", "8"], fake)).code,
    2,
  );
});

test("ciHome: build tokens live in ci-build, every other CI name in ci-deploy /ci (ADR 0512)", () => {
  assert.deepEqual(ciHome("TURBO_TOKEN"), { project: "ci-build", path: "/ci/turbo" });
  assert.deepEqual(ciHome("UNIWIND_AUTH_TOKEN"), { project: "ci-build", path: "/ci" });
  assert.deepEqual(ciHome("STACKRA_REGISTRY_TOKEN"), {
    project: "ci-build",
    path: "/ci/registry",
  });
  assert.deepEqual(ciHome("MINTLIFY_ADMIN_KEY"), { project: "ci-deploy", path: "/ci" });
});

test("importSecret streams a value in and returns only { name, ok, reason }", async () => {
  const home = mkdtempSync(join(tmpdir(), "vault-import-test-"));
  const v = canary();
  const fake = fakeInfisical();
  const base = { home, runner: fake.runner, actor: "request-page" };
  const ok = await importSecret({ ...base, name: "STREAMED_KEY", valueStream: Readable.from([v]) });
  assert.deepEqual(ok, { name: "STREAMED_KEY", ok: true });
  assert.equal(fake.store.get("dev:/agents:STREAMED_KEY"), v);

  const prod = await importSecret({
    ...base,
    name: "PROD_STREAM",
    project: "ci-deploy",
    env: "prod",
    path: "/ci",
    valueStream: Readable.from([v]),
  });
  assert.equal(prod.ok, false);
  assert.match(prod.reason, /needs --confirm/);

  const big = await importSecret({
    ...base,
    name: "BIG_STREAM",
    valueStream: Readable.from([Buffer.alloc(64 * 1024 + 1, 120)]),
  });
  assert.deepEqual(big, { name: "BIG_STREAM", ok: false, reason: "larger than 65536 bytes" });

  const bad = await importSecret({ ...base, name: v, valueStream: Readable.from([v]) });
  assert.deepEqual(bad, {
    name: "(invalid name)",
    ok: false,
    reason: "name is not SCREAMING_SNAKE",
  });
  assert.ok(!JSON.stringify([ok, prod, big, bad]).includes(v), "value in a result");
  assert.ok(!JSON.stringify(fake.calls).includes(v), "value on argv");
  assert.ok(
    !readFileSync(join(home, ".stackra", "secrets-audit.log"), "utf8").includes(v),
    "value in the log",
  );
});

test("importSecret refuses a symlinked inbox before creating its temp dir (STA-192)", async () => {
  const home = mkdtempSync(join(tmpdir(), "vault-import-link-"));
  const elsewhere = join(home, "elsewhere");
  mkdirSync(elsewhere);
  symlinkSync(elsewhere, join(home, "Secrets-inbox"));
  const fake = fakeInfisical();
  const r = await importSecret({
    name: "LINKED_INBOX",
    valueStream: Readable.from([canary()]),
    home,
    runner: fake.runner,
  });
  assert.deepEqual(r, { name: "LINKED_INBOX", ok: false, reason: "inbox is not a real directory" });
  assert.deepEqual(readdirSync(elsewhere), []);
  assert.equal(fake.calls.length, 0);
});
