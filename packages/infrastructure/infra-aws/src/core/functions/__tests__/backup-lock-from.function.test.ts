/**
 * Stackra file contract:
 * Purpose: unit tests of `backupLockFrom`: governance mode with bounds defaulted from the environments' snapshot
 *          retention (35 days when none declares backups); explicit bounds and compliance mode are taken as written;
 *          bounds that would refuse an environment's copies, or a ceiling past 35 days no crypto-shredding covers, are
 *          refused with their paths.
 * Boundary: test only; the narrowed runway is built by `parseInfraRunway` from a `parseRunway` root.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0186 (decision 2), ADR 0188 (decision 3).
 */
import { parseRunway, RunwayInvalidError } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { backupLockFrom } from "#core/functions/backup-lock-from.function";
import { parseInfraRunway } from "#core/functions/parse-infra-runway.function";

/** The narrowed runway with the given lock and each environment's backups. */
function runwayWith(
  backupLock: Record<string, unknown> | null,
  backups: Record<string, Record<string, unknown>>,
) {
  return parseInfraRunway(
    parseRunway("root", {
      version: 3,
      project: "acme",
      providers: {
        aws: { region: "me-central-1", ...(backupLock === null ? {} : { backupLock }) },
      },
      environments: Object.fromEntries(
        Object.entries(backups).map(([environment, settings]) => [
          environment,
          { shared: { database: { backups: settings } } },
        ]),
      ),
    }),
  );
}

describe("backupLockFrom", () => {
  it("defaults to governance mode over 35 days when no environment declares backups", () => {
    expect(backupLockFrom(runwayWith(null, {}))).toEqual({
      minRetentionDays: 35,
      maxRetentionDays: 35,
      changeableForDays: null,
    });
  });

  it("defaults the bounds to the shortest and longest snapshot retention", () => {
    const runway = runwayWith(null, { staging: { retentionDays: 7 }, production: {} });

    expect(backupLockFrom(runway)).toEqual({
      minRetentionDays: 7,
      maxRetentionDays: 35,
      changeableForDays: null,
    });
  });

  it("takes explicit bounds and compliance mode as written", () => {
    const runway = runwayWith(
      { minRetentionDays: 7, maxRetentionDays: 35, compliance: true, changeableForDays: 3 },
      { production: { retentionDays: 30 } },
    );

    expect(backupLockFrom(runway)).toEqual({
      minRetentionDays: 7,
      maxRetentionDays: 35,
      changeableForDays: 3,
    });
  });

  it("refuses bounds that would refuse an environment's copies", () => {
    const runway = runwayWith(
      { minRetentionDays: 14, maxRetentionDays: 20 },
      { staging: { retentionDays: 7 }, production: { retentionDays: 30 } },
    );

    expect(() => backupLockFrom(runway)).toThrow(RunwayInvalidError);
    expect(() => backupLockFrom(runway)).toThrow(
      /providers\.aws\.backupLock\.minRetentionDays: An environment keeps snapshot copies 7 days/,
    );
    expect(() => backupLockFrom(runway)).toThrow(
      /providers\.aws\.backupLock\.maxRetentionDays: An environment keeps snapshot copies 30 days/,
    );
  });

  it("refuses a ceiling past 35 days unless an environment keeps crypto-shredded copies that long", () => {
    expect(() => backupLockFrom(runwayWith({ maxRetentionDays: 90 }, {}))).toThrow(
      /maxRetentionDays: Keep it 35 days or less/,
    );
    const shredded = runwayWith(
      { maxRetentionDays: 90 },
      { production: { retentionDays: 90, cryptoShredded: true } },
    );
    expect(backupLockFrom(shredded).maxRetentionDays).toBe(90);
  });
});
