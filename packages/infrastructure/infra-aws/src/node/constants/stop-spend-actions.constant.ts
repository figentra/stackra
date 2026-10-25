/**
 * Stackra file contract:
 * Purpose: `STOP_SPEND_ACTIONS`, the AWS actions a non-production account's budget action denies once spend reaches
 *          the stop percentage: the calls that start or add compute, databases and caches.
 * Boundary: internal; it stops new spend, not running resources, and scaling down stays allowed. The roles it is
 *           attached to are the ones that add spend unattended (the Encore Cloud and infra roles).
 * Runtime: node
 * Governing contract: ADR 0172 (decision 5: Budget Actions stop non-production accounts).
 */

/** The denied actions. */
// shortcut: a curated list of the services Encore Cloud and the runtime stack provision; extend it when a new service lands.
export const STOP_SPEND_ACTIONS = [
  "ec2:RunInstances",
  "ec2:StartInstances",
  "ecs:CreateService",
  "ecs:RunTask",
  "ecs:StartTask",
  "eks:CreateCluster",
  "eks:CreateNodegroup",
  "lambda:CreateFunction",
  "rds:CreateDBCluster",
  "rds:CreateDBInstance",
  "rds:StartDBCluster",
  "rds:StartDBInstance",
  "elasticache:CreateCacheCluster",
  "elasticache:CreateReplicationGroup",
];
