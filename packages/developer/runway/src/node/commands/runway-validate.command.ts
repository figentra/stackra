/**
 * Stackra file contract:
 * Purpose: `RunwayValidateCommand`, `runway validate` (ADR 0352): every runway file of the repository against its
 *          kind's schema (the root, and each member under apps/, services/ and workers/), then the root's placement
 *          (`checkPlacement`), its destinations and target blocks against the drivers (`checkDestinations`, owner
 *          decision O8), each service's requirements (`checkRequires`) and its action stores in every deployed
 *          environment (`checkActionStores` against its generated manifest, STA-2798). Each finding is one line,
 *          `<file>: <path>: <message>`; it exits 1 on any. `stackra validate --repository` runs the same checks.
 * Boundary: reads the runway files and each service's committed `stackra.manifest.json` only; changes nothing.
 * Runtime: node
 * Governing contract: ADR 0352; ADR 0296 (enforcement); ADR 0506 (decision 8); STA-2100; STA-2798.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { Command, type CommandIo } from "@stackra/console";

import { RunwayKind } from "#core/enums/runway-kind.enum";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { checkActionStores } from "#core/functions/check-action-stores.function";
import { checkDestinations } from "#core/functions/check-destinations.function";
import { checkEnvironmentRegion } from "#core/functions/check-environment-region.function";
import { checkPlacement } from "#core/functions/check-placement.function";
import { checkRequires } from "#core/functions/check-requires.function";
import { deprecatedFields } from "#core/functions/deprecated-fields.function";
import { unusedCloudOptIns } from "#core/functions/unused-cloud-opt-ins.function";
import type { RootRunway } from "#core/types/root-runway.type";
import type { ServiceRunway } from "#core/types/service-runway.type";
import { readRunway } from "#node/functions/read-runway.function";
import { readRunways } from "#node/functions/read-runways.function";
import { repositoryRoot } from "#node/functions/repository-root.function";

/** Validates every runway file. */
export class RunwayValidateCommand extends Command({
  name: "validate",
  bin: true,
  description: "Check every runway file against its schema, the placement and the drivers",
  examples: ["runway validate", "runway validate --json"],
}) {
  /** Validates and resolves with 1 when a file has a finding, else 0. */
  handle(io: CommandIo): number {
    const root = repositoryRoot(io.cwd);
    const findings: string[] = [];
    /** Parses one file, recording its schema issues instead of throwing. */
    const read = <K extends RunwayKind>(file: string, kind: K) => {
      try {
        return readRunway(join(root, file), kind);
      } catch (error) {
        if (!(error instanceof RunwayInvalidError)) throw error;
        for (const { path, message } of error.issues)
          findings.push(`${file}: ${path || "(document)"}: ${message}`);
        return undefined;
      }
    };
    const { members } = readRunways(root);
    const parsedRoot = read("runway.yaml", RunwayKind.Root) as RootRunway | undefined;
    const services: [string, ServiceRunway, unknown][] = [];
    for (const { member, folder = "apps" } of members) {
      const file = `${folder}/${member}/runway.yaml`;
      if (folder === "services") {
        const service = read(file, RunwayKind.Service) as ServiceRunway | undefined;
        // the generated manifest says which action stores the member binds; none yet, nothing to check
        const manifest = join(root, folder, member, "stackra.manifest.json");
        if (service !== undefined)
          services.push([
            file,
            service,
            existsSync(manifest)
              ? (JSON.parse(readFileSync(manifest, "utf8")) as unknown)
              : undefined,
          ]);
      } else read(file, RunwayKind.App);
    }
    if (parsedRoot !== undefined) {
      const keys = members
        .filter(({ folder }) => folder === "services")
        .map(({ member }) => member);
      for (const { code, message } of checkPlacement(parsedRoot, keys))
        findings.push(`runway.yaml: ${message} (${code})`);
      for (const { path, message } of [
        ...checkDestinations(parsedRoot),
        ...checkEnvironmentRegion(parsedRoot),
      ])
        findings.push(`runway.yaml: ${path}: ${message}`);
      for (const { path, message } of [
        ...deprecatedFields(parsedRoot),
        ...unusedCloudOptIns(parsedRoot),
      ])
        io.output.warn(`runway.yaml: ${path}: ${message}`);
      for (const [file, service, manifest] of services)
        for (const { path, message } of [
          ...checkRequires(parsedRoot, service),
          ...checkActionStores(parsedRoot, service, manifest),
        ])
          findings.push(`${file}: ${path}: ${message}`);
    }
    for (const finding of findings) io.output.error(finding);
    if (findings.length === 0) io.output.success(`${members.length + 1} runway files valid`);
    return findings.length === 0 ? 0 : 1;
  }
}
