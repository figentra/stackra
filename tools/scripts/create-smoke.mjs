#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `node tools/scripts/create-smoke.mjs --core <dir> --template <dir> --out <dir> [--tarballs <dir>]
 *          [--service <path>] [--notes <path>] [--lane <n>] [--start-timeout <s>] [--keep-running]` (STA-2829), the
 *          create-to-authenticated-call smoke test: makes an app the way a user does and proves one signed-in feature
 *          works end to end. Steps, in order, each one a pass or a named failure:
 *          `pack` (every publishable `@stackra/*` package of the built core, `pnpm pack`; skipped with `--tarballs`),
 *          `create` (`stackra create` on those tarballs and the template checkout: install, gen, typecheck, test),
 *          `start` (`stackra dev` of the service, which runs it on Encore with its real Postgres),
 *          `probes` (`GET /healthz` is 200 `{ "status": "up" }`; `GET /readyz` is 200 with every indicator `up`),
 *          `sign-in` (`stackra dev token` prints a signed dev access token),
 *          `refusals` (the notes list answers 401 with no token and with the token's signature altered),
 *          `list` (the signed-in caller's notes page), `create-note` (`POST` a note with an `Idempotency-Key`),
 *          `replay` (the same key and body answer the same note), `read-back` (the note by id, and in the list), and
 *          `stop` (the dev run stopped, the API no longer answers). It writes `create-smoke.json` and
 *          `create-smoke.md` (one row per step) and each step's log to `<out>/logs/<step>.log`.
 * Boundary: writes only under `--out`, which must be missing or empty, and never into the core or template trees (the
 *           caller builds core first: no CLI build is exit 2). Reads no secret and prints none: the dev token goes to
 *           the API only, never to a log or the summary. Runs on the testbed or a CI runner, never a workstation
 *           (`stackra create` installs; `stackra dev` starts containers). The dev run is stopped even when a step
 *           fails, unless `--keep-running`.
 *           Exit 0 every step passed; 1 a step failed (the summary names it); 2 usage or setup error.
 * Runtime: node
 * Governing contract: ADR 0515 (`stackra create`); ADR 0206 (amendment of 2026-11-26: the dev issuer, STA-2795);
 *                     ADR 0098 and 0136 (`Idempotency-Key`); ADR 0166 (CI policy); STA-1952 (the create proof this
 *                     keeps true); STA-2829.
 */
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

/** The steps, in the order they run. */
export const STEPS = Object.freeze([
  "pack",
  "create",
  "start",
  "probes",
  "sign-in",
  "refusals",
  "list",
  "create-note",
  "replay",
  "read-back",
  "stop",
]);

// oxlint-disable-next-line no-control-regex -- reason: matching the ANSI escape is the point of the pattern
const ANSI = /\u001B\[[0-9;?]*[ -/]*[@-~]/g;

/** A compact JWS: three base64url segments. */
const JWT = /^[\w-]+\.[\w-]+\.[\w-]+$/;

/** The line `encore run` prints once the API listens. */
const RUNNING = /Your API is running at:?\s+(https?:\/\/\S+)/;

/** How much of a child's output is kept in memory for a failure's tail. */
const KEEP_BYTES = 64 * 1024;

/** The JSON body of a response, or undefined when it is not JSON. */
function json(response) {
  try {
    return JSON.parse(response.text);
  } catch {
    return undefined;
  }
}

/** A short description of a response for a failure reason. */
function shown(response) {
  return `${response.status} ${response.text.slice(0, 300)}`.trim();
}

/** The last lines of a child's output, colour codes removed. */
function tail(output, lines = 15) {
  return plain(output).trim().split("\n").slice(-lines).join("\n");
}

/** Text with colour codes removed. */
export function plain(text) {
  return text.replace(ANSI, "");
}

/** The API origin `encore run` printed, or undefined before it has. */
export function apiOrigin(output) {
  const match = RUNNING.exec(plain(output));
  return match ? match[1].replace(/\/+$/, "") : undefined;
}

/** The token `stackra dev token` printed (its last non-empty line), or undefined when that is not a JWS. */
export function tokenOf(output) {
  const last = plain(output)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .findLast((line) => line !== "");
  return last !== undefined && JWT.test(last) ? last : undefined;
}

/** The token with the first character of its signature changed, so a verifier that checks signatures refuses it. */
export function tampered(token) {
  const dot = token.lastIndexOf(".");
  return `${token.slice(0, dot + 1)}${token[dot + 1] === "A" ? "B" : "A"}${token.slice(dot + 2)}`;
}

/** Why `/healthz` is not live, or undefined when it is (200 `{ "status": "up" }`). */
export function judgeHealthz(response) {
  if (response.status !== 200) return `GET /healthz answered ${shown(response)}, not 200`;
  if (json(response)?.status !== "up")
    return `GET /healthz body is ${response.text.slice(0, 200)}, not status up`;
  return undefined;
}

/** Why `/readyz` is not ready, or undefined when it is (200, at least one indicator, every one `up`). */
export function judgeReadyz(response) {
  if (response.status !== 200) return `GET /readyz answered ${shown(response)}, not 200`;
  const body = json(response);
  if (typeof body !== "object" || body === null || Array.isArray(body))
    return `GET /readyz body is ${response.text.slice(0, 200)}, not an object of indicators`;
  const entries = Object.entries(body);
  if (entries.length === 0)
    return "GET /readyz ran no health indicator (the database's is expected)";
  const down = entries.filter(([, status]) => status !== "up").map(([name]) => name);
  return down.length === 0 ? undefined : `GET /readyz reports ${down.join(", ")} not up`;
}

/** Why a call that must be refused as unauthenticated was not, or undefined when it answered 401. */
export function judgeRefused(response, what) {
  return response.status === 401 ? undefined : `${what} answered ${shown(response)}, not 401`;
}

/** Why the notes page is wrong, or undefined when it is a 200 page with an `items` array. */
export function judgeList(response) {
  if (response.status !== 200) return `GET notes answered ${shown(response)}, not 200`;
  return Array.isArray(json(response)?.items)
    ? undefined
    : `GET notes body has no items array: ${response.text.slice(0, 200)}`;
}

/** Why the created note is wrong, or undefined when it is a 200 or 201 `not_` note with the title sent. */
export function judgeCreated(response, title) {
  if (response.status !== 200 && response.status !== 201)
    return `POST notes answered ${shown(response)}, not 200 or 201`;
  const body = json(response);
  if (typeof body?.id !== "string" || !body.id.startsWith("not_"))
    return `POST notes answered no not_ id: ${response.text.slice(0, 200)}`;
  return body.title === title
    ? undefined
    : `POST notes answered the title ${JSON.stringify(body.title)}, not ${JSON.stringify(title)}`;
}

/** Why the replayed create is wrong, or undefined when it answered the same note. */
export function judgeReplay(response, noteId) {
  if (response.status !== 200 && response.status !== 201)
    return `the replayed POST notes answered ${shown(response)}, not 200 or 201`;
  const id = json(response)?.id;
  return id === noteId
    ? undefined
    : `the replayed POST notes answered ${JSON.stringify(id)}, not the first note ${noteId}`;
}

/** Why the note does not read back, or undefined when its own read and the list both show it. */
export function judgeReadBack(one, page, note) {
  if (one.status !== 200) return `GET the note answered ${shown(one)}, not 200`;
  const body = json(one);
  if (body?.id !== note.id || body?.title !== note.title)
    return `GET the note answered ${one.text.slice(0, 200)}, not note ${note.id} titled ${JSON.stringify(note.title)}`;
  const listed = judgeList(page);
  if (listed !== undefined) return listed;
  return json(page).items.some((item) => item?.id === note.id)
    ? undefined
    : `GET notes does not list the new note ${note.id}`;
}

/** The publishable `@stackra/*` packages of a core tree: `packages/<group>/<name>/package.json`, not private. */
export function listPackages(core) {
  const packs = [];
  const root = join(core, "packages");
  for (const group of readdirSync(root, { withFileTypes: true })) {
    if (!group.isDirectory()) continue;
    for (const member of readdirSync(join(root, group.name), { withFileTypes: true })) {
      const dir = join(root, group.name, member.name);
      const file = join(dir, "package.json");
      if (!member.isDirectory() || !existsSync(file)) continue;
      const manifest = JSON.parse(readFileSync(file, "utf8"));
      if (
        typeof manifest.name === "string" &&
        manifest.name.startsWith("@stackra/") &&
        manifest.private !== true
      )
        packs.push({ name: manifest.name, version: manifest.version, dir });
    }
  }
  return packs.toSorted((a, b) => a.name.localeCompare(b.name));
}

/** The options, or `{ error }` with a usage message. */
export function readOptions(argv) {
  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        core: { type: "string" },
        template: { type: "string" },
        out: { type: "string" },
        tarballs: { type: "string" },
        service: { type: "string", default: "services/example" },
        notes: { type: "string", default: "/app/notes" },
        lane: { type: "string" },
        "start-timeout": { type: "string", default: "900" },
        "keep-running": { type: "boolean", default: false },
      },
      strict: true,
    }));
  } catch (error) {
    return { error: error.message };
  }
  if (!values.core || !values.template || !values.out)
    return { error: "--core, --template and --out are required" };
  if (values.lane !== undefined && !/^\d{1,2}$/.test(values.lane))
    return { error: "--lane is a whole number, 0 to 99" };
  const startTimeout = Number(values["start-timeout"]);
  if (!Number.isInteger(startTimeout) || startTimeout < 1)
    return { error: "--start-timeout is a whole number of seconds" };
  if (!values.notes.startsWith("/"))
    return { error: "--notes is an absolute API path such as /app/notes" };
  return {
    core: resolve(values.core),
    template: resolve(values.template),
    out: resolve(values.out),
    ...(values.tarballs === undefined ? {} : { tarballs: resolve(values.tarballs) }),
    service: values.service,
    notes: values.notes.replace(/\/+$/, ""),
    ...(values.lane === undefined ? {} : { lane: values.lane }),
    startTimeoutMs: startTimeout * 1000,
    keepRunning: values["keep-running"],
  };
}

/**
 * Runs the smoke test.
 *
 * @param options - the read options (`readOptions`).
 * @param deps - the side effects: `run` (a command to its end), `start` (a long-lived command: `output()`,
 *               `exitCode()`, `stop()`), `request` (one HTTP call; a network failure is status 0), `sleep`, `packages`
 *               (`listPackages`) and `log` (one progress line).
 * @returns the summary: `status` passed or failed, the `failed` step and its `reason`, and one row per step run.
 */
export async function runCreateSmoke(options, deps) {
  const steps = [];
  const env = {
    CI: "1",
    FORCE_COLOR: "0",
    NO_COLOR: "1",
    GIT_AUTHOR_NAME: "create-smoke",
    GIT_AUTHOR_EMAIL: "create-smoke@example.invalid",
    GIT_COMMITTER_NAME: "create-smoke",
    GIT_COMMITTER_EMAIL: "create-smoke@example.invalid",
    ...(options.lane === undefined ? {} : { STACKRA_LANE: options.lane }),
  };
  const app = join(options.out, "app");
  const cli = join(options.core, "packages", "developer", "cli", "dist", "stackra.mjs");
  const tarballs = options.tarballs ?? join(options.out, "tarballs");
  const logOf = (name) => join(options.out, "logs", `${name}.log`);
  const state = { api: undefined, dev: undefined, token: undefined, note: undefined };

  /** Runs one step: a reason it returns, or an error it throws, fails it; "skipped" skips it. */
  const step = async (name, body) => {
    const started = Date.now();
    let outcome;
    try {
      outcome = await body();
    } catch (error) {
      outcome = error instanceof Error ? error.message : String(error);
    }
    const status = outcome === "skipped" ? "skipped" : outcome === undefined ? "passed" : "failed";
    steps.push({
      name,
      status,
      ms: Date.now() - started,
      ...(status === "failed" ? { reason: outcome } : {}),
    });
    deps.log(`${status.toUpperCase()} ${name}${status === "failed" ? `: ${outcome}` : ""}`);
    return status !== "failed";
  };
  /** Runs a command that must exit 0; the tail of its output is the reason otherwise. */
  const must = async (name, command, args, cwd) => {
    const { code, output } = await deps.run(command, args, { cwd, env, log: logOf(name) });
    return code === 0 ? undefined : `${command} ${args.join(" ")} exited ${code}: ${tail(output)}`;
  };
  /** One call to the API. */
  const call = (method, path, { token, body, headers } = {}) =>
    deps.request(method, `${state.api}${path}`, {
      headers: {
        ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  const chain = [
    [
      "pack",
      async () => {
        if (options.tarballs !== undefined) return "skipped";
        const packs = deps.packages(options.core);
        if (packs.length === 0) return `${options.core} has no publishable @stackra package`;
        for (const pack of packs) {
          const failed = await must(
            "pack",
            "pnpm",
            ["pack", "--pack-destination", tarballs],
            pack.dir,
          );
          if (failed !== undefined) return `${pack.name}: ${failed}`;
        }
        return undefined;
      },
    ],
    [
      "create",
      () =>
        must(
          "create",
          process.execPath,
          [
            cli,
            "create",
            "app",
            "--yes",
            "--no-doctor",
            "--starter",
            options.template,
            "--tarballs",
            tarballs,
          ],
          options.out,
        ),
    ],
    [
      "start",
      async () => {
        state.dev = deps.start("pnpm", ["exec", "stackra", "dev"], {
          cwd: join(app, options.service),
          env,
          log: logOf("start"),
        });
        const deadline = Date.now() + options.startTimeoutMs;
        while (Date.now() < deadline) {
          if (state.dev.exitCode() !== undefined)
            return `stackra dev exited (${state.dev.exitCode()}) before the API answered: ${tail(state.dev.output())}`;
          state.api ??= apiOrigin(state.dev.output());
          // Up once it answers at all: a 502 is Encore's gateway while the app still boots.
          if (state.api !== undefined && ![0, 502].includes((await call("GET", "/healthz")).status))
            return undefined;
          await deps.sleep(2000);
        }
        return state.api === undefined
          ? `stackra dev printed no API address within ${options.startTimeoutMs / 1000} s: ${tail(state.dev.output())}`
          : `${state.api} did not answer within ${options.startTimeoutMs / 1000} s`;
      },
    ],
    [
      "probes",
      async () =>
        judgeHealthz(await call("GET", "/healthz")) ?? judgeReadyz(await call("GET", "/readyz")),
    ],
    [
      "sign-in",
      async () => {
        // No log: the token is never written to disk.
        const { code, output } = await deps.run("pnpm", ["exec", "stackra", "dev", "token"], {
          cwd: app,
          env,
          log: undefined,
        });
        if (code !== 0) return `stackra dev token exited ${code}: ${tail(output, 5)}`;
        state.token = tokenOf(output);
        return state.token === undefined
          ? "stackra dev token printed no token (three base64url segments)"
          : undefined;
      },
    ],
    [
      "refusals",
      async () =>
        judgeRefused(await call("GET", options.notes), "GET notes with no token") ??
        judgeRefused(
          await call("GET", options.notes, { token: tampered(state.token) }),
          "GET notes with an altered signature",
        ),
    ],
    ["list", async () => judgeList(await call("GET", options.notes, { token: state.token }))],
    [
      "create-note",
      async () => {
        const title = `create-smoke ${randomUUID().slice(0, 8)}`;
        const note = {
          title,
          key: randomUUID(),
          body: { title, body: "written by the create smoke test" },
        };
        const response = await call("POST", options.notes, {
          token: state.token,
          body: note.body,
          headers: { "Idempotency-Key": note.key },
        });
        const reason = judgeCreated(response, title);
        if (reason === undefined) state.note = { ...note, id: json(response).id };
        return reason;
      },
    ],
    [
      "replay",
      async () =>
        judgeReplay(
          await call("POST", options.notes, {
            token: state.token,
            body: state.note.body,
            headers: { "Idempotency-Key": state.note.key },
          }),
          state.note.id,
        ),
    ],
    [
      "read-back",
      async () =>
        judgeReadBack(
          await call("GET", `${options.notes}/${encodeURIComponent(state.note.id)}`, {
            token: state.token,
          }),
          await call("GET", options.notes, { token: state.token }),
          state.note,
        ),
    ],
  ];

  let failed;
  for (const [name, body] of chain) {
    if (!(await step(name, body))) {
      failed = name;
      break;
    }
  }
  // Stopped whatever failed, so a red run leaves no API, Encore run or app process behind.
  if (state.dev !== undefined && !options.keepRunning) {
    const stopped = await step("stop", async () => {
      await state.dev.stop();
      if (state.dev.exitCode() === undefined) return "stackra dev is still running after SIGKILL";
      for (let attempt = 0; attempt < 10; attempt += 1) {
        if (state.api === undefined || (await call("GET", "/healthz")).status === 0)
          return undefined;
        await deps.sleep(2000);
      }
      return `${state.api} still answers after stackra dev stopped`;
    });
    if (!stopped && failed === undefined) failed = "stop";
  }
  return {
    status: failed === undefined ? "passed" : "failed",
    ...(failed === undefined
      ? {}
      : { failed, reason: steps.find((row) => row.name === failed)?.reason }),
    steps,
  };
}

/** The summary as Markdown: a verdict heading and one row per step run. */
export function renderSummary(summary) {
  const head =
    summary.status === "passed"
      ? "Create smoke test: passed"
      : `Create smoke test: failed at \`${summary.failed}\``;
  const rows = summary.steps.map(
    (row) =>
      `| \`${row.name}\` | ${row.status} | ${(row.ms / 1000).toFixed(1)} s | ${(row.reason ?? "").replaceAll("|", "\\|").replaceAll("\n", " ")} |`,
  );
  return [
    `## ${head}`,
    "",
    "| Step | Result | Time | Reason |",
    "| --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
}

/** Appends a child's output to its log (when it has one) and keeps the last bytes in memory. */
function capture(child, log) {
  let kept = "";
  const take = (chunk) => {
    const text = chunk.toString();
    if (log !== undefined) appendFileSync(log, text);
    kept = (kept + text).slice(-KEEP_BYTES);
  };
  child.stdout.on("data", take);
  child.stderr.on("data", take);
  return () => kept;
}

/** The real side effects. */
function nodeDeps() {
  return {
    run: (command, args, { cwd, env, log }) =>
      new Promise((done) => {
        const child = spawn(command, args, {
          cwd,
          env: { ...process.env, ...env },
          stdio: ["ignore", "pipe", "pipe"],
        });
        const output = capture(child, log);
        child.on("error", (error) => done({ code: 127, output: error.message }));
        child.on("close", (code) => done({ code: code ?? 1, output: output() }));
      }),
    start: (command, args, { cwd, env, log }) => {
      // Its own process group, so a stop reaches `encore run` and the app it started; the Encore daemon detaches into
      // its own session and keeps running, as it does after a developer's Ctrl-C.
      const child = spawn(command, args, {
        cwd,
        env: { ...process.env, ...env },
        stdio: ["ignore", "pipe", "pipe"],
        detached: true,
      });
      const output = capture(child, log);
      let exitCode;
      const exited = new Promise((done) => {
        child.on("close", (code, signal) => {
          exitCode = code ?? signal ?? "unknown";
          done();
        });
        child.on("error", (error) => {
          exitCode = error.message;
          done();
        });
      });
      const signal = (name) => {
        try {
          process.kill(-child.pid, name);
        } catch {
          // the group is already gone
        }
      };
      return {
        output,
        exitCode: () => exitCode,
        stop: async () => {
          for (const [name, wait] of [
            ["SIGINT", 30_000],
            ["SIGTERM", 10_000],
            ["SIGKILL", 5000],
          ]) {
            if (exitCode !== undefined) return;
            signal(name);
            await Promise.race([
              exited,
              new Promise((done) => {
                setTimeout(done, wait);
              }),
            ]);
          }
        },
      };
    },
    request: async (method, url, { headers, body }) => {
      try {
        const response = await fetch(url, {
          method,
          headers,
          ...(body === undefined ? {} : { body }),
          signal: AbortSignal.timeout(30_000),
        });
        return { status: response.status, text: await response.text() };
      } catch (error) {
        return { status: 0, text: error instanceof Error ? error.message : String(error) };
      }
    },
    sleep: (ms) =>
      new Promise((done) => {
        setTimeout(done, ms);
      }),
    packages: listPackages,
    log: (line) => console.log(line),
  };
}

/** Checks the setup, runs the smoke test and writes its summary; returns the exit code. */
async function main(argv) {
  const options = readOptions(argv);
  if (options.error !== undefined) {
    console.error(`create-smoke: ${options.error}`);
    console.error(
      "usage: create-smoke.mjs --core <dir> --template <dir> --out <dir> [--tarballs <dir>] [--service <path>] [--notes <path>] [--lane <n>] [--start-timeout <s>] [--keep-running]",
    );
    return 2;
  }
  const setup = [
    [
      !existsSync(join(options.core, "packages", "developer", "cli", "dist", "stackra.mjs")),
      `${options.core} has no built CLI (build core first)`,
    ],
    [
      !existsSync(join(options.template, "package.json")),
      `${options.template} is not a template checkout`,
    ],
    [
      existsSync(options.out) && readdirSync(options.out).length > 0,
      `${options.out} exists and is not empty`,
    ],
    [
      options.tarballs !== undefined && !existsSync(options.tarballs),
      `${options.tarballs} does not exist`,
    ],
  ].find(([bad]) => bad);
  if (setup !== undefined) {
    console.error(`create-smoke: ${setup[1]}`);
    return 2;
  }
  mkdirSync(join(options.out, "logs"), { recursive: true });
  const summary = await runCreateSmoke(options, nodeDeps());
  writeFileSync(join(options.out, "create-smoke.json"), `${JSON.stringify(summary, null, 2)}\n`);
  writeFileSync(join(options.out, "create-smoke.md"), renderSummary(summary));
  console.log(renderSummary(summary));
  return summary.status === "passed" ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  process.exitCode = await main(process.argv.slice(2));
