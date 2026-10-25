/**
 * Stackra file contract:
 * Purpose: `costControls(name, args, opts)`, the project's monthly billing budget in the billing account's currency,
 *          scoped to the one project, with a rule at each threshold and every update published to a Pub/Sub topic the
 *          billing service may publish to.
 * Boundary: internal; the amount, currency and thresholds are runway data. The topic's subscription belongs to the
 *           observability stack, so no address is held here. GCP budgets alert but take no action, so nothing stops
 *           spend here (see the README).
 * Runtime: node
 * Governing contract: ADR 0172 (decision 5: budgets, per ADR 0354 for each GCP project too), ADR 0354 (decision 3).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as gcp from "@pulumi/gcp";
import type * as pulumi from "@pulumi/pulumi";

/** The account Cloud Billing publishes budget notifications as. */
const BILLING_PUBLISHER = "serviceAccount:billing-budget-alert@system.gserviceaccount.com";

/**
 * The budget's topic.
 *
 * @param args.amount - the resolved monthly limit (`2000`, `1500.50`).
 * @param args.thresholds - alert percentages of the limit.
 * @throws TypeError when the amount is not a decimal number.
 */
export function costControls(
  name: string,
  args: {
    project: string;
    projectNumber: string;
    billingAccount: string;
    currency: string;
    amount: string;
    thresholds: readonly number[];
  },
  opts: pulumi.CustomResourceOptions,
): gcp.pubsub.Topic {
  const match = /^(\d+)(?:\.(\d{1,9}))?$/.exec(args.amount);
  if (match === null)
    throw new TypeError(`The budget of ${name} (${args.amount}) is not a decimal amount`);
  const [, units = "0", fraction = ""] = match;

  const topic = new gcp.pubsub.Topic(`${name}-budgets`, { project: args.project }, opts);
  new gcp.pubsub.TopicIAMMember(
    `${name}-budgets`,
    {
      project: args.project,
      topic: topic.name,
      role: "roles/pubsub.publisher",
      member: BILLING_PUBLISHER,
    },
    opts,
  );
  new gcp.billing.Budget(
    name,
    {
      billingAccount: args.billingAccount,
      displayName: name,
      budgetFilter: { projects: [`projects/${args.projectNumber}`], calendarPeriod: "MONTH" },
      amount: {
        specifiedAmount: {
          currencyCode: args.currency,
          units,
          nanos: fraction === "" ? 0 : Number(fraction.padEnd(9, "0")),
        },
      },
      thresholdRules: args.thresholds.map((percent) => ({ thresholdPercent: percent / 100 })),
      allUpdatesRule: { pubsubTopic: topic.id, schemaVersion: "1.0" },
    },
    opts,
  );
  return topic;
}
