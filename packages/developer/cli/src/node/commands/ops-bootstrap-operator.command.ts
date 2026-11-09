/**
 * Stackra file contract:
 * Purpose: `OpsBootstrapOperatorCommand`, `stackra ops bootstrap-operator --email <email> [--role <role>] [--env
 *          <environment>] [--api <origin>] [--dry-run]`: gives the user with that email a role at the platform node of
 *          one environment (the owner role by default), once, and says `granted`, `already granted` or `would grant`
 *          (`--json`: the outcome, the role and the user id); no user with the email, an error status, an unreachable
 *          origin or an odd answer exits 1.
 * Boundary: calls the environment's own `identity.operator.bootstrap@1` (`POST /platform/operators/bootstrap` on the
 *           API origin from the root `runway.yaml`, or `--api`), so it needs no database shell and no connection; the
 *           action finds the user, checks and writes the grant through IAM and audits the call. The credential is the
 *           environment's bootstrap token from `STACKRA_OPS_TOKEN`: sent as a bearer token only, never printed or put
 *           in an argument (the one secret this CLI holds; see AGENTS.md). The email is sent, never printed.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0237 (the platform area); ADR 0208; STA-1586; ADR 0506; STA-1966.
 */
import { Command, CommandError, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { databaseEnvironment } from "#node/functions/database-environment.function";
import { environmentApiOrigin } from "#node/functions/environment-api-origin.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** The action's route on the environment's API origin. */
const BOOTSTRAP_PATH = "/platform/operators/bootstrap";

/** The variable holding the environment's bootstrap credential. */
const TOKEN_VARIABLE = "STACKRA_OPS_TOKEN";

/** How long the call may take. */
const TIMEOUT_MS = 30_000;

/** The line shown for each outcome the action answers, by its code. */
const SAID: Readonly<Record<string, (role: string, userId: string) => string>> = {
  granted: (role, userId) => `granted ${role} to ${userId}`,
  already_granted: (role, userId) => `${userId} already holds ${role}; nothing written`,
  would_grant: (role, userId) => `dry run: would grant ${role} to ${userId}; nothing written`,
};

/** Gives an environment's first operator a role at the platform node. */
export class OpsBootstrapOperatorCommand extends Command({
  name: "ops:bootstrap-operator",
  description: "Give an environment's first operator a role at the platform node, once (audited)",
  bin: true,
}) {
  /** The operator's email; sent, never printed. */
  @Option({ description: "The email of the user to grant the role to" })
  @Str
  email?: string;

  /** The role key; the action's default (owner) when absent. */
  @Option({ description: "The role key (default: owner)" })
  @Str
  role?: string;

  /** The target environment. */
  @Option({
    description:
      "dev, preview, test, staging or production (default: STACKRA_ENVIRONMENT, else dev)",
  })
  @Str
  env?: string;

  /** The API origin instead of the root runway.yaml's. */
  @Option({
    description: "The environment's API origin, https (default: from the root runway.yaml)",
  })
  @Str
  api?: string;

  /** Ask what would happen, writing nothing. */
  @Option({ description: "Say what would be granted; write nothing" })
  dryRun = false;

  /** Calls the bootstrap action and returns its answer. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const email = this.email;
    if (email === undefined || !/^[^\s@]+@[^\s@]+$/u.test(email))
      throw new CliUsageError("name the operator: --email <email>");
    const role = this.role;
    if (role !== undefined && role.trim() === "")
      throw new CliUsageError("give --role as a role key, such as owner");
    const environment = databaseEnvironment({ env: this.env });
    const origin =
      this.api === undefined
        ? environmentApiOrigin(workspaceRoot(io.cwd), environment)
        : this.api.replace(/\/+$/u, "");
    // the token must never cross plain HTTP, except to a gateway on this machine
    if (!/^https:\/\/|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/u.test(origin))
      throw new CliUsageError(`give --api as an https origin, not ${origin}`);
    const token = process.env[TOKEN_VARIABLE];
    if (token === undefined || token === "")
      throw new CliUsageError(
        `set ${TOKEN_VARIABLE} to the ${environment} bootstrap credential (see the deploys runbook)`,
      );
    const label = `ops bootstrap-operator (${environment})`;
    let response: Response;
    try {
      response = await fetch(`${origin}${BOOTSTRAP_PATH}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          email,
          ...(role === undefined ? {} : { role }),
          ...(this.dryRun ? { dryRun: true } : {}),
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      throw new CommandError(`${label}: ${origin} cannot be reached`, {
        why: (error as Error).message,
      });
    }
    if (!response.ok) throw new CommandError(`${label}: ${origin} answered ${response.status}`);
    const answer = (await response.json().catch(() => ({}))) as {
      outcome?: unknown;
      role?: unknown;
      userId?: unknown;
    };
    if (answer.outcome === "not_found") throw new CommandError(`${label}: no user with that email`);
    const said = typeof answer.outcome === "string" ? SAID[answer.outcome] : undefined;
    if (said === undefined || typeof answer.role !== "string" || typeof answer.userId !== "string")
      throw new CommandError(`${label}: unexpected answer from ${origin}`);
    io.output.success(`${label}: ${said(answer.role, answer.userId)}`);
    return { outcome: answer.outcome, role: answer.role, userId: answer.userId };
  }
}
