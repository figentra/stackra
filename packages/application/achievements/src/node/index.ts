/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/achievements (the `AwardKind`, `Award` and
 *          `AwardVerification` models, the two services and the recipient registration) until `stackra gen` writes
 *          the entry barrels and the generated `AchievementsModule` (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: it reads and writes Postgres through
 *           @stackra/database. The migration is found by its path, as every migration is, so it is not re-exported;
 *           the recipient registry stays internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0368; the STA-347 stand-in barrel decision.
 */
export { registerAwardRecipients } from "#node/functions/register-award-recipients.function";
export { Award } from "#node/models/award.model";
export { AwardKind } from "#node/models/award-kind.model";
export { AwardVerification } from "#node/models/award-verification.model";
export { AwardService } from "#node/services/award.service";
export { AwardKindService } from "#node/services/award-kind.service";
