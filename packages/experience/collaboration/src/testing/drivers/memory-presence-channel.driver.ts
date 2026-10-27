/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `PresenceChannel` port: rooms in process, for tests. One driver is one signed-in
 *          principal (the container's has a placeholder id; `MemoryPresenceChannelDriver.for(principalId)` names one);
 *          `peer(principalId)` adds another principal on the same rooms, so a test puts two people in one
 *          room. `drop()` and `reconnect()` take this driver's links down and up as a network would.
 * Boundary: test code only, so it ships in `./testing`; no network, no authorisation. A link opens on the next
 *           microtask (never before `join` returns). Only open links are reported as peers and receive peer lists.
 * Runtime: node
 * Governing contract: ADR 0266 (decision 2: memory driver first); ADR 0269 (decision 3: fakes in `./testing`); ADR
 *                     0225 (decision 2); ADR 0294 (constructor parameters are class tokens).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { PresenceChannel } from "#contracts/index";
import type {
  CollaborationCursor,
  CollaborationRoom,
  PresenceLink,
  PresenceLinkHandlers,
} from "#contracts/index";

/** One link in a room. */
interface Member {
  readonly peerId: string;
  readonly principalId: PublicId;
  readonly handlers: PresenceLinkHandlers;
  readonly owner: MemoryPresenceChannelDriver;
  cursor: CollaborationCursor | null;
  opened: boolean;
}

/**
 * Presence in process.
 *
 * @example
 * const alice = MemoryPresenceChannelDriver.for("usr_01j9z3k4m5n6p7q8r9s0t1v2w3");
 * const bob = alice.peer("usr_01j9z3k4m5n6p7q8r9s0t1v2w4");
 */
export class MemoryPresenceChannelDriver extends Driver(PresenceChannel) {
  private principalId: PublicId = "usr_00000000000000000000000000";

  // Shared with every driver made by `peer`.
  private rooms = new Map<string, Set<Member>>();

  /**
   * A driver whose links are stamped with `principalId`, on rooms of its own.
   *
   * @param principalId - the principal this driver's links are stamped with.
   */
  static for(principalId: PublicId): MemoryPresenceChannelDriver {
    const driver = new MemoryPresenceChannelDriver();
    driver.principalId = principalId;
    return driver;
  }

  /** A driver for `principalId` on the same rooms. */
  peer(principalId: PublicId): MemoryPresenceChannelDriver {
    const peer = MemoryPresenceChannelDriver.for(principalId);
    peer.rooms = this.rooms;
    return peer;
  }

  /** Joins `room`; `onOpen` and the peer lists follow on the next microtask unless it was left first. */
  join(room: CollaborationRoom, handlers: PresenceLinkHandlers): PresenceLink {
    const members = this.rooms.get(room.document) ?? new Set<Member>();
    this.rooms.set(room.document, members);
    const member: Member = {
      peerId: crypto.randomUUID(),
      principalId: this.principalId,
      handlers,
      owner: this,
      cursor: null,
      opened: false,
    };
    members.add(member);
    queueMicrotask(() => this.open(members, member));
    return {
      move: (cursor) => {
        if (!member.opened) return;
        member.cursor = cursor;
        this.announce(members);
      },
      leave: () => {
        if (members.delete(member)) this.announce(members);
      },
    };
  }

  /** Takes this driver's links down, reporting `onClose` to each and removing them from the others' lists. */
  drop(): void {
    for (const members of this.rooms.values()) {
      const lost = [...members].filter((member) => member.owner === this && member.opened);
      for (const member of lost) {
        member.opened = false;
        member.handlers.onClose();
      }
      if (lost.length > 0) this.announce(members);
    }
  }

  /** Brings this driver's dropped links up again, as a driver's own reconnect would. */
  reconnect(): void {
    for (const members of this.rooms.values())
      for (const member of members) if (member.owner === this) this.open(members, member);
  }

  /** Opens `member` if it is still in the room and not open, then sends everyone the new lists. */
  private open(members: Set<Member>, member: Member): void {
    if (!members.has(member) || member.opened) return;
    member.opened = true;
    member.handlers.onOpen();
    this.announce(members);
  }

  /** Sends each open link the list of the other open links. */
  private announce(members: Set<Member>): void {
    const open = [...members].filter((member) => member.opened);
    for (const member of open)
      member.handlers.onPeers(
        open
          .filter((other) => other !== member)
          .map(({ peerId, principalId, cursor }) => ({ peerId, principalId, cursor })),
      );
  }
}
