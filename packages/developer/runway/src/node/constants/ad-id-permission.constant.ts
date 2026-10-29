/**
 * Stackra file contract:
 * Purpose: `AD_ID_PERMISSION`, Google's advertising-id permission, which Play Services libraries merge into the
 *          manifest on their own. Every Android build blocks it unless an enabled capability declares it.
 * Boundary: internal; read by `capabilityConfig`. An app opts in by enabling a template capability (an ads or
 *           attribution flag) whose `android.permissions` lists this name; nothing else unblocks it.
 * Runtime: node
 * Governing contract: ADR 0439 (decision 3: the binary declares only what it uses); STA-1577.
 */

/** The advertising-id permission, blocked by default. */
export const AD_ID_PERMISSION = "com.google.android.gms.permission.AD_ID";
