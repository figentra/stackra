/**
 * Stackra file contract:
 * Purpose: `statusPage(args)`, the public status page on Better Stack (ADR 0185 decision 3): the page itself (company,
 *          subdomain, optional custom domain, time zone, published or not), one section per environment it shows, and
 *          one entry per heartbeat of those environments, named `<service> <job>` so a customer reads which part of
 *          the product is late.
 * Boundary: declares Pulumi resources only. Every value is the runway's `observability.statusPage`; nothing is typed
 *           here. The provider's API token is the owner's stack config. Incidents and their wording are the on-call's,
 *           not this program's.
 * Runtime: node (Pulumi program)
 * Governing contract: ADR 0185 (decision 3), ADR 0184 (decision 4: heartbeats), ADR 0402.
 *                     STA-1220 (the return type is written out, so the declaration emit names the provider classes
 *                     through the package entry, not their `bin/` files).
 */
import * as betterstack from "pulumi-better-uptime";

import type { ObservabilityPlan } from "#core/types/observability-plan.type";

/**
 * The status page.
 *
 * @param args.page - the plan's status page.
 * @param args.heartbeats - the plan's heartbeats and, in the same order, the monitors `heartbeatMonitors` declared.
 * @example
 * const page = statusPage({ project, page: plan.statusPage, heartbeats: plan.heartbeats, monitors });
 */
export function statusPage(args: {
  readonly project: string;
  readonly page: NonNullable<ObservabilityPlan["statusPage"]>;
  readonly heartbeats: ObservabilityPlan["heartbeats"];
  readonly monitors: readonly betterstack.Heartbeat[];
}): {
  readonly statusPage: betterstack.StatusPage;
  readonly sections: {
    readonly section: betterstack.StatusPageSection;
    readonly resources: betterstack.StatusPageResource[];
  }[];
} {
  const { project, page } = args;
  const statusPage = new betterstack.StatusPage(`status-${project}`, {
    companyName: page.companyName,
    companyUrl: page.companyUrl,
    subdomain: page.subdomain,
    timezone: page.timezone,
    published: page.published,
    ...(page.customDomain !== null && { customDomain: page.customDomain }),
  });
  const sections = page.environments.map((environment, position) => {
    const section = new betterstack.StatusPageSection(`status-${project}-${environment}`, {
      statusPageId: statusPage.id,
      name: environment,
      position,
    });
    const resources = args.heartbeats.flatMap((heartbeat, index) => {
      const monitor = args.monitors[index];
      if (heartbeat.environment !== environment || monitor === undefined) return [];
      return [
        new betterstack.StatusPageResource(
          `status-${heartbeat.environment}.${heartbeat.service}.${heartbeat.name}`,
          {
            statusPageId: statusPage.id,
            statusPageSectionId: section.id.apply(Number),
            resourceType: "Heartbeat",
            resourceId: monitor.id.apply(Number),
            publicName: `${heartbeat.service} ${heartbeat.name}`,
          },
        ),
      ];
    });
    return { section, resources };
  });
  return { statusPage, sections };
}
