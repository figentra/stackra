/**
 * Stackra file contract:
 * Purpose: hold `vault-keeper.mjs` to its contract (ADR 0480): the preflight lists every declared secret by NAME as
 *          present, missing or placeholder; generate and rotate write a random value blind, refuse the wrong one of
 *          the two, and need the owner's one-time token for prod; no value reaches the output or the runner's argv.
 * Boundary: a throwaway HOME and an in-memory Infisical runner; the real vault is never touched.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0257; ADR 0480.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";
import { STORE_KIT, declared, main } from "../vault-keeper.mjs";

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
  assert.ok(names.some((d) => d.name === "CLOUDFLARE_API_TOKEN" && d.path === "/ci"));
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
    ["generate", "STACKRA_WEBHOOK_SECRET", "--env", "dev", "--path", "/ci"],
    fake,
  );
  assert.equal(first.code, 0, first.out);
  assert.match(first.out, /STACKRA_WEBHOOK_SECRET  dev:\/ci  created/);
  const v1 = fake.store.get("dev:/ci:STACKRA_WEBHOOK_SECRET");
  assert.equal(Buffer.from(v1, "base64url").length, 32);

  const again = await run(
    ["generate", "STACKRA_WEBHOOK_SECRET", "--env", "dev", "--path", "/ci"],
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
  const args = ["generate", "STACKRA_SESSION_SECRET", "--env", "prod", "--path", "/ci"];
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
    (await run(["generate", "STACKRA_X", "--env", "dev", "--path", "/ci", "--rotate"], fake)).out,
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
