/**
 * Stackra file contract:
 * Purpose: `MentionKind`, what a mention points at: a member, a team, a role, an external participant of the record, or
 *          the shared assistant.
 * Boundary: an `Enum.of` in the leaf entry. The assistant's display name is the consumer's setting, never a value here;
 *           whether an id of the other kinds exists is the `MentionDirectory` port's answer.
 * Runtime: isomorphic
 * Governing contract: ADR 0433 (decision 3); OS-226.
 */
import { Enum } from "@stackra/contracts";

/** The mention targets. */
export const MentionKind = Enum.of({
  /** A member of the tenant. */
  Member: "member",
  /** A team. */
  Team: "team",
  /** Everyone holding a role. */
  Role: "role",
  /** An external participant of the record; only on a shared comment. */
  ExternalParticipant: "external_participant",
  /** The shared AI assistant; it has no id. */
  Assistant: "assistant",
});

/** One of the kinds above. */
export type MentionKind = Enum.Value<typeof MentionKind>;
