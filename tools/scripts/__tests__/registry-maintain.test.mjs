/**
 * Stackra file contract:
 * Purpose: hold `registry-maintain.mjs` to its contract: the actions file's refusals, the plan (wildcards, the
 *          compare-and-set of a tag, the problems that stop a run), apply (one publish token per package, tags before
 *          deprecations, masked tokens, the check after), scan (uninstallable versions and whether they are deprecated)
 *          and the exit codes; and keep `tools/release/registry-actions.json` valid and naming the known-bad versions.
 * Boundary: an in-memory registry behind an injected fetch; no network.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy); ADR 0453 (decisions 6 and
 *                     7). STA-2863.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ActionsFileError,
  DEFAULT_FILE,
  parseActions,
  parseArgs,
  plan,
  registryReader,
  run,
  uninstallable,
} from "../registry-maintain.mjs";

const REGISTRY = "https://npm.example.test/";
const ID_URL = "https://actions.example.test/token?api-version=2.0";
const ENV = {
  ACTIONS_ID_TOKEN_REQUEST_URL: ID_URL,
  ACTIONS_ID_TOKEN_REQUEST_TOKEN: "request-secret",
  GITHUB_ACTIONS: "true",
};

/** A package version; `deps` name exact versions of the scope's own packages. */
const v = (version, deps = {}, deprecated) => ({
  version,
  dependencies: deps,
  ...(deprecated === undefined ? {} : { deprecated }),
});

/** A JSON response, as the registry answers. */
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/**
 * An in-memory registry: packuments by name, a catalogue paged two names at a time, the OIDC exchange, and the
 * deprecate and dist-tag routes with the Worker's rules (a token is bound to one name; an unknown version is refused).
 */
function fakeRegistry(packages) {
  const state = structuredClone(packages);
  const calls = [];
  const tokens = new Map();
  let minted = 0;
  const fetchImpl = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = init.method ?? "GET";
    const auth = new Headers(init.headers).get("authorization") ?? "";
    calls.push(`${method} ${url.pathname}${url.search}`);
    if (url.href.startsWith(ID_URL)) {
      assert.equal(auth, "bearer request-secret");
      assert.equal(url.searchParams.get("audience"), "npm:npm.example.test");
      return json({ value: "github-id-token" });
    }
    const path = decodeURIComponent(url.pathname);
    if (path === "/-/stackra/v1/catalogue") {
      const names = Object.keys(state)
        .filter((name) => name.startsWith(`${url.searchParams.get("scope")}/`))
        .sort();
      const start = Number(url.searchParams.get("cursor") ?? "0");
      const next = start + 2 < names.length ? String(start + 2) : undefined;
      return json({ items: names.slice(start, start + 2).map((name) => ({ name })), next });
    }
    const exchange = path.match(/^\/-\/npm\/v1\/oidc\/token\/exchange\/package\/(.+)$/);
    if (exchange && method === "POST") {
      assert.equal(auth, "Bearer github-id-token");
      minted += 1;
      const token = `publish-token-${minted}`;
      tokens.set(token, exchange[1]);
      return json({ token }, 201);
    }
    const tag = path.match(/^\/-\/package\/(.+)\/dist-tags\/([^/]+)$/);
    if (tag && method === "PUT") {
      const [, name, tagName] = tag;
      if (tokens.get(auth.replace("Bearer ", "")) !== name)
        return json({ error: "forbidden" }, 403);
      const target = JSON.parse(init.body);
      if (state[name]?.versions[target] === undefined)
        return json({ error: "that version does not exist" }, 404);
      state[name]["dist-tags"][tagName] = target;
      return json({ ok: true }, 201);
    }
    const name = path.slice(1);
    if (method === "PUT") {
      if (tokens.get(auth.replace("Bearer ", "")) !== name)
        return json({ error: "forbidden" }, 403);
      const body = JSON.parse(init.body);
      for (const [version, manifest] of Object.entries(body.versions)) {
        if (state[name]?.versions[version] === undefined)
          return json({ error: "a new version needs its tarball" }, 400);
        if (manifest.deprecated === "") delete state[name].versions[version].deprecated;
        else state[name].versions[version].deprecated = manifest.deprecated;
      }
      return json({ ok: true });
    }
    if (method === "GET" && state[name] !== undefined) return json({ name, ...state[name] });
    return json({ error: "not_found" }, 404);
  };
  return { state, calls, fetchImpl };
}

/** Two packages at 0.2.0 and a partial 0.2.1: `@stackra/b@0.2.1` names `@stackra/c@0.2.1`, never published. */
const PARTIAL = {
  "@stackra/a": {
    "dist-tags": { latest: "0.2.1" },
    versions: { "0.2.0": v("0.2.0"), "0.2.1": v("0.2.1") },
  },
  "@stackra/b": {
    "dist-tags": { latest: "0.2.1" },
    versions: {
      "0.2.0": v("0.2.0", { "@stackra/c": "0.2.0" }),
      "0.2.1": v("0.2.1", { "@stackra/c": "0.2.1" }),
    },
  },
  "@stackra/c": { "dist-tags": { latest: "0.2.0" }, versions: { "0.2.0": v("0.2.0") } },
};

const FILE = {
  deprecate: [
    {
      packages: ["@stackra/*"],
      version: "0.2.1",
      message: "partial release; use 0.2.0",
      issue: "STA-1",
      reason: "r",
    },
  ],
  distTags: [
    {
      packages: ["@stackra/*"],
      tag: "latest",
      from: ["0.2.1"],
      to: "0.2.0",
      issue: "STA-1",
      reason: "r",
    },
  ],
};

const runWith = async (argv, registry, file = FILE, env = ENV) => {
  const lines = [];
  const code = await run(argv, {
    env,
    fetchImpl: registry.fetchImpl,
    out: (line) => lines.push(line),
    readFile: () => JSON.stringify(file),
  });
  return { code, lines };
};

test("parseActions refuses what the file must never hold", () => {
  const entry = {
    packages: ["@stackra/a"],
    version: "1.0.0",
    message: "m",
    issue: "STA-1",
    reason: "r",
  };
  const refused = [
    [{ deprecate: [{ ...entry, packages: [] }] }, /packages must be a non-empty list/],
    [{ deprecate: [{ ...entry, packages: ["stackra-a"] }] }, /not @scope\/name/],
    [{ deprecate: [{ ...entry, version: "^1.0.0" }] }, /exact version/],
    [{ deprecate: [{ ...entry, message: 7 }] }, /message must be a string/],
    [{ deprecate: [{ ...entry, message: "a\nb" }] }, /control character/],
    [{ deprecate: [{ ...entry, message: "x".repeat(501) }] }, /over 500/],
    [{ deprecate: [{ ...entry, issue: "" }] }, /Linear key/],
    [{ deprecate: [{ ...entry, reason: " " }] }, /reason/],
    [{ deprecate: [{ ...entry, extra: 1 }] }, /unknown key "extra"/],
    [
      {
        distTags: [
          {
            packages: ["@stackra/a"],
            tag: "latest",
            from: [],
            to: "1.0.0",
            issue: "STA-1",
            reason: "r",
          },
        ],
      },
      /from must list/,
    ],
    [
      {
        distTags: [
          {
            packages: ["@stackra/a"],
            tag: "latest",
            from: ["1.0.0"],
            to: "1.0.0",
            issue: "STA-1",
            reason: "r",
          },
        ],
      },
      /to is one of the from/,
    ],
    [
      {
        distTags: [
          {
            packages: ["@stackra/a"],
            tag: "Latest!",
            from: ["1.0.1"],
            to: "1.0.0",
            issue: "STA-1",
            reason: "r",
          },
        ],
      },
      /tag must be/,
    ],
    [{ unpublish: [] }, /unknown key "unpublish"/],
  ];
  for (const [raw, pattern] of refused)
    assert.throws(
      () => parseActions(raw),
      (error) => error instanceof ActionsFileError && pattern.test(error.message),
    );
  assert.deepEqual(parseActions({ deprecate: [entry] }).distTags, []);
});

test("plan expands @scope/* over the paged catalogue and plans only what differs", async () => {
  const registry = fakeRegistry(PARTIAL);
  const result = await plan(parseActions(FILE), registryReader(REGISTRY, registry.fetchImpl));
  assert.deepEqual(result.problems, []);
  assert.deepEqual(
    result.actions.map((action) => `${action.kind} ${action.name}`),
    ["deprecate @stackra/a", "deprecate @stackra/b", "dist-tag @stackra/a", "dist-tag @stackra/b"],
  );
  // @stackra/c has no 0.2.1 (skipped by the wildcard) and its latest is already the target.
  assert.deepEqual(result.skipped, ["@stackra/c#latest: already 0.2.0"]);
  // Two catalogue pages (a, b | c), and each packument read once.
  assert.equal(registry.calls.filter((call) => call.startsWith("GET /-/stackra")).length, 2);
  assert.equal(registry.calls.filter((call) => call === "GET /@stackra%2fa").length, 1);
});

test("a tag moves only while it points at a `from` version, so a later release is never moved back", async () => {
  const moved = structuredClone(PARTIAL);
  moved["@stackra/a"]["dist-tags"].latest = "0.3.0";
  moved["@stackra/a"].versions["0.3.0"] = v("0.3.0");
  const result = await plan(
    parseActions(FILE),
    registryReader(REGISTRY, fakeRegistry(moved).fetchImpl),
  );
  assert.deepEqual(
    result.actions.filter((action) => action.kind === "dist-tag").map((action) => action.name),
    ["@stackra/b"],
  );
  assert.ok(result.skipped.includes("@stackra/a#latest: at 0.3.0, not one of 0.2.1; left alone"));
});

test("plan names the problems that stop a run instead of guessing", async () => {
  const noTarget = structuredClone(PARTIAL);
  delete noTarget["@stackra/b"].versions["0.2.0"];
  const file = {
    deprecate: [
      { packages: ["@stackra/a"], version: "9.9.9", message: "m", issue: "STA-1", reason: "r" },
      { packages: ["@stackra/zz"], version: "0.2.0", message: "m", issue: "STA-1", reason: "r" },
      { packages: ["@stackra/a"], version: "0.2.1", message: "one", issue: "STA-1", reason: "r" },
      { packages: ["@stackra/*"], version: "0.2.1", message: "two", issue: "STA-1", reason: "r" },
    ],
    distTags: FILE.distTags,
  };
  const { problems } = await plan(
    parseActions(file),
    registryReader(REGISTRY, fakeRegistry(noTarget).fetchImpl),
  );
  assert.deepEqual(problems, [
    "@stackra/a@9.9.9: not on the registry (deprecate[0])",
    "@stackra/zz@0.2.0: not on the registry (deprecate[1])",
    "@stackra/a@0.2.1: deprecate[2] and deprecate[3] give different messages",
    "@stackra/b#latest: at 0.2.1, but @stackra/b@0.2.0 is not on the registry (distTags[0])",
  ]);
});

test("plan prints the actions, writes nothing and exits 0; a problem exits 1", async () => {
  const registry = fakeRegistry(PARTIAL);
  const { code, lines } = await runWith(["plan", "--registry", REGISTRY], registry);
  assert.equal(code, 0);
  assert.ok(lines.includes('deprecate @stackra/a@0.2.1: "partial release; use 0.2.0" (STA-1)'));
  assert.ok(lines.includes("move @stackra/b#latest 0.2.1 -> 0.2.0 (STA-1)"));
  assert.ok(lines.at(-1).startsWith("4 to apply"));
  assert.ok(registry.calls.every((call) => call.startsWith("GET ")));
  assert.deepEqual(registry.state, PARTIAL);
  const bad = { ...FILE, deprecate: [{ ...FILE.deprecate[0], packages: ["@stackra/zz"] }] };
  assert.equal(
    (await runWith(["plan", "--registry", REGISTRY], fakeRegistry(PARTIAL), bad)).code,
    1,
  );
});

test("apply exchanges one masked token per package, moves tags before deprecating, then verifies", async () => {
  const registry = fakeRegistry(PARTIAL);
  const { code, lines } = await runWith(["apply", "--registry", REGISTRY], registry);
  assert.equal(code, 0, lines.join("\n"));
  assert.equal(registry.state["@stackra/a"]["dist-tags"].latest, "0.2.0");
  assert.equal(registry.state["@stackra/b"]["dist-tags"].latest, "0.2.0");
  assert.equal(
    registry.state["@stackra/b"].versions["0.2.1"].deprecated,
    "partial release; use 0.2.0",
  );
  assert.equal(registry.state["@stackra/c"].versions["0.2.0"].deprecated, undefined);
  const writes = registry.calls.filter((call) => !call.startsWith("GET "));
  assert.deepEqual(writes, [
    "POST /-/npm/v1/oidc/token/exchange/package/@stackra%2fa",
    "PUT /-/package/@stackra%2fa/dist-tags/latest",
    "PUT /@stackra%2fa",
    "POST /-/npm/v1/oidc/token/exchange/package/@stackra%2fb",
    "PUT /-/package/@stackra%2fb/dist-tags/latest",
    "PUT /@stackra%2fb",
  ]);
  // Every token is masked before it could be printed, and none appears anywhere else.
  const masks = lines.filter((line) => line.startsWith("::add-mask::"));
  assert.deepEqual(masks, [
    "::add-mask::github-id-token",
    "::add-mask::publish-token-1",
    "::add-mask::github-id-token",
    "::add-mask::publish-token-2",
  ]);
  assert.ok(
    lines
      .filter((line) => !line.startsWith("::add-mask::"))
      .every((line) => !/token-\d|github-id|request-secret/.test(line)),
  );
  assert.equal(lines.at(-1), "verified: the registry matches the file");
  // A second run has nothing to do and writes nothing.
  const again = await runWith(["apply", "--registry", REGISTRY], registry);
  assert.equal(again.code, 0);
  assert.ok(again.lines.some((line) => line.startsWith("0 to apply")));
  assert.equal(registry.calls.filter((call) => call.startsWith("POST")).length, 2);
});

test("apply outside a job with id-token: write fails before any write", async () => {
  const registry = fakeRegistry(PARTIAL);
  const { code, lines } = await runWith(["apply", "--registry", REGISTRY], registry, FILE, {});
  assert.equal(code, 1);
  assert.match(lines.at(-1), /id-token: write/);
  assert.ok(registry.calls.every((call) => call.startsWith("GET ")));
});

test("apply stops on a refusal and names the route and the registry's error, never a token", async () => {
  const registry = fakeRegistry(PARTIAL);
  const refusing = async (input, init = {}) =>
    String(input).includes("dist-tags")
      ? new Response(JSON.stringify({ error: "this publish token is for @stackra/x" }), {
          status: 403,
        })
      : registry.fetchImpl(input, init);
  const lines = [];
  const code = await run(["apply", "--registry", REGISTRY], {
    env: ENV,
    fetchImpl: refusing,
    out: (line) => lines.push(line),
    readFile: () => JSON.stringify(FILE),
  });
  assert.equal(code, 1);
  assert.equal(
    lines.at(-1),
    "registry-maintain: PUT https://npm.example.test/-/package/@stackra%2fa/dist-tags/latest: HTTP 403 this publish token is for @stackra/x",
  );
});

test("apply fails when the registry accepts a write but the packument does not show it", async () => {
  // A write answered 200 that did not land (a stale cache, a no-op route) must not pass as done.
  const registry = fakeRegistry(PARTIAL);
  const ignoring = async (input, init = {}) =>
    (init.method ?? "GET") === "PUT"
      ? new Response(JSON.stringify({ ok: true }), { status: 200 })
      : registry.fetchImpl(input, init);
  const lines = [];
  const code = await run(["apply", "--registry", REGISTRY], {
    env: ENV,
    fetchImpl: ignoring,
    out: (line) => lines.push(line),
    readFile: () => JSON.stringify(FILE),
  });
  assert.equal(code, 1);
  assert.ok(
    lines.includes("STILL PENDING move @stackra/a#latest 0.2.1 -> 0.2.0 (STA-1)"),
    lines.join("\n"),
  );
  assert.ok(!lines.includes("verified: the registry matches the file"));
});

test("an undeprecation (empty message) clears the warning", async () => {
  const deprecated = structuredClone(PARTIAL);
  deprecated["@stackra/c"].versions["0.2.0"].deprecated = "wrongly deprecated";
  const registry = fakeRegistry(deprecated);
  const file = {
    deprecate: [
      { packages: ["@stackra/c"], version: "0.2.0", message: "", issue: "STA-1", reason: "r" },
    ],
  };
  const { code, lines } = await runWith(["apply", "--registry", REGISTRY], registry, file);
  assert.equal(code, 0, lines.join("\n"));
  assert.ok(lines.includes("applied undeprecate @stackra/c@0.2.0 (STA-1)"));
  assert.equal(registry.state["@stackra/c"].versions["0.2.0"].deprecated, undefined);
});

test("scan finds the versions whose tree names a missing version, and fails while one is not deprecated", async () => {
  const found = await uninstallable(registryReader(REGISTRY, fakeRegistry(PARTIAL).fetchImpl), [
    "@stackra",
  ]);
  assert.deepEqual(found, [
    { name: "@stackra/b", version: "0.2.1", missing: ["@stackra/c@0.2.1"], deprecated: "" },
  ]);
  const transitive = structuredClone(PARTIAL);
  transitive["@stackra/a"].versions["0.2.1"].dependencies = {
    "@stackra/b": "0.2.1",
    "left-pad": "1.0.0",
  };
  assert.deepEqual(
    (
      await uninstallable(registryReader(REGISTRY, fakeRegistry(transitive).fetchImpl), [
        "@stackra",
      ])
    ).map((item) => `${item.name}@${item.version}`),
    ["@stackra/a@0.2.1", "@stackra/b@0.2.1"],
  );
  const covered = await runWith(["scan", "--registry", REGISTRY], fakeRegistry(PARTIAL));
  assert.equal(covered.code, 0);
  assert.ok(covered.lines.includes("planned        @stackra/b@0.2.1 (missing @stackra/c@0.2.1)"));
  const uncovered = await runWith(["scan", "--registry", REGISTRY], fakeRegistry(PARTIAL), {
    deprecate: [],
    distTags: FILE.distTags,
  });
  assert.equal(uncovered.code, 1);
  assert.equal(
    uncovered.lines.at(-1),
    "1 uninstallable versions, 1 neither deprecated nor planned",
  );
});

test("parseArgs takes the three commands, --file and an https --registry ending in /", () => {
  assert.deepEqual(parseArgs(["plan"]), {
    command: "plan",
    file: DEFAULT_FILE,
    registry: "https://npm.stackra.figentra.com/",
  });
  assert.throws(() => parseArgs(["unpublish"]), /usage/);
  assert.throws(() => parseArgs(["plan", "--registry", "http://npm.example.test/"]), /https URL/);
  assert.throws(() => parseArgs(["plan", "--file"]), /usage/);
});

test("tools/release/registry-actions.json is valid and names the known-bad versions", () => {
  const raw = JSON.parse(
    readFileSync(new URL(`../../../${DEFAULT_FILE}`, import.meta.url), "utf8"),
  );
  const file = parseActions(raw);
  const deprecated = file.deprecate.map((entry) => entry.version).sort();
  assert.deepEqual(deprecated, ["0.10.0", "0.28.0", "0.33.1"]);
  assert.ok(file.deprecate.every((entry) => /Use|Install/.test(entry.message)));
  assert.deepEqual(
    file.distTags.map(
      (entry) => `${entry.packages.join(",")}#${entry.tag} ${entry.from.join(",")} -> ${entry.to}`,
    ),
    ["@stackra/*#latest 0.33.1 -> 0.33.0"],
  );
});
