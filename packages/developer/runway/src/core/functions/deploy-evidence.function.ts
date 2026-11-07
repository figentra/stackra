/**
 * Stackra file contract:
 * Purpose: `deployEvidence(root, input)`, the approvals bot's evidence for one deploy job (ADR 0533): the commit,
 *          target and member, `rollout` read from the root runway's `release.strategy` (true only for a gradual kind
 *          with automatic rollback), and `destructive` left `null` (floor) until gen classifies migrations.
 * Boundary: pure; reads the parsed root runway only. Never guesses a `true`: an undeclared value is `null` or `false`.
 * Runtime: isomorphic
 * Governing contract: ADR 0533 (decision 3); ADR 0352 (decision 6); ADR 0159 (the migration safety classes, once gen
 *                     classifies them); STA-2104.
 */
import type { DeployEvidence } from "#core/types/deploy-evidence.type";
import type { RootRunway } from "#core/types/root-runway.type";

/** The strategy kinds that roll a release out in steps rather than all at once. */
const GRADUAL_KINDS: ReadonlySet<string> = new Set(["canary", "staged", "rolling"]);

/**
 * The evidence of one deploy job.
 *
 * @example
 * deployEvidence(root, { repo: "figentra/pay", environment: "production", sha, target: "cloudflare-workers" });
 * // { schema: "runway.evidence/v1", …, rollout: false, destructive: null }
 */
export function deployEvidence(
  root: Pick<RootRunway, "release">,
  input: {
    readonly repo: string;
    readonly environment: string;
    readonly sha: string;
    readonly target: string;
    readonly member?: string | undefined;
  },
): DeployEvidence {
  const strategy = root.release?.strategy;
  const kind = strategy?.kind ?? null;
  const autoRollback = strategy?.autoRollback ?? null;
  return {
    schema: "runway.evidence/v1",
    repo: input.repo,
    environment: input.environment,
    sha: input.sha,
    target: input.target,
    member: input.member ?? null,
    rollout: kind === null ? null : GRADUAL_KINDS.has(kind) && autoRollback === true,
    rolloutDetail: { kind, healthGate: strategy?.healthGate ?? null, autoRollback },
    // shortcut: gen does not classify migrations yet, so this is unknown (floor); set it from gen's classes once it does
    destructive: null,
    destructiveMigrations: [],
  };
}
