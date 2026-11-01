/**
 * Stackra file contract:
 * Purpose: `TenantListCommand`, `tenant:list`: lists the tenants the `TenantDirectory` holds.
 * Boundary: reads only, through the `TenantDirectory` port; no SQL. Audited.
 * Runtime: node
 * Governing contract: STA-1731 spec FR-001 and FR-015.
 */
import { Command } from "@stackra/console";
import type { CommandIo } from "@stackra/console";

import type { TenantDirectory } from "#core/ports/tenant-directory.port";

/** Lists tenants. */
export class TenantListCommand extends Command({
  name: "tenant:list",
  description: "List the tenants",
  audit: true,
}) {
  /** The directory the host binds. */
  private readonly directory: TenantDirectory;

  /**
   * @param directory - where the tenants are kept.
   */
  constructor(directory: TenantDirectory) {
    super();
    this.directory = directory;
  }

  /** Lists the tenants and returns them. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const tenants = await this.directory.list();
    io.output.table(
      ["Id", "Name", "Created"],
      tenants.map((tenant) => [tenant.id, tenant.name, tenant.createdAt.toISOString()]),
    );
    return { tenants };
  }
}
