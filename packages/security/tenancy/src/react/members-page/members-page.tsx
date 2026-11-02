/**
 * Stackra file contract:
 * Purpose: `MembersPage`, the tenancy kit's members settings page: the active tenant's members (name, role, kind)
 *          with a role choice and a remove button on each, the invitations with their status and a revoke button on
 *          each pending one, and an invite dialog (email, role, and kind when outside members are allowed).
 * Boundary: composition of @stackra/ui (PageHeader, Table, Select, Button, StatusBadge, Modal, Form, TextField,
 *           AlertDialog, Alert, ErrorState) over the container's `TenantMembers` port. Both tables page by the port's
 *           cursor. A refused change shows the host's words for its code (`last_owner_refused`,
 *           `external_role_not_allowed`), any other failure its `failed` words, in a danger Alert (announced). A
 *           member without a name shows the host's `unnamedMember` words. The roles are the host's: tenancy does not
 *           depend on @stackra/iam.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0260 (client ports); ADR 0208 (memberships); OS ADR 0010
 *                     (external members); ADR 0140 (refusal codes); ADR 0165 (UI through @stackra/ui); WCAG 2.2
 *                     SC 4.1.3.
 */
import { useContainer } from "@stackra/container/react";
import type { SelectItem } from "@stackra/ui/contracts";
import {
  Alert,
  AlertDialog,
  Button,
  EmptyState,
  ErrorState,
  Form,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Table,
  TextField,
} from "@stackra/ui/react";
import { type FormEvent, type ReactElement, useCallback, useEffect, useState } from "react";

import { TenantMembers } from "#contracts/ports/tenant-members.port";
import type { TenantInvitation } from "#contracts/types/tenant-invitation.type";
import type { TenantMember } from "#contracts/types/tenant-member.type";
import type { MembersPageProps } from "#react/members-page/members-page.props";

/** One page of a cursor list. */
interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}

/** A cursor list: its rows so far, whether it is loading or failed, and how to load more, reload or edit it. */
function usePages<T>(load: (cursor: string | undefined) => Promise<Page<T>>) {
  const [state, setState] = useState<Page<T> & { readonly status: "loading" | "ready" | "failed" }>(
    {
      items: [],
      nextCursor: null,
      status: "loading",
    },
  );
  // `isLive` is false once the page is gone, so a late answer sets nothing.
  const first = useCallback(
    (isLive: () => boolean) =>
      load(undefined).then(
        (page) => {
          if (isLive())
            setState({ items: page.items, nextCursor: page.nextCursor, status: "ready" });
        },
        () => {
          if (isLive()) setState((current) => ({ ...current, status: "failed" }));
        },
      ),
    [load],
  );
  useEffect(() => {
    let isLive = true;
    void first(() => isLive);
    return () => {
      isLive = false;
    };
  }, [first]);
  const loadMore = () => {
    if (state.nextCursor === null || state.status === "loading") return;
    const cursor = state.nextCursor;
    setState((current) => ({ ...current, status: "loading" }));
    load(cursor).then(
      (page) =>
        setState((current) => ({
          items: [...current.items, ...page.items],
          nextCursor: page.nextCursor,
          status: "ready",
        })),
      () => setState((current) => ({ ...current, status: "failed" })),
    );
  };
  const reload = () => {
    setState((current) => ({ ...current, status: "loading" }));
    void first(() => true);
  };
  const edit = (change: (items: readonly T[]) => readonly T[]) =>
    setState((current) => ({ ...current, items: change(current.items) }));
  return { ...state, loadMore, reload, edit };
}

/** The host's words for a failed change: its refusal code's, else the general ones. */
function failureOf(error: unknown, labels: MembersPageProps["labels"]): string {
  // The codes of LastOwnerRefusedError and ExternalRoleNotAllowedError; a client's rebuilt error carries only the code.
  const code = (error as { readonly code?: unknown } | null)?.code;
  if (code === "last_owner_refused") return labels.lastOwner;
  if (code === "external_role_not_allowed") return labels.externalRole;
  return labels.failed;
}

/** The badge tone of each invitation status. */
const STATUS_TONE = {
  pending: "warning",
  accepted: "success",
  revoked: "default",
  expired: "default",
} as const;

/**
 * The members settings page.
 *
 * @example
 * <MembersPage roles={roles} allowExternal onInvited={() => toast.show(sent)} labels={labels} />
 */
export function MembersPage({
  roles,
  inviteRoles,
  allowExternal = false,
  onInvited,
  labels,
}: MembersPageProps): ReactElement {
  const port = useContainer().get(TenantMembers);
  const members = usePages(useCallback((cursor?: string) => port.list({ cursor }), [port]));
  const invitations = usePages(
    useCallback((cursor?: string) => port.invitations({ cursor }), [port]),
  );
  const [failure, setFailure] = useState<string | null>(null);
  const [removing, setRemoving] = useState<TenantMember | null>(null);
  const inviteChoices: readonly SelectItem[] =
    inviteRoles === undefined ? roles : roles.filter((role) => inviteRoles.includes(role.id));
  const [isInviting, setInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string | null>(inviteChoices[0]?.id ?? null);
  const [kind, setKind] = useState<TenantMember["kind"]>("internal");
  const [isSending, setSending] = useState(false);
  const [inviteFailure, setInviteFailure] = useState<string | null>(null);

  const nameOf = (member: TenantMember) => member.name ?? labels.unnamedMember;
  const roleName = (code: string) => roles.find((choice) => choice.id === code)?.label ?? code;
  const kindName = (value: TenantMember["kind"]) =>
    value === "external" ? labels.external : labels.internal;

  const run = async (work: () => Promise<void>) => {
    setFailure(null);
    try {
      await work();
    } catch (error) {
      setFailure(failureOf(error, labels));
    }
  };

  const changeRole = (member: TenantMember, next: string) =>
    run(async () => {
      await port.changeRole({ membershipId: member.membershipId, role: next });
      members.edit((rows) =>
        rows.map((row) =>
          row.membershipId === member.membershipId ? { ...row, role: next } : row,
        ),
      );
    });

  const remove = (member: TenantMember) =>
    run(async () => {
      await port.remove(member.membershipId);
      members.edit((rows) => rows.filter((row) => row.membershipId !== member.membershipId));
    });

  const revoke = (invitation: TenantInvitation) =>
    run(async () => {
      await port.revokeInvitation(invitation.id);
      invitations.edit((rows) =>
        rows.map((row) => (row.id === invitation.id ? { ...row, status: "revoked" } : row)),
      );
    });

  const invite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (role === null) return;
    setSending(true);
    setInviteFailure(null);
    try {
      const { invitationId } = await port.invite({
        email,
        role,
        kind: allowExternal ? kind : "internal",
      });
      setInviting(false);
      setEmail("");
      invitations.reload();
      onInvited?.(invitationId);
    } catch (error) {
      setInviteFailure(failureOf(error, labels));
    } finally {
      setSending(false);
    }
  };

  const memberRows = members.items.map((member) => ({ ...member, id: member.membershipId }));
  const memberColumns = [
    { id: "name", label: labels.name, isRowHeader: true },
    { id: "role", label: labels.role },
    ...(allowExternal ? [{ id: "kind", label: labels.kind }] : []),
    { id: "actions", label: labels.actions },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={labels.title}
        description={labels.description}
        actions={[
          {
            id: "invite",
            label: labels.invite,
            onPress: () => {
              setInviteFailure(null);
              setInviting(true);
            },
          },
        ]}
      />
      {failure !== null && <Alert tone="danger" title={failure} />}
      {members.status === "failed" ? (
        <ErrorState
          title={labels.loadFailed}
          retry={{ label: labels.retry, onPress: members.reload }}
        />
      ) : (
        <Table
          label={labels.members}
          items={memberRows}
          columns={memberColumns}
          isLoading={members.status === "loading"}
          loadingLabel={labels.loadingMembers}
          hasMore={members.nextCursor !== null}
          onLoadMore={members.loadMore}
          emptyState={<EmptyState title={labels.noMembers} />}
          renderCell={(member, column) => {
            if (column.id === "name") return <span dir="auto">{nameOf(member)}</span>;
            if (column.id === "kind") return kindName(member.kind);
            if (column.id === "role")
              return (
                <Select
                  aria-label={`${labels.role}: ${nameOf(member)}`}
                  items={roles}
                  value={member.role}
                  onChange={(next) => {
                    if (next !== null && next !== member.role) void changeRole(member, next);
                  }}
                />
              );
            return (
              <Button
                variant="danger-soft"
                size="sm"
                label={`${labels.remove}: ${nameOf(member)}`}
                onPress={() => setRemoving(member)}
              >
                {labels.remove}
              </Button>
            );
          }}
        />
      )}
      {invitations.status === "failed" ? (
        <ErrorState
          title={labels.loadFailed}
          retry={{ label: labels.retry, onPress: invitations.reload }}
        />
      ) : (
        <Table
          label={labels.invitations}
          items={invitations.items}
          columns={[
            { id: "email", label: labels.email, isRowHeader: true },
            { id: "role", label: labels.role },
            { id: "status", label: labels.status },
            { id: "actions", label: labels.actions },
          ]}
          isLoading={invitations.status === "loading"}
          loadingLabel={labels.loadingInvitations}
          hasMore={invitations.nextCursor !== null}
          onLoadMore={invitations.loadMore}
          emptyState={<EmptyState title={labels.noInvitations} />}
          renderCell={(invitation, column) => {
            if (column.id === "email") return <span dir="ltr">{invitation.email}</span>;
            if (column.id === "role") return roleName(invitation.role);
            if (column.id === "status")
              return (
                <StatusBadge tone={STATUS_TONE[invitation.status]}>
                  {labels.statuses[invitation.status]}
                </StatusBadge>
              );
            return invitation.status === "pending" ? (
              <Button
                variant="secondary"
                size="sm"
                label={`${labels.revoke}: ${invitation.email}`}
                onPress={() => void revoke(invitation)}
              >
                {labels.revoke}
              </Button>
            ) : null;
          }}
        />
      )}
      <Modal isOpen={isInviting} onOpenChange={setInviting}>
        <Modal.Header>
          <Modal.Title>{labels.inviteTitle}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={(event) => void invite(event)}>
          <Modal.Body className="flex flex-col gap-4">
            {inviteFailure !== null && <Alert tone="danger" title={inviteFailure} />}
            <TextField
              label={labels.email}
              type="email"
              name="email"
              isRequired
              value={email}
              onChange={setEmail}
            />
            <Select
              label={labels.role}
              name="role"
              isRequired
              items={inviteChoices}
              value={role}
              onChange={setRole}
            />
            {allowExternal && (
              <Select
                label={labels.kind}
                name="kind"
                isRequired
                items={[
                  { id: "internal", label: labels.internal },
                  { id: "external", label: labels.external },
                ]}
                value={kind}
                onChange={(next) => setKind(next === "external" ? "external" : "internal")}
              />
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={() => setInviting(false)}>
              {labels.cancel}
            </Button>
            <Button type="submit" isLoading={isSending}>
              {labels.invite}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      <AlertDialog
        isOpen={removing !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRemoving(null);
        }}
        tone="danger"
        title={labels.removeTitle}
        description={labels.removeDescription}
        confirmLabel={labels.removeConfirm}
        cancelLabel={labels.cancel}
        onConfirm={() => {
          if (removing !== null) void remove(removing);
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
