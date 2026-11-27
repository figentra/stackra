/**
 * Stackra file contract:
 * Purpose: `checkServerEnvironment(ir, generatorVersion?)`, the gen refusals that keep a service from booting a
 *          deployment as `dev` (STA-1571, on the one reader of STA-2844):
 *          - a service that runs `@stackra/app` from an authored `src/main.ts` (a v2 service, STA-344) gets no
 *            generated `environment.ts`, so nothing hands the platform to the reader, and an unset
 *            `STACKRA_ENVIRONMENT` reads as `dev` there with every dev-only relaxation on (an unbound audit trail,
 *            memory stores, dev sign-in): refused (`authored_main_environment`);
 *          - a service whose declared `@stackra/app` predates `providePlatformEnvironment` cannot load the
 *            `environment.ts` gen writes: refused (`app_version_floor`), at the lower of `APP_ENVIRONMENT_FLOOR` and
 *            gen's own version.
 * Boundary: pure; reads the layout, the authored main, the declared packages and the installed `@stackra/app`
 *           manifest's version. A service that does not run `@stackra/app` is not checked, and neither is the version
 *           of one whose `@stackra/app` manifest is not installed (`generated_dependency_missing` names that). Runs in
 *           the full pass beside the other checks, never in the manifest pass.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decisions 1 and 4: no action unaudited in a deployment); ADR 0296 (amendment
 *                     2026-11-26); ADR 0294 (decision 22: a refusal carries its fix); STA-1571, STA-2844, STA-344.
 */
import { APP_ENVIRONMENT_FLOOR } from "#core/constants/app-environment-floor.constant";
import { runsServerApp } from "#core/functions/runs-server-app.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The `major.minor.patch` numbers of `version`; a pre-release or build suffix is ignored. */
function numbers(version: string): readonly number[] | undefined {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  return match === null ? undefined : [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Whether `version` is older than `floor`; an unreadable version is not (there is nothing to compare). */
function older(version: string, floor: string): boolean {
  const left = numbers(version);
  const right = numbers(floor);
  if (left === undefined || right === undefined) return false;
  for (const [index, number] of left.entries()) {
    const other = right[index] ?? 0;
    if (number !== other) return number < other;
  }
  return false;
}

/**
 * The refusals of `ir`'s server environment.
 *
 * @param ir - the member read by discovery.
 * @param generatorVersion - gen's own version, when known; the floor never exceeds it.
 * @example
 * checkServerEnvironment({ ...service, authoredMain: true }); // [{ code: "authored_main_environment", ... }]
 */
export function checkServerEnvironment(ir: MemberIR, generatorVersion?: string): GenError[] {
  if (ir.layout !== "service" || !runsServerApp(ir)) return [];
  if (ir.authoredMain === true)
    return [
      {
        code: "authored_main_environment",
        file: "src/main.ts",
        line: 0,
        column: 0,
        subject: ir.package,
        message:
          `${ir.package} runs @stackra/app from an authored src/main.ts, which gets no generated environment.ts: ` +
          "with STACKRA_ENVIRONMENT unset, a deployment of it would boot as dev and run actions with no audit trail",
        fix:
          "delete src/main.ts so gen writes the server entry and stackra-encore/<member>/environment.ts (STA-344), " +
          "or remove @stackra/app from the service",
      },
    ];
  const version = ir.dependencies.find((dependency) => dependency.package === "@stackra/app")
    ?.manifest.version;
  if (version === undefined) return [];
  const floor =
    generatorVersion !== undefined && older(generatorVersion, APP_ENVIRONMENT_FLOOR)
      ? generatorVersion
      : APP_ENVIRONMENT_FLOOR;
  if (!older(version, floor)) return [];
  return [
    {
      code: "app_version_floor",
      file: "package.json",
      line: 0,
      column: 0,
      subject: "@stackra/app",
      message:
        `${ir.package} declares @stackra/app ${version}, older than ${floor}: the generated environment.ts imports ` +
        "providePlatformEnvironment from @stackra/app/server, which that version does not export",
      fix: `upgrade @stackra/app to ${floor} or later, with the rest of @stackra/* (they are released together)`,
    },
  ];
}
