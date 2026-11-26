/**
 * Stackra file contract:
 * Purpose: hold `create-smoke.mjs` to its contract: against a fake healthy app every step passes in order, and each
 *          step fails, by name, when the one thing it checks is broken (the pack, the create, the dev run, the probes,
 *          the dev token, the refusal of a missing or forged token, the list, the create, the idempotent replay, the
 *          read-back, the stop). The dev run is stopped after a failure, the token never reaches a log or the summary,
 *          and a usage or setup error is exit 2.
 * Boundary: `runCreateSmoke` with injected fakes (no process, container or network); the helpers on fixed text; the
 *           exit codes run the script with arguments that stop it before any step.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); STA-2829.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  apiOrigin,
  judgeReadyz,
  listPackages,
  readOptions,
  renderSummary,
  runCreateSmoke,
  STEPS,
  tampered,
  tokenOf,
} from "../create-smoke.mjs";

const SCRIPT = fileURLToPath(new URL("../create-smoke.mjs", import.meta.url));
const TOKEN = "eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1c3JfMDEifQ.c2lnbmF0dXJlLW9mLXRoZS1kZXYtaXNzdWVy"; // gitleaks:allow -- reason: a made-up JWS shape (payload {"sub":"usr_01"}, a text signature), never a real token
const API = "http://127.0.0.1:4700";
const NOTES = "/app/notes";

/** A fake response. */
function reply(status, body) {
  return { status, text: typeof body === "string" ? body : JSON.stringify(body) };
}

/**
 * A fake created app and the tools around it. `breaks` names what is broken; every other part behaves as a sound
 * app does: probes up, a 401 for a missing or forged token, notes kept per idempotency key.
 */
function fakeWorld(breaks = {}) {
  const calls = { run: [], requests: [], stops: 0 };
  const notes = [];
  const byKey = new Map();
  let up = false;
  let exitCode;
  const authorised = (headers) => {
    const value = headers.authorization;
    if (value === undefined) return breaks.acceptsAnonymous === true;
    if (value === `Bearer ${TOKEN}`) return true;
    // a verifier that skips the signature accepts any token whose header and payload match
    return (
      breaks.ignoresSignature === true &&
      value.startsWith(`Bearer ${TOKEN.split(".").slice(0, 2).join(".")}.`)
    );
  };
  const route = (method, path, { headers, body }) => {
    if (path === "/healthz") return breaks.healthz ?? reply(200, { status: "up" });
    if (path === "/readyz") return breaks.readyz ?? reply(200, { database: "up" });
    if (!path.startsWith(NOTES)) return reply(404, { code: "not_found" });
    if (!authorised(headers))
      return reply(401, { code: "request_refused", category: "unauthenticated" });
    if (breaks.accessControl)
      return reply(500, { code: "internal", internal_message: "AccessControl is not bound" });
    if (method === "POST") {
      if (breaks.create) return breaks.create;
      const key = headers["Idempotency-Key"];
      if (key === undefined) return reply(400, { code: "idempotency_key_required" });
      if (byKey.has(key) && !breaks.noIdempotency) return reply(200, byKey.get(key));
      const input = JSON.parse(body);
      const note = {
        id: `not_${String(notes.length + 1).padStart(26, "0")}`,
        title: input.title,
        body: input.body,
      };
      notes.push(note);
      byKey.set(key, note);
      return reply(201, note);
    }
    if (path === NOTES)
      return reply(200, {
        items: breaks.listHidesNotes
          ? [{ id: `not_${"9".repeat(26)}`, title: "another" }]
          : [...notes].reverse(),
        hasMore: false,
      });
    const one = notes.find((note) => `${NOTES}/${note.id}` === path);
    return one && !breaks.getOne ? reply(200, one) : reply(404, { code: "not_found" });
  };
  const deps = {
    run: async (command, args, options) => {
      calls.run.push({ command, args, ...options });
      if (args[0] === "pack")
        return { code: breaks.pack ? 1 : 0, output: breaks.pack ? "ERR_PNPM_PACK no dist" : "" };
      if (args.includes("create"))
        return {
          code: breaks.create_app ? 1 : 0,
          output: breaks.create_app ? "Type-checking\nerror TS2307" : "done",
        };
      if (args.includes("token")) {
        if (breaks.tokenExit)
          return { code: 1, output: "run stackra dev token inside a pnpm workspace" };
        return {
          code: 0,
          output: breaks.noToken
            ? "no token here\n"
            : `\u001B[2mdev issuer ready\u001B[0m\n${TOKEN}\n`,
        };
      }
      return { code: 0, output: "" };
    },
    start: (command, args, options) => {
      calls.start = { command, args, ...options };
      if (breaks.devExits) exitCode = 1;
      else if (!breaks.noAddress) up = true;
      return {
        output: () =>
          breaks.devExits
            ? "Error: port 4700 is busy"
            : breaks.noAddress
              ? "building...\n"
              : `\u001B[1m  Your API is running at:     ${API}\u001B[0m\n`,
        exitCode: () => exitCode,
        stop: async () => {
          calls.stops += 1;
          if (!breaks.outlivesStop) exitCode = 0;
          if (!breaks.keepsAnswering) up = false;
        },
      };
    },
    request: async (method, url, options) => {
      calls.requests.push({ method, url, ...options });
      if (!up) return { status: 0, text: "fetch failed" };
      if (breaks.gateway) return reply(502, "bad gateway");
      return route(method, url.slice(API.length), options);
    },
    sleep: async () => {},
    packages: () =>
      breaks.noPackages
        ? []
        : [
            { name: "@stackra/app", version: "0.33.1", dir: "/core/packages/runtime/app" },
            { name: "@stackra/cli", version: "0.33.1", dir: "/core/packages/developer/cli" },
          ],
    log: () => {},
  };
  return { deps, calls, notes };
}

const OPTIONS = {
  core: "/core",
  template: "/template",
  out: "/out",
  service: "services/example",
  notes: NOTES,
  startTimeoutMs: 200,
  keepRunning: false,
};

/** Runs the smoke test with one part broken and returns the summary and the calls. */
async function runWith(breaks, options = {}) {
  const world = fakeWorld(breaks);
  const summary = await runCreateSmoke({ ...OPTIONS, ...options }, world.deps);
  return { summary, ...world };
}

test("passes every step, in order, against a sound app", async () => {
  const { summary, calls, notes } = await runWith({});
  assert.equal(summary.status, "passed", JSON.stringify(summary, null, 2));
  assert.deepEqual(
    summary.steps.map((row) => [row.name, row.status]),
    STEPS.map((name) => [name, "passed"]),
  );
  assert.equal(notes.length, 1, "the replay makes no second note");
  assert.equal(calls.stops, 1);
  const create = calls.run.find((run) => run.args.includes("create"));
  assert.deepEqual(create.args.slice(1), [
    "create",
    "app",
    "--yes",
    "--no-doctor",
    "--starter",
    "/template",
    "--tarballs",
    "/out/tarballs",
  ]);
  assert.equal(create.cwd, "/out");
  assert.deepEqual(calls.start.args, ["exec", "stackra", "dev"]);
  assert.equal(calls.start.cwd, "/out/app/services/example");
  assert.equal(
    calls.run.filter((run) => run.args[0] === "pack").length,
    2,
    "one pnpm pack per publishable package",
  );
});

test("installs from --tarballs without packing, and runs in the lane given", async () => {
  const { summary, calls } = await runWith({}, { tarballs: "/given", lane: "7" });
  assert.equal(summary.status, "passed");
  assert.equal(summary.steps[0].status, "skipped");
  assert.equal(calls.run.filter((run) => run.args[0] === "pack").length, 0);
  assert.ok(calls.run.find((run) => run.args.includes("create")).args.includes("/given"));
  assert.equal(calls.start.env.STACKRA_LANE, "7");
});

const BROKEN = [
  ["pack", { pack: true }, /@stackra\/app: pnpm pack .*exited 1: ERR_PNPM_PACK/],
  ["pack", { noPackages: true }, /no publishable @stackra package/],
  ["create", { create_app: true }, /exited 1: Type-checking\nerror TS2307/],
  [
    "start",
    { devExits: true },
    /stackra dev exited \(1\) before the API answered: Error: port 4700 is busy/,
  ],
  ["start", { noAddress: true }, /printed no API address within/],
  ["start", { gateway: true }, /did not answer within/],
  [
    "probes",
    { healthz: { status: 503, text: '{"status":"draining"}' } },
    /GET \/healthz answered 503/,
  ],
  [
    "probes",
    { healthz: { status: 200, text: '{"status":"down"}' } },
    /GET \/healthz body .* not status up/,
  ],
  ["probes", { readyz: { status: 503, text: '{"database":"down"}' } }, /GET \/readyz answered 503/],
  ["probes", { readyz: { status: 200, text: "{}" } }, /ran no health indicator/],
  ["sign-in", { tokenExit: true }, /stackra dev token exited 1/],
  ["sign-in", { noToken: true }, /printed no token/],
  ["refusals", { acceptsAnonymous: true }, /GET notes with no token answered 200 .*, not 401/],
  [
    "refusals",
    { ignoresSignature: true },
    /GET notes with an altered signature answered 200 .*, not 401/,
  ],
  ["list", { accessControl: true }, /GET notes answered 500 .*AccessControl is not bound/],
  [
    "create-note",
    { create: { status: 403, text: '{"code":"forbidden"}' } },
    /POST notes answered 403/,
  ],
  ["create-note", { create: { status: 201, text: '{"id":"usr_1","title":"x"}' } }, /no not_ id/],
  [
    "replay",
    { noIdempotency: true },
    /the replayed POST notes answered "not_0+2", not the first note not_0+1/,
  ],
  ["read-back", { getOne: true }, /GET the note answered 404/],
  ["read-back", { listHidesNotes: true }, /GET notes does not list the new note/],
];

for (const [name, breaks, reason] of BROKEN) {
  test(`fails at ${name} when ${Object.keys(breaks)[0]} is broken (${reason.source})`, async () => {
    const { summary, calls } = await runWith(breaks);
    assert.equal(summary.status, "failed");
    assert.equal(summary.failed, name);
    assert.match(summary.reason, reason);
    const index = STEPS.indexOf(name);
    assert.deepEqual(
      summary.steps.filter((row) => row.name !== "stop").map((row) => row.name),
      STEPS.slice(0, index + 1),
      "no step after the failed one runs",
    );
    // A dev run that started is stopped even though a step failed.
    if (calls.start !== undefined) {
      assert.equal(summary.steps.at(-1).name, "stop");
      assert.equal(calls.stops, 1);
    } else assert.equal(calls.stops, 0);
  });
}

test("fails at stop when the API still answers after the dev run stops", async () => {
  const { summary } = await runWith({ keepsAnswering: true });
  assert.equal(summary.status, "failed");
  assert.equal(summary.failed, "stop");
  assert.match(summary.reason, /still answers after stackra dev stopped/);
});

test("fails at stop when stackra dev outlives every signal", async () => {
  const { summary } = await runWith({ outlivesStop: true });
  assert.equal(summary.failed, "stop");
  assert.match(summary.reason, /still running after SIGKILL/);
});

test("keeps the first failure when the stop after it also fails", async () => {
  const { summary } = await runWith({ accessControl: true, keepsAnswering: true });
  assert.equal(summary.failed, "list");
  assert.equal(summary.steps.at(-1).status, "failed");
});

test("leaves the dev run up with --keep-running", async () => {
  const { summary, calls } = await runWith({}, { keepRunning: true });
  assert.equal(summary.status, "passed");
  assert.equal(calls.stops, 0);
  assert.equal(summary.steps.at(-1).name, "read-back");
});

test("never writes the token to a log or the summary, and sends the forged one only to the API", async () => {
  const { summary, calls } = await runWith({ accessControl: true });
  const token = calls.run.find((run) => run.args.includes("token"));
  assert.equal(token.log, undefined);
  assert.ok(!JSON.stringify(summary).includes(TOKEN.split(".")[2]));
  assert.ok(!renderSummary(summary).includes(TOKEN.split(".")[2]));
  const forged = calls.requests.find(
    (request) =>
      request.headers.authorization !== undefined &&
      request.headers.authorization !== `Bearer ${TOKEN}`,
  );
  assert.equal(forged.headers.authorization, `Bearer ${tampered(TOKEN)}`);
});

test("sends the create with an Idempotency-Key and replays it with the same key and body", async () => {
  const { calls } = await runWith({});
  const posts = calls.requests.filter((request) => request.method === "POST");
  assert.equal(posts.length, 2);
  assert.match(posts[0].headers["Idempotency-Key"], /^[0-9a-f-]{36}$/);
  assert.equal(posts[1].headers["Idempotency-Key"], posts[0].headers["Idempotency-Key"]);
  assert.equal(posts[1].body, posts[0].body);
  assert.equal(posts[0].headers["content-type"], "application/json");
});

test("reads the API origin, the token and the readiness body", () => {
  assert.equal(
    apiOrigin("\u001B[1m  Your API is running at:     http://127.0.0.1:4000/\u001B[0m\n"),
    "http://127.0.0.1:4000",
  );
  assert.equal(apiOrigin("building"), undefined);
  assert.equal(tokenOf(`note\n${TOKEN}\n\n`), TOKEN);
  assert.equal(tokenOf(`${TOKEN}\nWarning: something`), undefined);
  const forged = tampered(TOKEN);
  assert.notEqual(forged, TOKEN);
  assert.equal(forged.split(".").slice(0, 2).join("."), TOKEN.split(".").slice(0, 2).join("."));
  assert.equal(forged.length, TOKEN.length);
  assert.equal(tampered("a.b.Axyz").split(".")[2], "Bxyz");
  assert.equal(judgeReadyz({ status: 200, text: '{"database":"up","cache":"up"}' }), undefined);
  assert.match(
    judgeReadyz({ status: 200, text: '{"database":"up","cache":"down"}' }),
    /cache not up/,
  );
  assert.match(judgeReadyz({ status: 200, text: "[]" }), /not an object/);
});

test("renders one row per step and the failed step in the heading", async () => {
  const { summary } = await runWith({ accessControl: true });
  const text = renderSummary(summary);
  assert.match(text, /^## Create smoke test: failed at `list`/);
  assert.match(text, /\| `list` \| failed \|/);
  assert.match(text, /\| `stop` \| passed \|/);
});

test("reads its options and refuses bad ones", () => {
  const options = readOptions([
    "--core",
    "c",
    "--template",
    "t",
    "--out",
    "o",
    "--lane",
    "3",
    "--notes",
    "/x/notes/",
  ]);
  assert.equal(options.notes, "/x/notes");
  assert.equal(options.lane, "3");
  assert.equal(options.service, "services/example");
  assert.equal(options.startTimeoutMs, 900_000);
  assert.match(readOptions(["--core", "c"]).error, /required/);
  assert.match(
    readOptions(["--core", "c", "--template", "t", "--out", "o", "--lane", "x"]).error,
    /--lane/,
  );
  assert.match(
    readOptions(["--core", "c", "--template", "t", "--out", "o", "--notes", "notes"]).error,
    /--notes/,
  );
  assert.match(readOptions(["--bogus"]).error, /bogus/);
});

test("lists the publishable @stackra packages of a core tree", () => {
  const core = mkdtempSync(join(tmpdir(), "create-smoke-core-"));
  try {
    const write = (path, manifest) => {
      mkdirSync(join(core, "packages", path), { recursive: true });
      writeFileSync(join(core, "packages", path, "package.json"), JSON.stringify(manifest));
    };
    write("runtime/app", { name: "@stackra/app", version: "1.0.0" });
    write("developer/cli", { name: "@stackra/cli", version: "1.0.0" });
    write("developer/internal", { name: "@stackra/internal", version: "1.0.0", private: true });
    write("tools/other", { name: "@figentra/other", version: "1.0.0" });
    mkdirSync(join(core, "packages", "runtime", "empty"));
    assert.deepEqual(
      listPackages(core).map((pack) => pack.name),
      ["@stackra/app", "@stackra/cli"],
    );
  } finally {
    rmSync(core, { recursive: true, force: true });
  }
});

test("exits 2 on a usage error or a core that is not built, before any step", () => {
  const usage = spawnSync(process.execPath, [SCRIPT, "--core", "x"], { encoding: "utf8" });
  assert.equal(usage.status, 2);
  assert.match(usage.stderr, /usage/);
  const empty = mkdtempSync(join(tmpdir(), "create-smoke-empty-"));
  try {
    const setup = spawnSync(
      process.execPath,
      [SCRIPT, "--core", empty, "--template", empty, "--out", join(empty, "out")],
      { encoding: "utf8" },
    );
    assert.equal(setup.status, 2);
    assert.match(setup.stderr, /no built CLI/);
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }
});
