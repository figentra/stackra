/**
 * Stackra file contract:
 * Purpose: the `AccessControl` port: the permission step of the pipeline (may this actor make this call at all) and
 *          `ctx.authorize(record)` (may it act on this record).
 * Boundary: an abstract class that is its own token. `@stackra/iam` implements it with its decision point and the
 *           record's policy; this package never imports iam (iam depends on actions). The pipeline fails closed: a call
 *           in an app that binds no `AccessControl` is an error, never an allowed call.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (as amended: permission is the second step; the record policy runs inside `handle`
 *                     through `ctx.authorize`); ADR 0132 as amended (permission from the key).
 */
import { Port } from "@stackra/contracts";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

/**
 * Decides permissions and record rules for the pipeline.
 *
 * @example
 * export class IamAccessControlDriver extends Driver(AccessControl) {
 *   async require(call: CallDescriptor): Promise<void> {
 *     if (!(await this.pdp.check(call.actor, call.permission))) throw ForbiddenError.create();
 *   }
 * }
 */
export abstract class AccessControl extends Port {
  /** Resolves when `call.actor` holds the call's permission; rejects with a Refusal (`forbidden`) otherwise. */
  abstract require(call: CallDescriptor): Promise<void>;

  /** Resolves when the record's policy allows the call on `record`; rejects with a Refusal otherwise. */
  abstract authorize(call: CallDescriptor, record: object): Promise<void>;
}
