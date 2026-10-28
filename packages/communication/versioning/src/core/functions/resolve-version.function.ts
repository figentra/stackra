/**
 * Stackra file contract:
 * Purpose: `resolveVersion`, which picks a request's dated version: the `Stackra-Version` header if sent, else the
 *          caller's pin, else the service's fallback. An older version is served while deprecated: it gets the
 *          `Deprecation` header (when its successor shipped) and the `Sunset` header, the earlier of its support
 *          window's end (`supportMonths` calendar months after its successor) and the earliest sunset among the
 *          dated changes after it. From its sunset on it is retired: refused with `VersionSunsetError`.
 * Boundary: reads the request and the registry only. A version the service does not serve is refused with
 *           `UnsupportedVersionError`, a version past its sunset with `VersionSunsetError`; a fallback missing from
 *           `supported` is the service's own mistake, so it throws a TypeError. With one supported date (the dormant
 *           case) it returns that date and no headers. The generated gateway calls it once per request.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (decisions 1, 3 and 4); ADR 0136 (sunset window); ADR 0237 (the version header is
 *                     handled in the gateway);
 *                     RFC 9745 (`Deprecation`); RFC 8594 (`Sunset`).
 */
import { time } from "@stackra/support";

import { CHANGE_REGISTRY } from "#core/constants/change-registry.constant";
import { VERSION_SUPPORT_MONTHS } from "#core/constants/version-support-months.constant";
import { VERSIONING_HEADERS } from "#core/constants/versioning-headers.constant";
import { UnsupportedVersionError } from "#core/errors/unsupported-version.error";
import { VersionSunsetError } from "#core/errors/version-sunset.error";
import type { ResolvedVersion } from "#core/types/resolved-version.type";
import type { VersionRequest } from "#core/types/version-request.type";

/** Midnight UTC of a `YYYY-MM-DD` day, in milliseconds. */
function midnight(day: string): number {
  return Date.parse(`${day}T00:00:00Z`);
}

/**
 * The earlier of `windowEnd` and the earliest sunset among the registered dated changes that shipped after
 * `version`.
 */
function sunsetOf(version: string, windowEnd: string): string {
  let sunset = windowEnd;
  for (const changes of CHANGE_REGISTRY.values())
    for (const change of changes)
      if (typeof change.from === "string" && change.from > version)
        if (change.sunset < sunset) sunset = change.sunset;
  return sunset;
}

/**
 * The request's dated version and the headers its response carries.
 *
 * @throws UnsupportedVersionError when the header or the pin names a version the service does not serve.
 * @throws VersionSunsetError when the version's sunset has passed.
 * @throws TypeError when `fallback` is not one of `supported`, or `supportMonths` is not a whole number above 0.
 * @example
 * const resolved = resolveVersion({
 *   header: request.headers.get(VERSIONING_HEADERS.version),
 *   pin: apiKey.version,
 *   supported: versioning.supported,
 *   fallback: versioning.fallback,
 *   now: clock.now(),
 * });
 * // { version: "2026-10-01", headers: { Deprecation: "@1803859200", Sunset: "Wed, 01 Mar 2028 00:00:00 GMT" } }
 */
export function resolveVersion(request: VersionRequest): ResolvedVersion {
  const { supported, fallback, now, supportMonths = VERSION_SUPPORT_MONTHS } = request;
  if (!Number.isInteger(supportMonths) || supportMonths < 1)
    throw new TypeError(
      `The support window must be a whole number of months, got ${supportMonths}`,
    );
  const sent = request.header ?? request.pin;
  const version = sent ?? fallback;
  if (!supported.includes(version)) {
    if (sent === undefined)
      throw new TypeError(`The fallback version ${fallback} is not one of the supported versions`);
    throw UnsupportedVersionError.create({ supported: [...supported] });
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const successor = supported.filter((day) => day > version).sort()[0];
  if (successor === undefined) return { version, headers: {} };
  const windowEnd = time.addMonths(new Date(midnight(successor)), supportMonths);
  const sunset = sunsetOf(version, windowEnd.toISOString().slice(0, 10));
  if (now.getTime() >= midnight(sunset)) throw VersionSunsetError.create({ version, sunset });
  return {
    version,
    headers: {
      [VERSIONING_HEADERS.deprecation]: `@${midnight(successor) / 1000}`,
      [VERSIONING_HEADERS.sunset]: new Date(midnight(sunset)).toUTCString(),
    },
  };
}
