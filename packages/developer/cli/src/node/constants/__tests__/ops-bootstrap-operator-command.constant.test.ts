/**
 * Stackra file contract:
 * Purpose: unit tests of `OPS_BOOTSTRAP_OPERATOR_COMMAND`: it posts the email, role and dry-run flag with the bearer
 *          token from `STACKRA_OPS_TOKEN` to the environment's `/platform/operators/bootstrap`; prints granted, already
 *          granted and would grant (exit 0); a user not found, an error status, an unreachable origin or an odd answer
 *          exit 1; a missing or bad email, an empty role, an unknown environment, a plain-HTTP origin or a missing token
 *          is a usage error and calls nothing; the token and the email are never printed.
 * Boundary: test only; a stubbed global fetch that records every call, so no environment is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0237; STA-1586.
 */
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { OPS_BOOTSTRAP_OPERATOR_COMMAND } from "#node/constants/ops-bootstrap-operator-command.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import type { CliContext } from "#node/types/cli-context.type";

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

const run = (values: CliContext["values"]) => {
  const { io, output } = captureIo();
  const code = OPS_BOOTSTRAP_OPERATOR_COMMAND.run({
    cwd: "/m",
    io,
    values: { api: API, env: "production", ...values },
    positionals: [],
    rest: [],
    cli: async () => 0,
  });
  return { code, output };
};

beforeEach(() => {
  vi.stubEnv("STACKRA_OPS_TOKEN", TOKEN);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("ops bootstrap-operator", () => {
  it("posts the email, role and dry run with the bearer token and prints the grant", async () => {
    const fetcher = answering(json({ outcome: "granted", role: "owner", userId: "usr_1" }));
    const { code, output } = run({ email: EMAIL, role: "owner" });
    expect(await code).toBe(0);
    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(url).toBe(`${API}/platform/operators/bootstrap`);
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string> | undefined)?.["authorization"]).toBe(
      `Bearer ${TOKEN}`,
    );
    expect(JSON.parse(String(init?.body))).toEqual({ email: EMAIL, role: "owner" });
    expect(output()).toContain("ops bootstrap-operator (production): granted owner to usr_1");
    expect(output()).not.toContain(TOKEN);
    expect(output()).not.toContain(EMAIL);
  });

  it("says when the role is already held, and sends dryRun on a dry run", async () => {
    answering(json({ outcome: "already_granted", role: "owner", userId: "usr_1" }));
    const held = run({ email: EMAIL });
    expect(await held.code).toBe(0);
    expect(held.output()).toContain("usr_1 already holds owner; nothing written");
    const fetcher = answering(json({ outcome: "would_grant", role: "owner", userId: "usr_1" }));
    const dry = run({ email: EMAIL, "dry-run": true });
    expect(await dry.code).toBe(0);
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({
      email: EMAIL,
      dryRun: true,
    });
    expect(dry.output()).toContain("dry run: would grant owner to usr_1");
  });

  it("exits 1 when no user has the email, on an error status, an unreachable origin or an odd answer", async () => {
    answering(json({ outcome: "not_found", role: "owner" }));
    const missing = run({ email: EMAIL });
    expect(await missing.code).toBe(1);
    expect(missing.output()).toContain("no user with that email");
    expect(missing.output()).not.toContain(EMAIL);
    answering(json({ code: "forbidden" }, 403));
    expect(await run({ email: EMAIL }).code).toBe(1);
    answering(new Error("connect ECONNREFUSED"));
    expect(await run({ email: EMAIL }).code).toBe(1);
    answering(json({ outcome: "maybe" }));
    expect(await run({ email: EMAIL }).code).toBe(1);
  });

  it("refuses a bad email, an empty role, an unknown environment or a missing token, calling nothing", async () => {
    const fetcher = answering(json({}));
    await expect(run({}).code).rejects.toThrow(CliUsageError);
    await expect(run({ email: "rana" }).code).rejects.toThrow(CliUsageError);
    await expect(run({ email: EMAIL, role: " " }).code).rejects.toThrow(CliUsageError);
    await expect(run({ email: EMAIL, env: "prod" }).code).rejects.toThrow(CliUsageError);
    await expect(run({ email: EMAIL, api: "http://api.acme.example" }).code).rejects.toThrow(
      CliUsageError,
    );
    vi.stubEnv("STACKRA_OPS_TOKEN", "");
    await expect(run({ email: EMAIL }).code).rejects.toThrow(/STACKRA_OPS_TOKEN/u);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
