/**
 * Stackra file contract:
 * Purpose: unit tests of `OpsBootstrapOperatorCommand` on the console: it posts the email, role and dry-run flag with
 *          the bearer token from `STACKRA_OPS_TOKEN` to the environment's `/platform/operators/bootstrap`; says granted,
 *          already granted and would grant (exit 0, the answer as the `--json` data); a user not found, an error
 *          status, an unreachable origin or an odd answer exit 1; a missing or bad email, an empty role, an unknown
 *          environment, a plain-HTTP origin or a missing token exits 2 and calls nothing; the token and the email are
 *          never printed.
 * Boundary: test only; a stubbed global fetch that records every call, so no environment is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0237; STA-1586; ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { OpsBootstrapOperatorCommand } from "#node/commands/ops-bootstrap-operator.command";

const TOKEN = "ops_token_secret";
const API = "https://api.acme.example";
const EMAIL = "rana@acme.example";

/** A fetch that answers `answer` and records every call. */
function answering(answer: Response | Error) {
  const fetcher = vi.fn(async (_url: string, _init: RequestInit) => {
    if (answer instanceof Error) throw answer;
    return answer;
  });
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}

const json = (body: object, status = 200) => new Response(JSON.stringify(body), { status });

/** Runs the command against `API` on production, then `flags`. */
const run = (...flags: string[]) =>
  runCommandForTest(
    [OpsBootstrapOperatorCommand],
    ["ops", "bootstrap-operator", "--api", API, "--env", "production", ...flags],
    { cwd: "/m" },
  );

beforeEach(() => {
  vi.stubEnv("STACKRA_OPS_TOKEN", TOKEN);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("OpsBootstrapOperatorCommand", () => {
  it("posts the email and role with the bearer token and says the grant", async () => {
    const fetcher = answering(json({ outcome: "granted", role: "owner", userId: "usr_1" }));
    const result = await run("--email", EMAIL, "--role", "owner");
    expect(result.exitCode).toBe(0);
    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(url).toBe(`${API}/platform/operators/bootstrap`);
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string> | undefined)?.["authorization"]).toBe(
      `Bearer ${TOKEN}`,
    );
    expect(JSON.parse(String(init?.body))).toEqual({ email: EMAIL, role: "owner" });
    expect(result.stdout).toContain("ops bootstrap-operator (production): granted owner to usr_1");
    expect(result.stdout + result.stderr).not.toContain(TOKEN);
    expect(result.stdout + result.stderr).not.toContain(EMAIL);
  });

  it("says when the role is already held, and sends dryRun on a dry run", async () => {
    answering(json({ outcome: "already_granted", role: "owner", userId: "usr_1" }));
    const held = await run("--email", EMAIL);
    expect(held.exitCode).toBe(0);
    expect(held.stdout).toContain("usr_1 already holds owner; nothing written");
    const fetcher = answering(json({ outcome: "would_grant", role: "owner", userId: "usr_1" }));
    const dry = await run("--email", EMAIL, "--dry-run", "--json");
    expect(dry.exitCode).toBe(0);
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({
      email: EMAIL,
      dryRun: true,
    });
    expect(dry.json).toEqual({
      ok: true,
      data: { outcome: "would_grant", role: "owner", userId: "usr_1" },
    });
  });

  it("exits 1 when no user has the email, on an error status, an unreachable origin or an odd answer", async () => {
    answering(json({ outcome: "not_found", role: "owner" }));
    const missing = await run("--email", EMAIL);
    expect(missing.exitCode).toBe(1);
    expect(missing.stderr).toContain("no user with that email");
    expect(missing.stdout + missing.stderr).not.toContain(EMAIL);
    answering(json({ code: "forbidden" }, 403));
    expect((await run("--email", EMAIL)).exitCode).toBe(1);
    answering(new Error("connect ECONNREFUSED"));
    expect((await run("--email", EMAIL)).exitCode).toBe(1);
    answering(json({ outcome: "maybe" }));
    expect((await run("--email", EMAIL)).exitCode).toBe(1);
  });

  it("refuses a bad email, an empty role, an unknown environment, plain HTTP or a missing token with exit 2", async () => {
    const fetcher = answering(json({}));
    for (const flags of [
      [],
      ["--email", "rana"],
      ["--email", EMAIL, "--role", " "],
      ["--email", EMAIL, "--env", "prod"],
      ["--email", EMAIL, "--api", "http://api.acme.example"],
    ])
      expect((await run(...flags)).exitCode).toBe(2);
    vi.stubEnv("STACKRA_OPS_TOKEN", "");
    const tokenless = await run("--email", EMAIL, "--json");
    expect(tokenless.exitCode).toBe(2);
    expect(JSON.stringify(tokenless.json)).toContain("STACKRA_OPS_TOKEN");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
