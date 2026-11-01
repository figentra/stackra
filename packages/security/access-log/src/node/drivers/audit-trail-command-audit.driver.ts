/**
 * Stackra file contract:
 * Purpose: `AuditTrailCommandAuditDriver`, the `CommandAudit` port of @stackra/console on the write audit: each run of
 *          an audited console command becomes the next `AuditLogEntry` of the platform's operations tenant chain, with
 *          the command as the key and the operator, the redacted values and the exit code as the entry's fields.
 * Boundary: implements the port by handing an `AuditEntry` to the bound `AuditTrail` (`PostgresAuditTrailDriver` by
 *           default), so the hash chain, the tenant setting and the retry on a lost race are that driver's. The write
 *           audit is tenant-owned and the package has no platform-scope row, so entries go in the chain of the tenant
 *           named by `AccessLogConfig.commandAuditScope` (`STACKRA_COMMAND_AUDIT_SCOPE`); unset, the driver refuses
 *           (`CommandAuditScopeMissingError`), and a scope the tenant registry does not mark as the platform's operations
 *           tenant is refused (`CommandAuditScopeInvalidError`), both in `ready`, before the handler. The actor is the console itself
 *           (`svc_console`), the operator is a field, and the key is `console.<command>` (a command is not an action,
 *           so it has no locked key). A run that did not end `ok` is stored as `refused`, its outcome as the code.
 * Runtime: node
 * Governing contract: STA-1731 spec FR-015 to FR-017; ADR 0136 (decision 5); ADR 0212 (decisions 3 and 4).
 */
import type { AuditTrail } from "@stackra/actions/contracts";
import { CommandAudit } from "@stackra/console/contracts";
import type { CommandAuditEntry } from "@stackra/console/contracts";
import { Driver } from "@stackra/container";
import { ActorKind, ApiArea } from "@stackra/contracts";
import type { TenantDirectory } from "@stackra/tenancy";
import type { Json, PublicId } from "@stackra/contracts";

import type { AccessLogConfig } from "#config/access-log.config";
import { CommandAuditScopeInvalidError } from "#core/errors/command-audit-scope-invalid.error";
import { CommandAuditScopeMissingError } from "#core/errors/command-audit-scope-missing.error";

/**
 * Stores each command audit entry in the write audit chain.
 *
 * @example
 * // generated wiring: { port: CommandAudit, deps: [AuditTrail, AccessLogConfig, TenantDirectory] }
 */
export class AuditTrailCommandAuditDriver extends Driver(CommandAudit) {
  /** Where the entry goes. */
  private readonly trail: AuditTrail;

  /** Names the chain's tenant. */
  private readonly config: AccessLogConfig;

  /** The tenant registry, which says which tenant is the platform's operations tenant. */
  private readonly directory: TenantDirectory;

  /**
   * @param trail - the write audit.
   * @param config - the access log's configuration.
   * @param directory - the tenant registry.
   */
  constructor(trail: AuditTrail, config: AccessLogConfig, directory: TenantDirectory) {
    super();
    this.trail = trail;
    this.config = config;
    this.directory = directory;
  }

  /**
   * Refuses before the command runs unless the configured scope is the tenant the registry marks as the platform's
   * operations tenant, so a mistyped or copied scope never puts operations into a customer's chain.
   *
   * @throws CommandAuditScopeMissingError when `commandAuditScope` is empty.
   * @throws CommandAuditScopeInvalidError when it is not the registry's operations tenant.
   */
  override async ready(): Promise<void> {
    const scope = this.config.commandAuditScope;
    if (scope === "") throw CommandAuditScopeMissingError.create({});
    if ((await this.directory.operationsTenant()) !== scope)
      throw CommandAuditScopeInvalidError.create({});
  }

  /**
   * Appends `entry` to the operations tenant's chain.
   *
   * @throws CommandAuditScopeMissingError when no operations tenant is configured.
   */
  override async record(entry: CommandAuditEntry): Promise<void> {
    const scopeId = this.config.commandAuditScope;
    if (scopeId === "") throw CommandAuditScopeMissingError.create({});
    await this.trail.record({
      call: {
        callId: crypto.randomUUID(),
        type: AuditTrailCommandAuditDriver,
        kind: "action",
        key: `console.${entry.command}`,
        actor: { kind: ActorKind.Service, id: "svc_console", scopeId: scopeId as PublicId },
        area: ApiArea.Platform,
      },
      at: entry.at,
      outcome: entry.outcome === "ok" ? "ok" : "refused",
      ...(entry.outcome === "ok" ? {} : { code: entry.outcome }),
      fields: {
        operator: entry.operator,
        command: entry.command,
        values: structuredClone(entry.values) as Json,
        exitCode: entry.exitCode,
        ...(entry.breakGlass === undefined ? {} : { breakGlass: entry.breakGlass }),
        outcome: entry.outcome,
      },
    });
  }
}
