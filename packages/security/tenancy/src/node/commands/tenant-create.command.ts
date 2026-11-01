/**
 * Stackra file contract:
 * Purpose: `TenantCreateCommand`, `tenant:create <name>`: creates a tenant through the `TenantDirectory`.
 * Boundary: writes only through the `TenantDirectory` port; no SQL. Audited.
 * Runtime: node
 * Governing contract: STA-1731 spec FR-001 and FR-015.
 */
import { Argument, Command, UsageError } from "@stackra/console";
import type { CommandIo } from "@stackra/console";

import type { TenantDirectory } from "#core/ports/tenant-directory.port";

/** Creates a tenant. */
export class TenantCreateCommand extends Command({
  name: "tenant:create",
  description: "Create a tenant",
  audit: true,
}) {
  /** The tenant's display name. */
  @Argument({ description: "The tenant's name" })
  name!: string;

  /** The directory the host binds. */
  private readonly directory: TenantDirectory;

  /**
   * @param directory - where the tenants are kept.
   */
  constructor(directory: TenantDirectory) {
    super();
    this.directory = directory;
  }

  /** Creates the tenant and returns it. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const name = this.name.trim();
    if (name === "" || name.length > 200)
      throw new UsageError("<name> must be 1 to 200 characters");
    const tenant = await io.output.task(`Creating ${name}`, () => this.directory.create({ name }));
    io.output.success(`Created ${tenant.name} (${tenant.id})`);
    return { tenant };
  }
}
