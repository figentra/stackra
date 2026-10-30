/**
 * Stackra file contract:
 * Purpose: `DatabasePlan`, one Postgres resource of a runtime plan: its identifier, engine and version, the size's
 *          instance class, Multi-AZ and storage, the backup days, the members and workloads that use it, and its tags.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decisions 1 to 3), ADR 0238, ADR 0186 (point-in-time recovery).
 */

/** One Postgres server. */
export type DatabasePlan = {
  /** `resources.<name>`, the key of the program's outputs. */
  readonly key: string;
  /** The resource name in the runway (`main-db`). */
  readonly resource: string;
  /** The RDS identifier, `<project>-<env>-<name>` (63 characters at most). */
  readonly name: string;
  /** `rds` or `aurora`. */
  readonly engine: "rds" | "aurora";
  /** The Postgres major version. */
  readonly version: string;
  /** The instance class of the size. */
  readonly instanceClass: string;
  /** Standby in a second zone. */
  readonly multiAz: boolean;
  /** Allocated storage in GB (RDS). */
  readonly storageGb: number;
  /** Days of automated backups. */
  readonly backupDays: number;
  /** The members and workloads that use it, sorted; the security group admits only them. */
  readonly consumers: readonly string[];
  /** `env` and `service` (the resource name). */
  readonly tags: Readonly<Record<string, string>>;
};
