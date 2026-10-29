/**
 * Stackra file contract:
 * Purpose: `OPS_BOOTSTRAP_OPERATOR_COMMAND`, `stackra ops bootstrap-operator --email <email> [--role <role>] [--env
 *          <environment>] [--api <origin>] [--dry-run]`: gives the user with that email a role at the platform node of
 *          one environment (the owner role by default), once, and prints `granted`, `already granted`, `would grant`
 *          or that no user has the email (exit 1).
 * Boundary: calls the environment's own `identity.operator.bootstrap@1` (`POST /platform/operators/bootstrap` on the
 *           API origin from the root `runway.yaml`, or `--api`), so it needs no database shell and no connection; the
 *           action finds the user, checks and writes the grant through IAM and audits the call. The credential is the
 *           environment's bootstrap token from `STACKRA_OPS_TOKEN`: sent as a bearer token only, never printed or put
 *           in an argument (the one secret this CLI holds; see AGENTS.md). The email is sent, never printed.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0237 (the platform area); ADR 0208; STA-1586.
 */
import { CliUsageError } from "#node/errors/cli-usage.error";
import { databaseEnvironment } from "#node/functions/database-environment.function";
import { environmentApiOrigin } from "#node/functions/environment-api-origin.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The action's route on the environment's API origin. */
const BOOTSTRAP_PATH = "/platform/operators/bootstrap";

/** The variable holding the environment's bootstrap credential. */
const TOKEN_VARIABLE = "STACKRA_OPS_TOKEN";

/** How long the call may take. */
const TIMEOUT_MS = 30_000;

/** The line printed for each outcome the action answers, by its code. */
const SAID: Readonly<Record<string, (role: string, userId: string) => string>> = {
  granted: (role, userId) => `granted ${role} to ${userId}`,
  already_granted: (role, userId) => `${userId} already holds ${role}; nothing written`,
  would_grant: (role, userId) => `dry run: would grant ${role} to ${userId}; nothing written`,
};

/** The `stackra ops bootstrap-operator` command. */
export const OPS_BOOTSTRAP_OPERATOR_COMMAND: CliCommand = {
  name: "ops bootstrap-operator",
  summary: "Give an environment's first operator a role at the platform node, once (audited)",
  usage:
    "stackra ops bootstrap-operator --email <email> [--role <role>] [--env <environment>] [--api <origin>] [--dry-run]",
  options: {
    email: { type: "string" },
    role: { type: "string" },
    env: { type: "string" },
    api: { type: "string" },
    "dry-run": { type: "boolean" },
  },
  async run({ cwd, values, io }) {
    const email = values["email"];
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+$/u.test(email))
      throw new CliUsageError("name the operator: --email <email>");
    const role = values["role"];
    if (role !== undefined && (typeof role !== "string" || role.trim() === ""))
      throw new CliUsageError("give --role as a role key, such as owner");
    const environment = databaseEnvironment(values);
    const api = values["api"];
    const origin =
      typeof api === "string"
        ? api.replace(/\/+$/u, "")
        : environmentApiOrigin(workspaceRoot(cwd), environment);
    // the token must never cross plain HTTP, except to a gateway on this machine
    if (!/^https:\/\/|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/u.test(origin))
      throw new CliUsageError(`give --api as an https origin, not ${origin}`);
    const token = process.env[TOKEN_VARIABLE];
    if (token === undefined || token === "")
      throw new CliUsageError(
        `set ${TOKEN_VARIABLE} to the ${environment} bootstrap credential (see the deploys runbook)`,
      );
    const dryRun = values["dry-run"] === true;
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
          ...(typeof role === "string" ? { role } : {}),
          ...(dryRun ? { dryRun } : {}),
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      io.err(`${label}: ${origin} cannot be reached (${(error as Error).message})\n`);
      return 1;
    }
    if (!response.ok) {
      io.err(`${label}: ${origin} answered ${response.status}\n`);
      return 1;
    }
    const answer = (await response.json().catch(() => ({}))) as {
      outcome?: unknown;
      role?: unknown;
      userId?: unknown;
    };
    const said = typeof answer.outcome === "string" ? SAID[answer.outcome] : undefined;
    if (answer.outcome === "not_found") {
      io.err(`${label}: no user with that email\n`);
      return 1;
    }
    if (
      said === undefined ||
      typeof answer.role !== "string" ||
      typeof answer.userId !== "string"
    ) {
      io.err(`${label}: unexpected answer from ${origin}\n`);
      return 1;
    }
    io.out(`${label}: ${said(answer.role, answer.userId)}\n`);
    return 0;
  },
};
