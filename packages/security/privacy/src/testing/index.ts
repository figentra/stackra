/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/privacy (the salt store fake and the registry reset)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; test code only. The memory drivers stay in `.`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 15); ADR 0269.
 */
export { clearPersonalData } from "#testing/clear-personal-data.function";
export { SubjectSaltStoreFake } from "#testing/subject-salt-store.fake";
