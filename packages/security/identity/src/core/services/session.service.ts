/**
 * Stackra file contract:
 * Purpose: `SessionService`, a client's session: its state (loading, signed in with a user, signed out, revoked), the
 *          listeners `useSession` re-renders with, sign-in and sign-out through the target's `SessionStore`, the
 *          memberships handed to the tenant switcher, the permission keys handed to IAM's UI snapshot (what
 *          `usePermission` reads), the idle sign-out of a shared device, and the re-read when a browser window comes
 *          back into view.
 * Boundary: a singleton service; the store keeps the credential and this service keeps no token. It starts once, on
 *           the first `start()` (the first `useSession` mount): it reads the store, and a failure other than a revoked
 *           session leaves it signed out and rejects, so the caller reports it. A revoked session
 *           (`SessionRevokedError`) becomes `SessionStatus.Revoked`, the signal the offline stores wipe on (ADR 0338
 *           decision 4). `current()` returns the same object until a change, so it is the `useSyncExternalStore`
 *           snapshot. The window and input listeners are attached only where a `document` exists; a device's
 *           foreground re-read belongs to its platform entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decisions 8 and 9); ADR 0210 (decision 3: the active tenant lives in the session); ADR
 *                     0338 (decision 4); ADR 0208 (decision 6: the permission keys a screen shows by); ADR 0294
 *                     (decisions 16 and 17).
 */
import { Service } from "@stackra/container";
import type { PermissionSnapshotService } from "@stackra/iam";
import type { TenantSwitcher } from "@stackra/tenancy";

import type { IdentityConfig } from "#config/identity.config";
import type { SessionStore } from "#contracts/ports/session-store.port";
import type { SessionUser } from "#contracts/types/session-user.type";
import type { SignInOptions } from "#contracts/types/sign-in-options.type";
import { SessionStatus } from "#core/enums/session-status.enum";
import { SessionRevokedError } from "#core/errors/session-revoked.error";
import type { SessionState } from "#core/types/session-state.type";

/** Before the store has been read. */
const LOADING: SessionState = Object.freeze({ status: SessionStatus.Loading, user: null });

/** The input that counts as activity for the idle rule. */
const ACTIVITY_EVENTS = ["pointerdown", "keydown"] as const;

/**
 * The session on a client.
 *
 * @example
 * const session = app.get(SessionService);
 * await session.start();
 * if (session.status === SessionStatus.SignedOut) await session.signIn();
 */
export class SessionService extends Service {
  /** The current state; the same object until it changes. */
  readonly current = (): SessionState => this.state;

  /**
   * Calls `listener` after every change; the shape `useSyncExternalStore` takes.
   *
   * @returns removes the listener; safe to call twice.
   */
  readonly subscribe = (listener: () => void): (() => void) => {
    const entry = () => listener();
    this.listeners.add(entry);
    return () => {
      this.listeners.delete(entry);
    };
  };

  /** The idle rule and the refresh switches. */
  private readonly config: IdentityConfig;

  /** The target's flow. */
  private readonly store: SessionStore;

  /** Takes the memberships of every state. */
  private readonly switcher: TenantSwitcher;

  /** Takes the permission keys of every state; empty when nobody is signed in. */
  private readonly permissions: PermissionSnapshotService;

  /** The current state, frozen. */
  private state: SessionState = LOADING;

  /** Who to call after a change. */
  private readonly listeners = new Set<() => void>();

  /** The first start, settled for every later caller. */
  private started: Promise<void> | undefined;

  /** The pending idle sign-out. */
  private idleTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * @param config - the idle rule and the refresh switches.
   * @param store - the target's `SessionStore` driver.
   * @param switcher - the tenant switcher, which lists the user's memberships.
   * @param permissions - IAM's UI permission snapshot, which `usePermission` reads.
   */
  constructor(
    config: IdentityConfig,
    store: SessionStore,
    switcher: TenantSwitcher,
    permissions: PermissionSnapshotService,
  ) {
    super();
    this.config = config;
    this.store = store;
    this.switcher = switcher;
    this.permissions = permissions;
  }

  /** The current status. */
  get status(): SessionStatus {
    return this.state.status;
  }

  /** The signed-in user, or `null`. */
  get user(): SessionUser | null {
    return this.state.user;
  }

  /**
   * Reads the stored session once and attaches the window and input listeners. Only the first caller sees a failure,
   * so it is reported once; later calls wait for the same read and resolve.
   *
   * @throws the store's failure, to the first caller only, after the state became signed out.
   */
  start(): Promise<void> {
    if (this.started !== undefined) return this.started;
    const first = this.listen().refresh();
    this.started = first.catch(() => undefined);
    return first;
  }

  /**
   * Reads the session again from the store.
   *
   * @throws the store's failure other than a revoked session, after the state became signed out.
   */
  async refresh(): Promise<void> {
    try {
      this.apply(await this.store.load());
    } catch (error) {
      this.fail(error);
    }
  }

  /**
   * Runs the flow's sign-in, then reads the session; while it runs the state is loading.
   *
   * @throws SignInCancelledError when the user stopped it; the state is back where it was.
   */
  async signIn(options?: SignInOptions): Promise<void> {
    const before = this.state;
    this.set(LOADING);
    try {
      await this.store.signIn(options);
    } catch (error) {
      this.set(before);
      throw error;
    }
    await this.refresh();
  }

  /** Ends the session here and at the provider; the state is signed out even when the provider cannot be reached. */
  async signOut(): Promise<void> {
    try {
      await this.store.signOut();
    } finally {
      this.apply(null);
    }
  }

  /** The access token for the next call; `undefined` when signed out, or when the provider just refused the session. */
  async accessToken(): Promise<string | undefined> {
    try {
      return await this.store.accessToken();
    } catch (error) {
      if (!(error instanceof SessionRevokedError)) throw error;
      this.set({ status: SessionStatus.Revoked, user: null });
      return undefined;
    }
  }

  /** Counts as activity: restarts the idle countdown while signed in under an idle rule. */
  touch(): void {
    clearTimeout(this.idleTimer);
    this.idleTimer = undefined;
    const minutes = this.config.idleMinutes;
    if (minutes <= 0 || this.state.status !== SessionStatus.SignedIn) return;
    // The state is signed out even when the provider cannot be told, so the failure is dropped here.
    this.idleTimer = setTimeout(() => void this.signOut().catch(() => undefined), minutes * 60_000);
  }

  /**
   * Sets the state, hands the memberships and the permission keys on, restarts the idle countdown and tells every
   * subscriber.
   */
  protected set(state: SessionState): void {
    this.state = Object.freeze(state);
    this.switcher.setMemberships(state.user?.memberships ?? []);
    this.permissions.set(state.user?.permissions ?? []);
    this.touch();
    // oxlint-disable-next-line unicorn/no-useless-spread -- reason: a copy, so a listener that unsubscribes another mid-loop does not skip it
    for (const listener of [...this.listeners]) listener();
  }

  /** The state of `user`: signed in with it, or signed out. */
  private apply(user: SessionUser | null): void {
    this.set(
      user === null
        ? { status: SessionStatus.SignedOut, user: null }
        : { status: SessionStatus.SignedIn, user },
    );
  }

  /** Turns a store failure into a state; rethrows all but a revoked session. */
  private fail(error: unknown): void {
    if (error instanceof SessionRevokedError) {
      this.set({ status: SessionStatus.Revoked, user: null });
      return;
    }
    this.apply(null);
    throw error;
  }

  /** Attaches the re-read on a visible window and the idle rule's input listeners, where there is a document. */
  private listen(): this {
    if (typeof document === "undefined") return this;
    if (this.config.refreshOnFocus)
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && this.state.status === SessionStatus.SignedIn)
          void this.refresh().catch(() => undefined);
      });
    if (this.config.idleMinutes > 0)
      for (const type of ACTIVITY_EVENTS)
        document.addEventListener(type, () => this.touch(), { passive: true });
    return this;
  }
}
