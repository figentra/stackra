/**
 * Stackra file contract:
 * Purpose: `QueuePlan`, one SQS queue of a runtime plan: a queue a service member sizes under
 *          `environments.<env>.queues` of its runway, with its AWS name, its dead-letter queue, whether an SNS topic of
 *          the same name feeds it (the root's `shared.queues.provider` is `sns-sqs`) and its cost tags.
 * Boundary: type only; data, no Pulumi type, so the plan stays testable without a cloud.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1: queue settings are member sizes), ADR 0172 (decision 5: cost tags).
 */

/** One queue. */
export type QueuePlan = {
  /** `<member>.<queue>`, the key of the program's outputs (`commerce.default`). */
  readonly key: string;
  /** The AWS queue name, `<project>-<env>-<member>-<queue>` (`acme-platform-staging-commerce-default`). */
  readonly name: string;
  /** The dead-letter queue's name when the queue has one (member `dlq`, else the root's `shared.queues.dlq`). */
  readonly deadLetterName?: string | undefined;
  /** The member's visibility timeout; SQS's default (30 s) when absent. */
  readonly visibilityTimeoutSeconds?: number | undefined;
  /** True when an SNS topic named like the queue publishes into it (the `sns-sqs` queue provider). */
  readonly topic: boolean;
  /** `env`, `service` and, when the topology places the member, `group`. */
  readonly tags: Readonly<Record<string, string>>;
};
