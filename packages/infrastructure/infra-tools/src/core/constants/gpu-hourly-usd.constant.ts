/**
 * Stackra file contract:
 * Purpose: `GPU_HOURLY_USD`, the on-demand price in US dollars per hour of each GPU instance type in each AWS region
 *          the tools stack runs in, so a plan can say what its GPU tools cost while awake.
 * Boundary: data. shortcut: these are estimates, not read from AWS's price list (checked against nothing on 2026-10-30);
 *           replace them with a pricing lookup, or verify against https://aws.amazon.com/ec2/pricing/on-demand/, before
 *           the per-environment cost cap (STA-1640) enforces anything. A GPU instance type or region missing here fails
 *           the plan, so a new one is added with its price.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (consequences: a GPU cost line the owner approves per region); ADR 0172 (cost controls);
 *                     STA-1640 (the cap will count `gpuHourlyUsdAtMax` as `tools.<tool>` at hourlyUsd x 730 x max replicas in STA-1662, after STA-1640 lands).
 */

/** Instance type, then region, to the estimated on-demand dollars per hour. */
export const GPU_HOURLY_USD: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  "g6.xlarge": {
    "me-central-1": 0.98,
    "me-south-1": 0.98,
    "eu-central-1": 0.97,
    "us-east-1": 0.8048,
  },
  "g6.2xlarge": {
    "me-central-1": 1.18,
    "me-south-1": 1.18,
    "eu-central-1": 1.17,
    "us-east-1": 0.9776,
  },
};
