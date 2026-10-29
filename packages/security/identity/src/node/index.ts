/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/identity (the passkey actions a BFF serves with their
 *          permissions and schemas, and the listener that ends an erased subject's provider sessions) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `contracts` and `core`, never `testing`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { PasskeyPermissions } from "#node/access/passkey.permissions";
export { ChallengePasskeyAction } from "#node/actions/challenge-passkey.action";
export { ConfirmPasskeyAction } from "#node/actions/confirm-passkey.action";
export { RegisterPasskeyAction } from "#node/actions/register-passkey.action";
export { VerifyPasskeyAction } from "#node/actions/verify-passkey.action";
export { EndErasedSubjectSessionsListener } from "#node/listeners/end-erased-subject-sessions.listener";
export { ChallengePasskeyInput } from "#node/schemas/challenge-passkey-input.schema";
export { ChallengePasskeyOutput } from "#node/schemas/challenge-passkey-output.schema";
export { ConfirmPasskeyInput } from "#node/schemas/confirm-passkey-input.schema";
export { ConfirmPasskeyOutput } from "#node/schemas/confirm-passkey-output.schema";
export { RegisterPasskeyInput } from "#node/schemas/register-passkey-input.schema";
export { RegisterPasskeyOutput } from "#node/schemas/register-passkey-output.schema";
export { VerifyPasskeyInput } from "#node/schemas/verify-passkey-input.schema";
export { VerifyPasskeyOutput } from "#node/schemas/verify-passkey-output.schema";
