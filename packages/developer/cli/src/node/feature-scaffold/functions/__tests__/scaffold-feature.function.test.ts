/**
 * Stackra file contract:
 * Purpose: unit tests of `scaffoldFeature`: a module with its first model (files, the owner by `@stackra/tenancy` or
 *          `--global`, the declared packages and their spec), a model's prefix kept clear of the registry and the
 *          member's own models, the next migration number, actions and queries named `<verb>-<model>` (keys, the L2
 *          permission added once, the `read` a query takes, a plural model, `--model`), the alter migration (nullable
 *          columns, the model's new fields with decorated ones first), `--dry-run`, and every refusal: no service, a
 *          missing or existing module, an unknown model, a NOT NULL or create migration, and a file that exists
 *          (nothing written).
 * Boundary: test only; writes a throwaway service in the OS temp directory and never formats (`format: false`); gen
 *           over the same output is `scaffold-feature-gen.function.test.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294; ADR 0305; ADR 0159; ADR 0239; ADR 0135; STA-2855.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { scaffoldFeature } from "#node/feature-scaffold/functions/scaffold-feature.function";
import type { FeatureOptions } from "#node/feature-scaffold/types/feature-options.type";

let root: string;
let member: string;

/** A workspace with one service, `services/shop`, declaring `@stackra/*` as `catalog:stackra`. */
function writeService(dependencies: Record<string, string> = {}): void {
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - services/*\n");
  mkdirSync(join(member, "src"), { recursive: true });
  writeFileSync(
    join(member, "stackra.config.ts"),
    'import { ApiArea, defineService } from "@stackra/contracts";\n\nexport default defineService({ area: ApiArea.App });\n',
  );
  writeFileSync(
    join(member, "package.json"),
    `${JSON.stringify({ name: "@acme/service-shop", dependencies: { "@stackra/app": "catalog:stackra", ...dependencies } }, null, 2)}\n`,
  );
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-feature-"));
  member = join(root, "services/shop");
  writeService();
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** Runs a feature kind from inside the service. */
const run = (options: Omit<FeatureOptions, "cwd">) =>
  scaffoldFeature({ cwd: join(member, "src"), format: false, ...options });

/** A file of the service. */
const read = (path: string): string => readFileSync(join(member, path), "utf8");

/** The service's package.json. */
const manifest = () =>
  JSON.parse(read("package.json")) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };

describe(scaffoldFeature, () => {
  it("makes a module with its first model, migration, service, view and permissions", () => {
    const made = run({ kind: "module", name: "orders", fields: "title:string,notes:text?" });

    expect(made.member).toBe(member);
    expect(made.created).toEqual([
      "src/modules/orders/access/order.permissions.ts",
      "src/modules/orders/database/migrations/0001-create-orders.migration.ts",
      "src/modules/orders/database/migrations/__tests__/0001-create-orders.migration.test.ts",
      "src/modules/orders/models/order.model.ts",
      "src/modules/orders/schemas/order-view.schema.ts",
      "src/modules/orders/services/order.service.ts",
    ]);
    const model = read("src/modules/orders/models/order.model.ts");
    expect(model).toContain(
      'export class Order extends Model.with(HasPublicId("ord"), Timestamps) {',
    );
    expect(model).toContain("  @Str({ max: 255 })\n  title!: string;");
    expect(model).toContain("  notes!: string | null;");
    const migration = read(
      "src/modules/orders/database/migrations/0001-create-orders.migration.ts",
    );
    expect(migration).toContain("export class CreateOrdersMigration extends Migration {");
    expect(migration).toContain('t.string("title", 255).notNull().comment("The title.");');
    expect(migration).toContain('t.string("notes").nullable().comment("The notes.");');
    expect(migration).not.toContain("belongsToTenant");
    expect(read("src/modules/orders/access/order.permissions.ts")).toContain(
      "static readonly read = Permission.L0;",
    );
    expect(
      read("src/modules/orders/database/migrations/__tests__/0001-create-orders.migration.test.ts"),
    ).toContain("from orders.orders");
    // The packages the files and gen's wiring import, with the spec the service uses for `@stackra/*`.
    expect(manifest().dependencies).toMatchObject({
      "@stackra/console": "catalog:stackra",
      "@stackra/database": "catalog:stackra",
      "@stackra/iam": "catalog:stackra",
      "@stackra/model": "catalog:stackra",
      "@stackra/validation": "catalog:stackra",
      zod: "catalog:",
    });
    expect(manifest().devDependencies).toMatchObject({
      "@stackra/testing": "catalog:stackra",
      "@electric-sql/pglite": "catalog:",
    });
    expect(Object.keys(manifest().dependencies)).toEqual(
      Object.keys(manifest().dependencies).toSorted(),
    );
  });

  it("makes a tenant-owned model in a service that runs @stackra/tenancy, and a global one when asked", () => {
    writeService({ "@stackra/tenancy": "^0.33.1" });
    run({ kind: "module", name: "orders" });
    run({ kind: "model", name: "region", module: "orders", global: true });

    expect(read("src/modules/orders/models/order.model.ts")).toContain(
      'Model.with(BelongsToTenant, HasPublicId("ord"), Timestamps)',
    );
    expect(
      read("src/modules/orders/database/migrations/0001-create-orders.migration.ts"),
    ).toContain("      t.belongsToTenant();\n");
    expect(read("src/modules/orders/models/region.model.ts")).toContain(
      'Model.global(HasPublicId("reg"), Timestamps)',
    );
    expect(
      read("src/modules/orders/database/migrations/0002-create-regions.migration.ts"),
    ).not.toContain("belongsToTenant");
    // A tenancy service's wiring needs the actions, events, queues and crons tenancy runs on.
    expect(manifest().dependencies).toMatchObject({
      "@stackra/actions": "catalog:stackra",
      "@stackra/events": "catalog:stackra",
      "@stackra/queue": "catalog:stackra",
      "@stackra/scheduler": "catalog:stackra",
    });
  });

  it("keeps a new prefix clear of the registry and of the service's own models", () => {
    // `sch` belongs to `scheduler.schedule` in the shared registry.
    run({ kind: "module", name: "schedules" });
    run({ kind: "model", name: "order", module: "schedules" });
    run({ kind: "model", name: "ordinance", module: "schedules" });

    expect(read("src/modules/schedules/models/schedule.model.ts")).toContain('HasPublicId("sce")');
    expect(read("src/modules/schedules/models/order.model.ts")).toContain('HasPublicId("ord")');
    expect(read("src/modules/schedules/models/ordinance.model.ts")).toContain('HasPublicId("ori")');
    expect(() =>
      run({ kind: "model", name: "invoice", module: "schedules", prefix: "ord" }),
    ).toThrow("--prefix ord is the public id prefix of another model");
    expect(() =>
      run({ kind: "model", name: "invoice", module: "schedules", prefix: "INV" }),
    ).toThrow("--prefix INV is not 2 to 6 lowercase letters");
    expect(
      read("src/modules/schedules/database/migrations/0003-create-ordinances.migration.ts"),
    ).toContain("CreateOrdinancesMigration");
  });

  it("makes an action with its schemas and test, and adds its L2 permission once", () => {
    run({ kind: "module", name: "orders", fields: "title:string" });
    const made = run({ kind: "action", name: "create-order", module: "orders" });

    expect(made.created).toEqual([
      "src/modules/orders/actions/__tests__/create-order.action.test.ts",
      "src/modules/orders/actions/create-order.action.ts",
      "src/modules/orders/schemas/create-order-input.schema.ts",
      "src/modules/orders/schemas/create-order-output.schema.ts",
    ]);
    expect(made.changed).toContain(
      "src/modules/orders/access/order.permissions.ts (added create at L2)",
    );
    const action = read("src/modules/orders/actions/create-order.action.ts");
    expect(action).toContain('  key: "order.create",');
    expect(action).toContain("  idempotency: Idempotency.Optional,");
    expect(action).toContain("this.orders.create({");
    expect(read("src/modules/orders/schemas/create-order-input.schema.ts")).toContain(
      "  @Str({ max: 255 })\n  title!: string;",
    );
    expect(read("src/modules/orders/schemas/create-order-output.schema.ts")).toContain(
      "export class CreateOrderOutput extends OrderView {}",
    );
    const permissions = read("src/modules/orders/access/order.permissions.ts");
    expect(permissions).toContain(
      "  static readonly read = Permission.L0;\n\n  /** Create an order. */\n  static readonly create = Permission.L2;\n}",
    );
    expect(manifest().dependencies).toMatchObject({
      "@stackra/actions": "catalog:stackra",
      "@stackra/events": "catalog:stackra",
      "@stackra/queue": "catalog:stackra",
    });
  });

  it("derives a custom verb, a multi-word model and a plural query from the name", () => {
    run({ kind: "module", name: "orders", model: "order-line" });
    const custom = run({ kind: "action", name: "mark-paid-order-line", module: "orders" });
    run({ kind: "query", name: "list-order-lines", module: "orders" });
    run({ kind: "query", name: "get-order-line", module: "orders" });
    run({ kind: "action", name: "approve", module: "orders", model: "order-line" });

    const action = read("src/modules/orders/actions/mark-paid-order-line.action.ts");
    expect(action).toContain('  key: "order_line.mark_paid",');
    expect(action).toContain("this.orderLines.findOneOrFail({ id: input.orderLineId })");
    expect(custom.notes).toEqual([
      "write what mark paid does in src/modules/orders/actions/mark-paid-order-line.action.ts (it loads the order line and answers it)",
    ]);
    expect(read("src/modules/orders/schemas/mark-paid-order-line-input.schema.ts")).toContain(
      '  orderLineId!: PublicId<"ord">;',
    );
    expect(read("src/modules/orders/queries/list-order-lines.query.ts")).toContain(
      '  key: "order_line.list",',
    );
    expect(read("src/modules/orders/queries/get-order-line.query.ts")).toContain(
      '  key: "order_line.get",',
    );
    expect(read("src/modules/orders/actions/approve.action.ts")).toContain(
      '  key: "order_line.approve",',
    );
    const permissions = read("src/modules/orders/access/order-line.permissions.ts");
    expect(permissions).toContain("static readonly markPaid = Permission.L2;");
    // The queries read `read`, which the model wrote, so it is not added again.
    expect(permissions.match(/static readonly read/g)).toHaveLength(1);
  });

  it("adds the read permission a query takes to a Permissions class that lacks it", () => {
    run({ kind: "module", name: "orders" });
    writeFileSync(
      join(member, "src/modules/orders/access/order.permissions.ts"),
      'import { Permission, Permissions } from "@stackra/iam";\n\nexport class OrderPermissions extends Permissions {\n  static readonly cancel = Permission.L1;\n}\n',
    );
    const query = run({ kind: "query", name: "list-orders", module: "orders" });
    const action = run({ kind: "action", name: "cancel-order", module: "orders" });

    expect(query.changed).toContain(
      "src/modules/orders/access/order.permissions.ts (added read at L0)",
    );
    expect(read("src/modules/orders/access/order.permissions.ts")).toContain(
      "static readonly read = Permission.L0;",
    );
    expect(action.notes).toContain(
      "src/modules/orders/access/order.permissions.ts: cancel is L1, but an action writes, so gen wants L2 or above",
    );
  });

  it("writes the next migration, nullable, and adds its fields to the model", () => {
    run({ kind: "module", name: "orders", fields: "notes:text?" });
    const made = run({
      kind: "migration",
      name: "add-sku-to-orders",
      module: "orders",
      fields: "sku:string?,paidAt:timestamp?",
    });

    expect(made.created).toEqual([
      "src/modules/orders/database/migrations/0002-add-sku-to-orders.migration.ts",
      "src/modules/orders/database/migrations/__tests__/0002-add-sku-to-orders.migration.test.ts",
    ]);
    const migration = read(
      "src/modules/orders/database/migrations/0002-add-sku-to-orders.migration.ts",
    );
    expect(migration).toContain('schema.table("orders", (t: Blueprint) => {');
    expect(migration).toContain('t.string("sku", 255).nullable().comment("The sku.");');
    expect(migration).toContain('t.timestamp("paid_at").nullable().comment("The paid at.");');
    // Decorated fields lead the class body, plain ones follow the fields already there.
    expect(read("src/modules/orders/models/order.model.ts")).toContain(
      "{\n  /** The sku. */\n  @Str({ max: 255 })\n  sku!: string | null;\n\n  /** The notes. */\n  notes!: string | null;\n\n  /** The paid at. */\n  paidAt!: Date | null;\n}",
    );
    expect(read("src/modules/orders/models/order.model.ts")).toContain(
      'import { Str } from "@stackra/validation";',
    );
  });

  it("lists the files on a dry run and writes nothing", () => {
    const made = run({ kind: "module", name: "orders", dryRun: true });

    expect(made.created).toContain("src/modules/orders/models/order.model.ts");
    expect(existsSync(join(member, "src/modules/orders"))).toBe(false);
    expect(manifest().dependencies).toEqual({ "@stackra/app": "catalog:stackra" });
  });

  it.each([
    [{ kind: "widget", name: "orders" }, "name the kind: module, model, migration, action, query"],
    [{ kind: "module", name: "Orders" }, "name it in kebab-case, such as orders"],
    [{ kind: "model", name: "order" }, "a model needs --module <key>, a folder under src/modules/"],
    [
      { kind: "model", name: "order", module: "orders" },
      "src/modules/orders does not exist; make it with `stackra new module orders`",
    ],
    [
      { kind: "action", name: "create-order", module: "orders", model: "Order" },
      "--model Order is not kebab-case",
    ],
  ])("refuses %o", (options, message) => {
    expect(() => run(options)).toThrow(new CliUsageError(message));
  });

  it("refuses a module that exists, an unknown model and a migration it cannot write", () => {
    run({ kind: "module", name: "orders" });

    expect(() => run({ kind: "module", name: "orders" })).toThrow(
      "src/modules/orders already exists",
    );
    expect(() => run({ kind: "action", name: "refund-payment", module: "orders" })).toThrow(
      "name the model: write the action as <verb>-<model> (such as create-order) or pass --model",
    );
    expect(() =>
      run({ kind: "query", name: "list-orders", module: "orders", model: "payment" }),
    ).toThrow("payment is not a model of orders");
    expect(() => run({ kind: "migration", name: "create-payments", module: "orders" })).toThrow(
      "a table is created with its model",
    );
    expect(() => run({ kind: "migration", name: "add-sku", module: "orders" })).toThrow(
      "a migration needs --fields",
    );
    expect(() =>
      run({ kind: "migration", name: "add-sku", module: "orders", fields: "sku:string" }),
    ).toThrow(
      "an added column is nullable, so rows written before it stay valid: write sku:<type>?",
    );
  });

  it("refuses a file that exists and writes nothing", () => {
    run({ kind: "module", name: "orders" });
    run({ kind: "action", name: "create-order", module: "orders" });
    const before = read("src/modules/orders/access/order.permissions.ts");

    expect(() => run({ kind: "action", name: "create-order", module: "orders" })).toThrow(
      "already there, nothing written: src/modules/orders/actions/create-order.action.ts",
    );
    expect(read("src/modules/orders/access/order.permissions.ts")).toBe(before);
  });

  it("refuses outside a service", () => {
    writeFileSync(join(member, "stackra.config.ts"), "export default definePackage({});\n");

    expect(() => run({ kind: "module", name: "orders" })).toThrow(`${member} is not a service`);
    expect(() =>
      scaffoldFeature({ kind: "module", name: "orders", cwd: root, format: false }),
    ).toThrow("run it inside a service");
  });
});
