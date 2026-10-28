/**
 * Stackra file contract:
 * Purpose: hold `bot-token.mjs` to its contract: the RS256 app JWT, the token mint and its errors that never name the
 *          key, the connect timeout, and the retry rules for idempotent and non-idempotent calls.
 * Boundary: a generated throwaway key and mocked fetch; no network.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy). STA-302.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, verify } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  appJwt,
  backoff,
  CONNECT_TIMEOUT_MS,
  ghIdempotent,
  isGraphqlRead,
  mintToken,
  netFetch,
  RETRY_ATTEMPTS,
  retryUnlessLanded,
  spawnRetrying,
} from "../bot-token.mjs";
import { enqueueReady } from "../pr-merge.mjs";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" });

test("appJwt is a valid RS256 JWT with iat-60, exp+9m and iss", () => {
  const jwt = appJwt(5386128, pem, 1_000_000);
  const [head, body, sig] = jwt.split(".");
  assert.deepEqual(JSON.parse(Buffer.from(head, "base64url")), { alg: "RS256", typ: "JWT" });
  assert.deepEqual(JSON.parse(Buffer.from(body, "base64url")), {
    iat: 999_940,
    exp: 1_000_540,
    iss: "5386128",
  });
  assert.ok(
    verify("RSA-SHA256", Buffer.from(`${head}.${body}`), publicKey, Buffer.from(sig, "base64url")),
  );
});

test("appJwt accepts a PEM stored with escaped newlines", () => {
  assert.equal(appJwt(1, pem.replace(/\n/g, "\\n"), 5).split(".").length, 3);
});

const env = {
  STACKRA_BOT_APP_ID: "5386128",
  STACKRA_BOT_INSTALLATION_ID: "173153517",
  STACKRA_BOT_PRIVATE_KEY: pem,
};

test("mintToken posts the JWT to the installation endpoint and returns the token", async () => {
  let call;
  const fetchMock = async (url, init, options) => {
    call = { url, init, options };
    return { ok: true, status: 201, json: async () => ({ token: "ghs_test" }) };
  };
  assert.equal(await mintToken(env, fetchMock), "ghs_test");
  assert.equal(call.url, "https://api.github.com/app/installations/173153517/access_tokens");
  assert.equal(call.init.method, "POST");
  assert.deepEqual(call.options, { idempotent: true });
  assert.match(call.init.headers.Authorization, /^Bearer [\w-]+\.[\w-]+\.[\w-]+$/);
});

const fail = async () => ({
  ok: false,
  status: 401,
  json: async () => ({ message: "Bad credentials" }),
});

test("mintToken errors name the problem, never the key", async () => {
  await assert.rejects(mintToken(env, fail), (error) => {
    assert.equal(error.message, "GitHub returned 401: Bad credentials");
    return true;
  });
  await assert.rejects(mintToken({}, fail), /missing env: STACKRA_BOT_APP_ID/);
  await assert.rejects(mintToken({ ...env, STACKRA_BOT_PRIVATE_KEY: "nope" }, fail), (error) => {
    assert.ok(!error.message.includes("nope"));
    return true;
  });
});

const noWait = () => {};

test("STA-302: a 30 s connect timeout and at least two tries (the OP7 enqueue gate reads these)", () => {
  assert.equal(CONNECT_TIMEOUT_MS, 30_000);
  assert.equal(RETRY_ATTEMPTS, 4);
});

test("backoff is exponential with full jitter", () => {
  assert.deepEqual(
    [1, 2, 3].map((n) => backoff(n, () => 0.999)),
    [499, 999, 1998],
  );
  assert.equal(
    backoff(3, () => 0),
    0,
  );
});

/**
 * A fake slow GitHub: each request takes the next behaviour, `drop` (hang 200 ms, then close the socket unanswered),
 * a status code, or 200 by default. Resolves to its URL, the hit count and a close function.
 */
async function slowServer(plan) {
  let hits = 0;
  const server = createServer((req, res) => {
    const step = plan[hits++] ?? 200;
    if (step === "drop") setTimeout(() => req.socket.destroy(), 200);
    else res.writeHead(step).end(step === 200 ? "ok" : "bad gateway");
  });
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  return {
    url: `http://127.0.0.1:${server.address().port}/`,
    hits: () => hits,
    close: () => {
      server.closeAllConnections();
      server.close();
    },
  };
}

test("netFetch retries an idempotent call through drops and 502/503/504", async () => {
  const s = await slowServer(["drop", 502, 503, 200]);
  try {
    const res = await netFetch(s.url, {}, { wait: noWait });
    assert.equal(res.status, 200);
    assert.equal(await res.text(), "ok");
    assert.equal(s.hits(), 4);
  } finally {
    s.close();
  }
});

test("netFetch gives up after RETRY_ATTEMPTS and returns the last response", async () => {
  const s = await slowServer([504, 504, 504, 504, 200]);
  try {
    assert.equal((await netFetch(s.url, {}, { wait: noWait })).status, 504);
    assert.equal(s.hits(), RETRY_ATTEMPTS);
  } finally {
    s.close();
  }
});

test("netFetch sends a POST once unless the caller marks it idempotent", async () => {
  const s = await slowServer(["drop", "drop", 200]);
  try {
    await assert.rejects(netFetch(s.url, { method: "POST" }, { wait: noWait }), /fetch failed/);
    assert.equal(s.hits(), 1);
    const res = await netFetch(s.url, { method: "POST" }, { idempotent: true, wait: noWait });
    assert.equal(res.status, 200);
    assert.equal(s.hits(), 3);
  } finally {
    s.close();
  }
});

const flakyRun = (errors) => {
  let n = 0;
  const run = () => {
    n++;
    if (errors.length) throw new Error(errors.shift());
    return "done";
  };
  return { run, runs: () => n };
};

test("retryUnlessLanded re-runs a write only when a fresh read says it did not land", async () => {
  let w = flakyRun(["gh pr merge failed: HTTP 502: Bad Gateway"]);
  assert.equal(await retryUnlessLanded(w.run, () => false, noWait), "done");
  assert.equal(w.runs(), 2);

  w = flakyRun(["fetch failed"]);
  assert.equal(await retryUnlessLanded(w.run, () => true, noWait), undefined);
  assert.equal(w.runs(), 1);

  let reads = 0;
  w = flakyRun(["HTTP 422: Validation Failed"]);
  await assert.rejects(
    retryUnlessLanded(w.run, () => ++reads, noWait),
    /422/,
  );
  assert.equal(reads, 0);
});

const failingRead = () => {
  throw new Error("gh pr view failed: i/o timeout");
};

test("retryUnlessLanded re-reads after the last send; a failing re-read keeps the send's error", async () => {
  let runs = 0;
  let reads = 0;
  const gateway = () => {
    runs++;
    throw new Error("gh pr merge failed: HTTP 504: Gateway Timeout");
  };
  // The 4th send lands although its response is lost: success, not a failure.
  assert.equal(await retryUnlessLanded(gateway, () => ++reads >= 4, noWait), undefined);
  assert.deepEqual([runs, reads], [4, 4]);

  runs = 0;
  await assert.rejects(
    retryUnlessLanded(gateway, () => false, noWait),
    /^Error: gh pr merge/,
  );
  assert.equal(runs, RETRY_ATTEMPTS);

  runs = 0;
  await assert.rejects(retryUnlessLanded(gateway, failingRead, noWait), (error) => {
    assert.match(
      error.message,
      /^gh pr merge failed: HTTP 504.*outcome unknown.*gh pr view failed/,
    );
    return true;
  });
  assert.equal(runs, 1);
});

test("without undici the timeout reads 10 s, so the OP7 enqueue gate stays shut", () => {
  // A copy outside the repository cannot resolve undici, as in linear-sync (no `pnpm install`).
  const dir = mkdtempSync(join(tmpdir(), "no-undici-"));
  copyFileSync(new URL("../bot-token.mjs", import.meta.url), join(dir, "bot-token.mjs"));
  const r = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `const m = await import(${JSON.stringify(pathToFileURL(join(dir, "bot-token.mjs")).href)});` +
        "console.log(m.CONNECT_TIMEOUT_MS, m.RETRY_ATTEMPTS);",
    ],
    { encoding: "utf8" },
  );
  assert.equal(r.stdout.trim(), "10000 4", r.stderr);
  assert.equal(enqueueReady({ CONNECT_TIMEOUT_MS: 10_000, RETRY_ATTEMPTS: 4 }), false);
});

test("ghIdempotent: reads and GET api calls retry; writes do not", () => {
  for (const args of [
    ["pr", "view", "12", "--json", "state"],
    ["pr", "-R", "figentra/os", "list"],
    ["pr", "checks", "12", "--watch"],
    ["run", "view", "1", "--log"],
    ["search", "prs", "x"],
    ["api", "--paginate", "--slurp", "repos/a/b/issues/1/comments"],
    ["api", "-H", "Accept: application/vnd.github.diff", "repos/a/b/compare/main...x"],
  ])
    assert.equal(ghIdempotent(args), true, args.join(" "));
  for (const args of [
    ["pr", "create", "--title", "view"],
    ["pr", "comment", "12", "--body", "x"],
    ["pr", "merge", "12"],
    ["api", "graphql", "-f", "query=query{viewer{login}}"],
    ["api", "-X", "PUT", "repos/a/b/pulls/1/merge"],
    ["api", "-iX", "POST", "x"],
    ["api", "--method=PATCH", "x"],
    ["api", "--input", "f.json", "x"],
  ])
    assert.equal(ghIdempotent(args), false, args.join(" "));
});

test("spawnRetrying re-runs a command that fails with transient output, and only that", () => {
  const counter = join(mkdtempSync(join(tmpdir(), "bot-net-")), "n");
  // Fails with `message` until it has run `failures` times, counting runs in a file.
  const script = (failures, message) =>
    `const fs=require("fs");const f=${JSON.stringify(counter)};` +
    `const n=fs.existsSync(f)?+fs.readFileSync(f,"utf8"):0;fs.writeFileSync(f,String(n+1));` +
    `if(n<${failures}){console.error(${JSON.stringify(message)});process.exit(1)}console.log("ok")`;
  const run = (failures, message) =>
    spawnRetrying(
      process.execPath,
      ["-e", script(failures, message)],
      { encoding: "utf8" },
      noWait,
    );

  let r = run(2, "dial tcp: i/o timeout");
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), "ok");
  assert.equal(readFileSync(counter, "utf8"), "3");

  r = run(9, "HTTP 422: Validation Failed");
  assert.equal(r.status, 1);
  assert.equal(readFileSync(counter, "utf8"), "4");
});

test("isGraphqlRead: a query or a bare selection after comments; anything else is a write", () => {
  for (const doc of [
    "query{a}",
    "  query Q($n:Int){a}",
    "{a}",
    "# note\nquery{a}",
    "#a\n#b\n\n{a}",
  ])
    assert.equal(isGraphqlRead(doc), true, doc);
  for (const doc of [
    "mutation{a}",
    "# note\nmutation{a}",
    "  # q\n  mutation M{a}",
    "subscription{a}",
    "fragment F on X{a} query{...F}",
    "queryX{a}",
    "# query{a}",
    "#".repeat(5000),
  ])
    assert.equal(isGraphqlRead(doc), false, doc);
});
