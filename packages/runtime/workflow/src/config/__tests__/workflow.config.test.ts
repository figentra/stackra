/**
 * Stackra file contract:
 * Purpose: unit tests of `WorkflowConfig`: a configuration keyed `workflow` (an override keeps the key), its field typed
 *          on the class, built with the shipped default, set by a runway value or a host override, and refusing a
 *          journal nobody ships; the signal retention defaults to seven days and refuses a duration outside 1m to 90d.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 19); ADR 0146 as amended; ADR 0427 (decision 2).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { WorkflowConfig } from "#config/workflow.config";
import { WORKFLOW_CONFIG_SCHEMA } from "#core/constants/workflow-config-schema.constant";
import type { WorkflowJournal } from "#core/ports/workflow-journal.port";

/** A host override, under the plain name with the package class aliased. */
const BaseWorkflowConfig = WorkflowConfig;

class HostWorkflowConfig extends BaseWorkflowConfig {
  override journal: DriverName<WorkflowJournal> = "memory";
}

describe("WorkflowConfig", () => {
  it("is a configuration keyed workflow, an override inheriting the key", () => {
    expect(new WorkflowConfig()).toBeInstanceOf(Config);
    expect(configKey(WorkflowConfig, "workflow")).toBe("workflow");
    expect(configKey(HostWorkflowConfig, "workflow")).toBe("workflow");
  });

  it("types its field on the class and builds with the default", () => {
    const config = buildConfig(WorkflowConfig);
    expectTypeOf(config.journal).toEqualTypeOf<DriverName<WorkflowJournal>>();
    expect({ ...config }).toEqual(WORKFLOW_CONFIG_SCHEMA.parse({}));
    expect(config.journal).toBe("postgres");
  });

  it("takes a runway value and a host override", () => {
    expect(buildConfig(WorkflowConfig, { values: { journal: "memory" } }).journal).toBe("memory");
    expect(buildConfig(HostWorkflowConfig).journal).toBe("memory");
  });

  it("refuses a journal nobody ships", () => {
    expect(() =>
      buildConfig(WorkflowConfig, {
        values: { journal: "temporal" as DriverName<WorkflowJournal> },
      }),
    ).toThrow(ConfigInvalidError);
  });

  it("holds signals seven days by default and takes a retention from 1m to 90d", () => {
    expect(buildConfig(WorkflowConfig).signalRetention).toBe("7d");
    expect(
      buildConfig(WorkflowConfig, { values: { signalRetention: "30d" } }).signalRetention,
    ).toBe("30d");
    for (const signalRetention of ["10s", "120d", "soon"])
      expect(() => buildConfig(WorkflowConfig, { values: { signalRetention } })).toThrow(
        ConfigInvalidError,
      );
  });
});
