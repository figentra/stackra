#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: apply the reviewed registry actions in `tools/release/registry-actions.json` (deprecate a version, move a
 *          dist-tag back) to the Stackra registry, and find published versions that cannot install. Three commands:
 *          `plan` (read-only: what `apply` would change), `apply` (the `registry-maintenance` job of release.yml only:
 *          exchanges the job's GitHub ID token per package, writes, then plans again and fails unless nothing is left)
 *          and `scan` (read-only: every version whose `@scope/*` dependency tree names a version that was never
 *          published, and whether the file or the registry already deprecates it).
 * Boundary: reads the file and the registry's packuments and catalogue; writes only the registry's deprecate
 *           (`PUT /@scope%2fname` with no attachment) and dist-tag (`PUT /-/package/@scope%2fname/dist-tags/<tag>`)
 *           routes. Never publishes, unpublishes or deletes a tag. A tag moves only while it still points at one of
 *           the entry's `from` versions (compare-and-set), so a run after the next release never moves it back.
 * Runtime: node (24, no dependencies: release.yml runs it before any `pnpm install`)
 * Governing contract: ADR 0453 (decisions 6 and 7: dist-tag changes and deprecations need the publish token that only
 *                     the trusted publisher workflow obtains); ADR 0177 (decision 6, deprecation); ADR 0468 (the
 *                     owner approves the `release` environment); ADR 0013 (immutable versions). STA-2863.
 * Input: `<plan|apply|scan> [--file <path>] [--registry <https url ending in />]`; `apply` reads
 *        ACTIONS_ID_TOKEN_REQUEST_URL and ACTIONS_ID_TOKEN_REQUEST_TOKEN (GitHub sets them for `id-token: write`).
 * Output: the plan, one line per action, on stdout (and as Markdown in GITHUB_STEP_SUMMARY when set). Exit 0 when the
 *         file is valid and (apply) every action landed or (scan) every uninstallable version is deprecated; 1 on an
 *         invalid file, a registry failure, an action that cannot be applied or an undeprecated uninstallable version;
 *         2 on bad arguments.
 * Secrets: the ID token and each publish token live in memory only; under GitHub Actions each is masked
 *          (`::add-mask::`) before any other output, and no error message carries one.
 */
import { appendFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** The registry release.yml publishes to (ADR 0453); `--registry` overrides it. */
export const DEFAULT_REGISTRY = "https://npm.stackra.figentra.com/";
/** The reviewed actions, relative to the repository root. */
export const DEFAULT_FILE = "tools/release/registry-actions.json";

const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const NAME = /^@[a-z0-9][a-z0-9-]*\/(?:\*|[a-z0-9][a-z0-9._-]*)$/;
const TAG = /^[a-z][a-z0-9-]*$/;
const ISSUE = /^[A-Z]+-\d+$/;
const MAX_MESSAGE = 500;

/** A refusal of the actions file; its message names the entry and the field. */
export class ActionsFileError extends Error {}

/** A registry answer the script cannot go on from; its message names the request, never a token. */
export class RegistryError extends Error {}

const fail = (where, problem) => {
  throw new ActionsFileError(`${where}: ${problem}`);
};

const onlyKeys = (where, entry, allowed) => {
  for (const key of Object.keys(entry))
    if (!allowed.includes(key)) fail(where, `unknown key "${key}"`);
};

const checkCommon = (where, entry) => {
  if (!Array.isArray(entry.packages) || entry.packages.length === 0)
    fail(where, "packages must be a non-empty list");
  for (const name of entry.packages)
    if (typeof name !== "string" || !NAME.test(name))
      fail(where, `"${name}" is not @scope/name or @scope/*`);
  if (typeof entry.issue !== "string" || !ISSUE.test(entry.issue))
    fail(where, "issue must be a Linear key such as STA-2863");
  if (typeof entry.reason !== "string" || entry.reason.trim() === "")
    fail(where, "reason must say why");
};

/**
 * Checks the parsed actions file and returns it typed; throws `ActionsFileError` naming the first problem.
 *
 * @example
 * parseActions({ deprecate: [], distTags: [] }); // { deprecate: [], distTags: [] }
 */
export function parseActions(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw))
    fail("file", "must be a JSON object");
  onlyKeys("file", raw, ["$comment", "deprecate", "distTags"]);
  const deprecate = raw.deprecate ?? [];
  const distTags = raw.distTags ?? [];
  if (!Array.isArray(deprecate)) fail("deprecate", "must be a list");
  if (!Array.isArray(distTags)) fail("distTags", "must be a list");
  deprecate.forEach((entry, index) => {
    const where = `deprecate[${index}]`;
    if (entry === null || typeof entry !== "object") fail(where, "must be an object");
    onlyKeys(where, entry, ["packages", "version", "message", "issue", "reason"]);
    checkCommon(where, entry);
    if (typeof entry.version !== "string" || !VERSION.test(entry.version))
      fail(where, "version must be an exact version such as 0.33.1");
    if (typeof entry.message !== "string")
      fail(where, 'message must be a string ("" undeprecates)');
    if (entry.message.length > MAX_MESSAGE)
      fail(where, `message is over ${MAX_MESSAGE} characters`);
    // oxlint-disable-next-line no-control-regex -- refusing control characters is the point
    if (/[\u0000-\u001f\u007f]/.test(entry.message))
      fail(where, "message holds a control character");
  });
  distTags.forEach((entry, index) => {
    const where = `distTags[${index}]`;
    if (entry === null || typeof entry !== "object") fail(where, "must be an object");
    onlyKeys(where, entry, ["packages", "tag", "from", "to", "issue", "reason"]);
    checkCommon(where, entry);
    if (typeof entry.tag !== "string" || !TAG.test(entry.tag))
      fail(where, "tag must be lower-case letters, digits or '-'");
    if (!Array.isArray(entry.from) || entry.from.length === 0)
      fail(where, "from must list the bad versions the tag may be moved off");
    for (const version of entry.from)
      if (typeof version !== "string" || !VERSION.test(version))
        fail(where, `from: "${version}" is not an exact version`);
    if (typeof entry.to !== "string" || !VERSION.test(entry.to))
      fail(where, "to must be an exact version");
    if (entry.from.includes(entry.to)) fail(where, "to is one of the from versions");
  });
  return { deprecate, distTags };
}

const scopeOf = (name) => name.slice(0, name.indexOf("/"));
const encode = (name) => name.replace("/", "%2f");

/** Fetch with a bound per call and retries of the transient failures (network, 429, 5xx); PUTs here are idempotent. */
async function call(fetchImpl, url, init = {}, attempts = 4) {
  let last;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(90_000) });
      if (response.status !== 429 && response.status < 500) return response;
      last = new RegistryError(`${init.method ?? "GET"} ${url}: HTTP ${response.status}`);
    } catch (error) {
      last = new RegistryError(`${init.method ?? "GET"} ${url}: ${error.message}`);
    }
    if (attempt < attempts)
      await new Promise((resolve) => {
        setTimeout(resolve, 250 * 2 ** attempt);
      });
  }
  throw last;
}

/** What the registry said, for an error line: its `error` field or the status alone. */
async function refusal(response) {
  const text = await response.text().catch(() => "");
  try {
    const body = JSON.parse(text);
    if (typeof body.error === "string") return `HTTP ${response.status} ${body.error}`;
  } catch {
    // not JSON: the status says enough
  }
  return `HTTP ${response.status}`;
}

/**
 * A read-only view of one registry: packuments by name and the names of a scope, each fetched once.
 *
 * @example
 * const reader = registryReader("https://npm.stackra.figentra.com/");
 * await reader.packument("@stackra/app"); // { name, "dist-tags", versions } or null
 */
export function registryReader(registry, fetchImpl = fetch) {
  const packuments = new Map();
  const scopes = new Map();
  return {
    registry,
    async packument(name) {
      if (!packuments.has(name))
        packuments.set(
          name,
          (async () => {
            const url = `${registry}${encode(name)}`;
            const response = await call(fetchImpl, url, {
              headers: { accept: "application/json" },
            });
            if (response.status === 404) return null;
            if (!response.ok) throw new RegistryError(`GET ${url}: ${await refusal(response)}`);
            return response.json();
          })(),
        );
      return packuments.get(name);
    },
    async names(scope) {
      if (!scopes.has(scope))
        scopes.set(
          scope,
          (async () => {
            const names = [];
            let cursor = "";
            do {
              const url = `${registry}-/stackra/v1/catalogue?scope=${encodeURIComponent(scope)}&limit=100${
                cursor === "" ? "" : `&cursor=${encodeURIComponent(cursor)}`
              }`;
              const response = await call(fetchImpl, url);
              if (!response.ok) throw new RegistryError(`GET ${url}: ${await refusal(response)}`);
              const page = await response.json();
              for (const item of page.items ?? []) names.push(item.name);
              cursor = page.next ?? "";
            } while (cursor !== "");
            return names.toSorted();
          })(),
        );
      return scopes.get(scope);
    },
  };
}

/** The names an entry covers: each exact name, and every catalogue name of the scope for `@scope/*`. */
async function expand(reader, packages) {
  const out = [];
  for (const pattern of packages) {
    const wildcard = pattern.endsWith("/*");
    const names = wildcard ? await reader.names(scopeOf(pattern)) : [pattern];
    for (const name of names) out.push({ name, wildcard });
  }
  return out;
}

/**
 * The actions `apply` would take now, the entries that are already in place or moved on (`skipped`), and what
 * cannot be applied (`problems`). Pure over the reader: it writes nothing.
 *
 * @example
 * const { actions, problems } = await plan(parseActions(json), registryReader(registry));
 */
export async function plan(actionsFile, reader) {
  const actions = [];
  const skipped = [];
  const problems = [];
  const deprecations = new Map();
  for (const [index, entry] of actionsFile.deprecate.entries()) {
    for (const { name, wildcard } of await expand(reader, entry.packages)) {
      const key = `${name}@${entry.version}`;
      const claimed = deprecations.get(key);
      if (claimed !== undefined) {
        if (claimed.message !== entry.message)
          problems.push(
            `${key}: deprecate[${claimed.index}] and deprecate[${index}] give different messages`,
          );
        continue;
      }
      deprecations.set(key, { index, message: entry.message });
      const packument = await reader.packument(name);
      const manifest = packument?.versions?.[entry.version];
      if (manifest === undefined) {
        if (!wildcard) problems.push(`${key}: not on the registry (deprecate[${index}])`);
        continue;
      }
      if ((manifest.deprecated ?? "") === entry.message) {
        skipped.push(`${key}: already ${entry.message === "" ? "not deprecated" : "deprecated"}`);
        continue;
      }
      actions.push({
        kind: "deprecate",
        name,
        version: entry.version,
        message: entry.message,
        issue: entry.issue,
      });
    }
  }
  const tags = new Map();
  for (const [index, entry] of actionsFile.distTags.entries()) {
    for (const { name, wildcard } of await expand(reader, entry.packages)) {
      const key = `${name}#${entry.tag}`;
      if (tags.has(key)) {
        problems.push(`${key}: distTags[${tags.get(key)}] and distTags[${index}] both move it`);
        continue;
      }
      tags.set(key, index);
      const packument = await reader.packument(name);
      if (packument === null) {
        if (!wildcard) problems.push(`${name}: not on the registry (distTags[${index}])`);
        continue;
      }
      const current = packument["dist-tags"]?.[entry.tag];
      if (current === entry.to) {
        skipped.push(`${key}: already ${entry.to}`);
        continue;
      }
      if (current === undefined || !entry.from.includes(current)) {
        skipped.push(
          `${key}: at ${current ?? "no version"}, not one of ${entry.from.join(", ")}; left alone`,
        );
        continue;
      }
      if (packument.versions?.[entry.to] === undefined) {
        problems.push(
          `${key}: at ${current}, but ${name}@${entry.to} is not on the registry (distTags[${index}])`,
        );
        continue;
      }
      actions.push({
        kind: "dist-tag",
        name,
        tag: entry.tag,
        from: current,
        to: entry.to,
        issue: entry.issue,
      });
    }
  }
  return { actions, skipped, problems };
}

/** One line per action, as `plan` prints it. */
export const describe = (action) =>
  action.kind === "deprecate"
    ? action.message === ""
      ? `undeprecate ${action.name}@${action.version} (${action.issue})`
      : `deprecate ${action.name}@${action.version}: "${action.message}" (${action.issue})`
    : `move ${action.name}#${action.tag} ${action.from} -> ${action.to} (${action.issue})`;

/**
 * Exchanges the job's GitHub ID token for a publish token bound to `name` (ADR 0453 decision 6), as runway-npm.yml's
 * publish script does. `mask` is called with each token before anything else can print it.
 */
export async function publishToken(registry, name, env, fetchImpl = fetch, mask = () => {}) {
  const requestUrl = env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const requestToken = env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!requestUrl || !requestToken)
    throw new RegistryError(
      "apply needs a GitHub Actions job with id-token: write (no ID token request in the environment)",
    );
  const host = registry.replace(/^https:\/\//, "").replace(/\/$/, "");
  const idResponse = await call(
    fetchImpl,
    `${requestUrl}&audience=${encodeURIComponent(`npm:${host}`)}`,
    {
      headers: { authorization: `bearer ${requestToken}` },
    },
  );
  if (!idResponse.ok) throw new RegistryError(`GitHub ID token request: HTTP ${idResponse.status}`);
  const idToken = (await idResponse.json()).value;
  if (typeof idToken !== "string" || idToken === "")
    throw new RegistryError("GitHub ID token request: no token");
  mask(idToken);
  const exchangeUrl = `${registry}-/npm/v1/oidc/token/exchange/package/${encode(name)}`;
  const response = await call(fetchImpl, exchangeUrl, {
    method: "POST",
    headers: { authorization: `Bearer ${idToken}` },
  });
  if (!response.ok) throw new RegistryError(`POST ${exchangeUrl}: ${await refusal(response)}`);
  const token = (await response.json()).token;
  if (typeof token !== "string" || token === "")
    throw new RegistryError(`POST ${exchangeUrl}: no token`);
  mask(token);
  return token;
}

/**
 * Applies `actions`, one publish token per package: tags first (installs stop resolving to the bad version), then
 * the deprecations of that package in one body. Returns the lines it printed; throws on the first refusal.
 */
export async function applyActions(registry, actions, env, fetchImpl = fetch, mask = () => {}) {
  const byName = new Map();
  for (const action of actions)
    byName.set(action.name, [...(byName.get(action.name) ?? []), action]);
  const done = [];
  for (const [name, list] of byName) {
    const token = await publishToken(registry, name, env, fetchImpl, mask);
    const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
    for (const action of list.filter((item) => item.kind === "dist-tag")) {
      const url = `${registry}-/package/${encode(name)}/dist-tags/${action.tag}`;
      const response = await call(fetchImpl, url, {
        method: "PUT",
        headers,
        body: JSON.stringify(action.to),
      });
      if (!response.ok) throw new RegistryError(`PUT ${url}: ${await refusal(response)}`);
      done.push(describe(action));
    }
    const deprecations = list.filter((item) => item.kind === "deprecate");
    if (deprecations.length > 0) {
      const url = `${registry}${encode(name)}`;
      const versions = Object.fromEntries(
        deprecations.map((action) => [
          action.version,
          { name, version: action.version, deprecated: action.message },
        ]),
      );
      const response = await call(fetchImpl, url, {
        method: "PUT",
        headers,
        body: JSON.stringify({ name, versions }),
      });
      if (!response.ok) throw new RegistryError(`PUT ${url}: ${await refusal(response)}`);
      for (const action of deprecations) done.push(describe(action));
    }
  }
  return done;
}

const EXACT = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/**
 * Every version in `scopes` whose dependency tree (dependencies, optional and peer dependencies) names an exact
 * version of a package in those scopes that the registry does not have, with the missing ones. A range is taken as
 * installable: Stackra publishes exact versions between its own packages (the fixed group, ADR 0177).
 */
export async function uninstallable(reader, scopes) {
  const inScope = (name) => scopes.includes(scopeOf(name));
  const memo = new Map();
  const missingOf = async (name, version, path) => {
    const key = `${name}@${version}`;
    if (memo.has(key)) return memo.get(key);
    if (path.has(key)) return [];
    const manifest = (await reader.packument(name))?.versions?.[version];
    if (manifest === undefined) return [key];
    path.add(key);
    const missing = new Set();
    const deps = {
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
      ...manifest.peerDependencies,
    };
    for (const [dep, range] of Object.entries(deps)) {
      if (!inScope(dep) || typeof range !== "string" || !EXACT.test(range)) continue;
      for (const item of await missingOf(dep, range, path)) missing.add(item);
    }
    path.delete(key);
    const result = [...missing].toSorted();
    memo.set(key, result);
    return result;
  };
  const found = [];
  for (const scope of scopes)
    for (const name of await reader.names(scope)) {
      const packument = await reader.packument(name);
      for (const version of Object.keys(packument?.versions ?? {})) {
        const missing = await missingOf(name, version, new Set());
        if (missing.length > 0)
          found.push({
            name,
            version,
            missing,
            deprecated: packument.versions[version].deprecated ?? "",
          });
      }
    }
  return found;
}

const usage =
  "usage: registry-maintain.mjs <plan|apply|scan> [--file <path>] [--registry <https url ending in />]";

/** Reads the command line; throws a usage error on anything else. */
export function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (!["plan", "apply", "scan"].includes(command)) throw new Error(usage);
  const options = { command, file: DEFAULT_FILE, registry: DEFAULT_REGISTRY };
  for (let index = 0; index < rest.length; index += 2) {
    const [flag, value] = [rest[index], rest[index + 1]];
    if (value === undefined) throw new Error(usage);
    if (flag === "--file") options.file = value;
    else if (flag === "--registry") options.registry = value;
    else throw new Error(usage);
  }
  if (
    !/^https:\/\/[^/]+\/$/.test(options.registry) &&
    !/^http:\/\/127\.0\.0\.1:\d+\/$/.test(options.registry)
  )
    throw new Error("--registry must be an https URL ending in /");
  return options;
}

/**
 * The command, with its side effects injected: returns the exit code.
 *
 * @example
 * await run(["plan"], { env: process.env, fetchImpl: fetch, out: console.log }); // 0
 */
export async function run(
  argv,
  { env, fetchImpl = fetch, out, readFile = (path) => readFileSync(path, "utf8") },
) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    out(error.message);
    return 2;
  }
  const inActions = env.GITHUB_ACTIONS === "true";
  const mask = (value) => {
    if (inActions) out(`::add-mask::${value}`);
  };
  const summary = (lines) => {
    if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`);
  };
  try {
    const actionsFile = parseActions(JSON.parse(readFile(options.file)));
    const reader = registryReader(options.registry, fetchImpl);
    if (options.command === "scan") {
      const { actions } = await plan(actionsFile, reader);
      const planned = new Set(
        actions
          .filter((a) => a.kind === "deprecate" && a.message !== "")
          .map((a) => `${a.name}@${a.version}`),
      );
      const scopes = [
        ...new Set([
          ...actionsFile.deprecate.flatMap((entry) => entry.packages.map(scopeOf)),
          ...actionsFile.distTags.flatMap((entry) => entry.packages.map(scopeOf)),
        ]),
      ].toSorted();
      const found = await uninstallable(reader, scopes.length > 0 ? scopes : ["@stackra"]);
      let open = 0;
      for (const item of found) {
        const key = `${item.name}@${item.version}`;
        const state =
          item.deprecated !== "" ? "deprecated" : planned.has(key) ? "planned" : "NOT DEPRECATED";
        if (state === "NOT DEPRECATED") open += 1;
        out(`${state.padEnd(14)} ${key} (missing ${item.missing.join(", ")})`);
      }
      out(`${found.length} uninstallable versions, ${open} neither deprecated nor planned`);
      return open === 0 ? 0 : 1;
    }
    const before = await plan(actionsFile, reader);
    const lines = [
      `## Registry actions (${options.registry})`,
      "",
      ...before.actions.map((action) => `- ${describe(action)}`),
      ...before.problems.map((problem) => `- PROBLEM ${problem}`),
      `- ${before.actions.length} to apply, ${before.skipped.length} in place or left alone, ${before.problems.length} problems`,
    ];
    for (const action of before.actions) out(describe(action));
    for (const line of before.skipped) out(`skip ${line}`);
    for (const problem of before.problems) out(`PROBLEM ${problem}`);
    out(lines.at(-1).slice(2));
    summary(lines);
    if (before.problems.length > 0) return 1;
    if (options.command === "plan") return 0;
    for (const line of await applyActions(options.registry, before.actions, env, fetchImpl, mask))
      out(`applied ${line}`);
    const after = await plan(actionsFile, registryReader(options.registry, fetchImpl));
    if (after.actions.length > 0 || after.problems.length > 0) {
      for (const action of after.actions) out(`STILL PENDING ${describe(action)}`);
      for (const problem of after.problems) out(`PROBLEM ${problem}`);
      return 1;
    }
    out("verified: the registry matches the file");
    summary(["", "Verified after apply: nothing left to do."]);
    return 0;
  } catch (error) {
    if (
      error instanceof ActionsFileError ||
      error instanceof RegistryError ||
      error instanceof SyntaxError
    ) {
      out(`registry-maintain: ${error.message}`);
      return 1;
    }
    throw error;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = await run(process.argv.slice(2), {
    env: process.env,
    out: (line) => process.stdout.write(`${line}\n`),
  });
}
