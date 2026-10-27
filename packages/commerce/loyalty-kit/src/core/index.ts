/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/loyalty-kit (the configuration with its shape and shipped schema,
 *          `LoyaltyService`, the memory ledger, the refusals, the views the renderers share, the reference constants
 *          and the two functions) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Isomorphic: nothing here reaches node-only code. Ports, enums
 *           and types come from ./contracts only, so no symbol is exported from two entries. The driver names, the
 *           i18n keys and the `DriverRegistry` augmentation stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { LoyaltyKitConfig } from "#config/loyalty-kit.config";
export { EXPIRE_REFERENCE_PREFIX } from "#core/constants/expire-reference-prefix.constant";
export { HOLD_REFERENCE_PREFIX } from "#core/constants/hold-reference-prefix.constant";
export { IMPORT_REFERENCE_PREFIX } from "#core/constants/import-reference-prefix.constant";
export { LOYALTY_KIT_CONFIG_SCHEMA as LoyaltyKitConfig$ } from "#core/constants/loyalty-kit-config-schema.constant";
export { MAX_POINTS_PER_ENTRY } from "#core/constants/max-points-per-entry.constant";
export { RELEASE_REFERENCE_PREFIX } from "#core/constants/release-reference-prefix.constant";
export { REVERT_REFERENCE_PREFIX } from "#core/constants/revert-reference-prefix.constant";
export { SETTLE_REFERENCE_PREFIX } from "#core/constants/settle-reference-prefix.constant";
export { TAKE_BACK_REFERENCE_PREFIX } from "#core/constants/take-back-reference-prefix.constant";
export { MemoryLoyaltyLedgerDriver } from "#core/drivers/memory-loyalty-ledger.driver";
export { AccountFrozenError } from "#core/errors/account-frozen.error";
export { InsufficientPointsError } from "#core/errors/insufficient-points.error";
export { NotAMemberError } from "#core/errors/not-a-member.error";
export { NotOwnPrincipalError } from "#core/errors/not-own-principal.error";
export { isExpiringSoon } from "#core/functions/is-expiring-soon.function";
export { memberId } from "#core/functions/member-id.function";
export { stampCardProgress } from "#core/functions/stamp-card-progress.function";
export { BalanceView } from "#core/schemas/balance-view.schema";
export { LoyaltyAccountView } from "#core/schemas/loyalty-account-view.schema";
export { LoyaltyKitOptions } from "#core/schemas/loyalty-kit-options.schema";
export { PointsIssuedView } from "#core/schemas/points-issued-view.schema";
export { LoyaltyService } from "#core/services/loyalty.service";
export type { StampCardProgress } from "#core/types/stamp-card-progress.type";
