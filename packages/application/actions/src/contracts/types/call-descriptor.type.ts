/**
 * Stackra file contract:
 * Purpose: `CallDescriptor`, what the pipeline tells a step's port about one call: the class, its identity, the
 *          permission and risk gen derived, the caller, the tenant, the scope node, the API area and the sandbox
 *          flag (so an entitlement or access driver can relax a check for a sandbox install, STA-1248) and the request
 *          origin (storefront, console, API key, agent; ADR 0456), which the audit entry and AI attribution read.
 * Boundary: a type only; the pipeline builds it once per call and hands the same frozen object to every port, except
 *           that when the `CallIsolation` runs as another tenant than the actor claims (a branch user runs as its
 *           parent tenant) it is rebuilt once with that tenant, before any step inside the isolation reads it; the
 *           tenancy step, which runs before the isolation, sees the actor's own claim. It carries no input and no
 *           record: a step that needs a record gets it as its own argument.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (as amended: the fixed order); ADR 0136 (decision 1: the handler context); ADR 0294
 *                     (decision 20: derived identities); ADR 0327 (decision 6: the current scope); ADR 0456 (decision 1).
 */
import type { AnyClass } from "@stackra/container";
import type { Actor, ApiArea, PublicId, ScopeRef } from "@stackra/contracts";

import type { Effect } from "#contracts/enums/effect.enum";
import type { CallCredential } from "#contracts/types/call-credential.type";
import type { CallOrigin } from "#contracts/types/call-origin.type";
import type { CallPublic } from "#contracts/types/call-public.type";

/** One call of an action or a query, as every pipeline port sees it. */
export interface CallDescriptor {
  /** The call's id, shared by its audit entry, its log lines and `RequestContext.current()`. */
  readonly callId: string;

  /** The action or query class. */
  readonly type: AnyClass;

  /** `action` or `query`. */
  readonly kind: "action" | "query";

  /** The locked identity `<module>.<model>.<verb>@<major>` gen registered, else the written key (`order.create`). */
  readonly key: string;

  /** The derived permission (`orders.order.create`), when gen registered one. */
  readonly permission?: string;

  /** The permission's risk (`L0` to `L4`), when gen registered one. */
  readonly risk?: string;

  /** The permission's effect tags, when gen registered them. */
  readonly effects?: readonly Effect[];

  /** Who is calling. */
  readonly actor: Actor;

  /**
   * The tenant the call acts in, and the one every row and event it writes is labelled with: the tenant the
   * `CallIsolation` runs as (a branch's parent tenant, read through the scope tree), else the actor's own claim
   * (`actingScopeId`); absent for a platform call.
   */
  readonly scopeId?: PublicId;

  /**
   * The scope node the actor itself claims (`actingScopeId`): a branch below `scopeId`, or `scopeId` itself; absent when
   * the actor claims none. Context for the audit and the access log only, never written as a tenant.
   */
  readonly branchScopeId?: PublicId;

  /** The scope node the call acts in, from `CallOptions.scope`; absent for a platform call. */
  readonly scope?: ScopeRef;

  /** The API area the call arrived on. */
  readonly area: ApiArea;

  /** `true` when the call runs in the tenant's sandbox (`CallOptions.sandbox`, OS-132); absent for a live call. */
  readonly sandbox?: true;

  /** The surface the call arrived through (`CallOptions.origin`); absent for an internal call. */
  readonly origin?: CallOrigin;

  /** The API key an `api_client` call came with (`CallOptions.credential`); absent for every other caller. */
  readonly credential?: CallCredential;

  /** What an API key must hold to call this operation; absent when the operation is not `public`. */
  readonly public?: CallPublic;

  /** `true` when the action answers a stream (`stream: true`), so audit and access see a streamed call; else absent. */
  readonly stream?: true;
}
