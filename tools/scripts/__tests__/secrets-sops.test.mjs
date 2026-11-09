/**
 * Stackra file contract:
 * Purpose: hold the SOPS secrets scripts to their contract (ADR 0525): `secrets-sops.mjs` (publish, scopes, names),
 *          `secrets-put`, `secrets-generate` (an ed25519 name rotates as a new pair), `secrets-import --scope`, `secrets-catalog`
 *          and `secrets-age-init` (`secrets-exec` has its own file). Every path asserts that no canary value reaches
 *          the output, the audit log, any CLI's argv or a written file.
 * Boundary: a throwaway HOME and a fake sops, git, gh and age-keygen runner; no real repository, key or vault.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy); ADR 0525; ADR 0257.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { SCOPE_RX, checkTarget, cliFailure, miseWhich, publish } from "../secrets-sops.mjs";
import { main as put } from "../secrets-put.mjs";
import {
  ed25519Pair,
  generateValue,
  keyIdFor,
  main as generate,
  missingEntries,
  vapidPair,
} from "../secrets-generate.mjs";
import { main as importMain } from "../secrets-import.mjs";
import { buildCatalog, checkCatalog, declaredNames } from "../secrets-catalog.mjs";
import { main as ageInit } from "../secrets-age-init.mjs";

const canary = () => `fake-${randomBytes(12).toString("hex")}`;
const home = () => mkdtempSync(join(tmpdir(), "secrets-sops-test-"));
const AGENT = { STACKRA_AGENT: "test-agent" };
const OWNER = {};

/**
 * A fake for every CLI the scripts call. sops "encrypts" to a fixed text that never holds the plaintext, and keeps the
 * plaintext in a map so `decrypt` can return it; `git add` snapshots the clone's files.
 */
function fakeCli({ existing = [], failPush = false, failAuto = false, seed = {} } = {}) {
  const calls = [];
  const stdins = [];
  const vault = new Map();
  const snapshots = [];
  let n = 0;
  const run = (command, args, { cwd, input } = {}) => {
    calls.push([command, ...args]);
    if (input !== undefined) stdins.push(input);
    if (command === "gh" && args[0] === "repo" && args[1] === "clone") {
      for (const f of existing) {
        mkdirSync(join(args[3], f, ".."), { recursive: true });
        writeFileSync(join(args[3], f), "old: ENC[x]\nsops:\n  kms: []\n");
      }
      for (const [f, text] of Object.entries(seed)) writeFileSync(join(args[3], f), text);
      return { status: 0, stdout: "", stderr: "" };
    }
    if (command === "sops" && args[0] === "encrypt") {
      const id = `c${(n += 1)}`;
      vault.set(id, input);
      return { status: 0, stdout: `ENC: ${id}\nsops:\n  gcp_kms: []\n`, stderr: "" };
    }
    if (command === "sops" && args[0] === "decrypt") {
      const id = /ENC: (c\d+)/.exec(readFileSync(join(cwd, args.at(-1)), "utf8"))?.[1];
      return { status: 0, stdout: vault.get(id) ?? "{}", stderr: "" };
    }
    if (command === "git" && args[0] === "add") {
      const files = {};
      const walk = (d) => {
        for (const e of readdirSync(d, { withFileTypes: true }))
          if (e.isDirectory()) walk(join(d, e.name));
          else files[relative(cwd, join(d, e.name))] = readFileSync(join(d, e.name), "utf8");
      };
      walk(cwd);
      snapshots.push(files);
    }
    if (command === "git" && args[0] === "push" && failPush)
      return { status: 1, stdout: "", stderr: "remote: Permission denied" };
    if (command === "gh" && args[1] === "merge" && args.includes("--auto") && failAuto)
      return { status: 1, stdout: "", stderr: "Pull request is in clean status" };
    if (command === "gh" && args[0] === "pr" && args[1] === "create")
      return { status: 0, stdout: "https://github.com/figentra/secrets/pull/1\n", stderr: "" };
    if (command === "age-keygen" && args[0] === "-o") {
      writeFileSync(args[1], `AGE-SECRET-KEY-1${"Q".repeat(58)}\n`, { mode: 0o600 });
      return { status: 0, stdout: "", stderr: "" };
    }
    if (command === "age-keygen" && args[0] === "-y")
      return { status: 0, stdout: `age1${"q".repeat(58)}\n`, stderr: "" };
    return { status: 0, stdout: "", stderr: "" };
  };
  return { run, calls, stdins, vault, snapshots };
}

/** Collects a script's output lines. */
const sink = () => {
  const lines = [];
  return { lines, write: (s) => lines.push(s) };
};

/** No canary anywhere it must never be: output, argv, the audit log, any file the clone held. */
function assertNoLeak(value, { lines = [], cli, homeDir }) {
  assert.ok(!lines.join("").includes(value), "value in output");
  assert.ok(!JSON.stringify(cli?.calls ?? []).includes(value), "value on argv");
  assert.ok(!JSON.stringify(cli?.snapshots ?? []).includes(value), "value in a written file");
  const log = homeDir && join(homeDir, ".stackra", "secrets-audit.log");
  if (log && existsSync(log))
    assert.ok(!readFileSync(log, "utf8").includes(value), "value in the audit log");
}

test("scopes: the documented shapes pass, anything else is refused", () => {
  for (const s of [
    "agents",
    "ci/production",
    "ci/production/release",
    "ci/flow/gate",
    "ci/infra",
    "products/pay/production",
  ])
    assert.ok(SCOPE_RX.test(s), s);
  for (const s of [
    "",
    "agents/x",
    "ci",
    "ci/other",
    "products/pay/prod",
    "../agents",
    "products/Pay/dev",
  ])
    assert.ok(!SCOPE_RX.test(s), s);
  assert.throws(
    () => checkTarget({ scope: "ci/flow/gate", name: "X" }, { agent: true }),
    /gate, registry or infra/,
  );
  assert.throws(() => checkTarget({ scope: "ci/production/registry", name: "X" }, { agent: true }));
  assert.throws(() => checkTarget({ scope: "ci/infra", name: "X" }, { agent: true }), /infra key/);
  assert.doesNotThrow(() => checkTarget({ scope: "ci/flow/gate", name: "X" }));
  assert.doesNotThrow(() => checkTarget({ scope: "ci/infra", name: "X" }));
});

test("publish: one file per secret, the value only on sops' stdin, a self-merging pull request", () => {
  const cli = fakeCli();
  const v = canary();
  const { written, url } = publish(
    [{ scope: "ci/production/release", name: "BOT_KEY", value: Buffer.from(v) }],
    {
      run: cli.run,
      actor: "test",
    },
  );
  assert.deepEqual(written, [{ scope: "ci/production/release", name: "BOT_KEY", replaced: false }]);
  assert.match(url, /pull\/1$/);
  assert.deepEqual(Object.keys(cli.snapshots[0]), ["ci/production/release/BOT_KEY.enc.yaml"]);
  assert.ok(
    cli.stdins.some((s) => s.includes(v)),
    "the value reached sops on stdin",
  );
  assert.ok(cli.calls.some((c) => c.join(" ") === `gh pr merge ${url} --auto --squash`));
  assertNoLeak(v, { cli });
});

test("publish: merges directly when --auto refuses an already mergeable pull request", () => {
  const cli = fakeCli({ failAuto: true });
  const { url } = publish([{ scope: "ci/infra", name: "APP_KEY", value: Buffer.from(canary()) }], {
    run: cli.run,
    actor: "test",
  });
  assert.ok(cli.calls.some((c) => c.join(" ") === `gh pr merge ${url} --squash`));
});

test("publish: replace false refuses an existing name; a failed push is a fixed message", () => {
  const cli = fakeCli({ existing: ["agents/X.enc.yaml"] });
  assert.throws(
    () =>
      publish([{ scope: "agents", name: "X", value: Buffer.from("v") }], {
        run: cli.run,
        replace: false,
      }),
    /--rotate/,
  );
  const failing = fakeCli({ failPush: true });
  assert.throws(
    () => publish([{ scope: "agents", name: "X", value: Buffer.from("v") }], { run: failing.run }),
    {
      message: "push: git was refused (sign in, or this identity lacks the key)",
    },
  );
});

test("cliFailure: names the cloud status and reasons, and repeats no other text", () => {
  const v = canary();
  const stderr = [
    "Failed to get the data key required to decrypt the SOPS file.",
    "Group 0: FAILED",
    `  projects/p/locations/global/keyRings/r/cryptoKeys/k: FAILED ${v}`,
    "    - | Error decrypting key: rpc error: code = PermissionDenied desc = Cloud KMS API requires billing",
    '      reason: "BILLING_DISABLED"',
    '      metadata: { "consumer": "projects/1" }',
  ].join("\n");
  const refused = cliFailure("decrypt", "sops", { status: 128, stderr, stdout: "" });
  assert.equal(
    refused.message,
    "decrypt: sops was refused (sign in, or this identity lacks the key) [PermissionDenied, BILLING_DISABLED]",
  );
  assert.ok(!refused.message.includes(v), "no text beyond the status and reasons is repeated");
  const quota = cliFailure("decrypt", "sops", {
    status: 128,
    stderr: 'code = PermissionDenied desc = x {"reason": "USER_PROJECT_DENIED"}',
    stdout: "",
  });
  assert.match(quota.message, /\[PermissionDenied, USER_PROJECT_DENIED\]$/);
  assert.equal(
    cliFailure("decrypt", "sops", { status: 1, stderr: "denied", stdout: "" }).message,
    "decrypt: sops was refused (sign in, or this identity lacks the key)",
  );
  assert.equal(
    cliFailure("decrypt", "sops", { status: 2, stderr: "boom", stdout: "" }).message,
    "decrypt: sops exited 2",
  );
});

test("put: the inbox file is written, deleted and never shown", async () => {
  const h = home();
  const v = canary();
  mkdirSync(join(h, "Secrets-inbox"));
  writeFileSync(join(h, "Secrets-inbox", "STRIPE_SECRET_KEY.txt"), `${v}\n`);
  const cli = fakeCli();
  const out = sink();
  const code = await put(["STRIPE_SECRET_KEY", "--scope", "products/pay/staging"], {
    home: h,
    run: cli.run,
    env: OWNER,
    write: out.write,
  });
  assert.equal(code, 0);
  assert.match(
    out.lines[0],
    /STRIPE_SECRET_KEY {2}products\/pay\/staging {2}added; inbox file deleted/,
  );
  assert.ok(!existsSync(join(h, "Secrets-inbox", "STRIPE_SECRET_KEY.txt")));
  assert.ok(
    cli.stdins.some((s) => s.includes(v) && !s.includes(`${v}\\n`)),
    "trailing newline stripped",
  );
  assertNoLeak(v, { lines: out.lines, cli, homeDir: h });
});

test("put: a hidden prompt when there is no inbox file; a refusal keeps nothing", async () => {
  const h = home();
  const v = canary();
  const cli = fakeCli();
  const out = sink();
  const code = await put(["CONTEXT7_API_KEY", "--scope", "agents"], {
    home: h,
    run: cli.run,
    env: OWNER,
    write: out.write,
    prompt: async () => Buffer.from(v),
  });
  assert.equal(code, 0);
  assertNoLeak(v, { lines: out.lines, cli, homeDir: h });
  const refused = sink();
  assert.equal(
    await put(["X", "--scope", "ci/flow/gate"], {
      home: h,
      run: cli.run,
      env: AGENT,
      write: refused.write,
      prompt: async () => Buffer.from(v),
    }),
    1,
  );
  assert.match(refused.lines[0], /refused: an agent never writes a gate, registry or infra key/);
  assert.equal(
    await put(["x-not-a-name", "--scope", "agents"], {
      home: h,
      run: cli.run,
      env: OWNER,
      write: refused.write,
    }),
    1,
  );
  assert.ok(!refused.lines.join("").includes("x-not-a-name"), "an invalid name is not echoed");
  assert.equal(await put(["X", "--value", v], { home: h, write: refused.write }), 2);
  assertNoLeak(v, { lines: refused.lines, cli, homeDir: h });
});

test("generate: random, refused when it exists, replaced with --rotate", () => {
  assert.notEqual(generateValue().toString(), generateValue().toString());
  assert.equal(generateValue(32, "hex").length, 64);
  assert.throws(() => generateValue(8), /16 to 128/);
  const h = home();
  const cli = fakeCli({ existing: ["products/os/production/EDGE_SIGNING_SECRET.enc.yaml"] });
  const out = sink();
  const args = ["EDGE_SIGNING_SECRET", "--scope", "products/os/production"];
  assert.equal(generate(args, { home: h, run: cli.run, env: AGENT, write: out.write }), 1);
  assert.match(out.lines[0], /already exists/);
  assert.equal(
    generate([...args, "--rotate"], { home: h, run: cli.run, env: AGENT, write: out.write }),
    0,
  );
  assert.match(out.lines[1], /rotated/);
  const generated = JSON.parse(cli.stdins.at(-1)).EDGE_SIGNING_SECRET;
  assertNoLeak(generated, { lines: out.lines, cli, homeDir: h });
});

test("generate --missing: every generated catalog name with no file, one pull request, names only", () => {
  const catalog = [
    "GATEWAY_VISITOR_SIGNING_KEY:",
    "  scopes: [products/pay/staging, products/pay/production]",
    "  kind: generated",
    "WEB_PUSH_VAPID_PUBLIC_KEY:",
    "  scopes: [products/os/production]",
    "  kind: generated",
    "  generator: vapid",
    "WEB_PUSH_VAPID_PRIVATE_KEY:",
    "  scopes: [products/os/production]",
    "  kind: generated",
    "  generator: vapid",
    "STRIPE_PLATFORM_SECRET_KEY:",
    "  scopes: [products/pay/production]",
    "  kind: human",
    "",
  ].join("\n");
  const cli = fakeCli({
    existing: ["products/pay/staging/GATEWAY_VISITOR_SIGNING_KEY.enc.yaml"],
    seed: { "catalog.yaml": catalog },
  });
  const h = home();
  const out = sink();
  assert.equal(
    generate(["--missing", "--dry-run"], { home: h, run: cli.run, env: AGENT, write: out.write }),
    0,
  );
  assert.equal(cli.snapshots.length, 0, "a dry run writes nothing");
  assert.equal(generate(["--missing"], { home: h, run: cli.run, env: AGENT, write: out.write }), 0);
  assert.deepEqual(
    Object.keys(cli.snapshots[0])
      .filter((f) => f.endsWith(".enc.yaml"))
      .toSorted(),
    [
      "products/os/production/WEB_PUSH_VAPID_PRIVATE_KEY.enc.yaml",
      "products/os/production/WEB_PUSH_VAPID_PUBLIC_KEY.enc.yaml",
      "products/pay/production/GATEWAY_VISITOR_SIGNING_KEY.enc.yaml",
      "products/pay/staging/GATEWAY_VISITOR_SIGNING_KEY.enc.yaml",
    ],
  );
  for (const stdin of cli.stdins)
    for (const v of Object.values(JSON.parse(stdin)))
      assertNoLeak(v, { lines: out.lines, cli, homeDir: h });
});

test("generate: a VAPID pair is the uncompressed P-256 point and its 32-byte scalar", () => {
  const { publicKey, privateKey } = vapidPair();
  const point = Buffer.from(publicKey.toString(), "base64url");
  assert.equal(point.length, 65);
  assert.equal(point[0], 4);
  assert.equal(Buffer.from(privateKey.toString(), "base64url").length, 32);
});

test("generate: an ed25519 key is PKCS#8 for Web Crypto; only its public half and key id are returned", async () => {
  const { privateKey, publicKey } = ed25519Pair();
  const raw = Buffer.from(publicKey, "base64url");
  assert.equal(raw.length, 32);
  assert.match(publicKey, /^[A-Za-z0-9_-]+={0,2}$/);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    Buffer.from(privateKey.toString(), "base64url"),
    { name: "Ed25519" },
    false,
    ["sign"],
  );
  const pub = await crypto.subtle.importKey("raw", raw, { name: "Ed25519" }, false, ["verify"]);
  const data = Buffer.from("event");
  const sig = await crypto.subtle.sign("Ed25519", key, data);
  assert.ok(await crypto.subtle.verify("Ed25519", pub, sig, data), "the pair matches");
  assert.equal(
    keyIdFor("products/invoicing/staging", undefined, new Date("2026-11-06")),
    "invoicing-staging-202611",
  );
  const [entry] = missingEntries(
    {
      STACKRA_EVENTS_SIGNING_KEY: {
        kind: "generated",
        generator: "ed25519",
        scopes: ["products/invoicing/staging"],
      },
    },
    [],
  );
  assert.equal(entry.name, "STACKRA_EVENTS_SIGNING_KEY");
  assert.ok(
    !JSON.stringify(entry.public).includes(entry.value.toString()),
    "the public part holds no private key",
  );
});

test("generate --rotate: an ed25519 catalog name gets a new pair and prints only its public half and a dated id", () => {
  const catalog = [
    "STACKRA_EVENTS_SIGNING_KEY:",
    "  scopes: [products/invoicing/staging]",
    "  kind: generated",
    "  generator: ed25519",
    "WEB_PUSH_VAPID_PRIVATE_KEY:",
    "  scopes: [products/os/production]",
    "  kind: generated",
    "  generator: vapid",
    "",
  ].join("\n");
  const cli = fakeCli({
    existing: [
      "products/invoicing/staging/STACKRA_EVENTS_SIGNING_KEY.enc.yaml",
      "products/os/production/WEB_PUSH_VAPID_PRIVATE_KEY.enc.yaml",
    ],
    seed: { "catalog.yaml": catalog },
  });
  const h = home();
  const out = sink();
  const args = ["STACKRA_EVENTS_SIGNING_KEY", "--scope", "products/invoicing/staging", "--rotate"];
  assert.equal(generate(args, { home: h, run: cli.run, env: AGENT, write: out.write }), 0);
  assert.match(
    out.lines[0],
    /STACKRA_EVENTS_SIGNING_KEY {2}products\/invoicing\/staging {2}rotated/,
  );
  // the new public half and a day-dated id, so it never shares the id of the key it replaces
  assert.match(
    out.lines[1],
    /^ {2}public key [A-Za-z0-9_-]{43} {2}key id invoicing-staging-\d{8}\n?$/,
  );
  const written = JSON.parse(cli.stdins.at(-1)).STACKRA_EVENTS_SIGNING_KEY;
  assert.equal(
    Buffer.from(written, "base64url")[0],
    0x30,
    "the stored value is a PKCS#8 key, not random bytes",
  );
  assertNoLeak(written, { lines: out.lines, cli, homeDir: h });
  const refused = sink();
  assert.equal(
    generate(["WEB_PUSH_VAPID_PRIVATE_KEY", "--scope", "products/os/production", "--rotate"], {
      home: h,
      run: cli.run,
      env: AGENT,
      write: refused.write,
    }),
    1,
  );
  assert.match(refused.lines[0], /refused: a VAPID pair rotates both halves together/);
  assert.equal(
    keyIdFor("products/invoicing/staging", undefined, new Date("2026-11-09"), { day: true }),
    "invoicing-staging-20261109",
  );
});

test("import --tree: scope folders go to their scopes in one pull request; files and folders are removed", () => {
  const h = home();
  const a = canary();
  const b = canary();
  const inbox = join(h, "Secrets-inbox");
  mkdirSync(join(inbox, "products/pay/staging"), { recursive: true });
  mkdirSync(join(inbox, "products/os/production"), { recursive: true });
  writeFileSync(join(inbox, "products/pay/staging/STRIPE_PLATFORM_SECRET_KEY"), a);
  writeFileSync(join(inbox, "products/os/production/RESEND_API_KEY.txt"), `${b}\n`);
  writeFileSync(join(inbox, "FLAT_TOKEN"), "left for the flat modes");
  const cli = fakeCli();
  const out = sink();
  assert.equal(
    importMain(["--tree"], { home: h, sopsRun: cli.run, env: OWNER, write: out.write }),
    0,
  );
  assert.deepEqual(Object.keys(cli.snapshots[0]).toSorted(), [
    "products/os/production/RESEND_API_KEY.enc.yaml",
    "products/pay/staging/STRIPE_PLATFORM_SECRET_KEY.enc.yaml",
  ]);
  assert.equal(cli.calls.filter((c) => c[0] === "gh" && c[2] === "create").length, 1);
  assert.deepEqual(
    readdirSync(inbox).filter((f) => !f.startsWith(".")),
    ["FLAT_TOKEN"],
  );
  for (const v of [a, b]) assertNoLeak(v, { lines: out.lines, cli, homeDir: h });
});

test("import --tree: a folder that is not a scope refuses the whole run", () => {
  const h = home();
  const inbox = join(h, "Secrets-inbox");
  mkdirSync(join(inbox, "products/pay/prod"), { recursive: true });
  mkdirSync(join(inbox, "ci/deploy"), { recursive: true });
  writeFileSync(join(inbox, "products/pay/prod/X_KEY"), canary());
  writeFileSync(join(inbox, "ci/deploy/Y_KEY"), canary());
  const cli = fakeCli();
  const out = sink();
  assert.equal(
    importMain(["--tree"], { home: h, sopsRun: cli.run, env: OWNER, write: out.write }),
    1,
  );
  assert.equal(cli.calls.length, 0);
  assert.ok(existsSync(join(inbox, "ci/deploy/Y_KEY")), "nothing deleted");
});

test("import --scope: inbox files go to sops in one pull request and are deleted", () => {
  const h = home();
  const a = canary();
  const b = canary();
  mkdirSync(join(h, "Secrets-inbox"));
  writeFileSync(join(h, "Secrets-inbox", "A_TOKEN"), a);
  writeFileSync(join(h, "Secrets-inbox", "B_TOKEN.pem"), b);
  const cli = fakeCli();
  const out = sink();
  assert.equal(
    importMain(["--scope", "ci/deploy"], {
      home: h,
      sopsRun: cli.run,
      env: OWNER,
      write: out.write,
    }),
    0,
  );
  assert.equal(cli.calls.filter((c) => c[0] === "gh" && c[2] === "create").length, 1);
  assert.deepEqual(
    readdirSync(join(h, "Secrets-inbox")).filter((f) => !f.startsWith(".")),
    [],
  );
  for (const v of [a, b]) assertNoLeak(v, { lines: out.lines, cli, homeDir: h });
});

test("catalog: names from files, kept fields survive, gaps are named", () => {
  const files = [
    { scope: "products/pay/staging", name: "STRIPE_SECRET_KEY" },
    { scope: "products/pay/production", name: "STRIPE_SECRET_KEY" },
    { scope: "agents", name: "NEW_ONE" },
  ];
  const old = {
    STRIPE_SECRET_KEY: {
      owner: "pay",
      purpose: "charges",
      kind: "human",
      rotateDays: 365,
      expires: "2027-01-01",
    },
    GONE: { owner: "x" },
  };
  const cat = buildCatalog(files, old);
  assert.deepEqual(Object.keys(cat), ["NEW_ONE", "STRIPE_SECRET_KEY"]);
  assert.deepEqual(cat.STRIPE_SECRET_KEY.scopes, [
    "products/pay/staging",
    "products/pay/production",
  ]);
  assert.equal(cat.STRIPE_SECRET_KEY.owner, "pay");
  const problems = checkCatalog(old, files, new Set(["DECLARED_ONLY"]));
  assert.ok(problems.includes("NEW_ONE: has a file but no catalog entry"));
  assert.ok(problems.includes("GONE: in the catalog but has no file"));
  assert.ok(problems.includes("DECLARED_ONLY: declared in runway.yaml but has no file"));
  assert.deepEqual(
    [...declaredNames({ secrets: { ci: ["A_B"], x: { C_D: 1 } }, other: { secrets: ["E"] } })],
    ["A_B", "C_D", "E"],
  );
});

test("age-init: the owner's only; prints the public key, never the private one", () => {
  const h = home();
  const cli = fakeCli();
  const out = sink();
  assert.equal(ageInit([], { home: h, run: cli.run, env: AGENT, write: out.write }), 1);
  assert.equal(ageInit([], { home: h, run: cli.run, env: OWNER, write: out.write }), 0);
  assert.ok(out.lines.some((l) => /^Public key: age1q{58}/.test(l)));
  assert.ok(!out.lines.join("").includes("AGE-SECRET-KEY"));
  assert.equal(
    ageInit([], { home: h, run: cli.run, env: OWNER, write: out.write }),
    1,
    "refuses to overwrite",
  );
});

/** A spawn stand-in that answers every call with `out`. */
const fakeSpawn = (out) => () => out;

test("miseWhich returns the pinned path, or null when mise or the pin is missing", () => {
  assert.equal(
    miseWhich("sops", { spawn: fakeSpawn({ status: 0, stdout: "/m/sops\n" }) }),
    "/m/sops",
  );
  assert.equal(miseWhich("sops", { spawn: fakeSpawn({ status: 1, stdout: "" }) }), null);
  assert.equal(miseWhich("sops", { spawn: fakeSpawn({ status: 0, stdout: "" }) }), null);
});
