/**
 * Stackra file contract:
 * Purpose: `WorkloadPlan`, one container workload of a runtime plan: its service name, image, port, health path,
 *          exposure, public env, secret names, the resources it uses, task size and count, and its tags.
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
  /** The container port. */
  readonly port: number;
  /** The health check path. */
  readonly health: string;
  /** An ALB behind Cloudflare in front of it. */
  readonly public: boolean;
  /** Public environment values. */
  readonly env: Readonly<Record<string, string>>;
  /** Its own secret names. */
  readonly secrets: readonly string[];
  /** The resources it uses, by name. */
  readonly uses: readonly string[];
  /** Fargate vCPU units and memory in MiB. */
  readonly cpu: number;
  readonly memoryMb: number;
  /** Task count bounds; one task when the runway sets none. */
  readonly scale: { readonly min: number; readonly max: number };
  /** `env` and `service` (the workload name). */
  readonly tags: Readonly<Record<string, string>>;
};
