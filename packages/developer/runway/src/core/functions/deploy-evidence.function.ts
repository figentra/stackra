/**
 * Stackra file contract:
 * Purpose: `deployEvidence(root, input)`, the approvals bot's evidence for one deploy job (ADR 0533): the commit,
 *          target and member, `rollout` judged per target, and `destructive` left `null` (floor) until gen classifies
 *          migrations. Only a Cloudflare Workers member can roll out: true when its merged worker settings move
 *          production traffic in more than one step and it ships no Durable Object migration, because the driver
 *          smokes each step and puts the previous version back on a failure. Every other declared target is `false`
 *          (no rollout primitive); an undeclared target, or a whole Workers target, is `null`. `release.strategy` is
 *          descriptive only.
 * Boundary: pure; reads the parsed root runway, and whether the member's wrangler config migrates as the caller read
 *           it. Never guesses a `true`: an unknown is `null` or `false`.
 * Runtime: isomorphic
 * Governing contract: ADR 0533 (decision 3); ADR 0519 (decisions 2 and 3, the rollout steps); ADR 0352 (decision 6);
 *                     ADR 0159 (the migration safety classes, once gen classifies them); STA-2104.
 */
import { CLOUDFLARE_WORKERS_SETTINGS_SCHEMA } from "#core/constants/cloudflare-workers-settings-schema.constant";
import { workerSettingsOf } from "#core/functions/worker-settings-of.function";
import type { DeployEvidence } from "#core/types/deploy-evidence.type";
import type { RootRunway } from "#core/types/root-runway.type";

/**
 * The evidence of one deploy job.
 *
 * @example
 * deployEvidence(root, { repo: "figentra/pay", environment: "production", sha, target: "cloudflare-workers",
 *   member: "edge", migrates: false });
 * // { schema: "runway.evidence/v1", …, rollout: true, rolloutDetail: { kind: "staged", steps: [10, 50, 100], … } }
 */
export function deployEvidence(
  root: Pick<RootRunway, "targets">,
  input: {
    readonly repo: string;
    readonly environment: string;
    readonly sha: string;
    readonly target: string;
    readonly member?: string | undefined;
    /** Whether the member's wrangler config ships Durable Object migrations; `undefined` when not read. */
    readonly migrates?: boolean | undefined;
  },
): DeployEvidence {
  return {
    schema: "runway.evidence/v1",
    repo: input.repo,
    environment: input.environment,
    sha: input.sha,
    target: input.target,
    member: input.member ?? null,
    ...rolloutOf(root, input),
    // shortcut: gen does not classify migrations yet, so this is unknown (floor); set it from gen's classes once it does
    destructive: null,
    destructiveMigrations: [],
  };
}

/** The evidence of a target that cannot roll out, or whose rollout is unknown. */
function floor(
  rollout: false | null,
  floorReason: "no-rollout-primitive" | "undeclared",
): Pick<DeployEvidence, "rollout" | "rolloutDetail"> {
  return {
    rollout,
    rolloutDetail: {
      kind: rollout === null ? null : "all-at-once",
      healthGate: null,
      autoRollback: null,
      steps: null,
      floorReason,
    },
  };
}

/** `rollout` and `rolloutDetail` of one target and member. */
function rolloutOf(
  root: Pick<RootRunway, "targets">,
  input: Parameters<typeof deployEvidence>[1],
): Pick<DeployEvidence, "rollout" | "rolloutDetail"> {
  const targets = root.targets ?? {};
  if (!Object.hasOwn(targets, input.target)) return floor(null, "undeclared");
  if (input.target !== "cloudflare-workers") return floor(false, "no-rollout-primitive");
  const settings = CLOUDFLARE_WORKERS_SETTINGS_SCHEMA.parse(targets["cloudflare-workers"]);
  if (input.member === undefined || !Object.hasOwn(settings.members, input.member))
    return floor(null, "undeclared");
  const { rollout } = workerSettingsOf(settings, input.member, input.environment);
  // The driver steps production only, and ships a migrating member with `wrangler deploy` at 100%.
  const steps = input.environment === "production" && rollout !== undefined ? rollout : [100];
  const detail = (
    kind: "staged" | "all-at-once",
    floorReason: DeployEvidence["rolloutDetail"]["floorReason"],
  ) => ({ kind, healthGate: true, autoRollback: true, steps: [...steps], floorReason });
  if (input.migrates === true)
    return { rollout: false, rolloutDetail: detail("all-at-once", "durable-object-migrations") };
  if (steps.length < 2)
    return { rollout: false, rolloutDetail: detail("all-at-once", "single-step") };
  if (input.migrates === undefined)
    return { rollout: null, rolloutDetail: detail("staged", "undeclared") };
  return { rollout: true, rolloutDetail: detail("staged", null) };
}
