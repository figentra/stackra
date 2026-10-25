/**
 * Stackra file contract:
 * Purpose: `TEST_ACTOR`, the caller of a fake context when a test names none: the platform itself (`ActorKind.System`).
 * Boundary: a frozen constant for `fakeExtensionContext` and `fakeActionContext`; a test that cares who calls passes
 *           `actor` (usually from `actors.*()` of `@stackra/iam/testing`).
 * Runtime: node
 * Governing contract: ADR 0269 (testing helpers); ADR 0098 (the typed actor).
 */
import { type Actor, ActorKind } from "@stackra/contracts";

/** The default caller of a fake context. */
export const TEST_ACTOR: Actor = Object.freeze({ kind: ActorKind.System, id: "sys_test" });
