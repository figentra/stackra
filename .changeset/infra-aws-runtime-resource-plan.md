---
"@stackra/infra-aws-runtime": minor
---

Plan the runway's `resources` and `workloads` (STA-1642, ADR 0493). `runtimePlan` now adds each Postgres resource
(`databases`: RDS or Aurora, the size's instance class, Multi-AZ and storage, 14 backup days, the members and workloads
that use it), queue, topic, cache and bucket resources beside the member-derived ones, and each container workload
(`workloads`: Fargate task size and count, exposure, env, secret names, uses), sized per environment from new catalogues
(`small` where unsized; dev Postgres is `db.t4g.micro`, single-AZ). The plan carries a monthly `cost` estimate and is
refused when it passes the environment's cap: `limits.monthly`, else $150 in dev and $500 in staging; production only
warns until it has a cap. A member that uses an undeclared resource is refused. `planForMembers` leaves the shared
resources and workloads to the environment's whole stack.
