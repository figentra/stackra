/**
 * Stackra file contract:
 * Purpose: `deployEvidence(root, input)`, the approvals bot's evidence for one deploy job (ADR 0533): the commit,
 *          target and member, `rollout` judged per target, and `destructive` judged per target from gen's ADR 0159
 *          classes. A service target (`encore-cloud`, `aws-ecs`, `compose`, `helm`) ships its services' Postgres
 *          migrations: `destructiveOf` the streams the caller read. A client target (`eas`, `mintlify`, `npm`,
 *          `electron-release`) ships none: `false`. A Workers member is `false` only when its wrangler config was read
 *          and has neither Durable Object migrations nor a D1 binding; an undeclared target is `null`.
 *          Only a Cloudflare Workers member can roll out: true when its merged worker settings move
 *          production traffic in more than one step and it ships no Durable Object migration, because the driver
 *          smokes each step and puts the previous version back on a failure. Every other declared target is `false`
 *          (no rollout primitive); an undeclared target, or a whole Workers target, is `null`. `release.strategy` is
 *          descriptive only.
 * Boundary: pure; reads the parsed root runway, whether the member's wrangler config migrates or binds D1, and the
 *           services' migration streams, as the caller read them. Never guesses a `true` rollout or a `false`
 *           destructive: an unknown is floor.
 * Runtime: isomorphic
 * Governing contract: ADR 0533 (decision 3); ADR 0519 (decisions 2 and 3, the rollout steps); ADR 0352 (decision 6);
 *                     ADR 0159 (decision 3: the migration safety classes gen computes); STA-2104; STA-2866.
 */
import { CLOUDFLARE_WORKERS_SETTINGS_SCHEMA } from "#core/constants/cloudflare-workers-settings-schema.constant";
import { SERVICE_TARGETS } from "#core/constants/service-targets.constant";
import { destructiveOf } from "#core/functions/destructive-of.function";
import { workerSettingsOf } from "#core/functions/worker-settings-of.function";
import type { DeployEvidence } from "#core/types/deploy-evidence.type";
import type { DeployMigrations } from "#core/types/deploy-migrations.type";
import type { RootRunway } from "#core/types/root-runway.type";

/** The targets that ship no database: apps, docs, packages and desktop updates. */
const CLIENT_TARGETS: ReadonlySet<string> = new Set(["eas", "mintlify", "npm", "electron-release"]);

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
    /** Whether the member's wrangler config binds a D1 database, whose migrations gen does not class. */
    readonly d1?: boolean | undefined;
    /** The services' migration streams a service target ships; `undefined` when not read. */
    readonly migrations?: DeployMigrations | undefined;
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
    ...destructiveOfTarget(root, input),
  };
}

/** `destructive` and `destructiveMigrations` of one target and member. */
function destructiveOfTarget(
  root: Pick<RootRunway, "targets">,
  input: Parameters<typeof deployEvidence>[1],
): Pick<DeployEvidence, "destructive" | "destructiveMigrations"> {
  const unknown = { destructive: null, destructiveMigrations: [] };
  if (!Object.hasOwn(root.targets ?? {}, input.target)) return unknown;
  if (SERVICE_TARGETS.has(input.target)) return destructiveOf(input.migrations);
  if (CLIENT_TARGETS.has(input.target)) return { destructive: false, destructiveMigrations: [] };
  // A Durable Object migration may delete a class's data, and a D1 database migrates outside gen: both unknown.
  return input.target === "cloudflare-workers" && input.migrates === false && input.d1 === false
    ? { destructive: false, destructiveMigrations: [] }
    : unknown;
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
