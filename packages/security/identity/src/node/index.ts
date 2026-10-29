/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/identity (the operator bootstrap action with its
 *          permission and schemas, the passkey actions a BFF serves with their
 *          permissions and schemas, the account deletion actions, query, job, permissions and schemas with its
 *          Postgres store and migration, the session list and sign-out-everywhere actions with their permissions
 *          and schemas, the listener that ends an erased subject's provider sessions, and the BFF's login, callback,
 *          session and logout routes (`BffService`) with their configuration, and the receiver of ZITADEL's auth
 *          events into the audit chain (`ZitadelAuthEventsService`) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `contracts` and `core`, never `testing`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { BffConfig } from "#config/bff.config";
export { BFF_CONFIG_SCHEMA as BffConfig$ } from "#core/constants/bff-config-schema.constant";
export { BffOptions } from "#core/schemas/bff-options.schema";
export { AccountDeletionPermissions } from "#node/access/account-deletion.permissions";
export { OperatorPermissions } from "#node/access/operator.permissions";
export { PasskeyPermissions } from "#node/access/passkey.permissions";
export { SessionPermissions } from "#node/access/session.permissions";
export { BootstrapOperatorAction } from "#node/actions/bootstrap-operator.action";
export { CancelAccountDeletionAction } from "#node/actions/cancel-account-deletion.action";
export { DeleteMyAccountAction } from "#node/actions/delete-my-account.action";
export { EraseDueAccountsAction } from "#node/actions/erase-due-accounts.action";
export { ChallengePasskeyAction } from "#node/actions/challenge-passkey.action";
export { ConfirmPasskeyAction } from "#node/actions/confirm-passkey.action";
export { EndAllMySessionsAction } from "#node/actions/end-all-my-sessions.action";
export { EndMySessionAction } from "#node/actions/end-my-session.action";
export { EndUserSessionsAction } from "#node/actions/end-user-sessions.action";
export { RegisterPasskeyAction } from "#node/actions/register-passkey.action";
export { VerifyPasskeyAction } from "#node/actions/verify-passkey.action";
export { CreateAccountDeletionsMigration } from "#node/database/migrations/0001-create-account-deletions.migration";
export { PostgresAccountDeletionsDriver } from "#node/drivers/postgres-account-deletions.driver";
export { EndErasedSubjectSessionsListener } from "#node/listeners/end-erased-subject-sessions.listener";
export { BffService } from "#node/services/bff.service";
export { ZitadelAuthEventsService } from "#node/services/zitadel-auth-events.service";
export { ListMySessionsQuery } from "#node/queries/list-my-sessions.query";
export { ShowAccountDeletionQuery } from "#node/queries/show-account-deletion.query";
export { BootstrapOperatorInput } from "#node/schemas/bootstrap-operator-input.schema";
export { BootstrapOperatorOutput } from "#node/schemas/bootstrap-operator-output.schema";
export { AccountDeletionInput } from "#node/schemas/account-deletion-input.schema";
export { AccountDeletionOutput } from "#node/schemas/account-deletion-output.schema";
export { EraseDueAccountsOutput } from "#node/schemas/erase-due-accounts-output.schema";
export { ChallengePasskeyInput } from "#node/schemas/challenge-passkey-input.schema";
export { ChallengePasskeyOutput } from "#node/schemas/challenge-passkey-output.schema";
export { ConfirmPasskeyInput } from "#node/schemas/confirm-passkey-input.schema";
export { ConfirmPasskeyOutput } from "#node/schemas/confirm-passkey-output.schema";
export { RegisterPasskeyInput } from "#node/schemas/register-passkey-input.schema";
export { RegisterPasskeyOutput } from "#node/schemas/register-passkey-output.schema";
export { EndMySessionInput } from "#node/schemas/end-my-session-input.schema";
export { EndUserSessionsInput } from "#node/schemas/end-user-sessions-input.schema";
export { EndedSessionsOutput } from "#node/schemas/ended-sessions-output.schema";
export { SessionLine } from "#node/schemas/session-line.schema";
export { SessionsInput } from "#node/schemas/sessions-input.schema";
export { SessionsOutput } from "#node/schemas/sessions-output.schema";
export { VerifyPasskeyInput } from "#node/schemas/verify-passkey-input.schema";
export { VerifyPasskeyOutput } from "#node/schemas/verify-passkey-output.schema";
