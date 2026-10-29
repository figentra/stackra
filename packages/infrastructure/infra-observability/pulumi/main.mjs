/**
 * Stackra file contract:
 * Purpose: the Pulumi program of core's telemetry stack (STA-1573): the plan from the root runway.yaml and every
 *          resource it holds, with the plan's outputs exported as stack outputs.
 * Boundary: core has no service or app that names a Sentry project or sends heartbeats yet, so the members are empty
 *           and the stack holds the uptime monitors, the OTLP source and the status page. Imports the built package
 *           by its own name (Node self-reference), so `turbo run build` must run first. `up` runs only in
 *           apply-observability.yml behind the `observability` environment's reviewer.
 * Runtime: node (Pulumi CLI)
 * Governing contract: ADR 0171 (decisions 4 and 6), ADR 0184, ADR 0185 (decisions 1 and 3), ADR 0296.
 */
import { fileURLToPath } from "node:url";

import { observabilityPlan } from "@stackra/infra-observability";
import { observabilityStack } from "@stackra/infra-observability/node";
import { readRunway } from "@stackra/runway/node";

const root = readRunway(fileURLToPath(new URL("../../../../runway.yaml", import.meta.url)), "root");

// shortcut: no member is read, so no Sentry project or heartbeat; read the members once core deploys a service or app.
const plan = observabilityPlan(root, { apps: {}, services: [] });

export const observability = observabilityStack(plan).outputs;
