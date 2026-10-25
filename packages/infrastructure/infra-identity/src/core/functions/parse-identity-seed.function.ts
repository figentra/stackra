/**
 * Stackra file contract:
 * Purpose: `parseIdentitySeed(document, source?)`, the one check of a parsed `.stackra/zitadel/seed.yaml` against
 *          seed format version 1, returning it typed with every default filled.
 * Boundary: a parsed value in, a parsed value out; reading and YAML parsing are `readIdentitySeed`'s (`./node`), and
 *           what reaches one instance is `identityPlan`'s. Reports every failure at once.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decisions 4, 5 and 8), ADR 0199 (decision 3: the seeded dev container), ADR 0325
 *                     (rule 1: inputs are checked before a deploy starts).
 */
import { IDENTITY_SEED_SCHEMA } from "#core/constants/identity-seed-schema.constant";
import { IdentityInfraInvalidError } from "#core/errors/identity-infra-invalid.error";
import type { IdentitySeed } from "#core/types/identity-seed.type";

/**
 * The checked seed.
 *
 * @param document - the parsed YAML (or JSON) value.
 * @param source - the file path or a description, for the error.
 * @throws IdentityInfraInvalidError naming every invalid path: an unknown key, a version other than 1, a role declared
 *         twice or held but not declared, a non-snake_case role code, a colour that is not `#rrggbb`, or the device
 *         code or token exchange on a BFF.
 * @example
 * const seed = parseIdentitySeed(parse(text), ".stackra/zitadel/seed.yaml");
 * seed.apps["console"]?.kind; // "bff"
 */
export function parseIdentitySeed(document: unknown, source = "zitadel/seed.yaml"): IdentitySeed {
  const result = IDENTITY_SEED_SCHEMA.safeParse(document);
  if (!result.success) {
    throw new IdentityInfraInvalidError(
      source,
      result.error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      })),
    );
  }
  return result.data;
}
