/**
 * Stackra file contract:
 * Purpose: end-to-end test of release.yml's registry maintenance (STA-2863) against this Worker: the repository's
 *          `tools/scripts/registry-maintain.mjs` exchanges a GitHub ID token per package, moves `latest` back off a
 *          partial release and deprecates it, and the packument (full and install form) and the audit log show it;
 *          the same run from an environment the publisher row does not name (`release-pr`) changes nothing.
 * Boundary: test only; D1 is node:sqlite with the real migrations, everything else in memory. The script is loaded
 *           from tools/scripts by URL, as release.yml runs it, and its fetch is routed into `handleRequest`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 6 and 7); ADR 0468.
 */
import { createTestRegistry, HOST, STACKRA_CLAIMS } from "#src/__tests__/fixtures/registry.fixture";
import type { GithubClaims } from "#src/interfaces/github-claims.interface";
import { handleRequest } from "#src/http/handle-request";

/** The part of the script this test drives. */
interface Script {
  run: (
    argv: readonly string[],
    io: {
      env: Readonly<Record<string, string>>;
      fetchImpl: typeof fetch;
      out: (line: string) => void;
      readFile: (path: string) => string;
    },
  ) => Promise<number>;
}

// oxlint-disable-next-line typescript/no-explicit-any -- the tests read deep npm JSON shapes by path
type Json = any;

const REGISTRY = `https://${HOST}/`;
const ID_URL = "https://actions.example.test/token?api-version=2.0";
const SCRIPT = new URL("../../../../../tools/scripts/registry-maintain.mjs", import.meta.url);

/** A partial release: core@0.2.0 names lib@0.2.0, which was never published. */
const ACTIONS = {
  deprecate: [
    {
      packages: ["@stackra/*"],
      version: "0.2.0",
      message: "0.2.0 is a partial release; install 0.1.0",
      issue: "STA-2863",
      reason: "lib 0.2.0 was never published",
    },
  ],
  distTags: [
    {
      packages: ["@stackra/*"],
      tag: "latest",
      from: ["0.2.0"],
      to: "0.1.0",
      issue: "STA-2863",
      reason: "0.1.0 is the newest complete set",
    },
  ],
};

describe("registry maintenance (release.yml) against the Worker", () => {
  let registry: Awaited<ReturnType<typeof createTestRegistry>>;
  let script: Script;

  beforeEach(async () => {
    registry = await createTestRegistry();
    script = (await import(SCRIPT.href)) as Script;
    const pkg = { license: "MIT", description: "x" };
    for (const published of [
      { name: "@stackra/lib", version: "0.1.0", ...pkg },
      {
        name: "@stackra/core",
        version: "0.1.0",
        dependencies: { "@stackra/lib": "0.1.0" },
        ...pkg,
      },
      {
        name: "@stackra/core",
        version: "0.2.0",
        dependencies: { "@stackra/lib": "0.2.0" },
        ...pkg,
      },
    ])
      expect((await registry.publish(published)).status).toBe(201);
  });

  /** release.yml's job as `claims` describe it: the ID token request answers a token with those claims. */
  const job = (claims: GithubClaims) => {
    const lines: string[] = [];
    const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith(ID_URL)) return Response.json({ value: await registry.idToken(claims) });
      if (!url.startsWith(REGISTRY)) throw new Error(`unexpected fetch ${url}`);
      const { signal: _signal, ...rest } = init ?? {};
      return handleRequest(new Request(url, rest), registry.deps);
    }) as typeof fetch;
    const run = (command: string) =>
      script.run([command, "--registry", REGISTRY], {
        env: {
          ACTIONS_ID_TOKEN_REQUEST_URL: ID_URL,
          ACTIONS_ID_TOKEN_REQUEST_TOKEN: "request",
          GITHUB_ACTIONS: "true",
        },
        fetchImpl,
        out: (line) => lines.push(line),
        readFile: () => JSON.stringify(ACTIONS),
      });
    return { lines, run };
  };

  const packument = async (accept?: string): Promise<Json> =>
    (await registry.request("/@stackra%2fcore", accept === undefined ? {} : { accept })).json();

  it("moves latest back and deprecates the partial release, audited as the release workflow", async () => {
    expect((await packument())["dist-tags"].latest).toBe("0.2.0");
    const scan = job(STACKRA_CLAIMS);
    expect(await scan.run("scan")).toBe(0);
    expect(scan.lines).toContain("planned        @stackra/core@0.2.0 (missing @stackra/lib@0.2.0)");

    const release = job(STACKRA_CLAIMS);
    expect(await release.run("apply")).toBe(0);
    expect(release.lines.at(-1)).toBe("verified: the registry matches the file");

    const full = await packument();
    expect(full["dist-tags"].latest).toBe("0.1.0");
    expect(full.versions["0.2.0"].deprecated).toBe("0.2.0 is a partial release; install 0.1.0");
    expect(full.versions["0.1.0"].deprecated).toBeUndefined();
    const install = await packument("application/vnd.npm.install-v1+json");
    expect(install.versions["0.2.0"].deprecated).toBe("0.2.0 is a partial release; install 0.1.0");
    // lib has no 0.2.0: the wildcard skips it, and its latest already names 0.1.0.
    expect(
      ((await (await registry.request("/@stackra%2flib")).json()) as Json)["dist-tags"].latest,
    ).toBe("0.1.0");

    const audit = registry.sqlite
      .prepare(
        "SELECT action, name, version, actor FROM audit_events WHERE action IN ('deprecate', 'dist-tag.set') ORDER BY id",
      )
      .all();
    expect(audit).toEqual([
      {
        action: "dist-tag.set",
        name: "@stackra/core",
        version: "0.1.0",
        actor: "ci:stackra-inc/stackra",
      },
      {
        action: "deprecate",
        name: "@stackra/core",
        version: "0.2.0",
        actor: "ci:stackra-inc/stackra",
      },
    ]);

    // A re-run, and a run after the next release, change nothing: latest has moved on from 0.2.0.
    expect(await job(STACKRA_CLAIMS).run("apply")).toBe(0);
    expect(
      (
        await registry.publish({
          name: "@stackra/core",
          version: "0.3.0",
          license: "MIT",
          description: "x",
        })
      ).status,
    ).toBe(201);
    expect((await packument())["dist-tags"].latest).toBe("0.3.0");
    const after = job(STACKRA_CLAIMS);
    expect(await after.run("apply")).toBe(0);
    expect(after.lines).toContain(
      "skip @stackra/core#latest: at 0.3.0, not one of 0.2.0; left alone",
    );
    expect((await packument())["dist-tags"].latest).toBe("0.3.0");
  });

  it("changes nothing from an environment the publisher row does not name", async () => {
    const unapproved = job({ ...STACKRA_CLAIMS, environment: "release-pr" });
    expect(await unapproved.run("apply")).toBe(1);
    expect(unapproved.lines.at(-1)).toBe(
      `registry-maintain: POST ${REGISTRY}-/npm/v1/oidc/token/exchange/package/@stackra%2fcore: HTTP 403 this workflow is not the trusted publisher of @stackra`,
    );
    const full = await packument();
    expect(full["dist-tags"].latest).toBe("0.2.0");
    expect(full.versions["0.2.0"].deprecated).toBeUndefined();
  });
});
