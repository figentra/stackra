/**
 * Stackra file contract:
 * Purpose: `costControls(name, args, opts)`, the account's monthly cost budget: an SNS topic AWS Budgets may publish to
 *          (only for this account), an actual-spend alert at each threshold percentage, and in a non-production
 *          account a budget action that, at the stop percentage, attaches a policy denying new spend to the roles that
 *          add spend unattended.
 * Boundary: internal; one budget per account, created by the account's first environment. Who hears the topic (Slack,
 *           Better Stack) is the observability stack's subscription; no address is held here. The action needs AWS
 *           Budgets' managed policy on its execution role, which is AWS's recommendation.
 * Runtime: node
 * Governing contract: ADR 0172 (decision 5: budgets at 50, 80 and 100%, Budget Actions stop non-production
 *                     accounts, cost tags).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as aws from "@pulumi/aws";
import type * as pulumi from "@pulumi/pulumi";

import { STOP_SPEND_ACTIONS } from "#node/constants/stop-spend-actions.constant";
import { policyOf } from "#node/functions/policy-of.function";

/** AWS Budgets' managed policy for the role that runs budget actions. */
const BUDGET_ACTIONS = "arn:aws:iam::aws:policy/AWSBudgetsActionsWithAWSResourceControlAccess";

/**
 * The budget topic.
 *
 * @param args.budgets - the monthly limit in US dollars, the alert percentages and the stop percentage (or `null`).
 * @param args.stoppable - the names of the roles the stop policy is attached to.
 */
export function costControls(
  name: string,
  args: {
    account: string;
    budgets: { monthlyUsd: string; thresholds: readonly number[]; stopAt: number | null };
    stoppable: readonly pulumi.Output<string>[];
    actionRoleName: string;
  },
  opts: pulumi.CustomResourceOptions,
): aws.sns.Topic {
  const source = {
    StringEquals: { "aws:SourceAccount": args.account },
    ArnLike: { "aws:SourceArn": `arn:aws:budgets::${args.account}:*` },
  };
  const topic = new aws.sns.Topic(`${name}-budgets`, {}, opts);
  new aws.sns.TopicPolicy(
    `${name}-budgets`,
    {
      arn: topic.arn,
      policy: policyOf([
        {
          Sid: "BudgetsPublish",
          Effect: "Allow",
          Principal: { Service: "budgets.amazonaws.com" },
          Action: "SNS:Publish",
          Resource: topic.arn,
          Condition: source,
        },
      ]),
    },
    opts,
  );
  const { monthlyUsd, thresholds, stopAt } = args.budgets;
  const budget = new aws.budgets.Budget(
    name,
    {
      budgetType: "COST",
      limitAmount: monthlyUsd,
      limitUnit: "USD",
      timeUnit: "MONTHLY",
      notifications: thresholds.map((threshold) => ({
        comparisonOperator: "GREATER_THAN",
        threshold,
        thresholdType: "PERCENTAGE",
        notificationType: "ACTUAL",
        subscriberSnsTopicArns: [topic.arn],
      })),
    },
    opts,
  );
  if (stopAt === null || args.stoppable.length === 0) return topic;

  const stop = new aws.iam.Policy(
    `${name}-stop-spend`,
    {
      description: "Attached by the budget action: no new compute, database or cache spend",
      policy: policyOf([
        { Sid: "StopNewSpend", Effect: "Deny", Action: STOP_SPEND_ACTIONS, Resource: "*" },
      ]),
    },
    opts,
  );
  const role = new aws.iam.Role(
    `${name}-budget-action`,
    {
      name: args.actionRoleName,
      assumeRolePolicy: policyOf([
        {
          Effect: "Allow",
          Principal: { Service: "budgets.amazonaws.com" },
          Action: "sts:AssumeRole",
          Condition: source,
        },
      ]),
    },
    opts,
  );
  const attachment = new aws.iam.RolePolicyAttachment(
    `${name}-budget-action`,
    { role: role.name, policyArn: BUDGET_ACTIONS },
    opts,
  );
  new aws.budgets.BudgetAction(
    name,
    {
      budgetName: budget.name,
      actionType: "APPLY_IAM_POLICY",
      approvalModel: "AUTOMATIC",
      notificationType: "ACTUAL",
      actionThreshold: { actionThresholdType: "PERCENTAGE", actionThresholdValue: stopAt },
      definition: { iamActionDefinition: { policyArn: stop.arn, roles: [...args.stoppable] } },
      executionRoleArn: role.arn,
      subscribers: [{ address: topic.arn, subscriptionType: "SNS" }],
    },
    { ...opts, dependsOn: [attachment] },
  );
  return topic;
}
