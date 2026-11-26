/**
 * Stackra file contract:
 * Purpose: unit tests of `DevTokenCommand` on the console (`stackra dev token`): it prints only a token for the
 *          seeded dev user that the workspace's dev issuer key verifies and that `verifyCallToken` accepts under
 *          `stackra dev` but refuses where no dev keys are set; `--user`, `--realm`, `--scope` with `--scope-id`,
 *          `--role`, `--permission` and `--ttl` shape it; `--json` answers the token with its user and expiry;
 *          `--scope` without `--scope-id` and a run outside a workspace are usage errors (exit 2).
 * Boundary: test only; the workspace root is a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (amendment of 2026-11-26: the dev issuer); STA-2795.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildConfig } from "@stackra/config";
import { BearerConfig, MemoryJsonWebKeysDriver, verifyCallToken } from "@stackra/app/server";
import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DevTokenCommand } from "#node/commands/dev-token.command";
import { ensureDevIssuer } from "#node/dev-issuer/functions/ensure-dev-issuer.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

vi.mock("#node/functions/workspace-root.function", () => ({ workspaceRoot: vi.fn() }));

/** The provider-neutral claim names a dev token carries (`IDENTITY_CLAIMS` of @stackra/identity). */
const IDENTITY_CLAIMS = {
  realm: "urn:stackra:realm",
  scopePath: "urn:stackra:scope_path",
  memberships: "urn:stackra:memberships",
  permissions: "urn:stackra:permissions",
} as const;

const OTHER_USER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";
const SCOPE_ID = "scp_01j9z3k4m5n6p7q8r9s0t1v2w6";

let root = "";

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-dev-token-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - services/*\n");
  vi.mocked(workspaceRoot).mockReturnValue(root);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** The claims `verifyCallToken` accepts `token` with, in a process whose env is `env`. */
async function claimsUnder(token: string, env: Record<string, string>) {
  return verifyCallToken(token, buildConfig(BearerConfig, { env }), new MemoryJsonWebKeysDriver());
}

describe("DevTokenCommand", () => {
  it("prints only a token for the seeded dev user, accepted under stackra dev and refused elsewhere", async () => {
    const result = await runCommandForTest([DevTokenCommand], ["dev", "token"]);
    expect(result.exitCode).toBe(0);
    const token = result.stdout.trim();
    expect(token.split(".")).toHaveLength(3);
    const { key, user } = await ensureDevIssuer(root);
    expect(result.stdout).not.toContain(String(key.privateKey.d));
    const devKeys = JSON.stringify({ keys: [key.publicKey] });
    expect(
      await claimsUnder(token, { STACKRA_DEV_ISSUER_KEYS: devKeys, STACKRA_ENVIRONMENT: "dev" }),
    ).toMatchObject({
      sub: user.id,
      email: user.email,
      [IDENTITY_CLAIMS.realm]: "tenant",
    });
    expect(await claimsUnder(token, { STACKRA_ENVIRONMENT: "production" })).toBeUndefined();
  });

  it("shapes the token from its flags and answers it under --json", async () => {
    const result = await runCommandForTest(
      [DevTokenCommand],
      [
        "dev:token",
        "--user",
        OTHER_USER,
        "--realm",
        "customer",
        "--scope",
        "platform.acme",
        "--scope-id",
        SCOPE_ID,
        "--role",
        "member",
        "--permission",
        "note.create",
        "--permission",
        "note.read",
        "--ttl",
        "60",
        "--json",
      ],
    );
    expect(result.exitCode).toBe(0);
    const data = (result.json as { data: Record<string, unknown> }).data;
    expect(data).toMatchObject({
      user: OTHER_USER,
      realm: "customer",
      scope: "platform.acme",
      scopeId: SCOPE_ID,
      roles: ["member"],
      issuer: "https://dev-issuer.stackra.invalid",
    });
    const { key } = await ensureDevIssuer(root);
    const claims = await claimsUnder(String(data["token"]), {
      STACKRA_DEV_ISSUER_KEYS: JSON.stringify({ keys: [key.publicKey] }),
      STACKRA_ENVIRONMENT: "dev",
    });
    expect(claims).toMatchObject({
      sub: OTHER_USER,
      [IDENTITY_CLAIMS.scopePath]: "platform.acme",
      [IDENTITY_CLAIMS.memberships]: [
        { scopeId: SCOPE_ID, path: "platform.acme", name: "platform.acme", roles: ["member"] },
      ],
      [IDENTITY_CLAIMS.permissions]: ["note.create", "note.read"],
    });
    expect(Number(claims?.["exp"]) - Number(claims?.["iat"])).toBe(60);
    expect(claims).not.toHaveProperty("email");
  });

  it("refuses --scope without --scope-id, and a run outside a workspace", async () => {
    const lone = await runCommandForTest(
      [DevTokenCommand],
      ["dev:token", "--scope", "platform.acme"],
    );
    expect(lone.exitCode).toBe(2);
    rmSync(join(root, "pnpm-workspace.yaml"));
    expect((await runCommandForTest([DevTokenCommand], ["dev:token"])).exitCode).toBe(2);
  });
});
