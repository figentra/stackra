/**
 * Stackra file contract:
 * Purpose: `AccountDeletionInput`, the input of the account deletion calls (`identity.account_deletion.request@1`,
 *          `.cancel@1`, `.read@1` and the `.erase@1` job): no fields, because the account is always the caller's own,
 *          never one named in the body, and the job reads the due ones from the store.
 * Boundary: a schema with no fields.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1567.
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** The input of an account deletion call, which takes no fields. */
export class AccountDeletionInput extends Schema {}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[AccountDeletionInput, z.object({})]]);
