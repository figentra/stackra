/**
 * Stackra file contract:
 * Purpose: `WorkloadPlan`, one container workload of a runtime plan: its service name, image, port, health path,
 *          arguments, the one-off migration run before each rollout, exposure, public env, secret names, the resources it uses and the names it reads their variables
 *          under, task size and count, and its tags.
 * Boundary: type only. Secret values never appear; only names.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decisions 1 to 5).
 */

/** One Fargate service. */
export type WorkloadPlan = {
  /** `workloads.<name>`, the key of the program's outputs. */
  readonly key: string;
  /** The workload name in the runway (`zitadel`). */
  readonly workload: string;
  /** The ECS service name, `<project>-<env>-<name>`. */
  readonly name: string;
  /** The image, pinned by digest. */
  readonly image: string;
  /** The container port; absent for a worker that serves nothing. */
  readonly port?: number;
  /** The health check path its load balancer reads; absent without a port. */
  readonly health?: string;
  /** The container's own health check command, healthy when it exits 0; empty for none. */
  readonly healthCommand: readonly string[];
  /** The container's arguments; empty runs the image's default command. */
  readonly command: readonly string[];
  /** The task run with the same image, env and secrets before each rollout; none when the runway sets no `migrate`. */
  readonly migrate?: { readonly command: readonly string[]; readonly timeoutMinutes: number };
  /** An ALB behind Cloudflare in front of it. */
  readonly public: boolean;
  /** Public environment values. */
  readonly env: Readonly<Record<string, string>>;
  /** Its own secret names. */
  readonly secrets: readonly string[];
  /** The resources it uses, by name. */
  readonly uses: readonly string[];
  /** The name the image reads → a variable of a resource it uses (`ZITADEL_DATABASE_POSTGRES_DSN` → `MAIN_DB_URL`). */
  readonly aliases: Readonly<Record<string, string>>;
  /** Fargate vCPU units (1024 is one vCPU). */
  readonly cpu: number;
  /** Task memory in MiB. */
  readonly memoryMb: number;
  /** Task count bounds; one task when the runway sets none. */
  readonly scale: { readonly min: number; readonly max: number };
  /** `env` and `service` (the workload name). */
  readonly tags: Readonly<Record<string, string>>;
};
