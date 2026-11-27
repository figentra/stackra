/**
 * Stackra file contract:
 * Purpose: `DevTokenCommand`, `stackra dev token [--user <usr_…>] [--realm <realm>] [--scope <path> --scope-id <scp_…>]
 *          [--role <code>]… [--permission <name>]… [--ttl <seconds>]`: prints a dev access token (STA-2795) for the
 *          workspace's seeded dev user, or the user given, signed with the workspace's dev issuer key
 *          (`.stackra/dev-issuer.json`, made on first use). A service run by `stackra dev` accepts it as a bearer
 *          token, so a developer calls a protected route with `authorization: Bearer $(stackra dev token)`.
 * Boundary: dev only. Prints the token alone on stdout (and, under `--json`, the token with its user, realm, scope and
 *           expiry), never the private key. Only a service with `STACKRA_ENVIRONMENT=dev` and the dev issuer's public
 *           key accepts it; every deployed environment refuses it and never boots with the key (`devIssuerKeys`).
 *           `--scope` needs `--scope-id`: the token's scope is one of its memberships, as a real token's is.
 * Runtime: node
 * Governing contract: ADR 0206 (decisions 2 and 3; amendment of 2026-11-26: the dev issuer); STA-2795.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { DEV_ISSUER, mintDevToken } from "@stackra/app";
import { Command, Option, type CommandIo } from "@stackra/console";
import { Realm } from "@stackra/contracts";
import { Int, List, Str } from "@stackra/validation";

import { ensureDevIssuer } from "#node/dev-issuer/functions/ensure-dev-issuer.function";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** A `usr_` public id. */
const USER_ID = /^usr_[0-9a-hjkmnp-tv-z]{26}$/i;

/** A `scp_` public id. */
const SCOPE_ID = /^scp_[0-9a-hjkmnp-tv-z]{26}$/i;

/** An `ltree` path (`platform.acme.shop_eu`). */
const SCOPE_PATH = /^[a-z0-9_]+(?:\.[a-z0-9_]+)*$/;

/** Mints a dev access token. */
export class DevTokenCommand extends Command({
  name: "dev:token",
  description:
    "Print a dev access token that services run by stackra dev accept (never deployed ones)",
  bin: true,
}) {
  /** The user the token names. */
  @Option({ description: "The user's usr_ id (default: the workspace's seeded dev user)" })
  @Str({ pattern: USER_ID })
  user?: string;

  /** The user's realm. */
  @Option({ description: "The realm: tenant (staff), customer or platform" })
  @Str({ pattern: /^(tenant|customer|platform)$/ })
  realm: string = Realm.Staff;

  /** The scope the token is issued for. */
  @Option({ description: "The ltree path of the scope the token is issued for (needs --scope-id)" })
  @Str({ pattern: SCOPE_PATH })
  scope?: string;

  /** That scope's id. */
  @Option({ description: "The scp_ id of --scope" })
  @Str({ pattern: SCOPE_ID })
  scopeId?: string;

  /** The roles held in the scope. */
  @Option({ description: "A role code held in --scope (default: owner)" })
  @List
  role: string[] = [];

  /** The permissions held in the scope. */
  @Option({ description: "A permission name held in --scope (note.create)" })
  @List
  permission: string[] = [];

  /** How long the token lives. */
  @Option({ description: "Seconds the token lives, 1 to 86400" })
  @Int({
    min: 1,
    max: 86_400,
  })
  ttl = 3600;

  /** Prints the token. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const root = workspaceRoot(io.cwd);
    if (!existsSync(join(root, "pnpm-workspace.yaml")))
      throw new CliUsageError("run stackra dev token inside a pnpm workspace");
    if ((this.scope === undefined) !== (this.scopeId === undefined))
      throw new CliUsageError("--scope and --scope-id go together");
    const { key, user } = await ensureDevIssuer(root);
    const userId = this.user ?? user.id;
    const seeded = userId === user.id;
    const roles = this.role.length > 0 ? this.role : ["owner"];
    const now = new Date();
    const token = await mintDevToken(key.privateKey, {
      userId,
      realm: this.realm as Realm,
      ...(this.scope === undefined || this.scopeId === undefined
        ? {}
        : {
            scopePath: this.scope,
            memberships: [{ scopeId: this.scopeId, path: this.scope, name: this.scope, roles }],
          }),
      ...(this.permission.length > 0 ? { permissions: this.permission } : {}),
      ...(seeded ? { name: user.name, email: user.email } : {}),
      ttlSeconds: this.ttl,
      now,
    });
    io.output.line(token);
    return {
      token,
      issuer: DEV_ISSUER.issuer,
      user: userId,
      realm: this.realm,
      ...(this.scope === undefined ? {} : { scope: this.scope, scopeId: this.scopeId, roles }),
      expiresAt: new Date(now.getTime() + this.ttl * 1000).toISOString(),
    };
  }
}
