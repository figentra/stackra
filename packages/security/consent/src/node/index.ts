/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/consent (the consent endpoint
 *          `IssueConsentSnapshotAction` with its input and output, and `ConsentSnapshotPermissions`) until
 *          `stackra gen` writes the entry barrels and the generated module (STA-339).
 * Boundary: names each re-export and declares nothing. Server only, and the only entry that imports @stackra/iam, so
 *           the browser entries stay free of it.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (an entry exists once its folder has a file);
 *                     the STA-347 stand-in barrel decision; ADR 0462 (decision 1); ADR 0472 (decision 1).
 */
export { ConsentSnapshotPermissions } from "#node/access/consent-snapshot.permissions";
export { IssueConsentSnapshotAction } from "#node/actions/issue-consent-snapshot.action";
export { IssueConsentSnapshotInput } from "#node/schemas/issue-consent-snapshot-input.schema";
export { IssueConsentSnapshotOutput } from "#node/schemas/issue-consent-snapshot-output.schema";
