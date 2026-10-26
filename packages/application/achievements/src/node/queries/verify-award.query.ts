/**
 * Stackra file contract:
 * Purpose: `VerifyAwardQuery`, `achievements.award.verify@1`: the public check of an award by the token in its QR
 *          code's URL or by the short code printed beside it; `GET /awards/verify?token=` or `?code=`.
 * Boundary: read only, no transaction, in the public API area (`ApiArea.Public`), so an anonymous caller may use it and
 *           the public area's rate-limit bucket bounds guessing. It opens the award's scope session through
 *           `AwardService.verify`/`verifyCode`, which is why it is its own query. Not an MCP tool: an agent reads
 *           awards through the scoped queries of the consumer.
 * Runtime: node
 * Governing contract: ADR 0432 (decisions 1 and 2); ADR 0368 (decision 5); ADR 0294 (decisions 16 and 21); ADR 0082
 *                     (the public area).
 */
import { Query } from "@stackra/actions";
import { ActorKind, ApiArea, HttpMethod } from "@stackra/contracts";

import type { VerifyAwardInput } from "#node/schemas/verify-award-input.schema";
import { VerifyAwardOutput } from "#node/schemas/verify-award-output.schema";
import type { AwardService } from "#node/services/award.service";

/**
 * Verifies an award for anyone holding its certificate.
 *
 * @example
 * const { status, award } = await pipeline.execute(VerifyAwardQuery, { code: "7K3Q-9XPM-0ABZ" }, { actor });
 */
export class VerifyAwardQuery extends Query({
  key: "award.verify",
  actors: [ActorKind.Anonymous, ActorKind.User, ActorKind.Service],
  area: ApiArea.Public,
  endpoint: { method: HttpMethod.Get, path: "/awards/verify" },
  // reason: an agent reads awards through the scoped queries of the consumer, not the public check
  tool: false,
}) {
  /** Resolves tokens and codes. */
  private readonly awards: AwardService;

  /**
   * @param awards - the award service.
   */
  constructor(awards: AwardService) {
    super();
    this.awards = awards;
  }

  /** The award's status, by token when one is given, else by code. */
  async handle(input: VerifyAwardInput): Promise<VerifyAwardOutput> {
    const award =
      input.token === undefined
        ? await this.awards.verifyCode(input.code ?? "")
        : await this.awards.verify(input.token);
    return VerifyAwardOutput.create({ status: award === null ? "not_found" : "valid", award });
  }
}
