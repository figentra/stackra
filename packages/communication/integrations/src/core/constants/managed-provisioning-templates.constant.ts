/**
 * Stackra file contract:
 * Purpose: `MANAGED_PROVISIONING_TEMPLATES`, the seed workflow template pack `os.managed_provisioning`: one automation
 *          per provider category with a managed source (`workflow-template:os:managed-provisioning:<category>`), which
 *          creates the tenant's resource on the platform account, waits for the provider to approve it, then connects
 *          the managed Connection.
 * Boundary: seed data in the `WorkflowTemplatePack$` shape of `@stackra/workflow`, built from `PROVIDER_CATEGORY_SEEDS`
 *           so a category and its template never drift. The blocks it names (`integrations.*`) are registered by the
 *           host over `ManagedProvisioning` and the connection store; the approval wait and the retries are data an
 *           operator may change in the workflow studio.
 * Runtime: isomorphic
 * Governing contract: R3-SO-03; config-model sections 5 and 6 (flows in workflows, templates as seed documents).
 */
import { PROVIDER_CATEGORY_SEEDS } from "#core/constants/provider-category-seeds.constant";

/** The automation key of category `name`: dashes become underscores. */
const keyOf = (name: string): string => `managed_provisioning.${name.replaceAll("-", "_")}`;

/** The template pack. */
export const MANAGED_PROVISIONING_TEMPLATES = {
  key: "os.managed_provisioning",
  version: "1.0.0",
  templates: PROVIDER_CATEGORY_SEEDS.filter((record) => record.managed !== undefined).map(
    (record) => ({
      key: keyOf(record.name),
      version: 1,
      trigger: { block: "integrations.managed_resource_requested" },
      steps: [
        {
          name: "create",
          block: "integrations.create_managed_resource",
          input: {
            reference: { $ref: "input.reference" },
            category: record.name,
            provider: { $ref: "input.provider" },
            scope: { $ref: "input.scope" },
            details: { $ref: "input.details" },
          },
          retry: { attempts: 5 },
        },
        {
          name: "approved",
          waitFor: {
            block: "integrations.managed_resource_active",
            correlate: "results.create.id",
            timeout: "30d",
          },
        },
        {
          name: "connect",
          block: "integrations.connect_managed_resource",
          input: { resourceId: { $ref: "results.create.id" } },
        },
      ],
    }),
  ),
} as const;
