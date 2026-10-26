# Feature Specification: comment, thread and mention primitives in @stackra/collaboration

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-832

**Clarifications status**: complete (OS collaboration SPEC decisions OS-224 to OS-226; ADR 0433, Proposed)

## Impact

- **Packages touched**: packages/experience/collaboration
- **Services touched**: none (the OS collaboration service moves to these tables later)
- **Tenancy and data**: four tables under the forced scope policy; comment text is personal data, never in events
- **ADR needed**: yes, 0433 (Proposed)
- **New dependencies**: `@stackra/model`, `@stackra/events` (`workspace:*`); lockfile not updated (owner mode)
- **Lane**: full · **Change risk**: R2

## Requirements

- **FR-001** Contracts: `CommentVisibility`, `MentionKind`, `ThreadStatus`, `CommentableRef`, `MentionTarget`,
  `CommentRules`, `CommentView` and the `MentionDirectory` port.
- **FR-002** Core: `CommentCreated`, `MentionCreated`, `checkMentions`, `CommentTombstonedError`,
  `MentionNotAllowedError`, `CommentVisibilityNotAllowedError`.
- **FR-003** Node: `CommentThread`, `Comment`, `CommentRevision`, `CommentMention`, migration 0002 and
  `CommentService` (post, reply and reopen, edit with revision, tombstone, resolve, reads, `viewOf`, hold checks).
- **FR-004** Testing: `MemoryMentionDirectoryDriver`.

## Not built here

- Actions, queries, permissions and policies: the consumer's (the OS collaboration service). The activity feed and
  notification digests. Tests, typecheck and build are written but not run (owner mode).
